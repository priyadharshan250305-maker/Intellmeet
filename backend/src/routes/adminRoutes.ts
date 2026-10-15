import { Router } from 'express';
import {
  getSystemStats,
  getAllUsers,
  updateUserStatus,
  getAllMeetings,
} from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { requireAdmin } from '../middleware/rbac';

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/stats', getSystemStats);
router.get('/users', getAllUsers);
router.put('/users/:id', updateUserStatus);
router.get('/meetings', getAllMeetings);

export default router;
