import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { WorkspaceMembership } from '../models/WorkspaceMembership';

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.userId) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  if (req.userRole !== 'admin') {
    res.status(403).json({ success: false, message: 'Access forbidden: Admin privilege required' });
    return;
  }
  next();
};

export const requireWorkspaceRole = (roles: Array<'owner' | 'admin' | 'member'>) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      // If user is global admin, allow access
      if (req.userRole === 'admin') {
        return next();
      }

      const workspaceId = req.params.workspaceId || req.body.workspaceId;
      if (!workspaceId) {
        res.status(400).json({ success: false, message: 'Workspace ID required' });
        return;
      }

      const membership = await WorkspaceMembership.findOne({
        workspaceId,
        userId: req.userId,
        status: 'accepted',
      });

      if (!membership) {
        res.status(403).json({ success: false, message: 'Not a member of this workspace' });
        return;
      }

      if (!roles.includes(membership.role)) {
        res.status(403).json({
          success: false,
          message: `Insufficient workspace permissions. Required: ${roles.join(' or ')}`,
        });
        return;
      }

      next();
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Permission check error', error: error.message });
    }
  };
};
