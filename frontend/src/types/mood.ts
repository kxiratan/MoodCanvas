export type MoodType = 'positive' | 'negative' | 'neutral' | 'energetic' | 'calm' | 'chaotic';

export interface MoodState {
  type: MoodType;
  intensity: number; // 0-100
  timestamp: number;
}

export interface SentimentInput {
  text: string;
  type: 'text' | 'drawing' | 'emoji';
  timestamp: number;
  userId: string;
}

export interface ThemeConfig {
  background: string;
  gradient: string;
  animation: string;
}

export interface AudioConfig {
  type: 'upbeat' | 'calm' | 'focus' | 'ambient' | 'energetic';
  frequency: number;
  volume: number;
}