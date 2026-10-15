import server from './index';
import { connectDatabase } from './config/db';

const port = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  connectDatabase()
    .then(() => {
      server.listen(port, () => {
        console.log(`[Server] IntellMeet backend server running on port ${port}`);
        console.log('[Server] WebRTC Signaling & Socket.IO active');
      });
    })
    .catch((error) => {
      console.error('[Server] Database startup error:', error);
      server.listen(port, () => {
        console.log(`[Server] Running on port ${port} (Database degraded mode)`);
      });
    });
}