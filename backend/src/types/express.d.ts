import { MoodState } from './mood';

declare global {
  var sessionMoods: {
    [sessionId: string]: MoodState[];
  };
}

declare module 'express-serve-static-core' {
  interface Request {
    session?: {
      id: string;
      username?: string;
    };
    body: any;
  }

  interface Response {
    json(body: any): this;
    status(code: number): this;
  }
}