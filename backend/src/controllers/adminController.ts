import { Response } from 'express';
import { User } from '../models/User';
import { Meeting } from '../models/Meeting';
import { Workspace } from '../models/Workspace';
import { MeetingSummary } from '../models/MeetingSummary';
import { ActionItem } from '../models/ActionItem';
import { AuthRequest } from '../middleware/auth';

export const getSystemStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalUsers,
      totalMeetings,
      liveMeetings,
      totalWorkspaces,
      totalSummaries,
      totalActionItems,
    ] = await Promise.all([
      User.countDocuments(),
      Meeting.countDocuments(),
      Meeting.countDocuments({ status: 'live' }),
      Workspace.countDocuments(),
      MeetingSummary.countDocuments(),
      ActionItem.countDocuments(),
    ]);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalMeetings,
        liveMeetings,
        totalWorkspaces,
        totalSummaries,
        totalActionItems,
        uptimeHours: Math.round(process.uptime() / 3600),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin stats', error: error.message });
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, role, status } = req.query;

    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) query.role = role;
    if (status) query.status = status;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Prevent suspending self
    if (id === req.userId && status === 'suspended') {
      res.status(400).json({ success: false, message: 'You cannot suspend your own admin account' });
      return;
    }

    if (status) user.status = status;
    if (role) user.role = role;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.email} updated successfully`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update user', error: error.message });
  }
};

export const getAllMeetings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const meetings = await Meeting.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('hostId', 'name email avatar')
      .populate('workspaceId', 'name');

    res.json({
      success: true,
      count: meetings.length,
      meetings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch all meetings', error: error.message });
  }
};
