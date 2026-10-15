import { Router } from 'express';
import {
  createWorkspace,
  getUserWorkspaces,
  getWorkspaceDetails,
  updateSharedNotes,
  inviteMember,
  removeMember,
} from '../controllers/workspaceController';
import { authenticate } from '../middleware/auth';
import { requireWorkspaceRole } from '../middleware/rbac';

const router = Router();

router.use(authenticate);

router.post('/', createWorkspace);
router.get('/', getUserWorkspaces);
router.get('/:id', getWorkspaceDetails);
router.put('/:id/notes', updateSharedNotes);
router.post('/:id/invite', inviteMember);
router.delete('/:id/members/:memberId', removeMember);

export default router;
