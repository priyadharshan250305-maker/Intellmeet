import mongoose, { Document, Schema } from 'mongoose';

export interface IMeetingSummary extends Document {
  meetingId: mongoose.Types.ObjectId;
  generatedBy?: mongoose.Types.ObjectId;
  overview: string;
  discussionPoints: string[];
  keyDecisions: string[];
  importantQuestions: string[];
  risksAndIssues: string[];
  nextSteps: string[];
  modelUsed: string;
  rawResponse?: string;
  generatedAt: Date;
  updatedAt: Date;
}

const MeetingSummarySchema = new Schema<IMeetingSummary>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      unique: true,
      index: true,
    },
    generatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    overview: {
      type: String,
      required: true,
      default: '',
    },
    discussionPoints: {
      type: [String],
      default: [],
    },
    keyDecisions: {
      type: [String],
      default: [],
    },
    importantQuestions: {
      type: [String],
      default: [],
    },
    risksAndIssues: {
      type: [String],
      default: [],
    },
    nextSteps: {
      type: [String],
      default: [],
    },
    modelUsed: {
      type: String,
      default: 'gpt-4o-mini',
    },
    rawResponse: {
      type: String,
      default: '',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

export const MeetingSummary = mongoose.model<IMeetingSummary>('MeetingSummary', MeetingSummarySchema);
