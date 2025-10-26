import io from 'socket.io-client';
import { MoodType } from '@/types/mood';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Socket.io client instance
export const socket = io(API_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

export const api = {
  // Session management
  async createSession() {
    const response = await fetch(`${API_URL}/api/session/create`, {
      method: 'POST',
    });
    return response.json();
  },

  async joinSession(sessionId: string, username: string) {
    const response = await fetch(`${API_URL}/api/session/${sessionId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username }),
    });
    return response.json();
  },

  async getSession(sessionId: string) {
    const response = await fetch(`${API_URL}/api/session/${sessionId}`);
    return response.json();
  },

  // Sentiment Analysis
  async analyzeSentiment(text: string, sessionId: string): Promise<{ mood: MoodType; intensity: number; timestamp: number }> {
    const response = await fetch(`${API_URL}/api/sentiment/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, sessionId }),
    });
    return response.json();
  },

  async getCurrentMood(sessionId: string): Promise<{ type: MoodType; intensity: number; timestamp: number }> {
    const response = await fetch(`${API_URL}/api/sentiment/${sessionId}/mood`);
    return response.json();
  },
};

// Socket event handlers
export const socketEvents = {
  connect: () => {
    socket.connect();
  },

  disconnect: () => {
    socket.disconnect();
  },

  joinSession: (sessionId: string, username: string) => {
    socket.emit('join_session', sessionId, username);
  },

  onUserJoined: (callback: (data: { username: string; users: string[] }) => void) => {
    socket.on('user_joined', callback);
  },

  onUserLeft: (callback: (data: { username: string; users: string[] }) => void) => {
    socket.on('user_left', callback);
  },

  sendMessage: (sessionId: string, username: string, text: string) => {
    socket.emit('chat_message', { sessionId, username, text });
  },

  onMessage: (callback: (data: { user: string; text: string; timestamp: number }) => void) => {
    socket.on('chat_message', callback);
  },

  updateMood: (sessionId: string, moodState: { type: MoodType; intensity: number; timestamp: number }) => {
    socket.emit('mood_update', { sessionId, ...moodState });
  },

  onMoodUpdate: (callback: (moodState: { type: MoodType; intensity: number; timestamp: number }) => void) => {
    socket.on('mood_update', callback);
  },

  updateCanvas: (sessionId: string, elements: any[]) => {
    socket.emit('canvas_update', { sessionId, elements });
  },

  onCanvasUpdate: (callback: (elements: any[]) => void) => {
    socket.on('canvas_update', callback);
  },

  // Clean up event listeners
  cleanup: () => {
    socket.off('user_joined');
    socket.off('user_left');
    socket.off('chat_message');
    socket.off('mood_update');
    socket.off('canvas_update');
    socket.disconnect();
  }
};