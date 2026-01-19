import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, FolderOpen, Trash2, Edit, Copy, ExternalLink } from 'lucide-react';

interface FileContextMenuProps {
  itemId: string;
  itemName: string;
  isFolder: boolean;
  onOpen?: () => void;
  onOpenNewTab?: () => void;
  onDuplicate?: () => void;
  onRename?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
  children?: React.ReactNode;
}

export function FileContextMenu({
  itemId,
  itemName,
  isFolder,
  onOpen,
  onOpenNewTab,
  onDuplicate,
  onRename,
  onMove,
  onDelete,
  children,
}: FileContextMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children || (
          <button className="p-1 hover:bg-white/10 rounded transition-colors">
            <MoreVertical size={16} className="text-white" />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-[#1A1A1A] border-white/10 text-white min-w-[180px]">
        <DropdownMenuItem
          onClick={onOpen}
          className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
        >
          <FolderOpen size={16} className="mr-2" />
          Open
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onOpenNewTab}
          className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
        >
          <ExternalLink size={16} className="mr-2" />
          Open in a new tab
        </DropdownMenuItem>
        {!isFolder && (
          <DropdownMenuItem
            onClick={onDuplicate}
            className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
          >
            <Copy size={16} className="mr-2" />
            Duplicate
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={onMove}
          className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
        >
          <FolderOpen size={16} className="mr-2" />
          Move
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onRename}
          className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
        >
          <Edit size={16} className="mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onDelete}
          className="cursor-pointer hover:bg-white/10 focus:bg-white/10 text-red-400 focus:text-red-400"
        >
          <Trash2 size={16} className="mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
