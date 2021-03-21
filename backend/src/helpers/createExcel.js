const xl = require('excel4node');
const createWorkSheet = require('./createWorkSheet');

const createExcel = async (
    priceList,
    path,
    { extended } = { extended: false }
) => {
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

    if (extended) {
        columns.splice(1, 1);
        columns.push(
            ...[
                {
                    header: 'Model name',
                    accessor: 'name',
                    type: 'string',
                    style,
                },
                {
                    header: 'Category',
                    accessor: 'category',
                    type: 'string',
                    style,
                },
                { header: 'Brand', accessor: 'brand', type: 'string', style },
                { header: 'UPC', accessor: 'upc', type: 'string', style },
                {
                    header: 'Short Description',
                    accessor: 'shortDescription',
                    type: 'string',
                    width: 25,
                    style,
                },
                {
                    header: 'Long Description',
                    accessor: 'longDescription',
                    type: 'string',
                    width: 25,
                    style,
                },
                {
                    header: 'Sale Price',
                    accessor: 'salePrice',
                    type: 'number',
                    style,
                },
                {
                    header: 'Original Price',
                    accessor: 'originalPrice',
                    type: 'number',
                    style,
                },
                {
                    header: 'Dimension Specifications',
                    accessor: (data) =>
                        Array.isArray(data.dimensions) &&
                        data.dimensions.map(
                            ({ specName, specValue }) =>
                                `${specName} - ${specValue}\n`
                        ),
                    type: 'string',
                    style,
                },
                { header: 'Images', accessor: 'images', type: 'images', style },
            ]
        );
    }
    createWorkSheet(wb, columns, priceList, 'Home Depot price list');

    return new Promise((res, rej) => {
        wb.write(path, (err, stats) => {
            if (err) rej(err);
            else res(stats);
        });
    });
};

module.exports = createExcel;
