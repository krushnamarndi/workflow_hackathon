"use client";

import React, { useState } from 'react';
import { X, Folder, FolderOpen, Users } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trpc } from '@/lib/trpc/provider';
import { toast } from 'sonner';

interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  itemName: string;
  itemType: 'workflow' | 'folder';
  currentFolderId: string | null;
  currentFolderName?: string;
  onSuccess?: () => void;
}

export function MoveDialog({
  open,
  onOpenChange,
  itemId,
  itemName,
  itemType,
  currentFolderId,
  currentFolderName,
  onSuccess,
}: MoveDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Fetch all folders for the user
  const { data: folders } = trpc.folder.listAll.useQuery(undefined, {
    enabled: open,
  });

  // Move workflow mutation
  const moveWorkflow = trpc.workflow.move.useMutation({
    onSuccess: () => {
      toast.success('Moved successfully');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to move item');
    },
  });

  // Move folder mutation
  const moveFolder = trpc.folder.move.useMutation({
    onSuccess: () => {
      toast.success('Moved successfully');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to move folder');
    },
  });

  const handleMove = () => {
    if (itemType === 'workflow') {
      moveWorkflow.mutate({
        id: itemId,
        folderId: selectedFolderId,
      });
    } else {
      moveFolder.mutate({
        id: itemId,
        parentId: selectedFolderId,
      });
    }
  };

  const isLoading = moveWorkflow.isPending || moveFolder.isPending;
  const canMove = selectedFolderId !== currentFolderId;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#2A2A2A] border-white/10 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Move "{itemName}"
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Location */}
          <div>
            <p className="text-sm text-zinc-400 mb-2">
              Current location: <span className="text-white">{currentFolderName || 'Dashboard'}</span>
            </p>
          </div>

          {/* Folder List */}
          <div className="space-y-2">
            {/* Dashboard (root) option */}
            <button
              onClick={() => setSelectedFolderId(null)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                selectedFolderId === null
                  ? 'bg-[#d3e689]/20 border border-[#d3e689]/50'
                  : 'bg-[#1A1A1A] hover:bg-[#222222] border border-transparent'
              }`}
            >
              <FolderOpen size={20} className="text-[#d3e689]" />
              <span className="text-sm">Dashboard</span>
            </button>

            {/* My Files section */}
            {folders && folders.length > 0 && (
              <div>
                <div className="flex items-center gap-2 px-4 py-2 text-xs text-zinc-500 font-medium">
                  <Folder size={16} />
                  My Files
                </div>
                {folders.map((folder) => (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    disabled={folder.id === itemId} // Can't move folder into itself
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      selectedFolderId === folder.id
                        ? 'bg-[#d3e689]/20 border border-[#d3e689]/50'
                        : 'bg-[#1A1A1A] hover:bg-[#222222] border border-transparent'
                    }`}
                  >
                    <Folder size={20} className="text-zinc-400" />
                    <span className="text-sm">{folder.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <button
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-transparent border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleMove}
              disabled={isLoading || !canMove}
              className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-[#d3e689] text-black hover:bg-[#d3e689]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Moving...' : 'Move'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
