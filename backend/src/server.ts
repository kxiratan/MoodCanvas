import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './socket';
import { sentimentRouter } from './routes/sentiment-new';
import { sessionRouter } from './routes/session';
// Load environment variables
dotenv.config();

import { connectDatabase } from './config/database';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/sentiment', sentimentRouter);
app.use('/api/session', sessionRouter);

// Import types and services
import { MoodState } from './types/mood';
import { SessionCleanupService } from './services/cleanup';

// Initialize global session moods
declare global {
  var sessionMoods: Record<string, MoodState[]>;
}
global.sessionMoods = {} as Record<string, MoodState[]>;
const cleanupService = new SessionCleanupService();

// Socket.io setup
setupSocketHandlers(io);

// Health check and stats endpoints
app.get('/health', (req: Request, res: Response<any>) => {
  console.log('Health check endpoint called');
  const cleanupStats = cleanupService.getLastCleanupStats();
  res.status(200).json({ 
    status: 'ok',
    cleanup: cleanupStats
  });
});

// Force cleanup endpoint (admin only)
app.post('/admin/cleanup', (req: Request, res: Response) => {
  try {
    cleanupService.cleanupInactiveSessions();
    const stats = cleanupService.getLastCleanupStats();
    res.status(200).json({ 
      message: 'Cleanup completed successfully',
      stats 
    });
  } catch (error) {
    console.error('Error during forced cleanup:', error);
    res.status(500).json({ error: 'Failed to run cleanup' });
  }
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  const status = err.status || 500;
  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      status
    }
  });
});

const PORT = process.env.PORT || 3000;

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

// Connect to MongoDB and start server
connectDatabase()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Available routes:');
      console.log('- GET /health');
      console.log('- POST /api/sentiment/analyze');
      console.log('- POST /api/session/create');
      console.log('- POST /api/session/:sessionId/join');
      console.log('- GET /api/session/:sessionId');
    });
  })
  .catch(err => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });