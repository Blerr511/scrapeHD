const xl = require('excel4node');

const createExcel = (priceList, path) => {
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

    priceList.forEach(({ model, price, error, updatedAt }, _row) => {
        const row = _row + 2;
        ws.cell(row, 1).string(model).style(style);
        if (error) ws.cell(row, 4).string(error).style(errorStyle);
        else {
            ws.cell(row, 2).number(price).style(style);
            updatedAt && ws.cell(row, 3).date(new Date(updatedAt));
        }
    });
    wb.write(path);
};

module.exports = createExcel;
