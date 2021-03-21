const WLogger = require('loggers/winston');
const { getPrice } = require('./getPrice.helper');

const scrapePrice = async (id, { extended } = { extended: false }) => {
    const data = await getPrice(id);
    WLogger.info(data, { service: 'scrapePrice', file: __filename });
    const {
        data: {
            searchModel: { products },
        },
    } = data;
    if (products?.length !== 1) return Promise.reject('Product not found');
    const product = products[0];
    const { pricing, availabilityType } = product;
    if (!pricing) {
        if (availabilityType.discontinued)
            return Promise.reject('Product discontinued');
        else return Promise.reject('Product price not found');
    }
    const { value, original } = pricing;

    return { price: value || original, itemId: product.itemId };
};

module.exports = scrapePrice;
