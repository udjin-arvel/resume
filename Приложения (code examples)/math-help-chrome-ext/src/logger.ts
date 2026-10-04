import { utilities as nestWinstonModuleUtilities } from "nest-winston";
import * as winston from "winston";
import "winston-daily-rotate-file";

export const LoggerConfig = {
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        nestWinstonModuleUtilities.format.nestLike(), // NestJS-style logs
      ),
    }),
    new winston.transports.DailyRotateFile({
      dirname: "./logs",
      filename: "application-%DATE%.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
      level: "debug", // Log all levels to the file
      handleExceptions: true, // Handle uncaught exceptions
      handleRejections: true, // Handle unhandled promise rejections
    }),
  ],
};
