import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, socket, socketEvents } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Session, ChatMessage } from '@/types/session';
import { CanvasState } from '@/types/canvas';
import { MoodState } from '@/types/mood';
import { MoodEngine } from '@/utils/moodEngine';
import { ThemeManager } from '@/utils/themeManager';

interface SessionContextType {
  currentSession: Session | null;
  sessionId: string | null;
  canvasState: CanvasState;
  chatMessages: ChatMessage[];
  currentMood: MoodState;
  moodEngine: MoodEngine;
  userName: string;
  setUserName: (name: string) => void;
  createSession: (name: string) => string;
  joinSession: (sessionId: string) => void;
  leaveSession: () => void;
  updateCanvas: (state: CanvasState) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMood: (mood: MoodState) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
}

const MAX_HISTORY = 20;

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    strokes: [],
    stickyNotes: [],
    textElements: []
  });
  const [canvasHistory, setCanvasHistory] = useState<CanvasState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMood, setCurrentMood] = useState<MoodState>({
    type: 'neutral',
    intensity: 50,
    timestamp: Date.now()
  });
  const [moodEngine] = useState(() => new MoodEngine());
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('userName') || 'Anonymous';
  });

  // Save username to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('userName', userName);
  }, [userName]);

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('currentSessionId');
    if (savedSessionId) {
      const savedSession = localStorage.getItem(`session_${savedSessionId}`);
      if (savedSession) {
        const session = JSON.parse(savedSession);
        setCurrentSession(session);
        loadSessionData(savedSessionId);
      }
    }
  }, []);

  // Initialize socket connection and listeners
  useEffect(() => {
    try {
      socketEvents.connect();

      const handleIncomingMessage = (data: { user: string; text: string; timestamp: number }) => {
        const newMessage: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          userId: data.user,
          userName: data.user,
          text: data.text,
          timestamp: data.timestamp,
        };
        setChatMessages(prev => [...prev, newMessage]);
      };

      const handleMood = (moodState: MoodState) => {
        setCurrentMood(moodState);
      };

      socket.on('chat_message', handleIncomingMessage);
      socket.on('mood_update', handleMood);

      return () => {
        socket.off('chat_message', handleIncomingMessage);
        socket.off('mood_update', handleMood);
        socketEvents.disconnect();
      };
    } catch (e) {
      // ignore in non-browser environments
    }
  }, []);

  // Save session data when it changes
  useEffect(() => {
    if (currentSession) {
      localStorage.setItem(`session_${currentSession.id}`, JSON.stringify(currentSession));
      localStorage.setItem(`canvas_${currentSession.id}`, JSON.stringify(canvasState));
      localStorage.setItem(`chat_${currentSession.id}`, JSON.stringify(chatMessages));
      localStorage.setItem(`mood_${currentSession.id}`, JSON.stringify(currentMood));
    }
  }, [currentSession, canvasState, chatMessages, currentMood]);

  const loadSessionData = (sessionId: string) => {
    const savedCanvas = localStorage.getItem(`canvas_${sessionId}`);
    const savedChat = localStorage.getItem(`chat_${sessionId}`);
    const savedMood = localStorage.getItem(`mood_${sessionId}`);

    if (savedCanvas) {
      const canvas = JSON.parse(savedCanvas);
      setCanvasState(canvas);
      setCanvasHistory([canvas]);
      setHistoryIndex(0);
    }
    if (savedChat) setChatMessages(JSON.parse(savedChat));
    if (savedMood) setCurrentMood(JSON.parse(savedMood));
  };

  const createSession = (name: string): string => {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const userId = localStorage.getItem('userId') || `user_${Date.now()}`;
    localStorage.setItem('userId', userId);

    const newSession: Session = {
      id: sessionId,
      name,
      creatorId: userId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      participants: [userId]
    };

    setCurrentSession(newSession);
    localStorage.setItem('currentSessionId', sessionId);
    
    // Reset canvas and chat
    const initialCanvas = { strokes: [], stickyNotes: [], textElements: [] };
    setCanvasState(initialCanvas);
    setCanvasHistory([initialCanvas]);
    setHistoryIndex(0);
    setChatMessages([]);
    setCurrentMood({ type: 'neutral', intensity: 50, timestamp: Date.now() });

    return sessionId;
  };

  const joinSession = (sessionId: string) => {
    const savedSession = localStorage.getItem(`session_${sessionId}`);
    if (savedSession) {
      const session = JSON.parse(savedSession);
      setCurrentSession(session);
      localStorage.setItem('currentSessionId', sessionId);
      loadSessionData(sessionId);
    }
  };

  const leaveSession = () => {
    setCurrentSession(null);
    localStorage.removeItem('currentSessionId');
    setCanvasState({ strokes: [], stickyNotes: [], textElements: [] });
    setCanvasHistory([]);
    setHistoryIndex(-1);
    setChatMessages([]);
    setCurrentMood({ type: 'neutral', intensity: 50, timestamp: Date.now() });
  };

  const updateCanvas = (state: CanvasState) => {
    // Add to history
    const newHistory = canvasHistory.slice(0, historyIndex + 1);
    newHistory.push(state);
    
    // Limit history size
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setCanvasHistory(newHistory);
    setCanvasState(state);
    
    if (currentSession) {
      const updatedSession = {
        ...currentSession,
        lastActivity: Date.now()
      };
      setCurrentSession(updatedSession);
    }
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCanvasState(canvasHistory[newIndex]);
    }
  };

  const redo = () => {
    if (historyIndex < canvasHistory.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCanvasState(canvasHistory[newIndex]);
    }
  };

  const addChatMessage = (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, newMessage]);

    // Emit chat message over socket if connected and a session exists
    if (currentSession) {
      try {
        socketEvents.sendMessage(currentSession.id, message.userName || userName, message.text);
      } catch (e) {
        // ignore if socket not available
      }
    }

    // Analyze sentiment if not AI message
    if (!message.isAI && message.text) {
      const sentiment = moodEngine.analyzeSentiment({
        text: message.text,
        type: 'text',
        timestamp: Date.now(),
        userId: message.userId
      });
      
      setCurrentMood(sentiment);

      // Generate AI summary every 10 messages
      if (chatMessages.length > 0 && chatMessages.length % 10 === 0) {
        setTimeout(() => {
          const summary = moodEngine.generateAISummary();
          addChatMessage({
            userId: 'ai',
            userName: 'MoodCanvas AI',
            text: summary,
            isAI: true
          });
        }, 1000);
      }
    }
  };

  const updateMood = (mood: MoodState) => {
    setCurrentMood(mood);
  };

  // Apply CSS variables for the current mood so UI (buttons, backgrounds)
  // that use the design system tokens pick up the mood colors. We intentionally
  // do NOT change the canvas background here so the drawing area remains
  // visually isolated from the mood styling.
  useEffect(() => {
    try {
      const vars = ThemeManager.getCssVars(currentMood.type);
      Object.entries(vars).forEach(([key, value]) => {
        document.documentElement.style.setProperty(key, value);
      });
    } catch (e) {
      // If document isn't available (SSR) or something fails, silently ignore.
      // This keeps the client-side behavior intact.
      console.warn('Failed to apply theme CSS variables', e);
    }
  }, [currentMood.type, currentMood.intensity]);

  return (
    <SessionContext.Provider
      value={{
        currentSession,
        sessionId: currentSession?.id || null,
        canvasState,
        chatMessages,
        currentMood,
        moodEngine,
        userName,
        setUserName,
        createSession,
        joinSession,
        leaveSession,
        updateCanvas,
        addChatMessage,
        updateMood,
        undo,
        redo,
        canUndo: historyIndex > 0,
        canRedo: historyIndex < canvasHistory.length - 1
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};