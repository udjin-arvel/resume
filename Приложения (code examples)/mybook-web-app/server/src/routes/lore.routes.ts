import { Router } from 'express';
import {
  getAllLoreItems,
  getLoreItemById,
  createLoreItem,
  updateLoreItem,
  deleteLoreItem,
} from '../controllers/lore.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadSingle } from '../utils/upload.js';

const router = Router();

// Публичные маршруты
router.get('/', getAllLoreItems);
router.get('/:id', getLoreItemById);

// Защищенные маршруты (с поддержкой загрузки изображений)
router.post('/', authenticateToken, uploadSingle('poster'), createLoreItem);
router.put('/:id', authenticateToken, uploadSingle('poster'), updateLoreItem);
router.delete('/:id', authenticateToken, deleteLoreItem);

export default router; 