import * as dotenv from "dotenv";
dotenv.config();
import { StripeModule } from "@golevelup/nestjs-stripe";
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RawBody,
  RequestMethod,
} from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ImageModule } from "./common/utils/image/image.module";
import { MetricsModule } from "./metrics/metrics.module";
import { OrdersModule } from "./orders/orders.module"; // Import MetricsModule
import { RequestLoggerMiddleware } from "./middlewares/request-logger.middleware";
import { WinstonModule } from "nest-winston";
import { LoggerConfig } from "./logger";
import { DiscoveryModule } from "@golevelup/nestjs-discovery";
import { WebhooksModule, applyRawBodyOnlyTo } from "@golevelup/nestjs-webhooks"; // 👈
import { SubscriptionsModule } from './subscriptions/subscriptions.module';  // ← добавили
import { HealthModule } from './health/health.module';

import * as cfg from "./cfg";
import { PaymentsModule } from "./payments/payments.module";
import { ThrottlerModule } from '@nestjs/throttler';
import {SharedStripeModule} from "./shared/stripe/stripe.module";
import { ScheduleModule } from '@nestjs/schedule';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ "ttl": 60, limit: 10 }]),
    ScheduleModule.forRoot(),
    WinstonModule.forRoot(LoggerConfig),
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ".env" }),
    /** 1️⃣  StripeModule — в самом верху, до любого модуля,
     *  который просто `import { StripeModule }`             */
    // StripeModule.forRoot({
    //   apiKey: process.env.STRIPE_SECRET_KEY,
    //   webhookConfig: {
    //     stripeSecrets: {
    //       accountTest:process.env.STRIPE_WEBHOOK_SECRET,
    //     },
    //   },
    // }),
    SharedStripeModule,
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,
      entities: [
        __dirname + "/entities/*.entity{.ts,.js}",
        __dirname + "/orderss/*.entity{.ts,.js}",
      ],
      logging: true,
    }),
    OrdersModule,
    AuthModule,
    UsersModule,
    ImageModule,
    DiscoveryModule,
    WebhooksModule.forRoot({ requestRawBodyProperty: "rawBody" }),
    MetricsModule,
    PaymentsModule,
    SubscriptionsModule,
    HealthModule,
    TelegramModule,    
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    applyRawBodyOnlyTo(consumer, {
      method: RequestMethod.ALL,
      path: "stripe/webhook",
    });
    consumer.apply(RequestLoggerMiddleware).forRoutes("*");

    // raw‑body нужен только Stripe‑вебхуку
  }
}
