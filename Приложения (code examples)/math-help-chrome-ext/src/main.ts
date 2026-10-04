import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { WinstonLogger, WinstonModule } from "nest-winston";
import { LoggerConfig } from "./logger";
import * as bodyParser from "body-parser";

import { loggers } from "winston";
import * as fs from "fs";
import winston from "winston/lib/winston/config";
//import * as dotenv from "dotenv";
//dotenv.config();


async function bootstrap() {
  /*  const httpsOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem'),
  };*/
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    logger: WinstonModule.createLogger(LoggerConfig), // Use Winston logger
  });
  app.enableCors({ origin: ['chrome-extension://aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa','https://example.com'],
methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true

 });
  // Only this route gets the raw parser:
  app.use(
    "/stripe/webhook",
    // ⬇️ parse as raw so we get a Buffer in req.body
    bodyParser.raw({ type: "application/json", limit: "2mb" }),
    // ⬇️ immediately inspect it
    // (req, res, next) => {
    //   // req.body is the raw Buffer
    //   console.log('stripe-signature header:', req.headers['stripe-signature']);
    //   console.log('req.body is Buffer?', Buffer.isBuffer(req.body));
    //   if (Buffer.isBuffer(req.body)) {
    //     // you can even peek at the first 200 bytes of the payload
    //     console.log(req.body.toString('utf8', 0, 200));
    //   }
  );
  //     next();
  //   },
  // );

  // All your other routes still get normal JSON
  app.use(bodyParser.json({ limit: "10mb" }));
  app.use(bodyParser.urlencoded({ extended: true, limit: "10mb" }));
  // 1) подключаем статику (если нужно)
  app.useStaticAssets(join(__dirname, './', 'public'));

  // 2) указываем, где лежат .ejs
  app.setBaseViewsDir(join(__dirname, './', 'views'));

  // 3) регистрируем EJS как движок
  app.setViewEngine('ejs');
  /** 2️⃣  Your “normal” parsers for every other route */
  //  app.use(bodyParser.json({ limit: '10mb' }));
  //

  // Handle shutdown signals to flush logs
  process.on("SIGTERM", async () => {
    this.logger.log(
      "SIGTERM signal received. Shutting down gracefully...",
      "Bootstrap",
    );
    await app.close();
    process.exit(0);
  });

  process.on("SIGINT", async () => {
    this.logger.log(
      "SIGINT signal received. Shutting down gracefully...",
      "Bootstrap",
    );
    await app.close();
    process.exit(0);
  });

  await app.listen(5555);
}
bootstrap();
