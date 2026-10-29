// src/subscriptions/subscriptions.controller.ts
import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard }           from '../auth/jwt.strategy';
import { CurrentUser }            from '../auth/current-user.decorator';
import { User }                   from '../entities/User.entity';
import { SubscriptionsService }   from './subscriptions.service';

@UseGuards(JwtAuthGuard)
@Controller('subscription')
export class SubscriptionsController {
  constructor(private readonly subs: SubscriptionsService) {}

  /** GET /subscription Ц отдаЄм фронту текущую информацию */
  @Get()
  getMySubscription(@CurrentUser() user: User) {
    console.log('[SUBSCRIPTIONS] subscription requested by', user.email);
    return this.subs.getSubscription(user);
  }

  /** POST /subscription/cancel Ц отметить Ђотменить в конце периодаї */
  @Post('cancel')
  async cancel(@CurrentUser() user: User) {
    console.log('[SUBSCRIPTIONS] Cancel requested by', user.email);
    await this.subs.cancelSubscription(user);
    return { ok: true };
  }
}
