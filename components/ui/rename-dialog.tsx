"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from '@/lib/trpc/provider';
import { toast } from 'sonner';

interface RenameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  itemType: 'workflow' | 'folder';
  onSuccess?: () => void;
}

export function RenameDialog({
  open,
  onOpenChange,
  itemId,
  itemName,
  itemType,
  onSuccess,
}: RenameDialogProps) {
  const [newName, setNewName] = useState(itemName);

  // Reset name when dialog opens with new item
  useEffect(() => {
    if (open) {
      setNewName(itemName);
    }
  }, [open, itemName]);

  // Rename workflow mutation
  const renameWorkflow = trpc.workflow.rename.useMutation({
    onSuccess: () => {
      toast.success('Renamed successfully');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to rename workflow');
    },
  });

  // Rename folder mutation
  const renameFolder = trpc.folder.update.useMutation({
    onSuccess: () => {
      toast.success('Renamed successfully');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to rename folder');
    },
  });

  const handleRename = () => {
    if (!newName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    if (newName === itemName) {
      onOpenChange(false);
      return;
    }

    if (itemType === 'workflow') {
      renameWorkflow.mutate({
        id: itemId,
        name: newName.trim(),
      });
    } else {
      renameFolder.mutate({
        id: itemId,
        name: newName.trim(),
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRename();
    }
  };

  const isLoading = renameWorkflow.isPending || renameFolder.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#2A2A2A] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Rename {itemType === 'workflow' ? 'Workflow' : 'Folder'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">
              {itemType === 'workflow' ? 'Workflow' : 'Folder'} name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter name..."
              autoFocus
              className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#d3e689] transition-colors"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-transparent border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleRename}
              disabled={isLoading || !newName.trim()}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#d3e689] text-black hover:bg-[#d3e689]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Renaming...' : 'Rename'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
