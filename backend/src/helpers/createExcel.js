const xl = require('excel4node');
const createWorkSheet = require('./createWorkSheet');

const createExcel = async (priceList, path) => {
    var wb = new xl.Workbook({ dateFormat: 'm/d/yy hh:mm:ss' });
    const style = wb.createStyle({
        font: {
            size: 12,
        },
        numberFormat: '$#,##0.00; ($#,##0.00); -',
        alignment: {
            wrapText: true,
            horizontal: 'center',
        },
    });
    const errorStyle = wb.createStyle({
        font: {
            color: '#FF0800',
            size: 12,
        },
        alignment: {
            wrapText: true,
            horizontal: 'center',
        },
    });
    const columns = [
        {
            header: 'Model',
            style,
            accessor: 'model',
            width: 15,
            freeze: true,
            type: 'string',
        },
        { header: 'Price', style, accessor: 'price', type: 'number' },
        {
            header: 'Updated at',
            accessor: (data) => new Date(data.updatedAt),
            width: 25,
            type: 'date',
        },
        {
            header: 'Error',
            style: errorStyle,
            accessor: 'error',
            width: 35,
            type: 'string',
        },
    ];
    createWorkSheet(wb, columns, priceList, 'Home Depot price list');

    return new Promise((res, rej) => {
        wb.write(path, (err, stats) => {
            if (err) rej(err);
            else res(stats);
        });
    });
};

module.exports = createExcel;
