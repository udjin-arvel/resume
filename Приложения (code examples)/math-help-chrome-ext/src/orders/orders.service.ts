import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Order } from "../entities/Order.entity";
import { User } from "../entities/User.entity";

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order) private readonly ordersRepo: Repository<Order>,
  ) {}

  /** Create empty order in status `created` */
  async createDraft(params: {
    user: User;
    userId: number;
    priceId: string;
    attemptsDelta: number;
    stripeSessionId: string;
  }): Promise<Order> {
    const order = this.ordersRepo.create({
      ...params,
      stripePaymentIntentId: null,
      status: "pending",
    });
    return this.ordersRepo.save(order);
  }
  async save(order: Order) {
    return this.ordersRepo.save(order);
  }
  async markPaid(
      orderId: number,
      opts: { customerId: string; paymentIntentId: string },
  ) {
    await this.ordersRepo.update(orderId, {
      status: 'paid',
      stripeCustomerId:   opts.customerId,
      stripePaymentIntentId: opts.paymentIntentId,
    });
  }

  async find(orderId: string) {
    return this.ordersRepo.findOne({ where: { id: parseInt(orderId) } });
  }

  async findBySession(sessionId: string) {
    return this.ordersRepo.findOne({ where: { stripeSessionId: sessionId } });
  }
  async create(params: {
    userId: number;
    priceId: string;
    attemptsDelta: number;
    stripeCustomerId:string;
  }) {
    const order = this.ordersRepo.create({
      ...params,
      status: "pending",
    });
    return this.ordersRepo.save(order);
  }

  /** Записываем Stripe‑session‑ID */
  async setSession(orderId: number, sessionId: string) {
    await this.ordersRepo.update(orderId, { stripeSessionId: sessionId });
  }
}
