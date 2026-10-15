import { Module } from "@nestjs/common";
import { PaymentsService } from "./payments.service";
import { PaymentsController } from "./payments.controller";
import { StripeWebhookService } from "./stripe-webhook.service";
import { UsersModule } from "../users/users.module";
import { OrdersModule } from "../orders/orders.module";
import { TelegramModule } from "../telegram/telegram.module";

@Module({
  imports: [
    UsersModule,
    OrdersModule,
    TelegramModule,
  ],
  providers: [PaymentsService, StripeWebhookService],
  controllers: [PaymentsController],
})
export class PaymentsModule {}
