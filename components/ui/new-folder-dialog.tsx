import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from 'lucide-react';

interface NewFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateFolder: (name: string) => void;
  isCreating?: boolean;
}

export function NewFolderDialog({
  open,
  onOpenChange,
  onCreateFolder,
  isCreating = false,
}: NewFolderDialogProps) {
  const [folderName, setFolderName] = useState('');

  const handleCreate = () => {
    if (folderName.trim()) {
      onCreateFolder(folderName.trim());
      setFolderName('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && folderName.trim()) {
      handleCreate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1A1A1A] border-white/10 text-white max-w-md">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
        </button>
        <DialogHeader>
          <DialogTitle className="text-white text-lg">Create folder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <label htmlFor="folder-name" className="text-sm text-zinc-400 mb-2 block">
              Name
            </label>
            <Input
              id="folder-name"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="node"
              className="bg-[#0A0A0A] border-white/10 text-white placeholder:text-zinc-600 focus:border-white/20"
              autoFocus
              disabled={isCreating}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="ghost"
              onClick={() => {
                onOpenChange(false);
                setFolderName('');
              }}
              disabled={isCreating}
              className="text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!folderName.trim() || isCreating}
              className="bg-[#E9FF97] text-black hover:opacity-90 font-semibold"
            >
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
