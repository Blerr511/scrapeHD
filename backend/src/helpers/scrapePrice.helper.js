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
            const price = dom.window.document.body.querySelectorAll(
                '.price>div>span'
            );
            if (!price?.length)
                return Promise.reject("Model or it's price not found");
            return (
                Number(price[1].textContent) +
                0.01 * Number(price[2].textContent)
            );
        });
module.exports = scrapePrice;
