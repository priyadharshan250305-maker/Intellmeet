import express, { Application, Request, Response, NextFunction } from 'express';
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

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import meetingRoutes from './routes/meetingRoutes';
import workspaceRoutes from './routes/workspaceRoutes';
import transcriptRoutes from './routes/transcriptRoutes';
import aiRoutes from './routes/aiRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

const app: Application = express();
app.set('trust proxy', 1);

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

app.use('/api', apiLimiter);

app.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'IntellMeet Backend API',
    health: '/api/health',
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'IntellMeet Backend API & Signaling Engine',
    version: '1.0.0',
  });
});

app.get('/api/webrtc/ice-servers', (_req: Request, res: Response) => {
  const customStun = process.env.STUN_SERVERS
    ? process.env.STUN_SERVERS.split(',').map((url) => ({ urls: url.trim() }))
    : [];

  res.json({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      ...customStun,
    ],
    turnNotice: 'For restrictive corporate firewalls or symmetric NATs, a relay TURN server (e.g. coturn or Twilio Network Traversal) should be configured in STUN_SERVERS / TURN_SERVERS.',
  });
});

app.use('/api', async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await connectDatabase();
    next();
  } catch (error) {
    next(error);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/meetings', meetingRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/transcripts', transcriptRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

app.use(errorHandler);

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.use((_socket, next) => {
  connectDatabase().then(() => next()).catch(next);
});

setupSocketHandlers(io);

export default server;
