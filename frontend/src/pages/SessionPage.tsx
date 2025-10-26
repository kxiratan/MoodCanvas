import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '@/contexts/SessionContext';
import { audioManager } from '@/utils/audioManager';
import { useCanvasTransform } from '@/hooks/useCanvasTransform';
import WhiteboardCanvas from '@/components/WhiteboardCanvas';
import DrawingTools from '@/components/DrawingTools';
import ChatSidebar from '@/components/ChatSidebar';
import StickyNoteComponent from '@/components/StickyNoteComponent';
import TextInputDialog from '@/components/TextInputDialog';
import TextElement from '@/components/TextElement';
import ZoomControls from '@/components/ZoomControls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Copy, Check, Edit2, User } from 'lucide-react';
import { StickyNote, TextElement as TextElementType } from '@/types/canvas';
import { showSuccess } from '@/utils/toast';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const SessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { 
    currentSession, 
    currentMood, 
    canvasState, 
    updateCanvas, 
    leaveSession,
    undo,
    redo,
    canUndo,
    canRedo,
    userName,
    setUserName
  } = useSession();
  
  const [tool, setTool] = useState<'pen' | 'eraser' | 'text' | 'sticky'>('pen');
  const [color, setColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(3);
  const [opacity, setOpacity] = useState(100);
  const [sketchType, setSketchType] = useState<'pen' | 'pencil' | 'marker' | 'highlighter'>('pen');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.3);

  // Initialize audio manager
  useEffect(() => {
    audioManager.initialize();
    return () => audioManager.cleanup();
  }, []);
  const [copied, setCopied] = useState(false);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [textPosition, setTextPosition] = useState({ x: 0, y: 0 });
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState(userName);

  const {
    transform,
    zoomIn,
    zoomOut,
    resetZoom,
    handleWheel,
    startPan,
    updatePan,
    endPan,
    isPanning,
    screenToCanvas,
    canvasToScreen
  } = useCanvasTransform();

  useEffect(() => {
    audioManager.initialize();
    
    const canvasElement = document.querySelector('canvas');
    if (canvasElement) {
      canvasElement.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      audioManager.cleanup();
      if (canvasElement) {
        canvasElement.removeEventListener('wheel', handleWheel);
      }
    };
  }, [handleWheel]);

  useEffect(() => {
    if (!isMuted) {
      audioManager.setMood(currentMood.type);
    }
  }, [currentMood, isMuted]);

  const handleClear = () => {
    if (confirm('Are you sure you want to clear the entire canvas?')) {
      updateCanvas({
        strokes: [],
        stickyNotes: [],
        textElements: []
      });
    }
  };

  const handleExport = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      canvasState.strokes.forEach(stroke => {
        if (stroke.points.length < 2) return;
        
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalAlpha = stroke.opacity / 100;
        
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
      
      canvasState.textElements.forEach(textEl => {
        ctx.fillStyle = textEl.color;
        ctx.font = `${textEl.fontSize}px sans-serif`;
        ctx.fillText(textEl.text, textEl.x, textEl.y);
      });
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `moodcanvas-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
          showSuccess('Canvas exported successfully!');
        }
      });
    }
  };

  const handleToggleMute = () => {
    const newMuted = audioManager.toggleMute();
    setIsMuted(newMuted);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    audioManager.setVolume(newVolume);
  };

  const handleAddSticky = () => {
    const userId = localStorage.getItem('userId') || 'anonymous';
    const newSticky: StickyNote = {
      id: `sticky_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: '',
      x: Math.random() * 500 + 100,
      y: Math.random() * 300 + 100,
      color: '#FFF59D',
      userId,
      timestamp: Date.now()
    };
    
    updateCanvas({
      ...canvasState,
      stickyNotes: [...canvasState.stickyNotes, newSticky]
    });
  };

  const handleUpdateSticky = (id: string, text: string, x: number, y: number) => {
    updateCanvas({
      ...canvasState,
      stickyNotes: canvasState.stickyNotes.map(note =>
        note.id === id ? { ...note, text, x, y } : note
      )
    });
  };

  const handleDeleteSticky = (id: string) => {
    updateCanvas({
      ...canvasState,
      stickyNotes: canvasState.stickyNotes.filter(note => note.id !== id)
    });
  };

  const handleTextClick = (x: number, y: number) => {
    setTextPosition({ x, y });
    setTextDialogOpen(true);
  };

  const handleTextSubmit = (text: string, color: string) => {
    const userId = localStorage.getItem('userId') || 'anonymous';
    const newTextElement: TextElementType = {
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      x: textPosition.x,
      y: textPosition.y,
      fontSize: 16,
      color,
      userId,
      timestamp: Date.now()
    };
    
    updateCanvas({
      ...canvasState,
      textElements: [...canvasState.textElements, newTextElement]
    });
  };

  const handleUpdateText = (id: string, x: number, y: number) => {
    updateCanvas({
      ...canvasState,
      textElements: canvasState.textElements.map(text =>
        text.id === id ? { ...text, x, y } : text
      )
    });
  };

  const handleDeleteText = (id: string) => {
    updateCanvas({
      ...canvasState,
      textElements: canvasState.textElements.filter(text => text.id !== id)
    });
  };

  const handleCopySessionId = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId);
      setCopied(true);
      showSuccess('Session ID copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLeave = () => {
    if (confirm('Are you sure you want to leave this session?')) {
      leaveSession();
      navigate('/');
    }
  };

  const handleSaveName = () => {
    if (tempName.trim()) {
      setUserName(tempName.trim());
      setEditingName(false);
      showSuccess('Name updated!');
    }
  };

  useEffect(() => {
    if (tool === 'sticky') {
      handleAddSticky();
      setTool('pen');
    }
  }, [tool]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="bg-white/80 backdrop-blur-md border-b border-purple-200 shadow-sm px-4 py-2">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLeave}
              className="hover:bg-purple-100 text-purple-700"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Leave
            </Button>
            <div className="h-6 w-px bg-purple-200" />
            <div>
              <h2 className="font-semibold text-sm text-purple-900">{currentSession?.name}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Username Editor */}
            <Popover open={editingName} onOpenChange={setEditingName}>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs hover:bg-purple-100 text-purple-700 flex items-center gap-1"
                >
                  <User className="w-3 h-3" />
                  {userName}
                  <Edit2 className="w-3 h-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 border-2 border-purple-200">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm text-purple-900">Edit Your Name</h4>
                  <Input
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                    placeholder="Enter your name"
                    className="border-purple-200 focus:border-purple-400"
                  />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTempName(userName);
                        setEditingName(false);
                      }}
                      className="flex-1 border-purple-300 hover:bg-purple-50"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveName}
                      disabled={!tempName.trim()}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <div className="text-xs bg-gradient-to-r from-purple-100 to-pink-100 px-4 py-1.5 rounded-full border border-purple-200">
              <span className="font-medium text-purple-700">Mood: </span>
              <span className="capitalize text-purple-900">{currentMood.type}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopySessionId}
              className="text-xs hover:bg-purple-100 text-purple-700"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3 mr-1" />
                  Share
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <DrawingTools
        tool={tool}
        setTool={setTool}
        color={color}
        setColor={setColor}
        brushSize={brushSize}
        setBrushSize={setBrushSize}
        opacity={opacity}
        setOpacity={setOpacity}
        sketchType={sketchType}
        setSketchType={setSketchType}
        onClear={handleClear}
        onExport={handleExport}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        onUndo={undo}
        onRedo={redo}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      <div className="flex-1 flex overflow-hidden">
  <div className={`flex-1 relative transition-all duration-1000`}>
          <WhiteboardCanvas
            tool={tool}
            color={color}
            brushSize={brushSize}
            opacity={opacity}
            sketchType={sketchType}
            onTextClick={handleTextClick}
            transform={transform}
            isPanning={isPanning}
            onPanStart={startPan}
            onPanMove={updatePan}
            onPanEnd={endPan}
            screenToCanvas={screenToCanvas}
          />
          
          {canvasState.stickyNotes.map(note => {
            const screenPos = canvasToScreen(note.x, note.y);
            return (
              <StickyNoteComponent
                key={note.id}
                {...note}
                x={screenPos.x}
                y={screenPos.y}
                onUpdate={(id, text, x, y) => {
                  const canvasPos = screenToCanvas(x, y);
                  handleUpdateSticky(id, text, canvasPos.x, canvasPos.y);
                }}
                onDelete={handleDeleteSticky}
              />
            );
          })}

          {canvasState.textElements.map(textEl => {
            const screenPos = canvasToScreen(textEl.x, textEl.y);
            return (
              <TextElement
                key={textEl.id}
                {...textEl}
                x={screenPos.x}
                y={screenPos.y}
                onUpdate={(id, x, y) => {
                  const canvasPos = screenToCanvas(x, y);
                  handleUpdateText(id, canvasPos.x, canvasPos.y);
                }}
                onDelete={handleDeleteText}
              />
            );
          })}

          <ZoomControls
            onZoomIn={zoomIn}
            onZoomOut={zoomOut}
            onResetZoom={resetZoom}
            scale={transform.scale}
          />
        </div>

        <ChatSidebar />
      </div>

      <TextInputDialog
        open={textDialogOpen}
        onClose={() => setTextDialogOpen(false)}
        onSubmit={handleTextSubmit}
      />
    </div>
  );
};

export default SessionPage;