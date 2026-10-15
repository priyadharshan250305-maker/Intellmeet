import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let memoryServer: any = null;
let connectionPromise: Promise<void> | null = null;

export const connectDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (connectionPromise) {
    return connectionPromise;
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const mongoUri = process.env.MONGODB_URI ||
    (!isProduction ? 'mongodb://127.0.0.1:27017/intellmeet' : undefined);

  if (!mongoUri) {
    throw new Error('MONGODB_URI must be configured in production.');
  }

  connectionPromise = (async () => {
    try {
      mongoose.set('strictQuery', false);
      await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 3000,
      });
      console.log('[Database] MongoDB connected successfully.');
    } catch (error: unknown) {
      console.warn('[Database] MongoDB connection failed.');

      if (isProduction) {
        throw error;
      }

      try {
        console.log('[Database] Activating automatic in-memory Mongo server for development...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const inMemoryUri = memoryServer.getUri();
        await mongoose.connect(inMemoryUri);
        console.log(`[Database] In-memory MongoDB connected successfully at: ${inMemoryUri}`);
        console.log('[Database] User accounts, meetings, transcripts, and workspaces are fully operational!');
      } catch (memErr: any) {
        console.error('[Database] In-memory database fallback error:', memErr.message);
      }
    }
  })();

  try {
    await connectionPromise;
  } finally {
    connectionPromise = null;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('[Database] MongoDB disconnected cleanly.');
  } catch (error) {
    console.error('[Database] Disconnect error:', error);
  } finally {
    connectionPromise = null;
  }
};
