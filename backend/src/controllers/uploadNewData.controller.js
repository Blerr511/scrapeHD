const scrapper = require('services/scrapper').default;

const uploadNewDataController = async (req, res, next) => {
    const host = `${req.protocol}://${req.get('host')}`;
    scrapper.host = host;
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
