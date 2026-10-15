import mongoose, { Document, Schema } from 'mongoose';

export type ParticipantRole = 'host' | 'co-host' | 'participant';
export type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export interface IMeetingParticipant extends Document {
  meetingId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  name: string;
  email?: string;
  role: ParticipantRole;
  joinedAt: Date;
  leftAt?: Date;
  isMuted: boolean;
  isVideoOff: boolean;
  isHandRaised: boolean;
  connectionStatus: ConnectionStatus;
  socketId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingParticipantSchema = new Schema<IMeetingParticipant>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['host', 'co-host', 'participant'],
      default: 'participant',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
    },
    isMuted: {
      type: Boolean,
      default: false,
    },
    isVideoOff: {
      type: Boolean,
      default: false,
    },
    isHandRaised: {
      type: Boolean,
      default: false,
    },
    connectionStatus: {
      type: String,
      enum: ['connected', 'reconnecting', 'disconnected'],
      default: 'connected',
    },
    socketId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const MeetingParticipant = mongoose.model<IMeetingParticipant>(
  'MeetingParticipant',
  MeetingParticipantSchema
);
