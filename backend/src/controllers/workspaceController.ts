import { Response } from 'express';
import { Workspace } from '../models/Workspace';
import { WorkspaceMembership } from '../models/WorkspaceMembership';
import { User } from '../models/User';
import { Meeting } from '../models/Meeting';
import { ActionItem } from '../models/ActionItem';
import { AuthRequest } from '../middleware/auth';

export const createWorkspace = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { name, description } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'Workspace name is required' });
      return;
    }

    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const workspace = await Workspace.create({
      name,
      description: description || '',
      slug,
      ownerId: req.userId,
      avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(name)}`,
    });

    await WorkspaceMembership.create({
      workspaceId: workspace._id,
      userId: req.userId,
      invitedEmail: req.user?.email || '',
      role: 'owner',
      status: 'accepted',
      invitedBy: req.userId,
    });

    res.status(201).json({
      success: true,
      message: 'Workspace created successfully',
      workspace,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create workspace', error: error.message });
  }
};

export const getUserWorkspaces = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const memberships = await WorkspaceMembership.find({
      userId: req.userId,
      status: 'accepted',
    }).populate('workspaceId');

    const workspaces = memberships
      .map((m) => {
        const ws: any = m.workspaceId;
        if (!ws) return null;
        return {
          id: ws._id,
          name: ws.name,
          description: ws.description,
          slug: ws.slug,
          role: m.role,
          avatar: ws.avatar,
          createdAt: ws.createdAt,
        };
      })
      .filter(Boolean);

    res.json({
      success: true,
      workspaces,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch workspaces', error: error.message });
  }
};

export const getWorkspaceDetails = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const workspace = await Workspace.findById(id).populate('ownerId', 'name email avatar');
    if (!workspace) {
      res.status(404).json({ success: false, message: 'Workspace not found' });
      return;
    }

    const [members, meetings, tasks] = await Promise.all([
      WorkspaceMembership.find({ workspaceId: id })
        .populate('userId', 'name email avatar title department status')
        .sort({ role: 1 }),
      Meeting.find({ workspaceId: id }).sort({ scheduledStartTime: -1 }).limit(10),
      ActionItem.find({ workspaceId: id }).sort({ createdAt: -1 }),
    ]);

    res.json({
      success: true,
      workspace,
      members,
      recentMeetings: meetings,
      tasks,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch workspace details', error: error.message });
  }
};

export const updateSharedNotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { sharedNotes } = req.body;

    const workspace = await Workspace.findByIdAndUpdate(
      id,
      { $set: { sharedNotes: sharedNotes || '' } },
      { new: true }
    );

    if (!workspace) {
      res.status(404).json({ success: false, message: 'Workspace not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Workspace notes updated successfully',
      sharedNotes: workspace.sharedNotes,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update notes', error: error.message });
  }
};

export const inviteMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    const { email, role } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if membership already exists
    const existingMembership = await WorkspaceMembership.findOne({
      workspaceId: id,
      invitedEmail: normalizedEmail,
    });

    if (existingMembership) {
      res.status(400).json({ success: false, message: 'User already invited or member of this workspace' });
      return;
    }

    // Check if user is registered on platform
    const existingUser = await User.findOne({ email: normalizedEmail });

    const newMembership = await WorkspaceMembership.create({
      workspaceId: id,
      userId: existingUser ? existingUser._id : undefined,
      invitedEmail: normalizedEmail,
      role: role || 'member',
      status: existingUser ? 'accepted' : 'pending',
      invitedBy: req.userId,
    });

    const populatedMembership = await WorkspaceMembership.findById(newMembership._id).populate(
      'userId',
      'name email avatar title department'
    );

    res.status(201).json({
      success: true,
      message: `Invitation successfully created for ${normalizedEmail}`,
      membership: populatedMembership,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to invite member', error: error.message });
  }
};

export const removeMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, memberId } = req.params;

    const membership = await WorkspaceMembership.findById(memberId);
    if (!membership) {
      res.status(404).json({ success: false, message: 'Membership not found' });
      return;
    }

    if (membership.role === 'owner') {
      res.status(400).json({ success: false, message: 'Cannot remove workspace owner' });
      return;
    }

    await WorkspaceMembership.findByIdAndDelete(memberId);

    res.json({
      success: true,
      message: 'Member removed from workspace successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to remove member', error: error.message });
  }
};
