const scrapper = require('services/scrapper');

const uploadNewDataController = async (req, res, next) => {
    res.send(scrapper.options);
};

module.exports = [uploadNewDataController];
