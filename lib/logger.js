var logger = require('winston');

logger.setLevels({
    debug:0,
    info: 1,
    warn: 2,
    error:3,
});
logger.addColors({
    debug: 'green',
    info:  'cyan',
    warn:  'yellow',
    error: 'red'
});

logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, { level: 'debug', colorize: true, timestamp: true });

module.exports = logger;
