import { Router } from 'express';
import { createMistake } from '../controllers/mistake.controller.js';
import { optionalAuthenticateToken } from '../middleware/auth.js';

const router = Router();

// Создание сообщения об ошибке (опциональная авторизация)
router.post('/', optionalAuthenticateToken, createMistake);

export default router;
