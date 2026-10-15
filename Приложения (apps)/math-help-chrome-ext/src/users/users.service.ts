import { ForbiddenException, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "src/entities/User.entity";
import { Repository } from "typeorm";

/** суточный лимит в зависимости от плана */
export function dailyLimit(plan: string): number {
  switch (plan) {
    case 'Weekly':  return 300;
    case 'Monthly': return 200;
    case 'Yearly':  return 70;
    default:        return 10; // гость / free
  }
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async findOrCreate(userData: Partial<User>): Promise<User> {
    let user = await this.usersRepository.findOne({
      where: { email: userData.email },
    });

    if (!user) {
      user = this.usersRepository.create({ ...userData, attemptsLeft: 10 });
      await this.usersRepository.save(user);
    }

    return user;
  }
  async findById(userId: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException("User not found");
    }
    return user;
  }
  async incrementAttemptsById(userId: number, delta: number): Promise<User> {
    return this.updateAttemptsById(userId, delta);
  }
  async getFreeAttempts(email: string): Promise<number> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException({ message: "User not found" });
    }
    return user.attemptsLeft;
  }

  async updateAttempts(email: string, attemptsUsed: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException({ message: "User not found" });
    }

    user.attemptsLeft = Math.max(user.attemptsLeft - attemptsUsed, 0);
    await this.usersRepository.save(user);

    return user;
  }

  async logout(email: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      throw new UnauthorizedException({ message: "User not found" });
    }

    user.googleId = null;
    await this.usersRepository.save(user);
  }
  /** осталось попыток сегодня */
  getRemainingAttempts(user: User): number {
    resetCounterIfNeeded(user);
    return Math.max(dailyLimit(user.subscriptionPlan) - user.attemptsUsedToday, 0);
  }
  async getMe(
    token: string,
  ): Promise<{ googleId: string; attemptsLeft: number }> {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: "demo-jwt-secret",
      });
      const user = await this.usersRepository.findOne({
        where: { googleId: decoded.user.googleId },
      });

      if (!user) {
        throw new UnauthorizedException({ message: "User not found" });
      }

      return { googleId: user.googleId, attemptsLeft: user.attemptsLeft };
    } catch (err) {
      throw new UnauthorizedException({ message: "Invalid token", error: err });
    }
  }
  async incrementAttemptsByEmail(email: string, amount: number): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) throw new UnauthorizedException("User not found");

    user.attemptsLeft = (user.attemptsLeft || 0) + amount;
    return this.usersRepository.save(user);
  }
  /**
   * Обновляет attemptsLeft для пользователя с данным id.
   * @param userId — id пользователя
   * @param delta — сколько добавить (если отрицательное, то отнять)
   */
  async updateAttemptsById(userId: number, delta: number): Promise<User> {
    // 1) Найти пользователя
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException(`User with id=${userId} not found`);
    }

    // 2) Изменить attemptsLeft (не ниже 0)
    user.attemptsLeft = Math.max((user.attemptsLeft ?? -5) + delta, 0);

    // 3) Сохранить и вернуть
    return this.usersRepository.save(user);
  }
  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { googleId } });
  }
  async setStripeCustomerId(
    userId: number,
    stripeCustomerId: string,
  ): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error("User not found");
    user.stripeCustomerId = stripeCustomerId;
    return this.usersRepository.save(user);
  }

  async incrementAttemptsByCustomerId(stripeCustomerId: string, delta: number) {
    // 1) Найти пользователя
    const user = await this.usersRepository.findOne({ where: { stripeCustomerId: stripeCustomerId } });
    if (!user) {
      throw new UnauthorizedException(`User with id=${stripeCustomerId} not found`);
    }

    // 2) Изменить attemptsLeft (не ниже 0)
    user.attemptsLeft = Math.max((user.attemptsLeft ?? -5) + delta, 0);

    // 3) Сохранить и вернуть
    return this.usersRepository.save(user);
  }

  async updateSubscriptionByCustomerId(
      customerId: string,
      data: {
        id: string;
        status: 'active' | 'canceling' | 'canceled';
        periodEnd: Date;
        plan: 'Weekly' | 'Monthly' | 'Yearly';
        attemptsLeft: number;
      },
  ) {
    const user = await this.usersRepository.findOne({
      where: { stripeCustomerId: customerId },
    });
    if (!user) throw new Error('User not found');

    Object.assign(user, {
      subscriptionId       : data.id,
      subscriptionStatus   : data.status,
      subscriptionPeriodEnd: data.periodEnd,
      subscriptionPlan     : data.plan,
      attemptsLeft         : data.attemptsLeft,
    });
    return await this.usersRepository.save(user);
  }

  async useAttempt(user: User, qty = 1): Promise<User> {
    if (user.subscriptionId && user.subscriptionStatus !== "canceled") {
      resetCounterIfNeeded(user);

      const limit = dailyLimit(user.subscriptionPlan);
      if (user.attemptsUsedToday + qty > limit) {
        throw new ForbiddenException('Daily limit reached');
      }

      user.attemptsUsedToday += qty;
    } else if (user.attemptsLeft > 0) {
      user.attemptsLeft -= qty;
    }

    return this.usersRepository.save(user);
  }

  async hasBalance(user: User): Promise<boolean> {
    if (user.subscriptionStatus !== 'canceled') {
      const limit = dailyLimit(user.subscriptionPlan);
      if (user.attemptsUsedToday < limit) return true;
      if (user.attemptsLeft > 0) return true;
    }
    
    return false;
  }
}

export const resetCounterIfNeeded = function (user: User) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  if (String(user.attemptsDate) !== today) {
    user.attemptsUsedToday = 0;
    user.attemptsDate      = new Date(today);
  }
}