const scrapePrice = require('helpers/scrapePrice.helper');
const redisClient = require('db/connect');
const { promisify } = require('util');
const io = require('services/socket');
const createExcel = require('helpers/createExcel');

const getItem = promisify(redisClient.get).bind(redisClient);
const setItem = promisify(redisClient.set).bind(redisClient);
const updateInterval = process.env.UPDATE_INTERVAL || 3600 * 1000;

const updateItem = async (model) => {
    try {
        const price = await scrapePrice(model);
        const updatedAt = Date.now();
        const data = { price, updatedAt };
        await setItem(model, JSON.stringify(data));
        return { model, price, updatedAt };
    } catch (error) {
        setItem(model, JSON.stringify({ error: error.message || error }));
        return Promise.resolve({
            model,
            error: error.message || error,
            updatedAt: Date.now(),
        });
    }
};

let tmr = null;
let currentProgress = null;
let modelArray = [];
let lastData = null;
const updater = async ({ host, filePath }) => {
    const priceList = [];
    currentProgress = {
        current: 0,
        total: modelArray.length,
    };
    io.emit('updateProgress', currentProgress);
    for (let i = 0; i < modelArray.length; i++) {
        const model = modelArray[i];
        const d = await getItem(model);
        if (d) {
            const data = JSON.parse(d);
            if (
                !data.updatedAt ||
                data.updatedAt + updateInterval + 5000 < Date.now()
            ) {
                await updateItem(model).then((data) => priceList.push(data));
                currentProgress = {
                    current: i + 1,
                    total: modelArray.length,
                };
                io.emit('updateProgress', currentProgress);
            } else {
                priceList.push({
                    model,
                    ...data,
                });
                currentProgress = {
                    current: i + 1,
                    total: modelArray.length,
                };
                io.emit('updateProgress', currentProgress);
            }
        } else {
            await updateItem(model).then((data) => priceList.push(data));
            currentProgress = {
                current: i + 1,
                total: modelArray.length,
            };
            io.emit('updateProgress', currentProgress);
        }
    }

    io.emit('updateProgress', currentProgress);
    createExcel(priceList, filePath);
    lastData = { filePath: `${host}/${filePath}`, updatedAt: Date.now() };
    io.emit('result', { filePath: `${host}/${filePath}` });
    clearTimeout(tmr);
    tmr = setTimeout(updater, updateInterval, { host, filePath });
};
io.on('connect', (socket) => {
    if (currentProgress) socket.emit('updateProgress', currentProgress);
    if (lastData) socket.emit('result', lastData);
});

const uploadNewDataController = async (req, res, next) => {
    modelArray = req.body.data;
    clearTimeout(tmr);
    const filePath = 'static/excel.xlsx';
    const host = `${req.protocol}://${req.get('host')}`;

    tmr = setTimeout(updater, updateInterval, { host, filePath });
    updater({ host, filePath });
    next();
};

const response = (req, res, next) => {
    res.send({
        success: true,
        filePath: res.filePath,
    });
    next();
};

module.exports = [uploadNewDataController, response];
