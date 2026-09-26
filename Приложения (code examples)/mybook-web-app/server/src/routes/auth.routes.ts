import { Router } from 'express';
import { register, login, logout, getProfile, updateProfile, getUserStats, getUserAchievements, uploadAvatar } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middleware/auth.js';
import { uploadSingle } from '../utils/upload.js';

const router = Router();

// Публичные маршруты
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Защищенные маршруты
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, updateProfile);
router.get('/stats', authenticateToken, getUserStats);
router.get('/achievements', authenticateToken, getUserAchievements);
router.post('/avatar', authenticateToken, uploadSingle('avatar'), uploadAvatar);

export default router; 