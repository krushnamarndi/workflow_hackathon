"use client";

import { memo, useState, useCallback } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MoreHorizontal, Copy, Edit2, Lock, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useWorkflowStore } from "@/store/workflow.store";
import { HANDLE_TYPES } from "@/lib/workflow-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type TextNodeData = {
  value?: string;
  label?: string;
  locked?: boolean;
};

const TextNode = memo(({ id, data }: NodeProps) => {
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode);
  const removeNode = useWorkflowStore((state) => state.removeNode);
  const resetNode = useWorkflowStore((state) => state.resetNode);
  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nodeName, setNodeName] = useState("Prompt");
  const nodeData = data as TextNodeData;

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateNode(id, { value: e.target.value });
  };

  const handleDuplicate = useCallback(() => {
    duplicateNode(id);
  }, [id, duplicateNode]);

  const handleRename = useCallback(() => {
    setIsRenaming(true);
  }, []);

  const handleLock = useCallback(() => {
    updateNode(id, { locked: !nodeData?.locked });
  }, [id, nodeData?.locked, updateNode]);

  const handleDelete = useCallback(() => {
    removeNode(id);
  }, [id, removeNode]);

  const handleReset = useCallback(() => {
    resetNode(id);
    toast.success("Node reset successfully");
  }, [id, resetNode]);

  return (
    <div 
      className="bg-[#2A2A2A] border border-white/8 rounded-2xl p-3 w-[240px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        {isRenaming ? (
          <input
            type="text"
            value={nodeName}
            onChange={(e) => setNodeName(e.target.value)}
            onBlur={() => setIsRenaming(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter") setIsRenaming(false);
              if (e.key === "Escape") {
                setIsRenaming(false);
                setNodeName("Prompt");
              }
            }}
            autoFocus
            className="text-[10px] font-medium text-zinc-300 bg-transparent border-b border-white/20 outline-none uppercase tracking-wide"
          />
        ) : (
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">{nodeName}</span>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-zinc-600 hover:text-zinc-400 transition-colors">
              <MoreHorizontal size={12} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#2A2A2A] border border-white/10 text-zinc-200">
            <DropdownMenuItem onClick={handleDuplicate} className="cursor-pointer hover:bg-white/5">
              <Copy size={14} />
              <span>Duplicate</span>
              <span className="ml-auto text-xs text-zinc-500">ctrl+d</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleRename} className="cursor-pointer hover:bg-white/5">
              <Edit2 size={14} />
              <span>Rename</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLock} className="cursor-pointer hover:bg-white/5">
              <Lock size={14} />
              <span>{nodeData?.locked ? "Unlock" : "Lock"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleReset} className="cursor-pointer hover:bg-white/5">
              <RotateCcw size={14} />
              <span>Reset</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/10" />
            <DropdownMenuItem onClick={handleDelete} variant="destructive" className="cursor-pointer hover:bg-red-500/10">
              <Trash2 size={14} />
              <span>Delete</span>
              <span className="ml-auto text-xs text-zinc-500">delete / backspace</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Text Area */}
      <textarea
        value={nodeData?.value || ""}
        onChange={handleTextChange}
        placeholder="Enter your prompt..."
        className="w-full bg-[#1F1F1F] border-0 rounded-lg p-2.5 text-[11px] leading-relaxed text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-white/10 resize-none min-h-[120px]"
      />

      {/* Input Handle Label */}
      {isHovered && (
        <div className="absolute left-0 -translate-x-full pr-3 flex items-center" style={{ top: '30%' }}>
          <span className="text-xs text-[#A78BFA] font-medium whitespace-nowrap">Text</span>
        </div>
      )}

      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        id={HANDLE_TYPES.TEXT_INPUT}
        className="!w-3 !h-3 !bg-[#A78BFA] !border-[3px] !border-[#1A1A1A] !rounded-full"
        style={{ left: -6, top: '30%' }}
      />

      {/* Output Handle Label */}
      {isHovered && (
        <div className="absolute right-0 translate-x-full pl-3 flex items-center" style={{ top: '70%' }}>
          <span className="text-xs text-[#A78BFA] font-medium whitespace-nowrap">Text</span>
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id={HANDLE_TYPES.TEXT_OUTPUT}
        className="!w-3 !h-3 !bg-[#A78BFA] !border-[3px] !border-[#1A1A1A] !rounded-full"
        style={{ right: -6, top: '70%' }}
      />
    </div>
  );
});

TextNode.displayName = "TextNode";

export default TextNode;
