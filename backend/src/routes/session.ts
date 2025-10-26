import express, { Request, Response } from 'express';
import { nanoid } from 'nanoid';

const router = express.Router();

interface Session {
  id: string;
  users: string[];
  createdAt: number;
}

const sessions = new Map<string, Session>();

// Create new session
router.post('/create', (req: Request, res: Response) => {
  const sessionId = nanoid();
  const session: Session = {
    id: sessionId,
    users: [],
    createdAt: Date.now()
  };
  
  sessions.set(sessionId, session);
  res.json({ sessionId });
});

// Join existing session
router.post('/:sessionId/join', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const { username } = req.body;

  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (!session.users.includes(username)) {
    session.users.push(username);
  }

  res.json({ session });
});

// Get session info
router.get('/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({ session });
});

export const sessionRouter = router;