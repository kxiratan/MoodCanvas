import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { MoodType } from '../types/mood';

dotenv.config();

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY // You'll need to add this to your .env file
});

export const handleMoodUpdate = async (text: string): Promise<{ type: MoodType; intensity: number }> => {
  try {
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