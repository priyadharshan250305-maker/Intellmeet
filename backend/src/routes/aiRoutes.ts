import { Router } from 'express';
import {
  generateSummary,
  getMeetingSummary,
  extractActionItems,
  getMeetingActionItems,
  createActionItem,
  updateActionItem,
  deleteActionItem,
} from '../controllers/aiController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

// Meeting Summary endpoints
router.post('/summary/:meetingId', authenticate, generateSummary);
router.get('/summary/:meetingId', optionalAuth, getMeetingSummary);

// Action Item extraction & management
router.post('/action-items/extract/:meetingId', authenticate, extractActionItems);
router.get('/action-items/:meetingId', optionalAuth, getMeetingActionItems);
router.post('/action-items', authenticate, createActionItem);
router.put('/action-items/:id', authenticate, updateActionItem);
router.delete('/action-items/:id', authenticate, deleteActionItem);

export default router;
