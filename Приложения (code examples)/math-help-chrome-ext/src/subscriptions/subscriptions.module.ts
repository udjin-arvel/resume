// src/subscriptions/subscriptions.module.ts
import { Module }           from '@nestjs/common';
import { UsersModule }      from '../users/users.module';

import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService }   from './subscriptions.service';
import {StripeModule} from "@golevelup/nestjs-stripe";
import {SharedStripeModule} from "../shared/stripe/stripe.module";

@Module({
  /* StripeModule.forRoot уже находится в AppModule,
     поэтому здесь достаточно просто StripeModule (или forFeature()) */
  imports: [UsersModule,SharedStripeModule],
  controllers: [SubscriptionsController],
  providers:   [SubscriptionsService],
})
export class SubscriptionsModule {}
