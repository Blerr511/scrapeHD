const WLogger = require('loggers/winston');
const redis = require('redis');
const url = process.env.REDIS_URL;
const redisClient = redis.createClient({ url });

redisClient.on('error', (error) => {
    WLogger.error(error, { file: __filename, service: 'redis' });
});

module.exports = redisClient;
