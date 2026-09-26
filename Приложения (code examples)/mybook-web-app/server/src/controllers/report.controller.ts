import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';

// Отправка сообщения в Telegram
const sendTelegramMessage = async (text: string): Promise<boolean> => {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    console.warn('Telegram credentials not configured');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      console.error('Telegram API error:', await response.text());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
};

export const createReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { subject, message } = req.body;
    const userId = req.user?.id || null;

    if (!subject || !message) {
      res.status(400).json({
        success: false,
        error: 'Subject and message are required',
      });
      return;
    }

    const report = await prisma.report.create({
      data: {
        subject,
        message,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            login: true,
          },
        },
      },
    });

    // Отправляем уведомление в Telegram
    const userInfo = report.user ? `От: ${report.user.login} (ID: ${report.user.id})` : 'От: Аноним';
    const telegramMessage = `📩 <b>Новое сообщение с сайта</b>\n\n<b>Тема:</b> ${subject}\n<b>${userInfo}</b>\n\n${message}`;
    
    // Отправляем асинхронно, не блокируя ответ
    sendTelegramMessage(telegramMessage).catch(err => {
      console.error('Telegram notification failed:', err);
    });

    res.status(201).json({
      success: true,
      data: report,
      message: 'Report submitted successfully',
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create report',
    });
  }
};

export const getAllReports = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        include: {
          user: {
            select: {
              id: true,
              login: true,
              email: true,
            },
          },
        },
        skip,
        take: Number(limit),
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.report.count(),
    ]);

    res.json({
      success: true,
      data: {
        reports,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get reports',
    });
  }
};

export const getReportById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id: Number(id) },
      include: {
        user: {
          select: {
            id: true,
            login: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Report not found',
      });
      return;
    }

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get report',
    });
  }
};

export const deleteReport = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id: Number(id) },
    });

    if (!report) {
      res.status(404).json({
        success: false,
        error: 'Report not found',
      });
      return;
    }

    await prisma.report.delete({
      where: { id: Number(id) },
    });

    res.json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete report',
    });
  }
};
