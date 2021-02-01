const { JSDOM } = require('jsdom');
const { default: fetch } = require('node-fetch');

const scrapePrice = async (id) =>
    await fetch(`https://www.homedepot.com/s/${id}`)
        .then((data) => data.text())
        .then((data) => {
            if (!data) return Promise.reject('Failed to load');
            return data;
        })
        .then((data) => {
            const dom = new JSDOM(data);
            if (
                dom.window.document.body.querySelector('body>h1')
                    ?.textContent === 'Access Denied'
            )
                return Promise.reject('Access Denied please use proxy');
            const price = dom.window.document.body.querySelector(
                '.price>div>span:nth-of-type(2)'
            );
            if (!price)
                return Promise.reject("Model or it' price not found");
            return Number(price.textContent);
        });
module.exports = scrapePrice;
