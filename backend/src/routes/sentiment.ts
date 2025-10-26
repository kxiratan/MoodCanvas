import express, { Request, Response } from 'express';
import { handleMoodUpdate } from '../services/sentiment';
import { MoodType, MoodState } from '../types/mood';

const router = express.Router();

// Analyze text sentiment
// Initialize global session moods
if (!global.sessionMoods) {
  global.sessionMoods = {};
}

// Get current mood state for a session
router.get('/:sessionId/mood', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const moods: MoodState[] = global.sessionMoods[sessionId] || [];
  
  if (moods.length === 0) {
    return res.json({ type: 'neutral', intensity: 50, timestamp: Date.now() });
  }

  // Get moods from the last 5 minutes
  const recentMoods = moods.filter((mood: MoodState) => 
    Date.now() - mood.timestamp < 5 * 60 * 1000
  );

  if (recentMoods.length === 0) {
    return res.json(moods[moods.length - 1]); // Return last mood if no recent ones
  }

  // Calculate weighted average of recent moods
  const weightedMoods = recentMoods.map((mood: MoodState) => {
    const age = Date.now() - mood.timestamp;
    const weight = Math.max(0.1, 1 - (age / (5 * 60 * 1000)));
    return { ...mood, weight };
  });

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
router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { text, sessionId } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const moodState = await handleMoodUpdate(text);
    const timestamp = Date.now();

    // Store mood in memory
    if (sessionId) {
      if (!global.sessionMoods[sessionId]) {
        global.sessionMoods[sessionId] = [];
      }
      global.sessionMoods[sessionId].push({
        ...moodState,
        timestamp
      });

      // Keep only last 100 moods per session
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
    console.error('Error analyzing sentiment:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

export const sentimentRouter = router;