const winston = require('winston')
const { combine , printf, timestamp, colorize, json } = winston.format

const myFormat = printf((info)=> `${info.timestamp} [${info.level}] ${info.message}`)

const logger = winston.createLogger({

    transports: [
        new winston.transports.File({ 
                filename: './Logs/winston/warn.log', 
                level: 'warn', 
                format: (combine(timestamp(), json(), myFormat))
        }),
        new winston.transports.File({ 
                filename: './Logs/winston/error.log', 
                level: 'error', 
                format: (combine(timestamp(), json(), myFormat))
        }),
        new winston.transports.Console({
                level: 'verbose', 
                format: (combine(colorize(), timestamp(), myFormat))
        })
    ]
})


module.exports = logger