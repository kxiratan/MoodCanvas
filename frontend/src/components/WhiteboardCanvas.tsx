import React, { useRef, useEffect, useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { DrawingStroke } from '@/types/canvas';
import { socketEvents } from '@/services/api';

interface WhiteboardCanvasProps {
  tool: 'pen' | 'eraser' | 'text';
  color: string;
  brushSize: number;
  opacity: number;
  sketchType: 'pen' | 'pencil' | 'marker' | 'highlighter';
  onTextClick?: (x: number, y: number) => void;
  transform: { scale: number; offsetX: number; offsetY: number };
  isPanning: boolean;
  onPanStart: (x: number, y: number) => void;
  onPanMove: (x: number, y: number) => void;
  onPanEnd: () => void;
  screenToCanvas: (x: number, y: number) => { x: number; y: number };
}

const WhiteboardCanvas: React.FC<WhiteboardCanvasProps> = ({ 
  tool, 
  color, 
  brushSize, 
  opacity,
  sketchType,
  onTextClick,
  transform,
  isPanning,
  onPanStart,
  onPanMove,
  onPanEnd,
  screenToCanvas
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [spacePressed, setSpacePressed] = useState(false);
  const { sessionId, username } = useSession();
  const drawingElements = useRef<DrawingStroke[]>([]);

  const drawElements = (elements: DrawingStroke[]) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    // Apply transform
    ctx.save();
    ctx.translate(transform.offsetX, transform.offsetY);
    ctx.scale(transform.scale, transform.scale);

    // Draw all elements
    elements.forEach((element) => {
      drawStroke(ctx, element);
    });

    ctx.restore();

    // Store elements
    drawingElements.current = elements;
  };

  useEffect(() => {
    if (!sessionId || !username) return;

    // Set up socket event listener for canvas updates
    socketEvents.onCanvasUpdate((elements) => {
      if (canvasRef.current) {
        drawElements(elements);
      }
    });

    // Send current canvas state when joining
    if (drawingElements.current.length > 0) {
      socketEvents.updateCanvas(sessionId, drawingElements.current);
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        setSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      socketEvents.cleanup();
    };
  }, []);

  const getStrokeStyle = (type: string, baseWidth: number) => {
    switch (type) {
      case 'pencil':
        return { 
          lineCap: 'round' as CanvasLineCap, 
          lineJoin: 'round' as CanvasLineJoin,
          width: baseWidth * 0.8,
          opacityMultiplier: 0.7
        };
      case 'marker':
        return { 
          lineCap: 'square' as CanvasLineCap, 
          lineJoin: 'miter' as CanvasLineJoin,
          width: baseWidth * 1.5,
          opacityMultiplier: 0.9
        };
      case 'highlighter':
        return { 
          lineCap: 'butt' as CanvasLineCap, 
          lineJoin: 'bevel' as CanvasLineJoin,
          width: baseWidth * 3,
          opacityMultiplier: 0.3
        };
      default: // pen
        return { 
          lineCap: 'round' as CanvasLineCap, 
          lineJoin: 'round' as CanvasLineJoin,
          width: baseWidth,
          opacityMultiplier: 1
        };
    }
  };

  const drawStroke = (ctx: CanvasRenderingContext2D, stroke: DrawingStroke) => {
    if (stroke.points.length < 2) return;

    const style = getStrokeStyle(stroke.sketchType, stroke.width);
    
    ctx.lineCap = style.lineCap;
    ctx.lineJoin = style.lineJoin;
    ctx.lineWidth = style.width;

    // Apply sketch-specific rendering
    switch (stroke.sketchType) {
      case 'pencil':
        // Pencil: grainy, sketchy texture with variable opacity
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = (stroke.opacity / 100) * style.opacityMultiplier;
        
        // Draw multiple thin lines with slight offset for texture
        for (let offset = 0; offset < 3; offset++) {
          ctx.globalAlpha = ((stroke.opacity / 100) * style.opacityMultiplier) * (1 - offset * 0.2);
          ctx.beginPath();
          ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
          
          for (let i = 1; i < stroke.points.length; i++) {
            const jitter = (Math.random() - 0.5) * 0.5;
            ctx.lineTo(stroke.points[i].x + jitter, stroke.points[i].y + jitter);
          }
          ctx.stroke();
        }
        break;

      case 'marker':
        // Marker: bold, saturated, slightly textured edges
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = (stroke.opacity / 100) * style.opacityMultiplier;
        
        // Main stroke
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
        
        // Add slight edge texture
        ctx.globalAlpha = ((stroke.opacity / 100) * style.opacityMultiplier) * 0.3;
        ctx.lineWidth = style.width * 1.1;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
        break;

      case 'highlighter':
        // Highlighter: wide, semi-transparent, soft edges
        ctx.strokeStyle = stroke.color;
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = (stroke.opacity / 100) * style.opacityMultiplier;
        
        // Draw wider base
        ctx.lineWidth = style.width;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
        
        // Add soft glow effect
        ctx.globalAlpha = ((stroke.opacity / 100) * style.opacityMultiplier) * 0.5;
        ctx.lineWidth = style.width * 1.2;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
        
        ctx.globalCompositeOperation = 'source-over';
        break;

      default: // pen
        // Pen: smooth, clean, consistent
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = stroke.opacity / 100;
        
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
        break;
    }
    
    ctx.globalAlpha = 1;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear and apply transform
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.translate(transform.offsetX, transform.offsetY);
    ctx.scale(transform.scale, transform.scale);

    // Draw all strokes with their specific styles
    drawingElements.current.forEach(stroke => {
      drawStroke(ctx, stroke);
    });

    ctx.restore();
  }, [transform]);

  const isPointNearStroke = (point: { x: number; y: number }, stroke: DrawingStroke, threshold: number): boolean => {
    for (let i = 0; i < stroke.points.length - 1; i++) {
      const p1 = stroke.points[i];
      const p2 = stroke.points[i + 1];
      
      const A = point.x - p1.x;
      const B = point.y - p1.y;
      const C = p2.x - p1.x;
      const D = p2.y - p1.y;

      const dot = A * C + B * D;
      const lenSq = C * C + D * D;
      let param = -1;
      
      if (lenSq !== 0) param = dot / lenSq;

      let xx, yy;

      if (param < 0) {
        xx = p1.x;
        yy = p1.y;
      } else if (param > 1) {
        xx = p2.x;
        yy = p2.y;
      } else {
        xx = p1.x + param * C;
        yy = p1.y + param * D;
      }

      const dx = point.x - xx;
      const dy = point.y - yy;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < threshold) {
        return true;
      }
    }
    return false;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Handle panning with space bar or middle mouse
    if (spacePressed || e.button === 1) {
      e.preventDefault();
      onPanStart(e.clientX, e.clientY);
      return;
    }

    const { x, y } = screenToCanvas(screenX, screenY);

    // Handle text tool
    if (tool === 'text' && onTextClick) {
      onTextClick(x, y);
      return;
    }

    setIsDrawing(true);
    setCurrentStroke([{ x, y }]);

    // Handle eraser
    if (tool === 'eraser') {
      const strokesToRemove = drawingElements.current.filter(stroke => 
        isPointNearStroke({ x, y }, stroke, brushSize + 5)
      );
      
      if (strokesToRemove.length > 0) {
        drawingElements.current = drawingElements.current.filter(stroke => 
          !strokesToRemove.includes(stroke)
        );
        if (sessionId) {
          socketEvents.updateCanvas(sessionId, drawingElements.current);
        }
        drawElements(drawingElements.current);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    // Handle panning
    if (spacePressed || isPanning) {
      onPanMove(e.clientX, e.clientY);
      return;
    }

    if (!isDrawing) return;

    const { x, y } = screenToCanvas(screenX, screenY);
    setCurrentStroke(prev => [...prev, { x, y }]);

    // Handle eraser
    if (tool === 'eraser') {
      const strokesToRemove = drawingElements.current.filter(stroke => 
        isPointNearStroke({ x, y }, stroke, brushSize + 5)
      );
      
      if (strokesToRemove.length > 0) {
        drawingElements.current = drawingElements.current.filter(stroke => 
          !strokesToRemove.includes(stroke)
        );
        if (sessionId) {
          socketEvents.updateCanvas(sessionId, drawingElements.current);
        }
        drawElements(drawingElements.current);
      }
      return;
    }

    // Draw current stroke preview with appropriate style
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.translate(transform.offsetX, transform.offsetY);
    ctx.scale(transform.scale, transform.scale);

    const style = getStrokeStyle(sketchType, brushSize);
    ctx.strokeStyle = color;
    ctx.lineWidth = style.width;
    ctx.lineCap = style.lineCap;
    ctx.lineJoin = style.lineJoin;
    ctx.globalAlpha = (opacity / 100) * style.opacityMultiplier;

    if (sketchType === 'highlighter') {
      ctx.globalCompositeOperation = 'multiply';
    }

    if (currentStroke.length > 0) {
      ctx.beginPath();
      ctx.moveTo(currentStroke[currentStroke.length - 1].x, currentStroke[currentStroke.length - 1].y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }

    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  };

  const stopDrawing = () => {
    if (isPanning) {
      onPanEnd();
      return;
    }

    if (!isDrawing || currentStroke.length === 0 || tool === 'eraser') {
      setIsDrawing(false);
      setCurrentStroke([]);
      return;
    }

    const userId = localStorage.getItem('userId') || 'anonymous';
    
    const newStroke: DrawingStroke = {
      id: `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      points: currentStroke,
      color: color,
      width: brushSize,
      opacity: opacity,
      sketchType: sketchType,
      userId: username || 'anonymous',
      timestamp: Date.now()
    };

    // Add stroke to local state
    drawingElements.current = [...drawingElements.current, newStroke];
    drawElements(drawingElements.current);

    // Emit stroke to other users
    if (sessionId) {
      socketEvents.updateCanvas(sessionId, drawingElements.current);
    }

    setIsDrawing(false);
    setCurrentStroke([]);
  };

  const getCursor = () => {
    if (spacePressed || isPanning) return 'grab';
    if (tool === 'eraser') return 'pointer';
    if (tool === 'text') return 'text';
    return 'crosshair';
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ cursor: getCursor() }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onContextMenu={(e) => e.preventDefault()}
    />
  );
};

export default WhiteboardCanvas;