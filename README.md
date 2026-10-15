# IntellMeet — AI-Powered Enterprise Meeting & Collaboration Platform

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-black.svg)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![WebRTC](https://img.shields.io/badge/WebRTC-Peer_to_Peer-orange.svg)](https://webrtc.org/)
[![Tests](https://img.shields.io/badge/Tests-13%20Passed-emerald.svg)]()

IntellMeet is a modern, full-stack, enterprise-grade AI-powered meeting and team collaboration platform. It combines peer-to-peer WebRTC audio/video conferencing, real-time Socket.IO signaling and chat, live speech-to-text audio transcription, OpenAI meeting summaries, and automated action item extraction with team workspaces and role-based access control.

---

## Key Features

1. **WebRTC Video Conferencing**:
   - Ultra-low latency mesh peer-to-peer audio and video streaming.
   - Dynamic participant video tiles with active speaker / hand-raised highlights.
   - Camera and microphone toggles with muted entry defaults.
   - High-definition screen sharing with seamless media track replacement.
   - STUN/TURN server configuration with NAT traversal.

2. **Real-Time Collaboration**:
   - Socket.IO signaling engine for WebRTC session negotiation (offers, answers, ICE candidates).
   - Instant in-meeting chat drawer with persistent history.
   - Real-time presence tracking, join/leave notifications, and raise-hand alerts.

3. **AI Meeting Transcription**:
   - Audio speech-to-text capture with participant notice and explicit consent dialog.
   - Browser Web Speech API integration with real-time interim results.
   - Clear visual distinction between live speech transcripts and demo data.
   - Segment storage with timestamps and speaker attribution in MongoDB.

4. **AI Meeting Summaries**:
   - Post-meeting executive overview, main discussion points, key decisions, important questions, risks/issues, and immediate next steps.
   - Powered by OpenAI `gpt-4o-mini` with a deterministic local NLP heuristic fallback when API keys are not configured.
   - Stored in MongoDB for instant retrieval and re-generation.

5. **Smart Action Items**:
   - Automated extraction of actionable tasks from transcripts.
   - Identifies explicitly mentioned assignees and deadlines without hallucinating unstated data.
   - Interactive task board: edit titles, assignees, deadlines, and statuses (`Pending`, `In Progress`, `Completed`).

6. **Team Workspaces & RBAC**:
   - Create custom team workspaces with unique slugs.
   - Invite team members with roles: `Owner`, `Admin`, `Member`.
   - Collaborative shared workspace notes and centralized meeting logs.
   - Role-based authorization for administrative actions.

7. **Enterprise Security & Design**:
   - JWT authentication with bcrypt password hashing and token expiration.
   - Helmet security headers, CORS origin verification, and rate limiting.
   - Light and dark theme toggle persisted in `localStorage`.
   - Fully responsive design on desktop, tablet, and mobile with Tailwind CSS.

---

## Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, React Router v6, Lucide React icons, Socket.IO Client.
- **Backend**: Node.js, Express, TypeScript, Socket.IO, Mongoose, JWT, bcryptjs, Helmet, Express Rate Limit, Morgan.
- **Database**: MongoDB with Mongoose (with `mongodb-memory-server` for self-contained testing).
- **AI**: OpenAI API (`gpt-4o-mini`) + Speech Recognition + Local Deterministic NLP Fallback.
- **Testing**: Jest, Supertest, ts-jest.

---

## 12 Main Application Pages

| # | Page | Route | Description |
|---|---|---|---|
| 1 | **Landing Page** | `/` | Hero section, feature breakdown, interactive CTAs, security overview. |
| 2 | **Sign Up Page** | `/signup` | User registration with department, title, and validation. |
| 3 | **Login Page** | `/login` | Authentication with quick-demo accounts for instant evaluation. |
| 4 | **Forgot Password Page** | `/forgot-password` | Password reset request and token verification workflow. |
| 5 | **User Dashboard** | `/dashboard` | Metric summaries, upcoming meetings, quick room join, and recent sessions. |
| 6 | **Create & Schedule Meeting** | `/schedule` | Instant or scheduled meeting setup, room ID generation, passcodes, entry rules. |
| 7 | **Live Meeting Room** | `/room/:roomId` | Full WebRTC video conference, mic/camera controls, screen share, chat drawer, live transcript drawer. |
| 8 | **Meeting History Page** | `/history` | Past meetings list with durations, dates, search filter, and notes links. |
| 9 | **Meeting Details & AI Summary** | `/meeting/:meetingId` | Executive overview, discussion points, key decisions, questions, risks, next steps, action items. |
| 10 | **Team Workspaces** | `/workspaces` | Workspace selector, member list, invitations, shared notes, tasks. |
| 11 | **User Profile & Settings** | `/profile` | Profile editing, password change, account metrics, theme switcher. |
| 12 | **Admin Console** | `/admin` | System statistics, user directory with suspension controls, meeting audit logs. |

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance running on port 27017, or a free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster URI.

---

### Installation

1. Clone or navigate to the project directory:
   ```bash
   cd intellmeet
   ```

2. Install dependencies for both backend and frontend:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

---

### Environment Variables

#### Backend (`backend/.env`)
Copy `backend/.env.example` to `backend/.env`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/intellmeet
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
OPENAI_API_KEY=your_openai_api_key_here
STUN_SERVERS=stun:stun.l.google.com:19302,stun:stun1.l.google.com:19302
```
> **Note**: If `OPENAI_API_KEY` is not provided, IntellMeet automatically activates its built-in local deterministic NLP extraction engine for summaries and action items.

#### Frontend (`frontend/.env`)
Copy `frontend/.env.example` to `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

### Running in Development

1. **Start the Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
   *Runs on `http://localhost:5000` with hot-reload and Socket.IO active.*

2. **Start the Frontend Application**:
   ```bash
   cd frontend
   npm run dev
   ```
   *Runs on `http://localhost:5173` with Vite HMR.*

3. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

---

### Running Automated Tests

Run the comprehensive test suite (Auth, Meetings, AI Summaries, Action Items, Workspaces):
```bash
npm run test
```
Or directly within backend:
```bash
cd backend
npm test
```
*Tests utilize an in-memory MongoDB server (`mongodb-memory-server`) to ensure 100% isolation without requiring an external database running.*

---

### Production Build

Verify production TypeScript compilation and asset bundling:
```bash
npm run build
```
This builds both `backend` (to `dist/`) and `frontend` (to `dist/` with minified CSS and JS).

---

## WebRTC STUN/TURN & Network Architecture

IntellMeet establishes peer-to-peer connections using standard WebRTC APIs:
- **Signaling**: Conducted over Socket.IO (offer/answer/ice-candidate).
- **Audio & Video Media**: Streamed directly between browsers peer-to-peer.
- **STUN Servers**: Used by default (`stun.l.google.com:19302`) to resolve public IP and NAT mapping.
- **TURN Relay Notice**: For restrictive corporate firewalls or symmetric NATs, configure a TURN relay server (e.g., [coturn](https://github.com/coturn/coturn) or Twilio Network Traversal) by providing credentials in `STUN_SERVERS` or `TURN_SERVERS` in `backend/.env`.

---

## REST API Reference

### Authentication
- `POST /api/auth/register` — Create user account & default workspace
- `POST /api/auth/login` — Authenticate & receive JWT token
- `GET /api/auth/me` — Get current authenticated user profile
- `POST /api/auth/forgot-password` — Generate password reset token
- `POST /api/auth/reset-password` — Update password with token

### Meetings
- `POST /api/meetings` — Create instant or scheduled meeting
- `GET /api/meetings/user` — Get upcoming and recent user meetings
- `GET /api/meetings/history` — Get completed meeting history
- `GET /api/meetings/room/:roomId` — Get meeting metadata by room ID
- `POST /api/meetings/room/:roomId/join` — Join room (validates passcode if private)
- `POST /api/meetings/room/:roomId/end` — End meeting (Host only)
- `GET /api/webrtc/ice-servers` — Fetch configured STUN/TURN ICE servers

### AI & Summaries
- `POST /api/ai/summary/:meetingId` — Generate or regenerate AI summary
- `GET /api/ai/summary/:meetingId` — Retrieve saved meeting summary
- `POST /api/ai/action-items/extract/:meetingId` — Extract action items from transcript
- `GET /api/ai/action-items/:meetingId` — List action items for meeting
- `POST /api/ai/action-items` — Create custom action item
- `PUT /api/ai/action-items/:id` — Update status, title, assignee, deadline
- `DELETE /api/ai/action-items/:id` — Remove action item

### Transcripts
- `POST /api/transcripts/segments` — Save live speech segment
- `GET /api/transcripts/:meetingId` — Retrieve chronological meeting transcript
- `POST /api/transcripts/:meetingId/sample` — Seed structured demo transcript

### Workspaces
- `POST /api/workspaces` — Create team workspace
- `GET /api/workspaces` — List user's workspaces
- `GET /api/workspaces/:id` — Get workspace details, members, meetings, tasks
- `PUT /api/workspaces/:id/notes` — Update collaborative shared notes
- `POST /api/workspaces/:id/invite` — Invite member by email with role
- `DELETE /api/workspaces/:id/members/:memberId` — Remove member

### Administration (Role: Admin)
- `GET /api/admin/stats` — Platform metrics (users, meetings, live calls, workspaces)
- `GET /api/admin/users` — List users with search and status filters
- `PUT /api/admin/users/:id` — Suspend or activate user
- `GET /api/admin/meetings` — Meeting audit logs

---

## License
MIT License. Built for enterprise collaboration and AI meeting intelligence.
