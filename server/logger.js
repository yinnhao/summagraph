import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 日志目录
const logDir = path.join(__dirname, '../logs');

// 自定义日志格式
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;

    // 添加元数据
    if (Object.keys(meta).length > 0) {
      // 过滤掉 winston 内部字段
      const cleanMeta = Object.fromEntries(
        Object.entries(meta).filter(([key]) => !key.startsWith('_'))
      );
      if (Object.keys(cleanMeta).length > 0) {
        msg += ` ${JSON.stringify(cleanMeta)}`;
      }
    }

    if (stack) {
      msg += `\n${stack}`;
    }

    return msg;
  })
);

// 控制台格式（带颜色）
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    let msg = `${timestamp} ${level}: ${message}`;

    // 添加元数据（简化显示）
    if (Object.keys(meta).length > 0) {
      const cleanMeta = Object.fromEntries(
        Object.entries(meta).filter(([key]) => !key.startsWith('_'))
      );
      if (Object.keys(cleanMeta).length > 0) {
        msg += ` ${JSON.stringify(cleanMeta)}`;
      }
    }

    return msg;
  })
);

// 创建 logger 实例
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    // 所有日志（info 及以上）
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d', // 保留 14 天
      format: customFormat
    }),

    // 错误日志（error 及以上）
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d', // 保留 30 天
      format: customFormat
    }),

    // 控制台输出（开发环境）
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug'
    })
  ],
  // 异常处理
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d'
    })
  ]
});

export default logger;
