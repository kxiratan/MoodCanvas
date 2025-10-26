import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSession } from '@/contexts/SessionContext';
import { Send, Bot, Smile, Reply } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { audioManager } from '@/utils/audioManager';
import { api, socketEvents } from '@/services/api';
import { MoodType } from '@/types/mood';

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '🎉', '🤔', '👏', '🔥', '✨', '💯', '🙌'];

const ChatSidebar: React.FC = () => {
  const [message, setMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reactions, setReactions] = useState<Record<string, Record<string, string[]>>>({});
  const { chatMessages, addChatMessage } = useSession();
  const scrollRef = useRef<HTMLDivElement>(null);
  const userId = localStorage.getItem('userId') || 'anonymous';
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Handle typing activity
  const handleTyping = () => {
    audioManager.registerChatActivity(0.3); // Lower intensity for typing
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      // Activity will naturally decay
    }, 1000);
  };

  // Initialize audio manager
  useEffect(() => {
    audioManager.initialize();
    return () => audioManager.cleanup();
  }, []);

  const handleSend = async () => {
    if (!message.trim()) return;

    const { sessionId } = useSession();

    // Add message to chat
    addChatMessage({
      userId,
      userName: 'You',
      text: message,
      replyTo: replyingTo || undefined
    });

    // Analyze sentiment and update mood
    try {
      const { mood, intensity } = await api.analyzeSentiment(message, sessionId);
      
      // Adjust audio based on mood and intensity
      switch(mood) {
        case 'positive':
          audioManager.registerChatActivity(intensity / 100, 'positive');
          break;
        case 'energetic':
          audioManager.registerChatActivity(intensity / 100, 'energetic');
          break;
        case 'negative':
          audioManager.registerChatActivity(intensity / 100, 'negative');
          break;
        case 'calm':
          audioManager.registerChatActivity(intensity / 100, 'calm');
          break;
        default:
          audioManager.registerChatActivity(0.5, 'neutral');
      }
      
      // Emit mood update to other users
      socketEvents.updateMood(sessionId, { type: mood, intensity, timestamp: Date.now() });
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
    }

    setMessage('');
    setReplyingTo(null);
  };

  const handleReaction = (messageId: string, emoji: string) => {
    setReactions(prev => {
      const messageReactions = prev[messageId] || {};
      const emojiUsers = messageReactions[emoji] || [];
      
      let newEmojiUsers;
      if (emojiUsers.includes(userId)) {
        // Remove reaction
        newEmojiUsers = emojiUsers.filter(id => id !== userId);
      } else {
        // Add reaction
        newEmojiUsers = [...emojiUsers, userId];
      }
      
      const newMessageReactions = { ...messageReactions };
      if (newEmojiUsers.length === 0) {
        delete newMessageReactions[emoji];
      } else {
        newMessageReactions[emoji] = newEmojiUsers;
      }
      
      return {
        ...prev,
        [messageId]: newMessageReactions
      };
    });
  };

  const handleMoreEmojis = (messageId: string) => {
    // Prompt user to type an emoji
    const emoji = prompt('Enter an emoji:');
    if (emoji && emoji.trim()) {
      handleReaction(messageId, emoji.trim());
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getReplyMessage = (replyId: string) => {
    return chatMessages.find(m => m.id === replyId);
  };

  return (
    <div className="w-80 bg-white/80 backdrop-blur-md border-l border-purple-200 flex flex-col h-full">
      <div className="p-4 border-b border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        <h3 className="font-semibold text-lg text-purple-900">Team Chat</h3>
        <p className="text-sm text-purple-600">Collaborate and share ideas</p>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {chatMessages.map((msg) => {
            const replyMsg = msg.replyTo ? getReplyMessage(msg.replyTo) : null;
            const messageReactions = reactions[msg.id] || {};
            
            return (
              <div
                key={msg.id}
                className={`${
                  msg.isAI
                    ? 'bg-gradient-to-r from-purple-100 to-pink-100 border-purple-300'
                    : msg.userId === userId
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-purple-200'
                    : 'bg-gray-50 border-gray-200'
                } p-3 rounded-lg border-2 shadow-sm group`}
              >
                {replyMsg && (
                  <div className="mb-2 pl-2 border-l-2 border-purple-400 text-xs text-purple-600">
                    <p className="font-medium">{replyMsg.userName}</p>
                    <p className="truncate">{replyMsg.text}</p>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-1">
                  {msg.isAI && <Bot className="w-4 h-4 text-purple-600" />}
                  <span className="font-medium text-sm text-purple-900">
                    {msg.userName}
                  </span>
                  <span className="text-xs text-purple-500 ml-auto">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-800 mb-2">
                  {msg.deleted ? (
                    <span className="italic text-gray-400">[deleted]</span>
                  ) : (
                    msg.text
                  )}
                  {msg.edited && !msg.deleted && (
                    <span className="text-xs text-purple-400 ml-2">(edited)</span>
                  )}
                </p>

                {/* Reactions */}
                {Object.keys(messageReactions).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {Object.entries(messageReactions).map(([emoji, users]) => (
                      <button
                        key={emoji}
                        onClick={() => handleReaction(msg.id, emoji)}
                        className={`text-xs px-2 py-1 rounded-full border ${
                          users.includes(userId)
                            ? 'bg-purple-100 border-purple-300'
                            : 'bg-white border-gray-200'
                        } hover:bg-purple-50 transition-colors`}
                      >
                        {emoji} {users.length}
                      </button>
                    ))}
                  </div>
                )}

                {/* Action buttons */}
                {!msg.isAI && !msg.deleted && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs hover:bg-purple-100"
                        >
                          <Smile className="w-3 h-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-2 border-2 border-purple-200">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {EMOJI_REACTIONS.map(emoji => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(msg.id, emoji)}
                                className="text-xl hover:scale-125 transition-transform p-1"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <div className="border-t border-purple-200 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMoreEmojis(msg.id)}
                              className="w-full text-xs border-purple-300 hover:bg-purple-50"
                            >
                              More Emojis... 😀
                            </Button>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReplyingTo(msg.id)}
                      className="h-6 px-2 text-xs hover:bg-purple-100"
                    >
                      <Reply className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
        {replyingTo && (
          <div className="mb-2 p-2 bg-purple-100 rounded text-xs flex items-center justify-between">
            <span className="text-purple-700">
              Replying to {getReplyMessage(replyingTo)?.userName}
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-purple-500 hover:text-purple-700"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Type a message..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
          />
          <Button 
            onClick={handleSend} 
            size="sm"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatSidebar;