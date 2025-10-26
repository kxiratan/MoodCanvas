import { MoodType, MoodState } from '../types/mood';
import { Anthropic } from '@anthropic-ai/sdk';
import { SentimentAnalysisError, InvalidInputError } from '../types/errors';
import dotenv from 'dotenv';
import '../types/global';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

export const handleMoodUpdate = async (text: string): Promise<MoodState> => {
  if (!text || typeof text !== 'string') {
    throw new InvalidInputError('Text input is required and must be a string');
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new SentimentAnalysisError('Anthropic API key is not configured', 500);
    }

    const completion = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 150,
      messages: [{
        role: 'user',
        content: `Analyze the emotional sentiment in this text: "${text}"
        Return ONLY a JSON object with two properties:
        1. type: one of "positive", "negative", "energetic", "calm", "chaotic"
        2. intensity: a number from 0-100 indicating the strength of the emotion
        Example: {"type": "positive", "intensity": 75}`
      }]
    });

    const response = JSON.parse(completion.content[0].text);
    return {
      type: response.type as MoodType,
      intensity: response.intensity,
      timestamp: Date.now()
    };

  } catch (error) {
    console.error('Error in sentiment analysis:', error);
    throw new SentimentAnalysisError(
      'Failed to analyze sentiment',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
};
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY // You'll need to add this to your .env file
});

import { SentimentAnalysisError, InvalidInputError } from '../types/errors';

export const handleMoodUpdate = async (text: string): Promise<{ type: MoodType; intensity: number }> => {
  if (!text || typeof text !== 'string') {
    throw new InvalidInputError('Text input is required and must be a string');
  }

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new SentimentAnalysisError('Anthropic API key is not configured', 500);
    }

    const response = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 50,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: `Analyze the sentiment and energy level of this text. Return a JSON object with two fields:
          - mood: one of [positive, negative, neutral, energetic, calm, chaotic]
          - intensity: a number from 0-100 indicating the strength of the emotion
          
          Text: "${text}"
          
          Response format:
          {"mood": "type", "intensity": number}`
        }
      ]
    });

    // Parse the response
    if (response.content[0]?.type === 'text') {
      try {
        const json = JSON.parse(response.content[0].text.trim());
        if (json.mood && json.intensity) {
          return {
            type: json.mood as MoodType,
            intensity: Math.min(100, Math.max(0, json.intensity))
          };
        }
      } catch (e) {
        console.error('Error parsing AI response:', e);
      }
    }
    
    // Fallback to basic sentiment analysis
    const words = text.toLowerCase().split(/\s+/);
    let score = 0;
    
    const positiveWords = new Set(['great', 'good', 'awesome', 'excellent', 'amazing', 'love', 'happy']);
    const negativeWords = new Set(['bad', 'terrible', 'awful', 'hate', 'sad', 'angry', 'frustrated']);
    const energeticWords = new Set(['excited', 'energetic', 'fast', 'quick', 'rush', 'go']);
    const calmWords = new Set(['calm', 'peaceful', 'quiet', 'steady', 'gentle', 'slow']);
    
    words.forEach(word => {
      if (positiveWords.has(word)) score += 1;
      if (negativeWords.has(word)) score -= 1;
    });
    
    const hasEnergetic = words.some(word => energeticWords.has(word));
    const hasCalm = words.some(word => calmWords.has(word));
    const exclamations = text.split('!').length - 1;
    const caps = text.split('').filter(c => c === c.toUpperCase()).length / text.length;
    
    if (hasEnergetic || exclamations > 2 || caps > 0.5) {
      return { type: 'energetic', intensity: 75 };
    } else if (hasCalm) {
      return { type: 'calm', intensity: 65 };
    } else if (score > 0) {
      return { type: 'positive', intensity: Math.min(100, 50 + score * 10) };
    } else if (score < 0) {
      return { type: 'negative', intensity: Math.min(100, 50 + Math.abs(score) * 10) };
    }
    
    return { type: 'neutral', intensity: 50 };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return { type: 'neutral', intensity: 50 };
  }
};

// Message counter and timestamp tracking for AI responses and spam prevention
const messageTracker = {
  count: 0,
  lastMessage: Date.now(),
  lastAIResponse: Date.now()
};

// AI response templates based on mood
const aiResponses: Record<MoodType, string[]> = {
  positive: [
    "That's the spirit! Keep that positive energy flowing! 🌟",
    "Love seeing such positivity in the team! 💫",
    "Your enthusiasm is contagious! 🌈"
  ],
  negative: [
    "Let's take a deep breath and work through this together. 🫂",
    "I understand your frustration. How can we help? 🤝",
    "Perhaps we could approach this from a different angle? 🤔"
  ],
  energetic: [
    "The energy in this room is amazing! Keep it going! ⚡",
    "You're on fire today! 🔥",
    "Love this dynamic energy! 💫"
  ],
  calm: [
    "What a peaceful atmosphere we have here. 🌊",
    "This calm energy is perfect for focusing. ✨",
    "Maintaining this peaceful vibe. 🌸"
  ],
  chaotic: [
    "Let's take a moment to center ourselves. 🎯",
    "One step at a time, we'll figure this out. 🌟",
    "Deep breaths everyone - we've got this! 🌈"
  ],
  neutral: [
    "I'm here to help if needed! 💫",
    "How's everyone doing today? 🌟",
    "Don't hesitate to reach out if you need anything! ✨"
  ]
};

export async function handleMoodUpdate(text: string): Promise<MoodState> {
  // Spam prevention: Check time since last message
  const now = Date.now();
  const timeSinceLastMessage = now - messageTracker.lastMessage;
  if (timeSinceLastMessage < 500) { // 500ms minimum between messages
    return {
      type: 'neutral',
      intensity: 50,
      timestamp: now
    };
  }
  messageTracker.lastMessage = now;
  messageTracker.count++;

  // Initialize mood scores
  const scores: Record<MoodType, number> = {
    positive: 0,
    negative: 0,
    energetic: 0,
    calm: 0,
    chaotic: 0,
    neutral: 0
  };

  // Enhanced text preprocessing
  const cleanText = text.trim();
  const isUpperCase = text === text.toUpperCase() && text.length >= 2;
  const hasExclamation = text.includes('!');
  const hasQuestion = text.includes('?');
  const hasMultipleMarks = /[!?]{2,}/.test(text);
  
  // Detect tone modifiers
  const isAggressive = isUpperCase || hasMultipleMarks;
  const isQuestioning = hasQuestion && !hasExclamation;
  const isEmphatic = hasExclamation && !hasQuestion;
  
  // Process each mood type with enhanced pattern matching
  Object.entries(emotionalPatterns).forEach(([mood, { words }]) => {
    const matches = (text.match(words) || []).length;
    
    // Base score from matches with context awareness
    scores[mood as MoodType] = matches;
    
    // Contextual scoring adjustments
    if (mood === 'negative' && isAggressive) {
      scores[mood as MoodType] *= 1.5; // 50% boost for aggressive tone
    }
    if (mood === 'chaotic' && isQuestioning) {
      scores[mood as MoodType] *= 1.2; // 20% boost for questioning tone
    }
    if (mood === 'positive' && isEmphatic) {
      scores[mood as MoodType] *= 1.2; // 20% boost for emphatic positive
    }
  });

  // Smart mood detection
  let dominantMood: MoodType = 'neutral';
  let maxScore = -1;

  // Priority-based mood selection with contextual weights
  const moodPriority: [MoodType, number][] = [
    ['negative', 1.5],   // Higher weight for negative emotions
    ['chaotic', 1.3],    // Increased chaos detection
    ['positive', 1.2],   // Slightly boost positive recognition
    ['energetic', 1.1],
    ['calm', 1.0],
    ['neutral', 0.5]
  ];

  // Apply contextual mood detection
  moodPriority.forEach(([mood, weight]) => {
    const contextualScore = scores[mood] * weight;
    if (contextualScore > maxScore) {
      dominantMood = mood;
      maxScore = contextualScore;
    }
  });

  // Quick triggers for immediate mood changes
  if (isAggressive && cleanText.length <= 10) { // Short aggressive messages
    dominantMood = 'negative';
    maxScore = 2; // Ensure it takes precedence
  }

  // Dynamic intensity calculation
  const baseIntensity = dominantMood === 'neutral' ? 50 : 70;
  const toneIntensity = (isAggressive ? 25 : 0) + 
                       (isEmphatic ? 15 : 0) + 
                       (hasMultipleMarks ? 10 : 0);
  const intensity = Math.min(100, baseIntensity + toneIntensity);

  // AI response generation with rate limiting
  const timeSinceLastAI = now - messageTracker.lastAIResponse;
  if (messageTracker.count % 15 === 0 && timeSinceLastAI > 30000) { // 30s minimum between AI responses
    const responses = aiResponses[dominantMood];
    const response = responses[Math.floor(Math.random() * responses.length)];
    messageTracker.lastAIResponse = now;
    
    setTimeout(() => {
      if (global.io) {
        global.io.emit('chat_message', {
          text: response,
          username: 'MoodCanvas AI',
          timestamp: now,
          isAI: true
        });
      }
    }, 1000);
  }

  return {
    type: dominantMood,
    intensity,
    timestamp: Date.now()
  };
}