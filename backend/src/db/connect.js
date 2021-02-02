const redis = require('redis');
const url = process.env.REDIS_URL;
const redisClient = redis.createClient({ url });

module.exports = redisClient;
