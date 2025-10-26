import { Request, Response, NextFunction } from 'express';
import { Session } from '../types/session';
import { SessionError } from '../types/errors';

interface SessionRequest extends Request {
  session?: Session;
}

export const validateSessionId = (req: SessionRequest, res: Response, next: NextFunction) => {
  const sessionId = req.params.sessionId || req.body.sessionId;
  
  if (!sessionId) {
    throw new SessionError('Session ID is required', 400);
  }

  // Validate session ID format
  if (!/^[a-f0-9-]{36}$/.test(sessionId)) {
    throw new SessionError('Invalid session ID format', 400);
  }

  // Check if session exists in global.sessionMoods
  if (!global.sessionMoods[sessionId]) {
    throw new SessionError('Session not found', 404);
  }

  // Attach session to request for use in route handlers
  req.session = {
    id: sessionId
  } as Session;

  next();
};

// Handle errors from the middleware
export const handleSessionErrors = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SessionError) {
    return res.status(err.status).json({ error: err.message });
  }
  next(err);
};