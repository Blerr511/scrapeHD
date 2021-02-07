const redisClient = require('./connect');
const { promisify } = require('util');
const getItem = promisify(redisClient.get).bind(redisClient);
const setItem = promisify(redisClient.set).bind(redisClient);

module.exports.getItem = getItem;
module.exports.setItem = setItem;
