import { Router } from 'express';
import {
  createStory,
  getStories,
  getStoryById,
  updateStory,
  deleteStory,
} from '../controllers/story.controller.js';
import { authenticateToken, requireWriter } from '../middleware/auth.js';

const router = Router();

// Публичные маршруты
router.get('/', getStories);
router.get('/:id', getStoryById);

// Защищенные маршруты
router.post('/', authenticateToken, requireWriter, createStory);
router.put('/:id', authenticateToken, requireWriter, updateStory);
router.delete('/:id', authenticateToken, requireWriter, deleteStory);

export default router; 