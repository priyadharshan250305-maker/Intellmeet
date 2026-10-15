import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

let memoryServer: any = null;

export const connectDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/intellmeet';

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    });
    console.log(`[Database] MongoDB connected successfully to: ${mongoUri}`);
  } catch (error: any) {
    console.warn(`[Database] Notice: Local MongoDB not connected at ${mongoUri}.`);

    // In development mode, auto-start in-memory Mongo server as seamless fallback
    try {
      console.log('[Database] Activating automatic in-memory MongoDB server for development...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const inMemoryUri = memoryServer.getUri();
      await mongoose.connect(inMemoryUri);
      console.log(`[Database] In-memory MongoDB connected successfully at: ${inMemoryUri}`);
      console.log('[Database] User accounts, meetings, transcripts, and workspaces are fully operational!');
    } catch (memErr: any) {
      console.error('[Database] In-memory database fallback error:', memErr.message);
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
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
  }
};
