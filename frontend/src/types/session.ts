export interface Session {
  id: string;
  name: string;
  creatorId: string;
  createdAt: number;
  lastActivity: number;
  participants: string[];
  archived?: boolean;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  isAI?: boolean;
  edited?: boolean;
  deleted?: boolean;
  replyTo?: string;
  reactions?: Record<string, string[]>;
}