import { Server, Socket } from 'socket.io';
import { handleMoodUpdate } from './services/sentiment';
import { ClientToServerEvents, ServerToClientEvents, SocketEventData } from './types/socket';

interface SessionData {
  users: Set<string>;
  messages: Array<SocketEventData['chat_message_received']>;
}

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

const sessions: Map<string, SessionData> = new Map();

export const setupSocketHandlers = (io: Server<ClientToServerEvents, ServerToClientEvents>) => {
  io.on('connection', (socket: TypedSocket) => {
    let currentSession: string | null = null;

    // Join session
    socket.on('join_session', (sessionId: string, username: string) => {
      // Create session if it doesn't exist
      if (!sessions.has(sessionId)) {
        sessions.set(sessionId, {
          users: new Set(),
          messages: []
        });
      }

      currentSession = sessionId;
      const session = sessions.get(sessionId)!;
      session.users.add(username);

      socket.join(sessionId);
      io.to(sessionId).emit('user_joined', {
        username,
        users: Array.from(session.users)
      });
    });

    // Handle chat message
    socket.on('chat_message', async (data: { sessionId: string; username: string; text: string }) => {
      const session = sessions.get(data.sessionId);
      if (!session) return;

      const message = {
        user: data.username,
        text: data.text,
        timestamp: Date.now()
      };

      session.messages.push(message);

      // Analyze sentiment and update mood
      const mood = await handleMoodUpdate(data.text);
      const timestamp = Date.now();
      
      io.to(data.sessionId).emit('chat_message', message);
      io.to(data.sessionId).emit('mood_update', {
        ...mood,
        sessionId: data.sessionId,
        timestamp
      });
    });

    // Handle canvas update
    socket.on('canvas_update', (data: { sessionId: string; elements: any[] }) => {
      socket.to(data.sessionId).emit('canvas_update', data.elements);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (currentSession) {
        const session = sessions.get(currentSession);
        if (session?.users) {
          // Remove user from session
          session.users.delete(socket.data.username);
          if (session.users.size === 0) {
            sessions.delete(currentSession);
          } else {
            io.to(currentSession).emit('user_left', {
              username: socket.data.username,
              users: Array.from(session.users)
            });
          }
        }
      }
    });
  });
};