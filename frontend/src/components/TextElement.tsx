import React, { useState, useRef, useEffect } from 'react';
import { GripVertical, X, User } from 'lucide-react';
import { useSession } from '@/contexts/SessionContext';

interface TextElementProps {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  userId: string;
  onUpdate: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
}

const TextElement: React.FC<TextElementProps> = ({ id, text, x, y, fontSize, color, userId, onUpdate, onDelete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState({ x, y });
  const elementRef = useRef<HTMLDivElement>(null);
  const { userName } = useSession();
  const currentUserId = localStorage.getItem('userId') || 'anonymous';
  const isOwnText = userId === currentUserId;

  useEffect(() => {
    setPosition({ x, y });
  }, [x, y]);

  const handleMouseDown = (e: React.MouseEvent) => {
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
      const maxX = window.innerWidth - 400;
      const maxY = window.innerHeight - 100;
      
      const constrainedX = Math.max(0, Math.min(newX, maxX));
      const constrainedY = Math.max(0, Math.min(newY, maxY));
      
      setPosition({ x: constrainedX, y: constrainedY });
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        onUpdate(id, position.x, position.y);
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
  }, [isDragging, dragStart, position, id, onUpdate]);

  return (
    <div
      ref={elementRef}
      className="absolute select-none group bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border-2 border-purple-200 p-3"
      style={{
        left: position.x,
        top: position.y,
        maxWidth: '400px',
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.2s',
        cursor: isDragging ? 'grabbing' : 'grab',
        zIndex: isDragging ? 1000 : 10
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-purple-400 flex-shrink-0 mt-1 cursor-grab" />
        <div className="flex-1">
          <p
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: 'sans-serif',
              color: color,
              wordWrap: 'break-word',
              whiteSpace: 'pre-wrap'
            }}
          >
            {text}
          </p>
          <div className="flex items-center gap-1 text-xs text-purple-600 mt-2 pt-2 border-t border-purple-100">
            <User className="w-3 h-3" />
            <span className="truncate">{isOwnText ? userName : 'Team Member'}</span>
          </div>
        </div>
        <button
          className="p-1 hover:bg-red-100 rounded transition-colors flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
        >
          <X className="w-4 h-4 text-red-500" />
        </button>
      </div>
    </div>
  );
};

export default TextElement;