import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { TelegramService } from "./telegram.service";
import { UsersService } from "../users/users.service";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "../entities/User.entity";
import { Repository } from "typeorm";
import axios from "axios";

@Injectable()
export class TelegramMonitoringService {
  private readonly logger = new Logger(TelegramMonitoringService.name);
  private lastApiCheck: Date | null = null;
  private consecutiveApiFailures = 0;
  private readonly maxConsecutiveFailures = 3;

  constructor(
    private readonly telegramService: TelegramService,
    private readonly usersService: UsersService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * Отправка статистики пользователей
   */
  @Cron(CronExpression.EVERY_DAY_AT_3PM, { name: 'sendDailyUserStats' })
  async sendDailyUserStats(): Promise<void> {
    this.logger.log("Starting user stats collection...");
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Получаем общее количество пользователей
      const totalUsers = await this.usersRepository.count();
      
      // Получаем активных пользователей (с попытками > 0 или активной подпиской)
      const activeUsers = await this.usersRepository
        .createQueryBuilder("user")
        .where("user.attemptsLeft > 0 OR (user.subscriptionStatus = :status AND user.subscriptionPeriodEnd > :now)", {
          status: "active",
          now: new Date(),
        })
        .getCount();

      const usersWithActiveSubscription = await this.usersRepository
        .createQueryBuilder("user")
        .where("user.subscriptionPlan IS NOT NULL AND user.subscriptionStatus = :status", {
          status: "active",
        })
        .getCount();
      
      await this.telegramService.sendUserStats(totalUsers, activeUsers, usersWithActiveSubscription);
      this.logger.log("User stats sent successfully");
    } catch (error) {
      this.logger.error("Failed to send daily user stats:", error);
    }
  }

  /**
   * Проверка API каждый час
   */
  @Cron(CronExpression.EVERY_HOUR, { name: 'checkApiHealth' })
  async checkApiHealth(): Promise<void> {
    this.logger.log("Starting API health check...");
    
    try {
      const apiUrl = process.env.API_HEALTH_CHECK_URL || "http://localhost:5555/health";
      
      const response = await axios.get(apiUrl, {
        timeout: 10000, // 10 секунд таймаут
        validateStatus: (status) => status < 500, // Принимаем любые статусы кроме 5xx
      });

      if (response.status >= 200 && response.status < 400) {
        // API работает нормально
        this.consecutiveApiFailures = 0;
        this.lastApiCheck = new Date();
        this.logger.log("API health check passed");
      } else {
        // API возвращает ошибку
        this.consecutiveApiFailures++;
        this.logger.warn(`API health check failed with status: ${response.status}`);
        
        if (this.consecutiveApiFailures >= this.maxConsecutiveFailures) {
          await this.telegramService.sendApiDownAlert(`HTTP ${response.status}: ${response.statusText}`);
        }
      }
    } catch (error) {
      this.consecutiveApiFailures++;
      this.logger.error("API health check failed:", error);
      
      if (this.consecutiveApiFailures >= this.maxConsecutiveFailures) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        await this.telegramService.sendApiDownAlert(errorMessage);
      }
    }
  }

  /**
   * Метод для ручной отправки статистики (для тестирования)
   */
  async sendUserStatsManually(): Promise<void> {
    await this.sendDailyUserStats();
  }

  /**
   * Метод для ручной проверки API (для тестирования)
   */
  async checkApiHealthManually(): Promise<void> {
    await this.checkApiHealth();
  }
}