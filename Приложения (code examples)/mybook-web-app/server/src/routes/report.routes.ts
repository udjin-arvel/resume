import { Router } from 'express';
import { createReport } from '../controllers/report.controller.js';
import { optionalAuthenticateToken } from '../middleware/auth.js';

const router = Router();

// Создание отчёта (опциональная авторизация - можно отправить анонимно)
router.post('/', optionalAuthenticateToken, createReport);

export default router;
