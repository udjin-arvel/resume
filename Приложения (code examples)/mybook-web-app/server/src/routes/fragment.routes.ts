import { Router } from 'express';
import { getFragmentById, updateFragment } from '../controllers/fragment.controller.js';
import { authenticateToken, optionalAuthenticateToken, requireWriter } from '../middleware/auth.js';

const router = Router();

router.get('/:id', optionalAuthenticateToken, getFragmentById);
router.patch('/:id', authenticateToken, requireWriter, updateFragment);
router.put('/:id', authenticateToken, requireWriter, updateFragment);

export default router;
