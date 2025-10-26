export interface Point {
  x: number;
  y: number;
}

export interface StrokeStyle {
  color: string;
  width: number;
  opacity: number;
}

export interface CanvasElement {
  id: string;
  type: 'stroke' | 'text' | 'image';
  points: Point[];
  style: StrokeStyle;
  timestamp: number;
  userId: string;
}

export interface CanvasState {
  elements: CanvasElement[];
  undoStack: CanvasElement[][];
  redoStack: CanvasElement[][];
}