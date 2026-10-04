import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Order } from './Order.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  /* ─── контактные данные ─── */
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  /* ─── Google-OAuth ─── */
  @Column({ nullable: true })
  googleId: string;

  /* ─── Stripe ─── */
  @Column({ nullable: true })
  stripeCustomerId: string;

  @Column({ type: 'int', default: 0 })
  attemptsUsedToday: number;          // сколько уже потратил сегодня

  @Column({ type: 'date', nullable: true })
  attemptsDate: Date;                 // дата, к которой относится счётчик



  /* подписка (обновляется методом updateSubscriptionByCustomerId) */
  @Column({ nullable: true })
  subscriptionId: string;                       // sub_***

  @Column({ type: 'timestamp', nullable: true })
  subscriptionPeriodEnd: Date;                  // current_period_end

  @Column({ length: 16, default: 'active' })
  subscriptionStatus: 'active' | 'canceling' | 'canceled';

  @Column({ length: 12, nullable: true })
  subscriptionPlan: 'Weekly' | 'Monthly' | 'Yearly';

  /* ─── attempts ─── */
  @Column({ nullable: true })
  attemptsLeft: number;

  @Column({ nullable: true })
  attemptsCount: number;

  /* ─── связи ─── */
  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];
}
