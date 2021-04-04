const { setItem, getItem } = require('db/helpers');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const scrapePrice = require('helpers/scrapePrice.helper');
const createExcel = require('helpers/createExcel');
const { setTimeoutInterval } = require('helpers/setTimeoutInterval');
const io = require('services/socket');
const redisClient = require('db/connect');
const { getDetailsById } = require('helpers/getDetailsById.helper');

class Scrapper {
    currentProgress = {
        total: 0,
        current: 0,
    };
    modelList = [];
    priceList = [];
    startTime = null;
    endTime = null;
    interval = 3600;
    fileLimit = 10;
    extended = false;
    host = '';
    getTimer = () => null;
    setHostFromSocket = (socket) => {
        this.host = `${socket.handshake.headers['x-forwarded-proto']}://${socket.handshake.headers.host}`;
    };
    getFileUrl = (file) => {
        return `${this.host}/static/${file}`;
    };
    get options() {
        return {
            startTime: this.startTime,
            endTime: this.endTime,
            interval: this.interval,
            fileLimit: this.fileLimit,
            extended: this.extended,
        };
    }
    constructor() {
        io.on('connect', (socket) => {
            if (this.currentProgress.current !== this.currentProgress.total)
                socket.emit('updateProgress', this.currentProgress);
            const sortedFL = fs.readdirSync('static').sort((file1, file2) => {
                const state1 = fs.statSync(path.join('static', file1));
                const state2 = fs.statSync(path.join('static', file2));
                return state1.ctime - state2.ctime;
            });
            this.setHostFromSocket(socket);
            socket.emit('filesReady', sortedFL.map(this.getFileUrl));
        });
    }

    setTimerOptions(options) {
        const { endTime, startTime, interval, extended } = options;
        if (endTime !== undefined) this.endTime = endTime;
        if (startTime !== undefined) this.startTime = startTime;
        if (interval) {
            this.interval = Number(interval);
            this.scheduleJob(true);
        }
        if (extended !== undefined) this.extended = extended;
    }
    setModelList = (modelList) => {
        this.modelList = modelList;
        this.scheduleJob();
    };
    isCorrectTime() {
        const { startTime, endTime } = this;
        if (!startTime || !endTime) return true;
        const now = new Date();
        const startH = Number(startTime.split(':')[0]);
        const startM = Number(startTime.split(':')[1]);
        const endH = Number(endTime.split(':')[0]);
        const endM = Number(endTime.split(':')[1]);
        if (
            now.getHours() >= startH &&
            now.getHours() <= endH &&
            now.getMinutes() >= startM &&
            now.getMinutes() <= endM
        )
            return true;

        return false;
    }
    scheduleJob(isIntervalChange) {
        const { interval } = this;
        const f = () => {
            if (this.isCorrectTime()) {
                this.updatePriceList('excel');
            }
        };
        clearTimeout(this.getTimer());
        if (!isIntervalChange) f();
        this.getTimer = setTimeoutInterval(f, interval * 1000);
    }

    progress(current, total) {
        this.currentProgress = { current, total };
        io.emit('updateProgress', this.currentProgress);
    }
    addToPriceList = (price) => {
        this.priceList.push(price);
    };
    updatePriceList = async (fileName = 'excel') => {
        const { extended } = this;
        this.progress(0, this.modelList.length);
        this.priceList = [];
        for (let i = 0; i < this.modelList.length; i++) {
            const model = this.modelList[i];
            let res = null;
            const d = await getItem(model);
            if (d) {
                const data = JSON.parse(d);
                if (
                    !data.updatedAt ||
                    data.updatedAt + this.interval * 1000 + 5000 < Date.now() ||
                    (extended && !data.extended)
                ) {
                    res = await Scrapper.updateItem(model, extended);
                } else res = data;
            } else {
                res = await Scrapper.updateItem(model, extended);
            }
            this.progress(i + 1, this.modelList.length);
            this.addToPriceList(res);
        }
        const { priceList } = this;
        const newFileName = `${fileName}_${moment().format(
            'YYYY-MM-DD_HH-mm'
        )}(${priceList.length}).xlsx`;
        const filePath = path.join('static', newFileName);
        await createExcel(priceList, filePath, { extended });
        const sortedFL = fs.readdirSync('static').sort((file1, file2) => {
            const state1 = fs.statSync(path.join('static', file1));
            const state2 = fs.statSync(path.join('static', file2));
            return state1.ctime - state2.ctime;
        });
        if (sortedFL.length > this.fileLimit) {
            while (sortedFL.length > this.fileLimit) {
                fs.unlinkSync(path.join('static', sortedFL[0]));
                sortedFL.splice(0, 1);
            }
        }
        io.emit('result', { filePath: this.getFileUrl(newFileName) });
        io.emit('filesReady', sortedFL.map(this.getFileUrl));
    };

    static async updateItem(model, extended) {
        try {
            const {
                price,
                itemId,
                identifiers: { canonicalUrl },
            } = await scrapePrice(model);

            const updatedAt = Date.now();
            const data = { model, price, updatedAt, extended, canonicalUrl };

            if (extended) {
                const response = await getDetailsById(itemId);
                const {
                    data: {
                        product: {
                            identifiers: {
                                canonicalUrl,
                                productLabel: name,
                                brandName: brand,
                                upc,
                            },
                            seoDescription: shortDescription,
                            details: {
                                description: _longDescription,
                                highlights,
                            },
                            specificationGroup,
                            pricing: {
                                value: salePrice,
                                original: originalPrice,
                            },
                            media: { images: img },
                            taxonomy: tax,
                        },
                    },
                } = response;

                let longDescription = _longDescription;

                if (Array.isArray(highlights))
                    longDescription += `\n${highlights.join('\n')}`;
                const images =
                    Array.isArray(img) &&
                    img.map(({ url, sizes }) =>
                        url.replace('<SIZE>', sizes[sizes.length - 1])
                    );

                let color, width, height, depth, category, type;
                for (let i = 0; i < specificationGroup?.length; i++) {
                    const spec = specificationGroup[i];
                    if (String(spec.specTitle).toLowerCase() === 'dimensions') {
                        const d = spec.specifications?.find((v) =>
                            String(v.specName).includes('Product Depth')
                        );
                        const w = spec.specifications?.find((v) =>
                            String(v.specName).includes('Product Width')
                        );
                        const h = spec.specifications?.find((v) =>
                            String(v.specName).includes('Product Height')
                        );
                        depth =
                            d?.specValue +
                            (d.specName.includes('(in.)') ? ' in' : '');

                        width =
                            w?.specValue +
                            (w.specName.includes('(in.)') ? ' in' : '');
                        height =
                            h?.specValue +
                            (h.specName.includes('(in.)') ? ' in' : '');
                    } else if (
                        String(spec.specTitle).toLowerCase() === 'details'
                    )
                        color =
                            spec.specifications?.find(
                                (v) =>
                                    String(v.specName).toLowerCase() ===
                                    'color/finish'
                            )?.specValue || 'none';
                    category = spec.specifications?.find((v) =>
                        String(v.specName).includes('Appliance Category')
                    )?.specValue;
                    type = spec.specifications?.find((v) =>
                        String(v.specName).includes('Appliance Type')
                    )?.specValue;
                }

                if (!type && Array.isArray(tax.breadCrumbs)) {
                    type = tax.breadCrumbs.reverse()[0]?.label;
                }
                if (!category && Array.isArray(tax.breadCrumbs)) {
                    category = tax.breadCrumbs.reverse()[1]?.label;
                }

                const details = {
                    name,
                    category,
                    brand,
                    upc,
                    type,
                    shortDescription,
                    longDescription,
                    salePrice,
                    originalPrice,
                    images,
                    color,
                    canonicalUrl,
                    width,
                    height,
                    depth,
                    type,
                };

                Object.assign(data, details);
            }

            await setItem(model, JSON.stringify(data));
            return data;
        } catch (error) {
            await setItem(
                model,
                JSON.stringify({ error: error.message || error })
            );
            return Promise.resolve({
                model,
                error: error.message || error,
                updatedAt: Date.now(),
            });
        }
    }
}

const ScraperService = new Scrapper();

module.exports.Scrapper = Scrapper;
module.exports.default = ScraperService;
