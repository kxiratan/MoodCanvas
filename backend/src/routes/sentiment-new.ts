import express, { Request, Response } from 'express';
import { handleMoodUpdate } from '../services/sentiment';
import { MoodType, MoodState } from '../types/mood';
import { validateSessionId, handleSessionErrors } from '../middleware/session';
import { InvalidInputError } from '../types/errors';

interface WeightedMoodScore {
  type: MoodType;
  score: number;
}

const router = express.Router();

function calculateDominantMood(moods: MoodState[]): MoodState {
  const FIVE_MINUTES = 5 * 60 * 1000;
  const currentTime = Date.now();

  // Get moods from the last 5 minutes
  const recentMoods = moods.filter(mood => 
    currentTime - mood.timestamp < FIVE_MINUTES
  );

  if (recentMoods.length === 0) {
    return moods[moods.length - 1];
  }

  // Calculate weighted mood scores
  let totalWeight = 0;
  const scores: WeightedMoodScore[] = recentMoods.map(mood => {
    const age = currentTime - mood.timestamp;
    const weight = Math.max(0.1, 1 - (age / FIVE_MINUTES));
    totalWeight += weight;
    return {
      type: mood.type,
      score: (mood.intensity / 100) * weight
    };
  });

  // Aggregate scores by mood type
  const moodScores: Record<MoodType, number> = {
    positive: 0,
    negative: 0,
    neutral: 0,
    energetic: 0,
    calm: 0,
    chaotic: 0
  };

  scores.forEach(({ type, score }) => {
    moodScores[type] += score;
  });

  // Find dominant mood
  let dominantMood: MoodType = 'neutral';
  let maxScore = 0;

  Object.entries(moodScores).forEach(([mood, score]) => {
    if (score > maxScore) {
      maxScore = score;
      dominantMood = mood as MoodType;
    }
  });

  return {
    type: dominantMood,
    intensity: Math.min(100, (maxScore / totalWeight) * 100),
    timestamp: currentTime
  };
}

router.get('/:sessionId/mood', validateSessionId, (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      throw new InvalidInputError('Session ID is required');
    }
    
    const moodHistory = global.sessionMoods[sessionId] || [];
    
    if (moodHistory.length === 0) {
      const defaultMood: MoodState = { 
        type: 'neutral', 
        intensity: 50, 
        timestamp: Date.now() 
      };
      return res.json(defaultMood);
    }

    const currentMood = calculateDominantMood(moodHistory);
    return res.json(currentMood);
  } catch (error) {
    if (error instanceof InvalidInputError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error getting mood state:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/analyze', validateSessionId, async (req: Request, res: Response) => {
  try {
    const { text, sessionId } = req.body;
    
    if (!text || typeof text !== 'string') {
      throw new InvalidInputError('Text is required and must be a string');
    }

    const moodState = await handleMoodUpdate(text);
    const timestamp = Date.now();

    // Initialize session moods if needed
    if (!global.sessionMoods[sessionId]) {
      global.sessionMoods[sessionId] = [];
    }

    // Add new mood to history
    const newMood: MoodState = {
      ...moodState,
      timestamp
    };

    global.sessionMoods[sessionId].push(newMood);
    
    // Keep only last 100 moods with cleanup
    if (global.sessionMoods[sessionId].length > 100) {
      const currentTime = Date.now();
      const oneHourAgo = currentTime - (60 * 60 * 1000);
      
      // Remove moods older than 1 hour first
      global.sessionMoods[sessionId] = global.sessionMoods[sessionId].filter(
        (mood: MoodState) => mood.timestamp > oneHourAgo
      );
      
      // If still over 100, keep the most recent 100
      if (global.sessionMoods[sessionId].length > 100) {
        global.sessionMoods[sessionId] = global.sessionMoods[sessionId].slice(-100);
      }
    }

    res.json(newMood);
  } catch (error) {
    if (error instanceof InvalidInputError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

router.use(handleSessionErrors);

export const sentimentRouter = router;