import { Controller, Post, Head, Body, Res, UseGuards, Get, Render, Query } from '@nestjs/common';
import { PaymentsService } from "./payments.service";
import { UsersService } from "./../users/users.service";
import { Response } from "express";
import { AuthGuard } from "@nestjs/passport";
import { User } from "src/entities/User.entity";
import * as cfg from "./../cfg";
import { JwtAuthGuard } from "src/auth/jwt.strategy";
import { CurrentUser } from "src/auth/current-user.decorator";
import { OrdersService } from "../orders/orders.service";
import { InjectStripeClient } from "@golevelup/nestjs-stripe";
import Stripe from "stripe";

@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly orders: OrdersService, // <-- фикс ①
    private readonly users: UsersService,
    @InjectStripeClient() // <-- фикс ②
    private readonly stripe: Stripe,
  ) {}

  @Get('success')
  @Render('success')  // смотрит в папке views/success.*
  successPage(@Query('oid') orderId: string) {
    return { orderId };
  }

  @Get('cancel')
  @Render('cancel')
  cancelPage(@Query('oid') orderId: string) {
    return { orderId };
  }

  @Post("checkout")
  @UseGuards(JwtAuthGuard) // user must be authenticated
  async createCheckout(
    @Body() dto: { priceId: string; qty?: number },
    @CurrentUser() user: User, // декоратор из своего auth модуля
  ) {
    // 1) Создаём/ищем stripe customer
    user = await this.payments.ensureCustomer(user);

    // 2) Создаём запись заказа
    const order = await this.orders.create({
      userId: user.id,
      priceId: dto.priceId,
      attemptsDelta: dto.qty ?? 1,
      stripeCustomerId: user.stripeCustomerId,
    });

    // 3) Создаём checkout‑session
    const session = await this.stripe.checkout.sessions.create({
      customer: user.stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: dto.priceId, quantity: dto.qty ?? 1 }],
      metadata: { orderId: order.id }, // <── связь!
      success_url: `${process.env.STRIPE_WEBHOOK_BACKURL}/payments/success?oid=${order.id}`,
      cancel_url: `${process.env.STRIPE_WEBHOOK_BACKURL}/payments/cancel?oid=${order.id}`,
    });

    // 4) Сохраняем sessionId, отдаём URL
    await this.orders.setSession(order.id, session.id);
    return { url: session.url };
  }

  async ensureCustomer(user: User): Promise<string> {
    if (user.stripeCustomerId) return user.stripeCustomerId;

    const customer = await this.stripe.customers.create({
      email: user.email,
      name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
    });

    const updated = await this.users.setStripeCustomerId(user.id, customer.id);
    return updated.stripeCustomerId!;
  }
}
