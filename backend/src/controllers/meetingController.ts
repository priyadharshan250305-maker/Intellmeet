import { Response } from 'express';
import crypto from 'crypto';
import { Meeting } from '../models/Meeting';
import { MeetingParticipant } from '../models/MeetingParticipant';
import { WorkspaceMembership } from '../models/WorkspaceMembership';
import { AuthRequest } from '../middleware/auth';

const generateRoomId = (): string => {
  // Format: xxx-yyyy-zzz
  const part1 = crypto.randomBytes(2).toString('hex');
  const part2 = crypto.randomBytes(2).toString('hex');
  const part3 = crypto.randomBytes(2).toString('hex');
  return `${part1}-${part2}-${part3}`;
};

export const createMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const {
      title,
      description,
      workspaceId,
      scheduledStartTime,
      scheduledEndTime,
      isPrivate,
      passcode,
      settings,
    } = req.body;

    if (!title) {
      res.status(400).json({ success: false, message: 'Meeting title is required' });
      return;
    }

    // If workspace provided, check user membership
    if (workspaceId) {
      const membership = await WorkspaceMembership.findOne({
        workspaceId,
        userId: req.userId,
        status: 'accepted',
      });
      if (!membership) {
        res.status(403).json({ success: false, message: 'You are not a member of this workspace' });
        return;
      }
    }

    const roomId = generateRoomId();
    const isInstant = !scheduledStartTime;

    const newMeeting = await Meeting.create({
      title,
      description: description || '',
      roomId,
      hostId: req.userId,
      workspaceId: workspaceId || undefined,
      scheduledStartTime: scheduledStartTime ? new Date(scheduledStartTime) : new Date(),
      scheduledEndTime: scheduledEndTime ? new Date(scheduledEndTime) : undefined,
      actualStartTime: isInstant ? new Date() : undefined,
      status: isInstant ? 'live' : 'scheduled',
      isPrivate: Boolean(isPrivate),
      passcode: passcode || '',
      transcriptionConsent: true,
      settings: {
        audioMutedOnEntry: Boolean(settings?.audioMutedOnEntry),
        videoOffOnEntry: Boolean(settings?.videoOffOnEntry),
        screenShareAllowed: settings?.screenShareAllowed !== false,
        chatEnabled: settings?.chatEnabled !== false,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Meeting created successfully',
      meeting: newMeeting,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create meeting', error: error.message });
  }
};

export const getMeetingByRoomId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const meeting = await Meeting.findOne({ roomId }).populate('hostId', 'name email avatar');

    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found' });
      return;
    }

    // Check if user is host
    const isHost = req.userId && meeting.hostId && (meeting.hostId as any)._id?.toString() === req.userId;

    res.json({
      success: true,
      meeting: {
        id: meeting._id,
        roomId: meeting.roomId,
        title: meeting.title,
        description: meeting.description,
        host: meeting.hostId,
        workspaceId: meeting.workspaceId,
        status: meeting.status,
        isPrivate: meeting.isPrivate,
        requiresPasscode: Boolean(meeting.isPrivate && meeting.passcode),
        actualStartTime: meeting.actualStartTime,
        actualEndTime: meeting.actualEndTime,
        durationMinutes: meeting.durationMinutes,
        settings: meeting.settings,
        transcriptionConsent: meeting.transcriptionConsent,
        isHost: Boolean(isHost),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch meeting', error: error.message });
  }
};

export const joinMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const { passcode, guestName } = req.body;

    const meeting = await Meeting.findOne({ roomId });
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found' });
      return;
    }

    if (meeting.status === 'cancelled') {
      res.status(400).json({ success: false, message: 'This meeting was cancelled' });
      return;
    }

    // If private, verify passcode or host identity
    const isHost = req.userId && meeting.hostId.toString() === req.userId;
    if (meeting.isPrivate && !isHost) {
      if (meeting.passcode && meeting.passcode !== passcode) {
        res.status(403).json({ success: false, message: 'Invalid meeting passcode' });
        return;
      }
    }

    // Activate meeting if currently scheduled
    if (meeting.status === 'scheduled') {
      meeting.status = 'live';
      meeting.actualStartTime = new Date();
      await meeting.save();
    }

    const participantName = req.user?.name || guestName || 'Guest Participant';
    const participantRole = isHost ? 'host' : 'participant';

    // Record participant entry
    const participant = await MeetingParticipant.create({
      meetingId: meeting._id,
      userId: req.userId || undefined,
      name: participantName,
      email: req.user?.email,
      role: participantRole,
      joinedAt: new Date(),
      connectionStatus: 'connected',
    });

    res.json({
      success: true,
      message: 'Joined meeting successfully',
      participantId: participant._id,
      role: participantRole,
      meeting: {
        id: meeting._id,
        roomId: meeting.roomId,
        title: meeting.title,
        status: meeting.status,
        hostId: meeting.hostId,
        settings: meeting.settings,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to join meeting', error: error.message });
  }
};

export const endMeeting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const { roomId } = req.params;
    const meeting = await Meeting.findOne({ roomId });

    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found' });
      return;
    }

    if (meeting.hostId.toString() !== req.userId && req.userRole !== 'admin') {
      res.status(403).json({ success: false, message: 'Only host or admin can end this meeting' });
      return;
    }

    const endTime = new Date();
    const startTime = meeting.actualStartTime || meeting.createdAt;
    const duration = Math.max(1, Math.round((endTime.getTime() - new Date(startTime).getTime()) / 60000));

    meeting.status = 'completed';
    meeting.actualEndTime = endTime;
    meeting.durationMinutes = duration;
    await meeting.save();

    // Mark remaining participants leftAt
    await MeetingParticipant.updateMany(
      { meetingId: meeting._id, leftAt: { $exists: false } },
      { $set: { leftAt: endTime, connectionStatus: 'disconnected' } }
    );

    res.json({
      success: true,
      message: 'Meeting ended successfully',
      durationMinutes: duration,
      meeting,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to end meeting', error: error.message });
  }
};

export const getUserMeetings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const upcoming = await Meeting.find({
      hostId: req.userId,
      status: { $in: ['scheduled', 'live'] },
    })
      .sort({ scheduledStartTime: 1 })
      .populate('workspaceId', 'name slug');

    const history = await Meeting.find({
      hostId: req.userId,
      status: 'completed',
    })
      .sort({ actualEndTime: -1 })
      .limit(20)
      .populate('workspaceId', 'name slug');

    res.json({
      success: true,
      upcoming,
      history,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to get meetings', error: error.message });
  }
};

export const getMeetingHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.userId) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const meetings = await Meeting.find({
      $or: [{ hostId: req.userId }],
      status: 'completed',
    })
      .sort({ actualEndTime: -1 })
      .populate('hostId', 'name email avatar')
      .populate('workspaceId', 'name');

    res.json({
      success: true,
      meetings,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to get history', error: error.message });
  }
};

export const getMeetingParticipants = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { roomId } = req.params;
    const meeting = await Meeting.findOne({ roomId });
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found' });
      return;
    }

    const participants = await MeetingParticipant.find({ meetingId: meeting._id })
      .sort({ joinedAt: -1 })
      .populate('userId', 'name email avatar title');

    res.json({
      success: true,
      participants,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to get participants', error: error.message });
  }
};
