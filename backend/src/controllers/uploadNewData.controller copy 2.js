const scrapper = require('services/scrapper');

const uploadNewDataController = async (req, res, next) => {
    scrapper.setModelList(req.body.data);
    next();
};

const response = (req, res, next) => {
    res.send({
        success: true,
    });
    next();
};

module.exports = [uploadNewDataController, response];
