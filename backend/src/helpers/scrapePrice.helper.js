const WLogger = require('loggers/winston');
const { default: fetch } = require('node-fetch');
const { getPrice } = require('./getPrice.helper');
const getInternetId = (data) => {
    let index = data.search('Internet #');
    if (index === -1) return null;
    let result = '';
    while (true) {
        if (isNaN(parseInt(data[index]))) {
            if (result === '') {
                index++;
                continue;
            } else break;
        } else {
            result += data[index];
            index++;
        }
    }
    return result;
};
const scrapePrice = async (id) =>
    await fetch(`https://www.homedepot.com/s/${id}`)
        .then((data) => data.text())
        .then((data) => {
            if (!data) return Promise.reject('Failed to load');
            return data;
        })
        .then(async (data) => {
            WLogger.info(data, {
                service: 'Scrapper',
                file: __filename,
                operation: 'Fetched data',
            });
            const intId = getInternetId(data);
            if (!intId) {
                if (data.search(/access denied/gi) === -1)
                    return Promise.reject('Access Denied please use proxy');

                return Promise.reject('Product not found');
            }

            try {
                const price = await getPrice(intId);
                if (!price) return Promise.reject('Product price not found');
                return price;
            } catch (error) {
                return Promise.reject(error.message || error);
            }
        });
module.exports = scrapePrice;
