// payments/stripe-webhook.service.ts
import { mapPriceToAttempts } from "./price‑map.util";
import { Injectable, Logger } from "@nestjs/common";
import {InjectStripeClient, StripeWebhookHandler} from "@golevelup/nestjs-stripe";
import Stripe from "stripe";
import { UsersService } from "../users/users.service";
import { OrdersService } from "../orders/orders.service";
import { TelegramService } from "../telegram/telegram.service";

@Injectable()
export class StripeWebhookService {
  private readonly logger = new Logger(StripeWebhookService.name);

  constructor(
    private readonly users: UsersService,
    private readonly orders: OrdersService,
    private readonly telegram: TelegramService,
    @InjectStripeClient() private readonly stripe: Stripe
  ) {}

  @StripeWebhookHandler('checkout.session.completed')
  async handleCheckoutCompleted(evt: Stripe.Event) {
    const session = evt.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.orderId;
    if (!orderId) return;

    const order = await this.orders.find(orderId);
    if (!order || order.status === 'paid') return;

    /** ── 1. отмечаем заказ оплаченным ───────────────────── */
    await this.orders.markPaid(Number(orderId), {
      customerId      : String(session.customer),
      paymentIntentId : String(session.payment_intent),
    });

    /** ── 2. начисляем попытки ───────────────────────────── */
    const attempts = mapPriceToAttempts(order.priceId);
    await this.users.incrementAttemptsByCustomerId(
        order.stripeCustomerId,
        attempts,
    );

    /** ── 3. если это подписка – сохраняем данные подписки ─ */
    if (session.mode === 'subscription' && session.subscription) {
      const sub = await this.stripe.subscriptions.retrieve(
        session.subscription as string,
        { expand: ['items.data.price'] },
      );

      // определяем план по первому price
      const priceId = sub.items.data[0].price.id;
      const plan = priceId === process.env.STRIPE_WEEKLY_ID ? 'Weekly' :
                  priceId === process.env.STRIPE_MONTHLY_ID ? 'Monthly' :
                  priceId === process.env.STRIPE_YEARLY_ID ? 'Yearly' : null;

      await this.users.updateSubscriptionByCustomerId(order.stripeCustomerId, {
        id: sub.id,
        status: sub.cancel_at_period_end ? 'canceling' : (sub.status as any),
        periodEnd: new Date(sub.items.data[0].current_period_end * 1000),   // ← берем прямо отсюда
        plan,
        attemptsLeft: -69,
      });

      this.logger.log(`Subscription ${sub.id} created for customer ${order.stripeCustomerId}`);
      await this.telegram.sendPaymentSuccessAlert(order.stripeCustomerId, plan);
    }
  }
  @StripeWebhookHandler('customer.subscription.updated')
  async handleSubscriptionUpdated(evt: Stripe.Event) {
    const sub = evt.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

    if (sub.cancel_at_period_end) {
      await this.users.updateSubscriptionByCustomerId(customerId, {
        id: sub.id,
        status: 'canceling',
        periodEnd: new Date((sub.ended_at ?? sub.items.data[0].current_period_end) * 1000),
        plan: null, // или по sub.items.data[0].price.id
        attemptsLeft:-69,
      });
    }
  }

  @StripeWebhookHandler("customer.subscription.deleted")
  async handleSubscriptionRevoked(evt: Stripe.Event) {
    const sub = evt.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;

    this.logger.log(`Subscription ${sub.id} deleted for customer ${customerId}`);

    await this.users.updateSubscriptionByCustomerId(customerId, {
      id: sub.id,
      status: 'canceled', // 👈 ключевое
      periodEnd: new Date((sub.ended_at ?? Date.now()) * 1000), // Fallback на now
      plan: null, // 👈 Можешь обнулить план
      attemptsLeft:0
    });
  }

  @StripeWebhookHandler("invoice.paid")
  async handleSubscriptionRenew(evt: Stripe.Event) {
    this.logger.log('Handle Subscription Renew:', evt.data.object);
    const invoice = evt.data.object as Stripe.Invoice;
    
    // Проверяем, что это подписка (не разовый платеж)
    if ((invoice as any).subscription) {
      const subscription = await this.stripe.subscriptions.retrieve(
        (invoice as any).subscription as string,
        { expand: ['items.data.price'] }
      );
      
      const customerId = typeof subscription.customer === 'string' 
        ? subscription.customer 
        : subscription.customer.id;
      
      this.logger.log(`Subscription ${subscription.id} renewed for customer ${customerId}`);
      
      // Определяем план по price ID (аналогично строке 57)
      const priceId = subscription.items.data[0].price.id;
      const plan = priceId === process.env.STRIPE_WEEKLY_ID ? 'Weekly' :
                  priceId === process.env.STRIPE_MONTHLY_ID ? 'Monthly' :
                  priceId === process.env.STRIPE_YEARLY_ID ? 'Yearly' : null;
      
      // Обновляем подписку в базе данных (аналогично строке 57)
      await this.users.updateSubscriptionByCustomerId(customerId, {
        id: subscription.id,
        status: subscription.cancel_at_period_end ? 'canceling' : (subscription.status as any),
        periodEnd: new Date((subscription.items.data[0]?.current_period_end || Date.now() / 1000) * 1000),
        plan,
        attemptsLeft: -69,
      });

      this.logger.log(`Subscription ${subscription.id} renewed for customer ${customerId}`);
    } else {
      this.logger.log('Not a subscription invoice');
    }
  }

  @StripeWebhookHandler("invoice.payment_failed")
  async handlePaymentFailed(evt: Stripe.Event) {
    this.logger.log('Handle Payment Failed:', evt.data.object);
    const invoice = evt.data.object as Stripe.Invoice;
    
    // Проверяем, что это подписка (не разовый платеж)
    if ((invoice as any).subscription) {
      const subscription = await this.stripe.subscriptions.retrieve(
        (invoice as any).subscription as string,
        { expand: ['items.data.price'] }
      );
      
      const customerId = typeof subscription.customer === 'string' 
        ? subscription.customer 
        : subscription.customer.id;
      
      this.logger.log(`Payment failed for subscription ${subscription.id}, customer ${customerId}`);
      
      // Определяем план по price ID
      const priceId = subscription.items.data[0].price.id;
      const plan = priceId === process.env.STRIPE_WEEKLY_ID ? 'Weekly' :
                  priceId === process.env.STRIPE_MONTHLY_ID ? 'Monthly' :
                  priceId === process.env.STRIPE_YEARLY_ID ? 'Yearly' : null;
      
      // Обновляем статус подписки на проблемный
      await this.users.updateSubscriptionByCustomerId(customerId, {
        id: subscription.id,
        status: 'canceled',
        periodEnd: new Date((subscription.items.data[0]?.current_period_end || Date.now() / 1000) * 1000),
        plan,
        attemptsLeft: 0, // убираем попытки при неудачном платеже
      });
      
      this.logger.warn(`Subscription ${subscription.id} marked as canceling due to payment failure`);
      await this.telegram.sendPaymentFailedAlert(customerId, subscription.id);
    } else {
      this.logger.log('Not a subscription invoice');
    }
  }

  /**
   * (Optional) You can wire up additional handlers here:
   *
   * @StripeWebhookHandler('payment_intent.succeeded')
   * async handlePaymentIntentSucceeded(event: Stripe.Event) {
   *   // ...
   * }
   */
}
