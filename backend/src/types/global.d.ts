import { MoodState } from './mood';

declare namespace NodeJS {
  interface Global {
    sessionMoods: { [sessionId: string]: MoodState[] };
  }
}

export {};