const scrapper = require('services/scrapper').default;

const updateScrapperOptions = async (req, res, next) => {
    scrapper.setTimerOptions(req.body);
    if (req.body.fileLimit) scrapper.fileLimit = req.body.fileLimit;
    next();
};

const response = (req, res, next) => {
    res.send({
        success: true,
    });
    next();
};

module.exports = [updateScrapperOptions, response];
