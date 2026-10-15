import { Request, Response } from 'express';
import { Meeting } from '../models/Meeting';
import { TranscriptSegment } from '../models/TranscriptSegment';
import { MeetingSummary } from '../models/MeetingSummary';
import { ActionItem } from '../models/ActionItem';
import { generateMeetingSummaryAI, extractActionItemsAI } from '../services/aiService';
import { AuthRequest } from '../middleware/auth';

export const generateSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found' });
      return;
    }

    const segments = await TranscriptSegment.find({ meetingId }).sort({ startTime: 1 });

    const transcriptTexts = segments.map((s) => ({
      speakerName: s.speakerName,
      text: s.text,
    }));

    const summaryData = await generateMeetingSummaryAI(meeting.title, transcriptTexts);

    // Upsert meeting summary
    const summary = await MeetingSummary.findOneAndUpdate(
      { meetingId },
      {
        $set: {
          generatedBy: req.userId || undefined,
          overview: summaryData.overview,
          discussionPoints: summaryData.discussionPoints,
          keyDecisions: summaryData.keyDecisions,
          importantQuestions: summaryData.importantQuestions,
          risksAndIssues: summaryData.risksAndIssues,
          nextSteps: summaryData.nextSteps,
          modelUsed: summaryData.modelUsed,
          generatedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'AI Meeting Summary generated successfully',
      summary,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to generate summary', error: error.message });
  }
};

export const getMeetingSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const { meetingId } = req.params;

    const summary = await MeetingSummary.findOne({ meetingId });
    if (!summary) {
      res.status(404).json({ success: false, message: 'Summary not generated yet' });
      return;
    }

    res.json({
      success: true,
      summary,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch summary', error: error.message });
  }
};

export const extractActionItems = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found' });
      return;
    }

    const segments = await TranscriptSegment.find({ meetingId }).sort({ startTime: 1 });
    const transcriptTexts = segments.map((s) => ({
      speakerName: s.speakerName,
      text: s.text,
    }));

    const extracted = await extractActionItemsAI(transcriptTexts);

    // Save tasks into ActionItem collection
    const createdItems = await Promise.all(
      extracted.map(async (task) => {
        let dueDateObj: Date | undefined = undefined;
        if (task.dueDate) {
          const now = new Date();
          if (task.dueDate.toLowerCase().includes('friday')) {
            now.setDate(now.getDate() + ((5 + 7 - now.getDay()) % 7 || 7));
            dueDateObj = now;
          } else if (task.dueDate.toLowerCase().includes('thursday')) {
            now.setDate(now.getDate() + ((4 + 7 - now.getDay()) % 7 || 7));
            dueDateObj = now;
          } else {
            const parsed = new Date(task.dueDate);
            if (!isNaN(parsed.getTime())) dueDateObj = parsed;
          }
        }

        return ActionItem.create({
          meetingId,
          workspaceId: meeting.workspaceId || undefined,
          title: task.title,
          description: task.description,
          assignee: task.assignee || '',
          dueDate: dueDateObj,
          status: task.status || 'Pending',
          isAiGenerated: true,
          confirmedBy: req.userId || undefined,
        });
      })
    );

    res.status(201).json({
      success: true,
      message: `Extracted ${createdItems.length} action items successfully`,
      actionItems: createdItems,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to extract action items', error: error.message });
  }
};

export const getMeetingActionItems = async (req: Request, res: Response): Promise<void> => {
  try {
    const { meetingId } = req.params;

    const actionItems = await ActionItem.find({ meetingId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      actionItems,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to fetch action items', error: error.message });
  }
};

export const createActionItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { meetingId, title, description, assignee, dueDate, status } = req.body;

    if (!meetingId || !title) {
      res.status(400).json({ success: false, message: 'Meeting ID and title are required' });
      return;
    }

    const meeting = await Meeting.findById(meetingId);
    if (!meeting) {
      res.status(404).json({ success: false, message: 'Meeting not found' });
      return;
    }

    const actionItem = await ActionItem.create({
      meetingId,
      workspaceId: meeting.workspaceId || undefined,
      title,
      description: description || '',
      assignee: assignee || '',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      status: status || 'Pending',
      isAiGenerated: false,
      confirmedBy: req.userId || undefined,
    });

    res.status(201).json({
      success: true,
      message: 'Action item created',
      actionItem,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to create action item', error: error.message });
  }
};

export const updateActionItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { title, description, assignee, dueDate, status } = req.body;

    const item = await ActionItem.findById(id);
    if (!item) {
      res.status(404).json({ success: false, message: 'Action item not found' });
      return;
    }

    if (title !== undefined) item.title = title;
    if (description !== undefined) item.description = description;
    if (assignee !== undefined) item.assignee = assignee;
    if (dueDate !== undefined) item.dueDate = dueDate ? new Date(dueDate) : undefined;
    if (status !== undefined) item.status = status;

    await item.save();

    res.json({
      success: true,
      message: 'Action item updated',
      actionItem: item,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to update action item', error: error.message });
  }
};

export const deleteActionItem = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const deleted = await ActionItem.findByIdAndDelete(id);
    if (!deleted) {
      res.status(404).json({ success: false, message: 'Action item not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Action item deleted successfully',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to delete action item', error: error.message });
  }
};
