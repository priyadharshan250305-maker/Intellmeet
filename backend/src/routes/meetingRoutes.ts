import { Router } from 'express';
import {
  createMeeting,
  getMeetingByRoomId,
  joinMeeting,
  endMeeting,
  getUserMeetings,
  getMeetingHistory,
  getMeetingParticipants,
} from '../controllers/meetingController';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();

router.post('/', authenticate, createMeeting);
router.get('/user', authenticate, getUserMeetings);
router.get('/history', authenticate, getMeetingHistory);

// Room specific endpoints (optionalAuth allows guest join while recording user if authenticated)
router.get('/room/:roomId', optionalAuth, getMeetingByRoomId);
router.post('/room/:roomId/join', optionalAuth, joinMeeting);
router.post('/room/:roomId/end', authenticate, endMeeting);
router.get('/room/:roomId/participants', optionalAuth, getMeetingParticipants);

export default router;
