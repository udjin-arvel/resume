import { Injectable, Logger } from "@nestjs/common";
import * as TelegramBot from 'node-telegram-bot-api';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private bot: TelegramBot;
  private chatId: string;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      this.logger.warn("Telegram bot token or chat ID not configured. Telegram notifications will be disabled.");
      return;
    }

    this.bot = new TelegramBot(token, { polling: false });
    this.chatId = chatId;
    this.logger.log("Telegram service initialized");
  }

  /**
   * Отправляет сообщение в Telegram
   */
  async sendMessage(message: string): Promise<void> {
    if (!this.bot || !this.chatId) {
      this.logger.warn("Telegram bot not configured, skipping message");
      return;
    }

    try {
      await this.bot.sendMessage(this.chatId, message, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
      this.logger.log("Message sent to Telegram successfully");
    } catch (error) {
      this.logger.error("Failed to send message to Telegram:", error);
    }
  }

  /**
   * Отправляет уведомление о статистике пользователей
   */
  async sendUserStats(totalUsers: number, activeUsers: number, usersWithActiveSubscription: number): Promise<void> {
    const message = `
    <b>Ежедневная статистика пользователей</b>

Всего пользователей: <b>${totalUsers}</b>
Активных пользователей: <b>${activeUsers}</b>
Активных подписок: <b>${usersWithActiveSubscription}</b>

${new Date().toLocaleDateString("ru-RU")}
    `.trim();

    await this.sendMessage(message);
  }

  /**
   * Отправляет уведомление о недоступности API
   */
  async sendApiDownAlert(error?: string): Promise<void> {
    const message = `
        <b>API недоступно!</b>

Сервис не отвечает на запросы
Время: ${new Date().toLocaleString("ru-RU")}
${error ? `\nОшибка: ${error}` : ""}

Требуется немедленное вмешательство!
    `.trim();

    await this.sendMessage(message);
  }

  /**
   * Отправляет уведомление об ошибке OpenAI
   */
  async sendOpenAIErrorAlert(error: string, userId?: string): Promise<void> {
    const message = `
        <b>Ошибка OpenAI</b>

Генерация не удалась
Время: ${new Date().toLocaleString("ru-RU")}
${userId ? `Пользователь: ${userId}` : ""}

Ошибка: <code>${error}</code>
    `.trim();

    await this.sendMessage(message);
  }

  /**
   * Отправляет уведомление об успешной оплате
   */
  async sendPaymentSuccessAlert(
    customerId: string,
    plan?: string
  ): Promise<void> {
    const message = `
        <b>Успешная оплата!</b>

Id пользователя: ${customerId}
${plan ? `План: ${plan}` : ""}
Время: ${new Date().toLocaleString("ru-RU")}

Платеж обработан успешно
    `.trim();

    await this.sendMessage(message);
  }

  /**
   * Отправляет уведомление о неудачной оплате
   */
  async sendPaymentFailedAlert(
    customerId: string,
    error: string
  ): Promise<void> {
    const message = `
        <b>Неудачная оплата</b>

Id пользователя: ${customerId}
Время: ${new Date().toLocaleString("ru-RU")}

Ошибка: <code>${error}</code>
    `.trim();

    await this.sendMessage(message);
  }

  /**
   * Проверяет доступность сервиса
   */
  async isConfigured(): Promise<boolean> {
    return !!(this.bot && this.chatId);
  }
}