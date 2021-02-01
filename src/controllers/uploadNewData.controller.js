const scrapePrice = require('helpers/scrapePrice.helper');
const redisClient = require('db/connect');
const { promisify } = require('util');
const io = require('socket');
const xl = require('excel4node');
const getItem = promisify(redisClient.get).bind(redisClient);
const setItem = promisify(redisClient.set).bind(redisClient);
const updateInterval = 3600 * 1000;

const updateItem = async (model) => {
    try {
        const price = await scrapePrice(model);
        const updatedAt = Date.now();
        const data = { price, updatedAt };
        await setItem(model, JSON.stringify(data));
        return { model, price, updatedAt };
    } catch (error) {
        setItem(model, JSON.stringify({ error }));
        return Promise.resolve({ model, error, updatedAt: Date.now() });
    }
};

let tmr = null;

const uploadNewDataController = async (req, res, next) => {
    const modelArray = req.body.data;
    const updater = async () => {
        const priceList = [];

        for (let i = 0; i < modelArray.length; i++) {
            const model = modelArray[i];
            const d = await getItem(model);
            if (d) {
                const data = JSON.parse(d);
                if (
                    !data.updatedAt ||
                    data.updatedAt + updateInterval + 5000 < Date.now()
                ) {
                    await updateItem(model).then((data) =>
                        priceList.push(data)
                    );
                    io.emit('updateProgress', {
                        current: i,
                        total: modelArray.length,
                    });
                } else {
                    priceList.push({
                        model,
                        ...data,
                    });
                }
            } else {
                await updateItem(model).then((data) => priceList.push(data));
                io.emit('updateProgress', {
                    current: i,
                    total: modelArray.length,
                });
            }
        }
        clearTimeout(tmr);
        tmr = setTimeout(updater, updateInterval);
        return priceList;
    };
    res.priceList = await updater();
    next();
};

const createExcel = (req, res, next) => {
    var wb = new xl.Workbook({ dateFormat: 'm/d/yy hh:mm:ss' });
    var ws = wb.addWorksheet('Home Depot price list');
    ws.column(1).setWidth(15).freeze();
    ws.column(3).setWidth(25);
    ws.column(4).setWidth(35);
    const style = wb.createStyle({
        font: {
            size: 12,
        },
        numberFormat: '$#,##0.00; ($#,##0.00); -',
    });
    const errorStyle = wb.createStyle({
        font: {
            color: '#FF0800',
            size: 12,
        },
    });
    const headerStyle = wb.createStyle({
        font: {
            bold: true,
        },
        alignment: {
            wrapText: true,
            horizontal: 'center',
        },
    });

    ws.cell(1, 1).string('Model').style(headerStyle);
    ws.cell(1, 2).string('Price').style(headerStyle);
    ws.cell(1, 3).string('Updated at').style(headerStyle);
    ws.cell(1, 4).string('Error').style(headerStyle);

    res.priceList.forEach(({ model, price, error, updatedAt }, _row) => {
        const row = _row + 2;
        ws.cell(row, 1).string(model).style(style);
        if (error) ws.cell(row, 4).string(error).style(errorStyle);
        else {
            ws.cell(row, 2).number(price).style(style);
            updatedAt && ws.cell(row, 3).date(new Date(updatedAt));
        }
    });
    wb.write('static/excel.xlsx');
    delete res.priceList;
    res.filePath = `${req.protocol}://${req.get('host')}/static/excel.xlsx`;
    next();
};

const response = (req, res, next) => {
    res.send({
        success: true,
        filePath: res.filePath,
    });
    next();
};

module.exports = [uploadNewDataController, createExcel, response];
