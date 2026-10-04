// src/subscriptions/subscriptions.service.ts
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectStripeClient } from '@golevelup/nestjs-stripe';
import Stripe from 'stripe';

import { resetCounterIfNeeded, UsersService } from '../users/users.service';
import { User } from '../entities/User.entity';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  /* Данные, которые нужны фронтенду */

  constructor(
    @InjectStripeClient() private readonly stripe: Stripe,
    private readonly users: UsersService,
  ) {
  }

  getSubscription(user: User) {
    let attemptsLeft = user.attemptsLeft ?? 0;

    if (user.subscriptionPlan && user.subscriptionStatus !== 'canceled') {
      resetCounterIfNeeded(user);
      attemptsLeft = Math.max(attemptsLeft - user.attemptsUsedToday, 0);
    } else {
      attemptsLeft = 0;
    }

    return {
      attemptsLeft,
      plan: user.subscriptionPlan,
      status: user.subscriptionStatus,
      periodEnd: user.subscriptionPeriodEnd,
    };
  }

  /* Отмечаем подписку как “отменить в конце текущего периода” */
  async cancelSubscription(user: User) {
    if (!user.subscriptionId) {
      throw new BadRequestException('У пользователя нет активной подписки');
    }

    /* 1) помечаем в Stripe */
    await this.stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: true,
    });

    /* 2) фиксируем в БД */
    await this.users.updateSubscriptionByCustomerId(user.stripeCustomerId, {
      id: user.subscriptionId,
      status: 'canceling',
      periodEnd: user.subscriptionPeriodEnd,
      plan: user.subscriptionPlan,
      attemptsLeft: user.attemptsLeft
    });

    this.logger.log(
      `Subscription ${user.subscriptionId} set to canceling for user ${user.id}`,
    );
  }
}
