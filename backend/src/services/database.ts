import { Session, MoodData, CanvasElement, ChatMessage } from '../models';
import { MoodType } from '../types/mood';
import { CanvasState } from '../types/canvas';

export class DatabaseService {
  // Session operations
  static async createSession(name: string): Promise<string> {
    const session = await Session.create({ name });
    return session._id.toString();
  }

  static async getSession(sessionId: string) {
    return await Session.findById(sessionId);
  }

  static async updateSessionActivity(sessionId: string) {
    await Session.findByIdAndUpdate(sessionId, {
      lastActive: new Date()
    });
  }

  // Canvas operations
  static async saveCanvasState(sessionId: string, elements: CanvasState['strokes']) {
    await CanvasElement.deleteMany({ sessionId }); // Clear previous state
    
    if (elements.length === 0) return;

    const canvasElements = elements.map(stroke => ({
      sessionId,
      type: 'stroke',
      content: stroke,
      createdAt: new Date(stroke.timestamp),
      createdBy: stroke.userId,
      position: stroke.points[0] // Store first point as reference position
    }));

    await CanvasElement.insertMany(canvasElements);
  }

  static async getCanvasState(sessionId: string) {
    const elements = await CanvasElement.find({ sessionId })
      .sort({ createdAt: 1 });
    
    return {
      strokes: elements
        .filter(el => el.type === 'stroke')
        .map(el => el.content)
    };
  }

  // Mood operations
  static async saveMoodData(sessionId: string, userId: string, type: MoodType, intensity: number, source: 'chat' | 'drawing' | 'interaction', context?: { messageId?: string; strokeId?: string }) {
    await MoodData.create({
      sessionId,
      userId,
      type,
      intensity,
      source,
      context,
      timestamp: new Date()
    });
  }

  static async getSessionMood(sessionId: string) {
    // Get moods from last 5 minutes
    const recentMoods = await MoodData.find({
      sessionId,
      timestamp: { $gte: new Date(Date.now() - 5 * 60 * 1000) }
    }).sort({ timestamp: -1 });

    if (recentMoods.length === 0) {
      return { type: 'neutral' as MoodType, intensity: 50 };
    }

    // Calculate weighted average
    let totalWeight = 0;
    const moodScores: Record<MoodType, number> = {
      positive: 0,
      negative: 0,
      neutral: 0,
      energetic: 0,
      calm: 0,
      chaotic: 0
    };

    recentMoods.forEach(mood => {
      const age = Date.now() - mood.timestamp.getTime();
      const weight = Math.max(0.1, 1 - (age / (5 * 60 * 1000)));
      moodScores[mood.type] += (mood.intensity / 100) * weight;
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

    return {
      type: dominantMood,
      intensity: Math.min(100, (maxScore / totalWeight) * 100)
    };
  }

  // Chat operations
  static async saveChatMessage(sessionId: string, userId: string, content: string, replyTo?: string) {
    return await ChatMessage.create({
      sessionId,
      userId,
      content,
      replyTo,
      timestamp: new Date()
    });
  }

  static async getSessionMessages(sessionId: string, limit = 100) {
    return await ChatMessage.find({ sessionId })
      .sort({ timestamp: -1 })
      .limit(limit);
  }

  static async updateMessageReactions(messageId: string, emoji: string, userId: string) {
    const message = await ChatMessage.findById(messageId);
    if (!message) return;

    const reactions = message.reactions || new Map();
    const users = reactions.get(emoji) || [];

    if (users.includes(userId)) {
      // Remove reaction
      reactions.set(emoji, users.filter(id => id !== userId));
    } else {
      // Add reaction
      reactions.set(emoji, [...users, userId]);
    }

    await message.save();
  }
}