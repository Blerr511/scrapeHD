const createWorkSheet = (wb, columns, data, options) => {
    const ws = wb.addWorksheet(options);
    const headerStyle = wb.createStyle({
        font: {
            bold: true,
        },
        alignment: {
            wrapText: true,
            horizontal: 'center',
        },
    });
    columns.forEach(({ style, accessor, width, header, freeze }, i) => {
        const colIndex = i + 1;
        if (width) ws.column(colIndex).setWidth(width);
        if (freeze) ws.column(colIndex).freeze();
        if (header && typeof header === 'string')
            ws.cell(1, colIndex).string(header).style(headerStyle);
        else if (header && typeof header === 'number')
            ws.cell(1, colIndex).number(header).style(headerStyle);

        data.forEach((data, k) => {
            const rowIndex = k + 2;
            const value =
                typeof accessor === 'function'
                    ? accessor(data)
                    : data[accessor];
            if (value && typeof value === 'string') {
                ws.cell(rowIndex, colIndex).string(value);
            } else if (value && typeof value === 'number') {
                ws.cell(rowIndex, colIndex).number(value);
            } else if (value && value instanceof Date) {
                ws.cell(rowIndex, colIndex).date(value.getTime());
            }
            if (style) ws.cell(rowIndex, colIndex).style(style);
        });
    });

    return wb;
};

module.exports = createWorkSheet;
