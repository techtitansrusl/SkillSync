import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const LOG_DIR = path.join('d:', 'SkillSync', 'logs');

const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

const logger = winston.createLogger({
    level: 'info',
    format: logFormat,
    defaultMeta: { service: 'skillsync-backend' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        }),
        new DailyRotateFile({
            filename: path.join(LOG_DIR, 'backend-error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxFiles: '14d'
        }),
        new DailyRotateFile({
            filename: path.join(LOG_DIR, 'backend-combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d'
        })
    ]
});

export default logger;
