const updateModels = require('./uploadNewData.controller');
const updateOptions = require('./updateScrapperOptions.controller');
const getOptions = require('./getOptions.controller');

const controller = {
    updateModels,
    updateOptions,
    getOptions,
};

module.exports = controller;
