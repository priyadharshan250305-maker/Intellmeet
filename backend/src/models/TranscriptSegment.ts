import mongoose, { Document, Schema } from 'mongoose';

export type TranscriptSource = 'stt_service' | 'browser_api' | 'demo';

export interface ITranscriptSegment extends Document {
  meetingId: mongoose.Types.ObjectId;
  speakerId?: mongoose.Types.ObjectId;
  speakerName: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  isFinal: boolean;
  source: TranscriptSource;
  createdAt: Date;
  updatedAt: Date;
}

const TranscriptSegmentSchema = new Schema<ITranscriptSegment>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      index: true,
    },
    speakerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    speakerName: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: Number,
      required: true,
      default: 0,
    },
    endTime: {
      type: Number,
      required: true,
      default: 0,
    },
    confidence: {
      type: Number,
      default: 1.0,
    },
    isFinal: {
      type: Boolean,
      default: true,
    },
    source: {
      type: String,
      enum: ['stt_service', 'browser_api', 'demo'],
      default: 'browser_api',
    },
  },
  {
    timestamps: true,
  }
);

TranscriptSegmentSchema.index({ meetingId: 1, startTime: 1 });

export const TranscriptSegment = mongoose.model<ITranscriptSegment>(
  'TranscriptSegment',
  TranscriptSegmentSchema
);
