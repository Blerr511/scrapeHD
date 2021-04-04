const scrapper = require('services/scrapper').default;

const uploadNewDataController = async (req, res, next) => {
    res.send(scrapper.options);
};

module.exports = [uploadNewDataController];
