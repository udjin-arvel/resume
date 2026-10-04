// src/orders/order.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User.entity";

export type OrderStatus = "pending" | "paid" | "failed";
// src/entities/Order.entity.ts
/* добавили обязательность, дефолты и длину строк,
   чтобы отражать фактическую схему БД */
@Entity({ name: 'order' })
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  /*  FK  */
  @Column({ type: 'int', nullable: false })
  userId: number;

  @ManyToOne(() => User, u => u.orders, { nullable: false })
  @JoinColumn({ name: 'userId' })
  user: User;

  /*  Stripe specific  */
  @Column({ length: 64, nullable: true })
  stripeCustomerId: string | null;             // ← дозаполняем веб‑хуком

  @Column({ length: 256, nullable: true })
  stripeSessionId: string | null;              // кладём при checkout

  @Column({ length: 256, nullable: true })
  stripePaymentIntentId: string | null;        // ← дозаполняем веб‑хуком

  @Column({ length: 64, nullable: false })
  priceId: string;

  @Column({ type: 'int', nullable: false })
  attemptsDelta: number;

  @Column({
    type:  'enum',
    enum:  ['pending', 'paid', 'failed'],
    default: 'pending',
  })
  status: OrderStatus;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;
}
