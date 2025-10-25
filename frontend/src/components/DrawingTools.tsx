import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Pen, Eraser, Type, StickyNote, Download, Trash2, Volume2, VolumeX, Undo, Redo, Palette, ChevronDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HexColorPicker } from 'react-colorful';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface DrawingToolsProps {
  tool: 'pen' | 'eraser' | 'text' | 'sticky';
  setTool: (tool: 'pen' | 'eraser' | 'text' | 'sticky') => void;
  color: string;
  setColor: (color: string) => void;
  brushSize: number;
  setBrushSize: (size: number) => void;
  opacity: number;
  setOpacity: (opacity: number) => void;
  sketchType: 'pen' | 'pencil' | 'marker' | 'highlighter';
  setSketchType: (type: 'pen' | 'pencil' | 'marker' | 'highlighter') => void;
  onClear: () => void;
  onExport: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const DrawingTools: React.FC<DrawingToolsProps> = ({
  tool,
  setTool,
  color,
  setColor,
  brushSize,
  setBrushSize,
  opacity,
  setOpacity,
  sketchType,
  setSketchType,
  onClear,
  onExport,
  isMuted,
  onToggleMute,
  volume,
  onVolumeChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo
}) => {
  const [colorPickerOpen, setColorPickerOpen] = useState(false);

  const presetColors = ['#000000', '#EF4444', '#3B82F6'];

  const sketchTypeLabels = {
    pen: 'Pen',
    pencil: 'Pencil',
    marker: 'Marker',
    highlighter: 'Highlighter'
  };

  return (
    <div className="bg-white/80 backdrop-blur-md border-b border-purple-200 shadow-sm px-4 py-2">
      <div className="flex items-center justify-between max-w-7xl mx-auto gap-4">
        {/* Left: Drawing Tools */}
        <div className="flex items-center gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={tool === 'pen' ? 'default' : 'ghost'}
                size="sm"
                className={tool === 'pen' ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : 'hover:bg-purple-100 text-purple-700'}
              >
                <Pen className="w-4 h-4 mr-1" />
                {sketchTypeLabels[sketchType]}
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="border-2 border-purple-200">
              <DropdownMenuItem onClick={() => { setTool('pen'); setSketchType('pen'); }}>
                <Pen className="w-4 h-4 mr-2" />
                Pen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setTool('pen'); setSketchType('pencil'); }}>
                <Pen className="w-4 h-4 mr-2" />
                Pencil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setTool('pen'); setSketchType('marker'); }}>
                <Pen className="w-4 h-4 mr-2" />
                Marker
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setTool('pen'); setSketchType('highlighter'); }}>
                <Pen className="w-4 h-4 mr-2" />
                Highlighter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant={tool === 'eraser' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setTool('eraser')}
            title="Eraser"
            className={tool === 'eraser' ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : 'hover:bg-purple-100 text-purple-700'}
          >
            <Eraser className="w-4 h-4" />
          </Button>
          <Button
            variant={tool === 'text' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setTool('text')}
            title="Text"
            className={tool === 'text' ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : 'hover:bg-purple-100 text-purple-700'}
          >
            <Type className="w-4 h-4" />
          </Button>
          <Button
            variant={tool === 'sticky' ? 'default' : 'ghost'}
            size="icon"
            onClick={() => setTool('sticky')}
            title="Add Sticky Note"
            className={tool === 'sticky' ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' : 'hover:bg-purple-100 text-purple-700'}
          >
            <StickyNote className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8 bg-purple-200" />

        {/* Center: Color & Size */}
        <div className="flex items-center gap-3">
          {/* Color Picker */}
          <div className="flex items-center gap-2">
            {/* Preset Colors */}
            <div className="flex items-center gap-1">
              {presetColors.map((c) => (
                <button
                  key={c}
                  className={`w-6 h-6 rounded-full border-2 ${
                    color === c ? 'border-purple-600 scale-110 ring-2 ring-purple-300' : 'border-purple-200'
                  } transition-all hover:scale-110`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>

            {/* Color Wheel Picker */}
            <Popover open={colorPickerOpen} onOpenChange={setColorPickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="border-2 border-purple-300 hover:bg-purple-50"
                  title="More colors"
                >
                  <Palette className="w-4 h-4 text-purple-700" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3 border-2 border-purple-200 bg-white/95 backdrop-blur-sm">
                <div className="space-y-3">
                  <HexColorPicker color={color} onChange={setColor} />
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded border-2 border-purple-300"
                      style={{ backgroundColor: color }}
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="flex-1 px-2 py-1 text-sm border border-purple-200 rounded focus:outline-none focus:border-purple-400"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <Separator orientation="vertical" className="h-8 bg-purple-200" />

          {/* Brush Size */}
          <div className="flex items-center gap-2 w-32">
            <span className="text-xs text-purple-700 font-medium w-8">Size</span>
            <Slider
              value={[brushSize]}
              onValueChange={(value) => setBrushSize(value[0])}
              min={1}
              max={20}
              step={1}
              className="flex-1 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-purple-500 [&_[role=slider]]:to-pink-500"
            />
            <span className="text-xs w-6 text-purple-700 font-medium">{brushSize}</span>
          </div>

          <Separator orientation="vertical" className="h-8 bg-purple-200" />

          {/* Opacity */}
          <div className="flex items-center gap-2 w-32">
            <span className="text-xs text-purple-700 font-medium w-12">Opacity</span>
            <Slider
              value={[opacity]}
              onValueChange={(value) => setOpacity(value[0])}
              min={10}
              max={100}
              step={5}
              className="flex-1 [&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-purple-500 [&_[role=slider]]:to-pink-500"
            />
            <span className="text-xs w-8 text-purple-700 font-medium">{opacity}%</span>
          </div>
        </div>

        <Separator orientation="vertical" className="h-8 bg-purple-200" />

        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo"
            className="hover:bg-purple-100 text-purple-700 disabled:opacity-30"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo"
            className="hover:bg-purple-100 text-purple-700 disabled:opacity-30"
          >
            <Redo className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-8 bg-purple-200" />

        {/* Right: Audio & Actions */}
        <div className="flex items-center gap-2">
          {/* Audio Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="hover:bg-purple-100 text-purple-700"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <div className="w-20">
              <Slider
                value={[volume * 100]}
                onValueChange={(value) => onVolumeChange(value[0] / 100)}
                min={0}
                max={100}
                step={1}
                disabled={isMuted}
                className="[&_[role=slider]]:bg-gradient-to-r [&_[role=slider]]:from-purple-500 [&_[role=slider]]:to-pink-500"
              />
            </div>
          </div>

          <Separator orientation="vertical" className="h-8 bg-purple-200" />

          {/* Actions */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onExport}
            title="Export Canvas"
            className="hover:bg-purple-100 text-purple-700"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            title="Clear Canvas"
            className="hover:bg-red-100 text-red-500"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DrawingTools;