import React from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ZoomControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  scale: number;
}

const ZoomControls: React.FC<ZoomControlsProps> = ({ onZoomIn, onZoomOut, onResetZoom, scale }) => {
  return (
    <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-white/90 backdrop-blur-md border-2 border-purple-200 rounded-lg p-2 shadow-lg z-50">
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomIn}
        title="Zoom In (Ctrl + Scroll)"
        className="hover:bg-purple-100 text-purple-700"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      <div className="text-xs text-center text-purple-700 font-medium px-2">
        {Math.round(scale * 100)}%
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onZoomOut}
        title="Zoom Out (Ctrl + Scroll)"
        className="hover:bg-purple-100 text-purple-700"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onResetZoom}
        title="Reset Zoom"
        className="hover:bg-purple-100 text-purple-700"
      >
        <Maximize2 className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ZoomControls;