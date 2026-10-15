import mongoose, { Document, Schema } from 'mongoose';

export type WorkspaceRole = 'owner' | 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'declined';

export interface IWorkspaceMembership extends Document {
  workspaceId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  invitedEmail: string;
  role: WorkspaceRole;
  status: InvitationStatus;
  invitedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceMembershipSchema = new Schema<IWorkspaceMembership>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    invitedEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'accepted',
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

WorkspaceMembershipSchema.index({ workspaceId: 1, invitedEmail: 1 }, { unique: true });

export const WorkspaceMembership = mongoose.model<IWorkspaceMembership>(
  'WorkspaceMembership',
  WorkspaceMembershipSchema
);
