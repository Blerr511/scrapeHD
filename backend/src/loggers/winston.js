const winston = require('winston');
require('winston-daily-rotate-file');

const dailyErrorTransport = new winston.transports.DailyRotateFile({
    filename: 'error.log',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'error',
    dirname: 'logs/%DATE%',
});

const dailyInfoTransport = new winston.transports.DailyRotateFile({
    filename: 'info.log',
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'info',
    dirname: 'logs/%DATE%',
});

const WLogger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        dailyInfoTransport,
        dailyErrorTransport,
    ],
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
//
if (process.env.NODE_ENV !== 'production') {
    WLogger.add(
        new winston.transports.Console({
            format: winston.format.simple(),
        })
    );
}

module.exports = WLogger;
