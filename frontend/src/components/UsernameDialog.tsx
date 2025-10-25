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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User } from 'lucide-react';

interface UsernameDialogProps {
  open: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}

const UsernameDialog: React.FC<UsernameDialogProps> = ({ open, onSubmit, onCancel }) => {
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim());
      setName('');
    }
  };

  const handleCancel = () => {
    setName('');
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50">
        <DialogHeader>
          <DialogTitle className="text-purple-900 flex items-center gap-2">
            <User className="w-5 h-5 text-purple-600" />
            Welcome to MoodCanvas!
          </DialogTitle>
          <DialogDescription className="text-purple-600">
            Please enter your name to join the session
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="username-input" className="text-purple-900">Your Name</Label>
            <Input
              id="username-input"
              placeholder="Enter your name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button 
            variant="outline"
            onClick={handleCancel}
            className="border-purple-300 hover:bg-purple-50 text-purple-700"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!name.trim()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            Join Session ✨
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UsernameDialog;