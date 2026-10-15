import mongoose, { Document, Schema } from 'mongoose';

export type ActionItemStatus = 'Pending' | 'In Progress' | 'Completed';

export interface IActionItem extends Document {
  meetingId: mongoose.Types.ObjectId;
  workspaceId?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  assignee?: string;
  assigneeId?: mongoose.Types.ObjectId;
  dueDate?: Date;
  status: ActionItemStatus;
  isAiGenerated: boolean;
  confirmedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ActionItemSchema = new Schema<IActionItem>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      index: true,
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    assignee: {
      type: String,
      trim: true,
      default: '',
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
      index: true,
    },
    isAiGenerated: {
      type: Boolean,
      default: true,
    },
    confirmedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

ActionItemSchema.index({ meetingId: 1, status: 1 });

export const ActionItem = mongoose.model<IActionItem>('ActionItem', ActionItemSchema);
