const { JSDOM } = require('jsdom');
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
            if (process.env.LOGGING === 'true') console.log(data);
            const dom = new JSDOM(data);
            if (
                dom.window.document.body.querySelector('body>h1')
                    ?.textContent === 'Access Denied'
            )
                return Promise.reject('Access Denied please use proxy');
            const intId = getInternetId(data);
            if (!intId) {
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
