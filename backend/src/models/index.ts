import { Schema, model } from 'mongoose';
import { IUser, ISession, ICanvasElement, IMoodData, IChatMessage } from '../types/models';

// User Model
const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, unique: true, sparse: true },
  createdAt: { type: Date, default: Date.now },
  preferences: {
    defaultTools: [String],
    colorPalette: [String]
  }
});

// Session Model
const sessionSchema = new Schema<ISession>({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  isArchived: { type: Boolean, default: false },
  settings: {
    isPublic: { type: Boolean, default: true },
    allowGuests: { type: Boolean, default: true }
  }
});

// Canvas Element Model
const canvasElementSchema = new Schema<ICanvasElement>({
  sessionId: { type: String, required: true, index: true },
  type: { type: String, required: true, enum: ['stroke', 'text', 'sticky'] },
  content: Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  }
});

// Mood Data Model
const moodDataSchema = new Schema<IMoodData>({
  sessionId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  type: {
    type: String,
    enum: ['positive', 'negative', 'neutral', 'energetic', 'calm', 'chaotic'],
    required: true
  },
  intensity: { type: Number, required: true, min: 0, max: 100 },
  source: {
    type: String,
    enum: ['chat', 'drawing', 'interaction'],
    required: true
  },
  context: {
    messageId: String,
    strokeId: String
  }
});

// Chat Message Model
const chatMessageSchema = new Schema<IChatMessage>({
  sessionId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  replyTo: String,
  reactions: {
    type: Map,
    of: [String]
  }
});

// Create indexes for better query performance
sessionSchema.index({ lastActive: -1 });
moodDataSchema.index({ timestamp: -1 });
chatMessageSchema.index({ timestamp: -1 });
canvasElementSchema.index({ createdAt: -1 });

// Export models
export const User = model<IUser>('User', userSchema);
export const Session = model<ISession>('Session', sessionSchema);
export const CanvasElement = model<ICanvasElement>('CanvasElement', canvasElementSchema);
export const MoodData = model<IMoodData>('MoodData', moodDataSchema);
export const ChatMessage = model<IChatMessage>('ChatMessage', chatMessageSchema);