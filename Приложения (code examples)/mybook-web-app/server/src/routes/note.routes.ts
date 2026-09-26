import { Router } from 'express';
import {
  getAllNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  buyNote,
} from '../controllers/note.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadSingle } from '../utils/upload.js';

const router = Router();

// Публичные маршруты
router.get('/', getAllNotes);
router.get('/:id', getNoteById);

// Защищенные маршруты (с поддержкой загрузки изображений)
router.post('/', authenticateToken, uploadSingle('poster'), createNote);
router.put('/:id', authenticateToken, uploadSingle('poster'), updateNote);
router.delete('/:id', authenticateToken, deleteNote);
router.post('/:id/buy', authenticateToken, buyNote);

export default router; 