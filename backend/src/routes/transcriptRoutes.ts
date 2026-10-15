import { Router } from 'express';
import {
  addTranscriptSegment,
  getMeetingTranscript,
  seedSampleTranscript,
} from '../controllers/transcriptController';
import { optionalAuth, authenticate } from '../middleware/auth';

const router = Router();

router.post('/segments', optionalAuth, addTranscriptSegment);
router.get('/:meetingId', optionalAuth, getMeetingTranscript);
router.post('/:meetingId/sample', authenticate, seedSampleTranscript);

export default router;
