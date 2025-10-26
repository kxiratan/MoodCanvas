import { Document } from 'mongoose';
import { MoodType } from './mood';

export interface IUser extends Document {
  username: string;
  email?: string;
  createdAt: Date;
  preferences: {
    defaultTools: string[];
    colorPalette: string[];
  };
}

export interface ISession extends Document {
  name: string;
  createdAt: Date;
  lastActive: Date;
  isArchived: boolean;
  settings: {
    isPublic: boolean;
    allowGuests: boolean;
  };
}

export interface ICanvasElement extends Document {
  sessionId: string;
  type: 'stroke' | 'text' | 'sticky';
  content: any;
  createdAt: Date;
  createdBy: string;
  position: {
    x: number;
    y: number;
  };
}

export interface IMoodData extends Document {
  sessionId: string;
  userId: string;
  timestamp: Date;
  type: MoodType;
  intensity: number;
  source: 'chat' | 'drawing' | 'interaction';
  context?: {
    messageId?: string;
    strokeId?: string;
  };
}

export interface IChatMessage extends Document {
  sessionId: string;
  userId: string;
  content: string;
  timestamp: Date;
  replyTo?: string;
  reactions: {
    [emoji: string]: string[]; // Array of userIds
  };
}