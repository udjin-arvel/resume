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

export const createMistake = async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentText, correctText, url } = req.body;
    const userId = req.user?.id || null;

    if (!currentText || !correctText || !url) {
      res.status(400).json({
        success: false,
        error: 'currentText, correctText and url are required',
      });
      return;
    }

    const mistake = await prisma.mistake.create({
      data: {
        currentText,
        correctText,
        url,
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
    const userInfo = mistake.user ? `От: ${mistake.user.login} (ID: ${mistake.user.id})` : 'От: Аноним';
    const telegramMessage = `✏️ <b>Сообщение об ошибке</b>\n\n<b>Текущий текст:</b> ${currentText}\n<b>Правильный текст:</b> ${correctText}\n<b>URL:</b> ${url}\n<b>${userInfo}</b>`;
    
    // Отправляем асинхронно, не блокируя ответ
    sendTelegramMessage(telegramMessage).catch(err => {
      console.error('Telegram notification failed:', err);
    });

    res.status(201).json({
      success: true,
      data: mistake,
      message: 'Mistake reported successfully',
    });
  } catch (error) {
    console.error('Create mistake error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create mistake report',
    });
  }
};

export const getAllMistakes = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [mistakes, total] = await Promise.all([
      prisma.mistake.findMany({
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
      prisma.mistake.count(),
    ]);

    res.json({
      success: true,
      data: {
        mistakes,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get mistakes error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mistakes',
    });
  }
};

export const getMistakeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const mistake = await prisma.mistake.findUnique({
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

    if (!mistake) {
      res.status(404).json({
        success: false,
        error: 'Mistake not found',
      });
      return;
    }

    res.json({
      success: true,
      data: mistake,
    });
  } catch (error) {
    console.error('Get mistake error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mistake',
    });
  }
};

export const deleteMistake = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const mistake = await prisma.mistake.findUnique({
      where: { id: Number(id) },
    });

    if (!mistake) {
      res.status(404).json({
        success: false,
        error: 'Mistake not found',
      });
      return;
    }

    await prisma.mistake.delete({
      where: { id: Number(id) },
    });

    res.json({
      success: true,
      message: 'Mistake deleted successfully',
    });
  } catch (error) {
    console.error('Delete mistake error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete mistake',
    });
  }
};
