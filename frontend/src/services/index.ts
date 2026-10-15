import api from './api';
import {
  User,
  Meeting,
  MeetingSummary,
  ActionItem,
  Workspace,
  TranscriptSegment,
} from '../types';

// Auth Services
export const authService = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getCurrentUser: () => api.get<{ success: boolean; user: User }>('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: any) => api.post('/auth/reset-password', data),
};

// User Profile Services
export const userService = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: Partial<User>) => api.put('/users/profile', data),
  changePassword: (data: any) => api.post('/users/change-password', data),
};

// Meeting Services
export const meetingService = {
  createMeeting: (data: any) => api.post<{ success: boolean; meeting: Meeting }>('/meetings', data),
  getUserMeetings: () => api.get<{ success: boolean; upcoming: Meeting[]; history: Meeting[] }>('/meetings/user'),
  getMeetingHistory: () => api.get<{ success: boolean; meetings: Meeting[] }>('/meetings/history'),
  getMeetingByRoomId: (roomId: string) => api.get<{ success: boolean; meeting: any }>(`/meetings/room/${roomId}`),
  joinMeeting: (roomId: string, data: { passcode?: string; guestName?: string }) =>
    api.post(`/meetings/room/${roomId}/join`, data),
  endMeeting: (roomId: string) => api.post(`/meetings/room/${roomId}/end`),
  getMeetingParticipants: (roomId: string) => api.get(`/meetings/room/${roomId}/participants`),
  getIceServers: () => api.get('/webrtc/ice-servers'),
};

// AI & Summary Services
export const aiService = {
  generateSummary: (meetingId: string) =>
    api.post<{ success: boolean; summary: MeetingSummary }>(`/ai/summary/${meetingId}`),
  getSummary: (meetingId: string) =>
    api.get<{ success: boolean; summary: MeetingSummary }>(`/ai/summary/${meetingId}`),
  extractActionItems: (meetingId: string) =>
    api.post<{ success: boolean; actionItems: ActionItem[] }>(`/ai/action-items/extract/${meetingId}`),
  getActionItems: (meetingId: string) =>
    api.get<{ success: boolean; actionItems: ActionItem[] }>(`/ai/action-items/${meetingId}`),
  createActionItem: (data: any) => api.post<{ success: boolean; actionItem: ActionItem }>('/ai/action-items', data),
  updateActionItem: (id: string, data: any) =>
    api.put<{ success: boolean; actionItem: ActionItem }>(`/ai/action-items/${id}`, data),
  deleteActionItem: (id: string) => api.delete(`/ai/action-items/${id}`),
};

// Transcript Services
export const transcriptService = {
  getTranscript: (meetingId: string) =>
    api.get<{ success: boolean; segments: TranscriptSegment[] }>(`/transcripts/${meetingId}`),
  addSegment: (data: any) => api.post('/transcripts/segments', data),
  seedSampleTranscript: (meetingId: string) =>
    api.post<{ success: boolean; segments: TranscriptSegment[] }>(`/transcripts/${meetingId}/sample`),
};

// Workspace Services
export const workspaceService = {
  createWorkspace: (data: any) => api.post<{ success: boolean; workspace: Workspace }>('/workspaces', data),
  getUserWorkspaces: () => api.get<{ success: boolean; workspaces: Workspace[] }>('/workspaces'),
  getWorkspaceDetails: (id: string) => api.get(`/workspaces/${id}`),
  updateNotes: (id: string, sharedNotes: string) => api.put(`/workspaces/${id}/notes`, { sharedNotes }),
  inviteMember: (id: string, data: { email: string; role?: string }) =>
    api.post(`/workspaces/${id}/invite`, data),
  removeMember: (workspaceId: string, memberId: string) =>
    api.delete(`/workspaces/${workspaceId}/members/${memberId}`),
};

// Admin Services
export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getAllUsers: (params?: any) => api.get('/admin/users', { params }),
  updateUserStatus: (id: string, data: any) => api.put(`/admin/users/${id}`, data),
  getAllMeetings: () => api.get('/admin/meetings'),
};
