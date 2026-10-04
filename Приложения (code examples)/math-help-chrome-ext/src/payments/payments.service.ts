// src/payments/payments.service.ts
import { Injectable, Logger } from "@nestjs/common";
import { InjectStripeClient } from "@golevelup/nestjs-stripe";
import Stripe from "stripe";
import { UsersService } from "../users/users.service";
import { OrdersService } from "../orders/orders.service";
import { User } from "src/entities/User.entity";
import { mapPriceToAttempts } from "./price‑map.util";
import * as fs from "fs";
import * as cfg from "./../cfg"
var isof = function (o, cn) {
  return (
    Object.getPrototypeOf(o).constructor.name.toUpperCase() === cn.toUpperCase()
  );
};

var saveToOutput = function (outputFile, add = false) {
  // create write stream
  // https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options
  //fs.createWriteStream(outputFile+".bak", {flags: 'w', encoding:'utf-8'}).end();
  const streamRaw = add
    ? fs.createWriteStream(outputFile, { flags: "a", encoding: "utf-8" })
    : fs.createWriteStream(outputFile, { flags: "w", encoding: "utf-8" });
  streamRaw.on("finish", () => {
    console.log(`All writes to ${outputFile} are now complete.`);
  });

  // return wrapper function which simply writes data into the stream
  return (data) => {
    // check if the stream is writable
    if (streamRaw.writable) {
      if (data === null) {
        streamRaw.end();
        return outputFile;
      } else if (isof(data, "array")) {
        // let dv=new DataView(x.buffer);
        try {
          streamRaw.write(data.join("\n") + "\n");
        } catch (e) {
          console.error(e);
        }
      } else if (isof(data, "string")) {
        try {
          streamRaw.write(data);
        } catch (e) {
          console.error(e);
        }
      } else {
        console.error(
          `input type error! input type is ${Object.getPrototypeOf(data).constructor.name}`,
        );
      }
    } else {
      console.log(`stream is not writable ${streamRaw.path}`);
    }
  };
};

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger("Payment");
  private readonly fw = saveToOutput("l.log");
  constructor(
    @InjectStripeClient() private readonly stripe: Stripe,
    private readonly orders: OrdersService,
    private readonly users: UsersService,
  ) {}

  /** Убеждаемся, что у пользователя есть stripeCustomerId */
  async ensureCustomer(user: User): Promise<User> {
    this.fw(JSON.stringify(user));
    user = await this.users.findByGoogleId(user.googleId);
    this.fw(JSON.stringify(user));
    this.fw(
      `ensureCustomer(): user.id=${user.id}, existing stripeCustomerId=${user.stripeCustomerId}`,
    );
    if (user.stripeCustomerId) {
      this.fw(
        `ensureCustomer(): Found existing customerId=${user.stripeCustomerId}`,
      );
      return user;
    }
    this.fw(JSON.stringify(user));
    try {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
      });

      this.fw(JSON.stringify(customer));

      this.fw(
        `ensureCustomer(): Created new Stripe customer ${customer.id} for user.id=${user.id}`,
      );

      const updated = await this.users.setStripeCustomerId(
        user.id,
        customer.id,
      );
      this.fw(
        `ensureCustomer(): Persisted stripeCustomerId in DB for user.id=${user.id}`,
      );
      return updated;
    } catch (error) {
      this.fw(
        `ensureCustomer(): Failed to create Stripe customer for user.id=${user.id}`,
      );
      throw error;
    }
  }

  /**
   * Создаёт checkout session и сохраняет его в ордере
   */
  // async createCheckoutSession(
  //   userId: number,
  //   priceId: string,
  // ): Promise<Stripe.Checkout.Session> {
  //   this.fw(
  //     `createCheckoutSession(): start — userId=${userId}, priceId=${priceId}`,
  //   );
  //   // шаг 1: достаём юзера
  //   const user = await this.users.findById(userId);
  //   this.fw(
  //     `createCheckoutSession(): fetched user from DB — stripeCustomerId=${user.stripeCustomerId}`,
  //   );
  //
  //   // шаг 2: считаем сколько попыток даёт этот прайс
  //   const attemptsDelta = mapPriceToAttempts(priceId);
  //   this.fw(`createCheckoutSession(): attemptsDelta=${attemptsDelta}`);
  //
  //   // шаг 3: создаём «черновик» заказа
  //   const draft = await this.orders.createDraft({
  //     user,
  //     userId,
  //     priceId,
  //     attemptsDelta,
  //     stripeSessionId: "pending",
  //   });
  //   this.fw(
  //     `createCheckoutSession(): draft order created — orderId=${draft.id}`,
  //   );
  //
  //   // шаг 4: создаём Session в Stripe
  //   try {
  //     const session = await this.stripe.checkout.sessions.create({
  //       customer: user.stripeCustomerId ?? undefined,
  //       mode: "subscription",
  //       payment_method_types: ["card"],
  //       line_items: [{ price: priceId, quantity: 1 }],
  //       metadata: { orderId: draft.id },
  //       success_url: `${process.env.FRONTEND_URL}/success?oid=${draft.id}`,
  //       cancel_url: `${process.env.FRONTEND_URL}/cancel?oid=${draft.id}`,
  //     });
  //     this.fw(
  //       `createCheckoutSession(): Stripe session created — sessionId=${session.id}`,
  //     );
  //
  //     // шаг 5: сохраняем sessionId в ордере
  //     await this.orders.markPaid(
  //       draft.id.toString(),
  //       session.payment_intent as string,
  //     );
  //     this.fw(
  //       `createCheckoutSession(): sessionId saved to order — orderId=${draft.id}`,
  //     );
  //
  //     return session;
  //   } catch (error) {
  //     this.fw(
  //       `createCheckoutSession(): Error creating Stripe session for orderId=${draft.id}`,
  //     );
  //     throw error;
  //   }
  //}
}
