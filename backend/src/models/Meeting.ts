import mongoose, { Document, Schema } from 'mongoose';

export type MeetingStatus = 'scheduled' | 'live' | 'completed' | 'cancelled';

export interface IMeetingSettings {
  audioMutedOnEntry: boolean;
  videoOffOnEntry: boolean;
  screenShareAllowed: boolean;
  chatEnabled: boolean;
}

export interface IMeeting extends Document {
  title: string;
  description?: string;
  roomId: string;
  hostId: mongoose.Types.ObjectId;
  workspaceId?: mongoose.Types.ObjectId;
  scheduledStartTime?: Date;
  scheduledEndTime?: Date;
  actualStartTime?: Date;
  actualEndTime?: Date;
  durationMinutes?: number;
  status: MeetingStatus;
  isPrivate: boolean;
  passcode?: string;
  transcriptionConsent: boolean;
  settings: IMeetingSettings;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    title: {
      type: String,
      required: [true, 'Meeting title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    roomId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    hostId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      index: true,
    },
    scheduledStartTime: {
      type: Date,
    },
    scheduledEndTime: {
      type: Date,
    },
    actualStartTime: {
      type: Date,
    },
    actualEndTime: {
      type: Date,
    },
    durationMinutes: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'completed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    passcode: {
      type: String,
      default: '',
    },
    transcriptionConsent: {
      type: Boolean,
      default: true,
    },
    settings: {
      audioMutedOnEntry: { type: Boolean, default: false },
      videoOffOnEntry: { type: Boolean, default: false },
      screenShareAllowed: { type: Boolean, default: true },
      chatEnabled: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

export const Meeting = mongoose.model<IMeeting>('Meeting', MeetingSchema);
