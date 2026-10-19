export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
  title?: string;
  department?: string;
  status?: 'active' | 'suspended';
  createdAt?: string;
}

export interface MeetingSettings {
  audioMutedOnEntry: boolean;
  videoOffOnEntry: boolean;
  screenShareAllowed: boolean;
  chatEnabled: boolean;
}

export interface Meeting {
  id: string;
  _id?: string;
  roomId: string;
  title: string;
  description?: string;
  hostId: string | User;
  workspaceId?: string | { id: string; name: string };
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  durationMinutes?: number;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  isPrivate: boolean;
  requiresPasscode?: boolean;
  passcode?: string;
  transcriptionConsent: boolean;
  isHost?: boolean;
  settings: MeetingSettings;
  createdAt: string;
}

export interface MeetingParticipant {
  id: string;
  _id?: string;
  meetingId: string;
  userId?: User;
  name: string;
  email?: string;
  role: 'host' | 'co-host' | 'participant';
  joinedAt: string;
  leftAt?: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isHandRaised: boolean;
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
  socketId?: string;
}

export interface PeerState {
  socketId: string;
  userId?: string;
  name: string;
  avatar?: string;
  role: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isSharingScreen: boolean;
  isHandRaised: boolean;
  stream?: MediaStream;
  reaction?: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderName: string;
  senderAvatar?: string;
  senderId?: string;
  message: string;
  timestamp: string;
  isSystem: boolean;
}

export interface TranscriptSegment {
  _id?: string;
  id?: string;
  meetingId: string;
  speakerName: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence?: number;
  source: 'stt_service' | 'browser_api' | 'demo';
  createdAt?: string;
}

export interface MeetingSummary {
  _id?: string;
  meetingId: string;
  overview: string;
  discussionPoints: string[];
  keyDecisions: string[];
  importantQuestions: string[];
  risksAndIssues: string[];
  nextSteps: string[];
  modelUsed: string;
  generatedAt: string;
}

export interface ActionItem {
  _id?: string;
  id?: string;
  meetingId: string;
  workspaceId?: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  isAiGenerated: boolean;
  createdAt: string;
}

export interface Workspace {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  slug: string;
  role?: 'owner' | 'admin' | 'member';
  avatar?: string;
  sharedNotes?: string;
  createdAt?: string;
}

export interface WorkspaceMembership {
  _id: string;
  workspaceId: string;
  userId?: User;
  invitedEmail: string;
  role: 'owner' | 'admin' | 'member';
  status: 'pending' | 'accepted' | 'declined';
  invitedBy?: User;
  createdAt: string;
}
