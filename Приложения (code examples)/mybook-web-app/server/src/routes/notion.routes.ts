import { Router } from 'express';
import {
  getAllNotions,
  getNotionById,
  createNotion,
  updateNotion,
  deleteNotion,
  searchNotions,
} from '../controllers/notion.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadSingle } from '../utils/upload.js';

const router = Router();

// Публичные маршруты
router.get('/', getAllNotions);
router.get('/search', searchNotions);
router.get('/:id', getNotionById);

// Защищенные маршруты с загрузкой файла
router.post('/', authenticateToken, uploadSingle('poster'), createNotion);
router.put('/:id', authenticateToken, uploadSingle('poster'), updateNotion);
router.delete('/:id', authenticateToken, deleteNotion);

export default router; 