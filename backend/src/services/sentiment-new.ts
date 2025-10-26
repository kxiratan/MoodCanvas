import { Anthropic } from '@anthropic-ai/sdk';
import { MoodState, MoodType } from '../types/mood';
import { SentimentAnalysisError, InvalidInputError } from '../types/errors';
import { Socket } from 'socket.io';
import { getConfig } from '../config/database';

declare global {
  var io: Socket | undefined;
}

const emotionalPatterns = {
  joy: {
    words: ['happy', 'joyful', 'excited', 'delighted', 'content'],
    intensity: 0.8
  },
  sadness: {
    words: ['sad', 'depressed', 'unhappy', 'gloomy', 'melancholy'],
    intensity: -0.7
  },
  anger: {
    words: ['angry', 'furious', 'outraged', 'irritated', 'mad'],
    intensity: -0.9
  },
  fear: {
    words: ['scared', 'afraid', 'terrified', 'anxious', 'worried'],
    intensity: -0.6
  },
  surprise: {
    words: ['surprised', 'amazed', 'astonished', 'shocked', 'stunned'],
    intensity: 0.5
  },
  neutral: {
    words: ['okay', 'fine', 'neutral', 'normal', 'average'],
    intensity: 0
  }
};

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

export const handleMoodUpdate = async (text: string): Promise<MoodState> => {
  try {
    if (!text.trim()) {
      throw new InvalidInputError('Empty text input');
    }

    const completion = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Analyze the emotional content and tone of this text: "${text}". Return a JSON object with two properties:
            1. type: The dominant emotion (one of: "joy", "sadness", "anger", "fear", "surprise", "neutral")
            2. intensity: A number between -1 and 1 indicating the intensity/severity (-1 being most negative, 1 being most positive)`
        }
      ]
    });

    // Parse the response
    const responseText = completion.content[0].text || '';
    let response;
    try {
      response = JSON.parse(responseText);
    } catch (e) {
      throw new SentimentAnalysisError('Failed to parse AI response');
    }

    // Validate response format
    if (!response || typeof response !== 'object' || !('type' in response) || !('intensity' in response)) {
      throw new SentimentAnalysisError('Invalid response format from AI');
    }

    const { type, intensity } = response;
    
    if (!Object.keys(MoodType).includes(type) || typeof intensity !== 'number') {
      throw new SentimentAnalysisError('Invalid mood type or intensity from AI');
    }

    // Create mood state
    const moodState: MoodState = {
      type: type as MoodType,
      intensity: intensity as number,
      timestamp: new Date().toISOString()
    };

    // Emit via Socket.IO if available
    if (global.io) {
      global.io.emit('chat_message', {
        text,
        mood: moodState
      });
    }

    return moodState;

  } catch (error) {
    // If AI analysis fails, try pattern matching as fallback
    console.error('AI analysis failed, falling back to pattern matching:', error);
    return analyzeSentimentWithPatterns(text);
  }
};

// Backup/fallback method using word patterns
function analyzeSentimentWithPatterns(text: string): MoodState {
  const words = text.toLowerCase().split(/\s+/);
  let maxMatchCount = 0;
  let dominantMood: MoodType = MoodType.NEUTRAL;
  let totalIntensity = 0;

  Object.entries(emotionalPatterns).forEach(([mood, pattern]) => {
    const matchCount = words.filter(word => 
      (pattern as {words: string[], intensity: number}).words.includes(word)
    ).length;

    if (matchCount > maxMatchCount) {
      maxMatchCount = matchCount;
      dominantMood = mood as MoodType;
      totalIntensity = (pattern as {words: string[], intensity: number}).intensity;
    }
  });

  return {
    type: dominantMood,
    intensity: totalIntensity,
    timestamp: new Date().toISOString()
  };
}
