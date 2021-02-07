const { setItem, getItem } = require('db/helpers');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const scrapePrice = require('helpers/scrapePrice.helper');
const createExcel = require('helpers/createExcel');
const { setTimeoutInterval } = require('helpers/setTimeoutInterval');
const io = require('services/socket');

class Scrapper {
    currentProgress = {
        total: 0,
        current: 0,
    };
    modelList = [];
    priceList = [];
    startTime = null;
    endTime = null;
    interval = 3600 * 1000;
    fileLimit = 10;
    getTimer = () => null;
    get options() {
        return {
            startTime: this.startTime,
            endTime: this.endTime,
            interval: this.interval,
            fileLimit: this.fileLimit,
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
            socket.emit('filesReady', sortedFL);
        });
    }

    setTimerOptions(options) {
        const { endTime, startTime, interval } = options;
        if (endTime) this.endTime = endTime;
        if (startTime) this.startTime = startTime;
        if (interval) this.interval = interval;
        this.scheduleJob();
    }
    setModelList = (modelList) => {
        this.modelList = modelList;
        this.scheduleJob();
    };
    scheduleJob(fileName) {
        const { startTime, endTime, interval } = this;
        const f = () => {
            if (!startTime || !endTime) return this.updatePriceList(fileName);
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
            ) {
                this.updatePriceList(fileName);
            }
        };
        clearTimeout(this.getTimer());
        f();
        this.getTimer = setTimeoutInterval(f, interval);
    }

    progress(current, total) {
        this.currentProgress = { current, total };
        io.emit('updateProgress', this.currentProgress);
    }
    addToPriceList = (price) => {
        this.priceList.push(price);
    };
    updatePriceList = (fileName = 'excel') => {
        Promise.all(
            this.modelList.map(async (model, i, modelArray) => {
                let res = null;
                const d = await getItem(model);
                if (d) {
                    const data = JSON.parse(d);
                    if (
                        !data.updatedAt ||
                        data.updatedAt + this.interval + 5000 < Date.now()
                    ) {
                        res = await Scrapper.updateItem(model);
                    } else res = data;
                } else {
                    res = await Scrapper.updateItem(model);
                }
                this.progress(i + 1, modelArray.length);
                this.addToPriceList(res);
                return res;
            })
        ).then(async (priceList) => {
            const filePath = path.join(
                'static',
                `${fileName}_${moment().format('YYYY-MM-DD_HH-mm')}(${
                    priceList.length
                }).xlsx`
            );
            await createExcel(priceList, path.join(filePath));
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
            io.emit('filesReady', sortedFL);
        });
    };

    static async updateItem(model) {
        try {
            const price = await scrapePrice(model);
            const updatedAt = Date.now();
            const data = { model, price, updatedAt };
            await setItem(model, JSON.stringify(data));
            return data;
        } catch (error) {
            setItem(model, JSON.stringify({ error: error.message || error }));
            return Promise.resolve({
                model,
                error: error.message || error,
                updatedAt: Date.now(),
            });
        }
    }
}

const ScraperService = new Scrapper();

module.exports = ScraperService;
