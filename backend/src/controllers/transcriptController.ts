import { Request, Response } from 'express';
import { TranscriptSegment } from '../models/TranscriptSegment';
import { Meeting } from '../models/Meeting';
import { AuthRequest } from '../middleware/auth';

export const addTranscriptSegment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { meetingId, speakerName, text, startTime, endTime, confidence, source } = req.body;

    if (!meetingId || !text) {
      res.status(400).json({ success: false, message: 'Meeting ID and text are required' });
      return;
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found' });
      return;
    }

    const segment = await TranscriptSegment.create({
      meetingId,
      speakerId: req.userId || undefined,
      speakerName: speakerName || req.user?.name || 'Participant',
      text: text.trim(),
      startTime: startTime || 0,
      endTime: endTime || (startTime || 0) + 3,
      confidence: confidence ?? 0.95,
      isFinal: true,
      source: source || 'browser_api',
    });

    res.status(201).json({
      success: true,
      segment,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to save transcript segment', error: error.message });
  }
};

export const getMeetingTranscript = async (req: Request, res: Response): Promise<void> => {
  try {
    const { meetingId } = req.params;

    const segments = await TranscriptSegment.find({ meetingId })
      .sort({ startTime: 1, createdAt: 1 })
      .populate('speakerId', 'name avatar');

    res.json({
      success: true,
      count: segments.length,
      segments,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch transcript', error: error.message });
  }
};

export const seedSampleTranscript = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { meetingId } = req.params;
    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found' });
      return;
    }

    // Check if transcript segments already exist
    const count = await TranscriptSegment.countDocuments({ meetingId });
    if (count > 0) {
      const existing = await TranscriptSegment.find({ meetingId }).sort({ startTime: 1 });
      res.json({ success: true, message: 'Transcript already exists', segments: existing });
      return;
    }

    const demoSegments = [
      {
        speakerName: 'Priya Sharma (Tech Lead)',
        text: 'Good morning everyone. Today we need to finalize the architecture for IntellMeet and agree on the deployment timeline for the enterprise pilot.',
        startTime: 0,
        endTime: 9,
      },
      {
        speakerName: 'Alex Rivera (Frontend Engineer)',
        text: 'The WebRTC video grid and responsive layout with dark and light themes are complete. We should review screen sharing performance across Firefox and Chromium.',
        startTime: 10,
        endTime: 21,
      },
      {
        speakerName: 'David Chen (DevOps)',
        text: 'I have set up the STUN servers. For restrictive enterprise firewalls, we need to provision a dedicated TURN relay by Friday before the security audit.',
        startTime: 22,
        endTime: 34,
      },
      {
        speakerName: 'Sarah Jenkins (Product Manager)',
        text: 'The AI meeting summary and action item extraction look fantastic. Can David verify the backup policy and Alex polish the keyboard accessibility by Thursday?',
        startTime: 35,
        endTime: 48,
      },
      {
        speakerName: 'Priya Sharma (Tech Lead)',
        text: 'Agreed. Let us document the TURN requirements and schedule the final staging test for Friday 2 PM. Meeting adjourned.',
        startTime: 49,
        endTime: 60,
      },
    ];

    const created = await TranscriptSegment.insertMany(
      demoSegments.map((s) => ({
        meetingId,
        speakerName: s.speakerName,
        text: s.text,
        startTime: s.startTime,
        endTime: s.endTime,
        confidence: 0.98,
        isFinal: true,
        source: 'demo' as const,
      }))
    );

    res.status(201).json({
      success: true,
      message: 'Sample demo transcript loaded successfully (clearly marked source: demo)',
      segments: created,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to seed sample transcript', error: error.message });
  }
};
