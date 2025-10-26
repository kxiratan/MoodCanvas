import React, { useState, useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { X, GripVertical, User } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';
import { ThemeManager } from '@/utils/themeManager';
import { MoodType } from '@/types/mood';
import { MoodEngine } from '@/utils/moodEngine';

interface StickyNoteComponentProps {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  userId: string;
  onUpdate: (id: string, text: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
}

const StickyNoteComponent: React.FC<StickyNoteComponentProps> = ({
  id,
  text,
  x,
  y,
  color,
  userId,
  onUpdate,
  onDelete
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x, y });
  const [currentText, setCurrentText] = useState(text);
  const [noteMood, setNoteMood] = useState<MoodType>('neutral');
  const [moodColor, setMoodColor] = useState(color);
  const cardRef = useRef<HTMLDivElement>(null);
  const { userName } = useSession();
  const currentUserId = localStorage.getItem('userId') || 'anonymous';
  const isOwnNote = userId === currentUserId;
  const moodEngine = React.useMemo(() => new MoodEngine(), []);

  // Analyze text for mood whenever it changes
  useEffect(() => {
    if (currentText.trim()) {
      const mood = moodEngine.analyzeSentiment({
        text: currentText,
        type: 'text',
        timestamp: Date.now(),
        userId: currentUserId
      });
      setNoteMood(mood.type);
      // Use the ThemeManager to get colors and apply them
      const newColor = ThemeManager.moodColors[mood.type]?.main || ThemeManager.moodColors.neutral.main;
      setMoodColor(newColor);
      
      // Only update the parent if the text has changed
      if (text !== currentText) {
        onUpdate(id, currentText, position.x, position.y);
      }
    } else {
      setNoteMood('neutral');
      setMoodColor(ThemeManager.moodColors.neutral.main);
      setMoodColor(ThemeManager['moodColors'].neutral.main);
    }
  }, [currentText, currentUserId, id, moodEngine, onUpdate, position.x, position.y, text]);

  useEffect(() => {
    setPosition({ x, y });
  }, [x, y]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if clicking on the card itself or grip icon, not textarea
    if ((e.target as HTMLElement).tagName === 'TEXTAREA') return;
    
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      e.preventDefault();
      
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Constrain to viewport
      const maxX = window.innerWidth - 200;
      const maxY = window.innerHeight - 200;
      
      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));
      
      setPosition({ x: constrainedX, y: constrainedY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onUpdate(id, currentText, position.x, position.y);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, position, id, currentText, onUpdate]);

  const handleTextChange = (newText: string) => {
    setCurrentText(newText);
    onUpdate(id, newText, position.x, position.y);
  };

  return (
    <Card
      ref={cardRef}
      className="absolute w-48 shadow-lg select-none"
      style={{
        left: position.x,
        top: position.y,
        backgroundColor: moodColor || ThemeManager.moodColors.neutral.main,
        transform: isDragging ? 'scale(1.05) rotate(2deg)' : 'scale(1) rotate(0deg)',
        transition: isDragging ? 'none' : 'transform 0.2s',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 1000 : 10
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header with drag handle and delete */}
      <div className="flex items-center justify-between p-2 border-b border-black/10">
        <GripVertical className="w-4 h-4 text-gray-600 cursor-grab" />
        <button
          className="p-1 hover:bg-black/10 rounded transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      
      {/* Text area */}
      <div className="p-3 h-36">
        <Textarea
          value={currentText}
          onChange={(e) => handleTextChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          className="w-full h-full resize-none border-none bg-transparent focus:ring-0 text-sm p-0"
          placeholder="Type here..."
          style={{ cursor: 'text' }}
        />
      </div>

      {/* Username footer */}
      <div className="px-3 pb-2 flex items-center gap-1 text-xs text-gray-600 border-t border-black/10 pt-2">
        <User className="w-3 h-3" />
        <span className="truncate">{isOwnNote ? userName : 'Team Member'}</span>
      </div>
    </Card>
  );
};

export default StickyNoteComponent;