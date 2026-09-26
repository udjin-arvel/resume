import { Router } from 'express';
import {
  createComment,
  getCommentsByContent,
  getCommentById,
  updateComment,
  deleteComment,
  getUserComments,
} from '../controllers/comment.controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Получение комментариев по контенту (публичный доступ)
router.get('/content/:contentType/:contentId', getCommentsByContent);

// Получение комментария по ID (публичный доступ)
router.get('/:id', getCommentById);

// Защищенные маршруты
router.post('/', authenticateToken, createComment);
router.get('/user/my', authenticateToken, getUserComments);
router.put('/:id', authenticateToken, updateComment);
router.delete('/:id', authenticateToken, deleteComment);

export default router;
