import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Folder, Plus } from 'lucide-react';

interface MyFilesDropdownProps {
  onNewFile: () => void;
  onNewFolder: () => void;
  children: React.ReactNode;
}

export function MyFilesDropdown({
  onNewFile,
  onNewFolder,
  children,
}: MyFilesDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {children}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="bg-[#1A1A1A] border-white/10 text-white min-w-[180px]"
        align="start"
        side="bottom"
      >
        <DropdownMenuItem
          onClick={onNewFile}
          className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
        >
          <FileText size={16} className="mr-2" />
          New File
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={onNewFolder}
          className="cursor-pointer hover:bg-white/10 focus:bg-white/10"
        >
          <Folder size={16} className="mr-2" />
          New Folder
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
