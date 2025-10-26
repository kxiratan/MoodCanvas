import express, { Request, Response } from 'express';
import { handleMoodUpdate } from '../services/sentiment';
import { MoodType, MoodState } from '../types/mood';
import { validateSessionId } from '../middleware/session';
import { SentimentAnalysisError, InvalidInputError, SessionError } from '../types/errors';

const router = express.Router();

interface WeightedMood extends MoodState {
  weight: number;
}

// Initialize global session moods
if (!global.sessionMoods) {
  global.sessionMoods = {} as Record<string, MoodState[]>;
}

// Get current mood state for a session
router.get('/:sessionId/mood', validateSessionId, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const moods: MoodState[] = global.sessionMoods[sessionId] || [];
    
    if (moods.length === 0) {
      return res.json({ type: 'neutral', intensity: 50, timestamp: Date.now() });
    }

    const dominantMood = calculateDominantMood(moods);
    res.json(dominantMood);
  } catch (error) {
    console.error('Error getting mood:', error);
    res.status(500).json({ error: 'Failed to get mood state' });
  }
});

// Post a new mood update
router.post('/:sessionId/analyze', validateSessionId, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { text } = req.body;

    if (!text) {
      throw new InvalidInputError('Text input is required');
    }

    const moodState = await handleMoodUpdate(text);

    // Store the mood state
    if (!global.sessionMoods[sessionId]) {
      global.sessionMoods[sessionId] = [];
    }
    global.sessionMoods[sessionId].push(moodState);

    res.json(moodState);
  } catch (error) {
    if (error instanceof InvalidInputError) {
      res.status(400).json({ error: error.message });
    } else if (error instanceof SentimentAnalysisError) {
      res.status(500).json({ error: error.message });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

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

  // Calculate weighted average of recent moods
  let totalWeight = 0;
  const moodScores: Record<MoodType, number> = {
    positive: 0,
    negative: 0,
    energetic: 0,
    calm: 0,
    chaotic: 0,
    neutral: 0
  };

  recentMoods.forEach((mood: MoodState) => {
    const timeAgo = currentTime - mood.timestamp;
    const weight = 1 - (timeAgo / FIVE_MINUTES); // More recent moods have higher weight
    totalWeight += weight;

    moodScores[mood.type] += mood.intensity * weight;
  });

  // Find the dominant mood
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

export const sentimentRouter = router;
function calculateDominantMood(moods: MoodState[]): MoodState {
  const FIVE_MINUTES = 5 * 60 * 1000;
  const currentTime = Date.now();

  // Get moods from the last 5 minutes
  const recentMoods = moods.filter(mood => 
    currentTime - mood.timestamp < FIVE_MINUTES
>>>>>>> Stashed changes
  );

  if (recentMoods.length === 0) {
    return moods[moods.length - 1];
  }
  // Calculate weighted average of recent moods
  const weightedMoods = recentMoods.map((mood: MoodState) => {
    const age = Date.now() - mood.timestamp;
    const weight = Math.max(0.1, 1 - (age / (5 * 60 * 1000)));
    return { ...mood, weight };
=======
  // Calculate weighted mood scores
  let totalWeight = 0;
  const moodScores = recentMoods.reduce((acc: Record<MoodType, number>, mood: MoodState) => {
    const age = currentTime - mood.timestamp;
    const weight = Math.max(0.1, 1 - (age / FIVE_MINUTES));
    acc[mood.type] = (acc[mood.type] || 0) + (mood.intensity / 100) * weight;
    totalWeight += weight;
    return acc;
  }, {
    positive: 0,
    negative: 0,
    neutral: 0,
    energetic: 0,
    calm: 0,
    chaotic: 0
>>>>>>> Stashed changes
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

    const moodScores: Record<MoodType, number> = {
      positive: 0,
      negative: 0,
      neutral: 0,
      energetic: 0,
      calm: 0,
      chaotic: 0
    };

    let totalWeight = 0;
    weightedMoods.forEach((mood: WeightedMood) => {
      moodScores[mood.type] += (mood.intensity / 100) * mood.weight;
      totalWeight += mood.weight;
    });    // Find dominant mood
    let dominantMood: MoodType = 'neutral';
    let maxScore = 0;

    Object.entries(moodScores).forEach(([mood, score]) => {
      if (score > maxScore) {
        maxScore = score;
        dominantMood = mood as MoodType;
      }
    });

    res.json({
      type: dominantMood,
      intensity: Math.min(100, (maxScore / totalWeight) * 100),
      timestamp: Date.now()
    });
  } catch (error) {
    if (error instanceof InvalidInputError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error getting mood state:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }

  // Get moods from the last 5 minutes
  const moodScores: Record<MoodType, number> = {
    positive: 0,
    negative: 0,
    neutral: 0,
    energetic: 0,
    calm: 0,
    chaotic: 0
  };

  let totalWeight = 0;
  weightedMoods.forEach(({ type, intensity, weight }: MoodState & { weight: number }) => {
    moodScores[type] += (intensity / 100) * weight;
    totalWeight += weight;
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

  res.json({
    type: dominantMood,
    intensity: Math.min(100, (maxScore / totalWeight) * 100),
    timestamp: Date.now()
  });
});

// Analyze text sentiment
router.post('/analyze', validateSessionId, async (req: Request, res: Response) => {
  try {
    const { text, sessionId } = req.body;
    
    if (!text || typeof text !== 'string') {
      throw new InvalidInputError('Text is required and must be a string');
    }

    if (!sessionId) {
      throw new SessionError('Session ID is required', 400);
    }

    const moodState = await handleMoodUpdate(text);
    const timestamp = Date.now();

    // Initialize session moods if needed
    if (!global.sessionMoods[sessionId]) {
      global.sessionMoods[sessionId] = [];
    }

    // Store mood in memory
    global.sessionMoods[sessionId].push({
      ...moodState,
      timestamp
    });
    
    // Keep only last 100 moods per session with cleanup
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

    res.json({ 
      mood: moodState.type,
      intensity: moodState.intensity,
      timestamp 
    });
  } catch (error) {
    if (error instanceof InvalidInputError || error instanceof SessionError) {
      return res.status(error.status).json({ error: error.message });
    }
    if (error instanceof SentimentAnalysisError) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});router.use(handleSessionErrors);

export const sentimentRouter = router;