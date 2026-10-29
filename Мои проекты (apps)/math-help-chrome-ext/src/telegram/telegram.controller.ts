import { Controller, Post, Get, Body, Logger } from "@nestjs/common";
import { TelegramService } from "./telegram.service";
import { TelegramMonitoringService } from "./telegram-monitoring.service";

@Controller("telegram")
export class TelegramController {
  private readonly logger = new Logger(TelegramController.name);

  constructor(
    private readonly telegramService: TelegramService,
    private readonly monitoringService: TelegramMonitoringService,
  ) {}

  /**
   * Отправка тестового сообщения
   */
  @Post("test")
  async sendTestMessage(@Body("message") message?: string): Promise<{ success: boolean; message: string }> {
    try {
      const testMessage = message || "🧪 Тестовое сообщение от Telegram сервиса";
      await this.telegramService.sendMessage(testMessage);
      return { success: true, message: "Test message sent successfully" };
    } catch (error) {
      this.logger.error("Failed to send test message:", error);
      return { success: false, message: "Failed to send test message" };
    }
  }

  /**
   * Ручная отправка статистики пользователей
   */
  @Post("stats")
  async sendUserStats(): Promise<{ success: boolean; message: string }> {
    try {
      await this.monitoringService.sendUserStatsManually();
      return { success: true, message: "User stats sent successfully" };
    } catch (error) {
      this.logger.error("Failed to send user stats:", error);
      return { success: false, message: "Failed to send user stats" };
    }
  }

  /**
   * Ручная проверка API
   */
  @Post("health-check")
  async checkApiHealth(): Promise<{ success: boolean; message: string }> {
    try {
      await this.monitoringService.checkApiHealthManually();
      return { success: true, message: "API health check completed" };
    } catch (error) {
      this.logger.error("Failed to check API health:", error);
      return { success: false, message: "Failed to check API health" };
    }
  }

  /**
   * Проверка конфигурации Telegram
   */
  @Get("config")
  async getConfig(): Promise<{ configured: boolean; message: string }> {
    const configured = await this.telegramService.isConfigured();
    return {
      configured,
      message: configured ? "Telegram is properly configured" : "Telegram is not configured"
    };
  }
}