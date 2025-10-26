import { MoodState } from './mood';
import { CanvasElement } from './canvas';

export interface SocketEventData {
  // User events
  join_session: {
    sessionId: string;
    username: string;
  };
  user_joined: {
    username: string;
    users: string[];
  };
  user_left: {
    username: string;
    users: string[];
  };

  // Chat events
  chat_message: {
    sessionId: string;
    username: string;
    text: string;
    timestamp?: number;
  };
  chat_message_received: {
    user: string;
    text: string;
    timestamp: number;
  };

  // Mood events
  mood_update: {
    sessionId: string;
    type: MoodState['type'];
    intensity: number;
    timestamp: number;
  };

  // Canvas events
  canvas_update: {
    sessionId: string;
    elements: CanvasElement[];
  };
}

export interface ServerToClientEvents {
  user_joined: (data: SocketEventData['user_joined']) => void;
  user_left: (data: SocketEventData['user_left']) => void;
  chat_message: (data: SocketEventData['chat_message_received']) => void;
  mood_update: (data: SocketEventData['mood_update']) => void;
  canvas_update: (elements: CanvasElement[]) => void;
}

export interface ClientToServerEvents {
  join_session: (sessionId: string, username: string) => void;
  chat_message: (data: SocketEventData['chat_message']) => void;
  mood_update: (sessionId: string, moodState: Omit<MoodState, 'timestamp'>) => void;
  canvas_update: (data: SocketEventData['canvas_update']) => void;
}