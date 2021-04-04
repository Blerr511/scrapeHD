const xl = require('excel4node');
const createWorkSheet = require('./createWorkSheet');
const ExcelJS = require('exceljs');

const createExcel = async (
    priceList,
    path,
    { extended } = { extended: false }
) => {
    const wb = new ExcelJS.Workbook();
    wb.created = new Date();
    wb.creator = 'Scrapper';
    priceList.forEach((el) => {
        el.updatedAt = new Date(el.updatedAt);
        if (el.canonicalUrl)
            el.model = {
                text: el.model,
                hyperlink: `https://www.homedepot.com${el.canonicalUrl}`,
                tooltip: `www.homedepot.com${el.canonicalUrl}`,
            };
        if (Array.isArray(el.images)) {
            el.images = el.images.join('\n');
        }
    });
    const ws = wb.addWorksheet(extended ? 'Details' : 'PriceList');
    ws.columns = getColumns(extended);
    ws.addRows(priceList);
    const d = await wb.xlsx.writeFile(path);
    return d;
};

module.exports = createExcel;

function getColumns(extended) {
    const columns = [
        {
            header: 'Model',
            key: 'model',
            width: 15,
        },
        { header: 'Price', key: 'price', style: { numFmt: '0.00$' } },
        {
            header: 'Updated at',
            key: 'updatedAt',
            width: 25,
        },
        {
            header: 'Error',
            key: 'error',
            width: 35,
            style: {
                font: {
                    color: { argb: 'FFFF0000' },
                },
            },
        },
    ];
    if (extended) {
        columns.splice(1, 1);
        columns.push(
            ...[
                {
                    header: 'Model name',
                    key: 'name',
                },
                {
                    header: 'Category',
                    key: 'category',
                },
                {
                    header: 'Type',
                    key: 'type',
                },
                { header: 'Brand', key: 'brand' },
                { header: 'UPC', key: 'upc' },
                {
                    header: 'Short Description',
                    key: 'shortDescription',
                    width: 25,
                },
                {
                    header: 'Long Description',
                    key: 'longDescription',
                    width: 25,
                },
                {
                    header: 'Sale Price',
                    key: 'salePrice',
                    style: { numFmt: '0.00$' },
                },
                {
                    header: 'Original Price',
                    key: 'originalPrice',
                    style: { numFmt: '0.00$' },
                },
                {
                    header: 'Width',
                    key: 'width',
                },
                {
                    header: 'Height',
                    key: 'height',
                },
                {
                    header: 'Depth',
                    key: 'depth',
                },
                {
                    header: 'Color',
                    key: 'color',
                },
                { header: 'Images', key: 'images' },
            ]
        );
    }
    return columns;
}
