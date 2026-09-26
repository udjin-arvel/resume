import { Router } from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { uploadDocx } from '../utils/uploadDocx.js';

import { getDashboard } from '../controllers/admin/dashboard.controller.js';
import * as userController from '../controllers/admin/user.controller.js';
import * as storyController from '../controllers/admin/story.controller.js';
import * as notionController from '../controllers/admin/notion.controller.js';
import * as compositionController from '../controllers/admin/composition.controller.js';
import * as noteController from '../controllers/admin/note.controller.js';
import * as loreController from '../controllers/admin/lore.controller.js';
import * as reportController from '../controllers/admin/report.controller.js';

const router = Router();

router.get('/dashboard', getDashboard);

// User picker for content assignment (MOD+)
router.get('/users/options', userController.getUserOptions);

// Users — ADMIN only
router.get('/users', requireAdmin, userController.getUsers);
router.get('/users/:id', requireAdmin, userController.getUserById);
router.patch('/users/:id', requireAdmin, userController.updateUser);
router.delete('/users/:id', requireAdmin, userController.deleteUser);

// Stories + DOCX import
router.get('/stories', storyController.getStories);
router.post('/stories/import-docx/preview', uploadDocx, storyController.previewDocxImport);
router.post('/stories/import-docx', storyController.importDocxStory);
router.get('/stories/:id', storyController.getStoryById);
router.post('/stories', storyController.createStory);
router.put('/stories/:id', storyController.updateStory);
router.delete('/stories/:id', storyController.deleteStory);

// Notions
router.get('/notions', notionController.getNotions);
router.get('/notions/:id', notionController.getNotionById);
router.post('/notions', notionController.createNotion);
router.put('/notions/:id', notionController.updateNotion);
router.delete('/notions/:id', notionController.deleteNotion);

// Compositions
router.get('/compositions', compositionController.getCompositions);
router.get('/compositions/:id', compositionController.getCompositionById);
router.post('/compositions', compositionController.createComposition);
router.put('/compositions/:id', compositionController.updateComposition);
router.delete('/compositions/:id', compositionController.deleteComposition);

// Notes
router.get('/notes', noteController.getNotes);
router.get('/notes/:id', noteController.getNoteById);
router.post('/notes', noteController.createNote);
router.put('/notes/:id', noteController.updateNote);
router.delete('/notes/:id', noteController.deleteNote);

// Lore
router.get('/lore', loreController.getLoreItems);
router.get('/lore/:id', loreController.getLoreItemById);
router.post('/lore', loreController.createLoreItem);
router.put('/lore/:id', loreController.updateLoreItem);
router.delete('/lore/:id', loreController.deleteLoreItem);

// Reports & mistakes
router.get('/reports', reportController.getReports);
router.get('/reports/:id', reportController.getReportById);
router.delete('/reports/:id', reportController.deleteReport);
router.get('/mistakes', reportController.getMistakes);
router.get('/mistakes/:id', reportController.getMistakeById);
router.delete('/mistakes/:id', reportController.deleteMistake);

export default router;
