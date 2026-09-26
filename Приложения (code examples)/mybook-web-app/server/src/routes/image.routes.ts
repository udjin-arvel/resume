import { Router } from 'express';
import {
  addImageToContent,
  getContentImages,
  deleteImage,
} from '../controllers/image.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadSingle } from '../utils/upload.js';

const router = Router();

// Публичные маршруты
router.get('/:contentType/:contentId', getContentImages);

// Защищенные маршруты
router.post('/:contentType/:contentId', authenticateToken, uploadSingle('image'), addImageToContent);
router.delete('/:id', authenticateToken, deleteImage);

export default router;
