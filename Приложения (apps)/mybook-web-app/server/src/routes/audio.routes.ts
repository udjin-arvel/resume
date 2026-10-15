import { Router } from 'express';
import {
  addAudioToContent,
  getContentAudios,
  deleteAudio,
} from '../controllers/audio.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadAudioSingle } from '../utils/upload.js';

const router = Router();

router.get('/:contentType/:contentId', getContentAudios);
router.post('/:contentType/:contentId', authenticateToken, uploadAudioSingle('audio'), addAudioToContent);
router.delete('/:id', authenticateToken, deleteAudio);

export default router;
