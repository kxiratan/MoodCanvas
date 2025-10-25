export interface DrawingStroke {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  opacity: number;
  sketchType: 'pen' | 'pencil' | 'marker' | 'highlighter';
  userId: string;
  timestamp: number;
}

export interface StickyNote {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  userId: string;
  timestamp: number;
}

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  userId: string;
  timestamp: number;
}

export interface CanvasState {
  strokes: DrawingStroke[];
  stickyNotes: StickyNote[];
  textElements: TextElement[];
}