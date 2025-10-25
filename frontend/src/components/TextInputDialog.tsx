import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface TextInputDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string, color: string) => void;
}

const TextInputDialog: React.FC<TextInputDialogProps> = ({ open, onClose, onSubmit }) => {
  const [text, setText] = useState('');
  const [color, setColor] = useState('#000000');

  const textColors = [
    { name: 'Black', value: '#000000' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Orange', value: '#F97316' }
  ];

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text, color);
      setText('');
      setColor('#000000');
      onClose();
    }
  };

  const handleCancel = () => {
    setText('');
    setColor('#000000');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50">
        <DialogHeader>
          <DialogTitle className="text-purple-900">Add Text to Canvas</DialogTitle>
          <DialogDescription className="text-purple-600">
            Type your text below and choose a color.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="text-input" className="text-purple-900">Text</Label>
            <Textarea
              id="text-input"
              placeholder="Enter your text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSubmit();
                }
              }}
              className="min-h-[100px] border-purple-200 focus:border-purple-400 focus:ring-purple-400"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label className="text-purple-900">Text Color</Label>
            <div className="flex gap-2 flex-wrap">
              {textColors.map((c) => (
                <button
                  key={c.value}
                  className={`w-8 h-8 rounded-full border-2 ${
                    color === c.value ? 'border-purple-600 scale-110 ring-2 ring-purple-300' : 'border-purple-200'
                  } transition-all hover:scale-110`}
                  style={{ backgroundColor: c.value }}
                  onClick={() => setColor(c.value)}
                  title={c.name}
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-purple-500">
            Tip: Press Ctrl+Enter to quickly add text
          </p>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleCancel}
            className="border-purple-300 hover:bg-purple-50 text-purple-700"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!text.trim()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Add Text ✨
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TextInputDialog;