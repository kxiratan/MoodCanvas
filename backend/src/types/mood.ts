export type MoodType = 'positive' | 'negative' | 'neutral' | 'energetic' | 'calm' | 'chaotic';

export interface MoodState {
  type: MoodType;
  intensity: number;
  timestamp: number;
}