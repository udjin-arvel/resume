import { Router } from 'express';
import {
  getAllCompositions,
  getCompositionById,
  createComposition,
  updateComposition,
  deleteComposition,
} from '../controllers/composition.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadSingle } from '../utils/upload.js';

const router = Router();

// Публичные маршруты
router.get('/', getAllCompositions);
router.get('/:id', getCompositionById);

// Защищенные маршруты (с поддержкой загрузки изображений)
router.post('/', authenticateToken, uploadSingle('poster'), createComposition);
router.put('/:id', authenticateToken, uploadSingle('poster'), updateComposition);
router.delete('/:id', authenticateToken, deleteComposition);

export default router; 