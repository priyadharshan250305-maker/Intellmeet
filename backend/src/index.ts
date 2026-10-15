import express, { Application, Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { connectDatabase } from './config/db';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import { setupSocketHandlers } from './socket/socketHandler';

// Route imports
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import meetingRoutes from './routes/meetingRoutes';
import workspaceRoutes from './routes/workspaceRoutes';
import transcriptRoutes from './routes/transcriptRoutes';
import aiRoutes from './routes/aiRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

const app: Application = express();
const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

// Socket.IO setup with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global API rate limiter
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'IntellMeet Backend API & Signaling Engine',
    version: '1.0.0',
  });
});

// STUN/TURN configuration endpoint for WebRTC clients
app.get('/api/webrtc/ice-servers', (req: Request, res: Response) => {
  const customStun = process.env.STUN_SERVERS
    ? process.env.STUN_SERVERS.split(',').map((url) => ({ urls: url.trim() }))
    : [];

  const defaultServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    ...customStun,
  ];

  res.json({
    iceServers: defaultServers,
    turnNotice: 'For restrictive corporate firewalls or symmetric NATs, a relay TURN server (e.g. coturn or Twilio Network Traversal) should be configured in STUN_SERVERS / TURN_SERVERS.',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/transcripts', transcriptRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Error Handler
app.use(errorHandler);

// Setup Socket.IO Signaling and Chat
setupSocketHandlers(io);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  connectDatabase()
    .then(() => {
      server.listen(PORT, () => {
        console.log(`[Server] IntellMeet backend server running on port ${PORT}`);
        console.log(`[Server] WebRTC Signaling & Socket.IO active`);
      });
    })
    .catch((err) => {
      console.error('[Server] Database startup error:', err);
      // Still listen so frontend can communicate in development
      server.listen(PORT, () => {
        console.log(`[Server] Running on port ${PORT} (Database degraded mode)`);
      });
    });
}

export { app, server, io };
