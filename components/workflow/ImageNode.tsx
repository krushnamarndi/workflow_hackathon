"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MoreHorizontal, Image as ImageIcon, Upload, X, Copy, Edit2, Lock, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useWorkflowStore } from "@/store/workflow.store";
import { HANDLE_TYPES } from "@/lib/workflow-types";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ImageNodeData = {
  images?: string[];
  label?: string;
  locked?: boolean;
};

const ImageNode = memo(({ id, data }: NodeProps) => {
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode);
  const removeNode = useWorkflowStore((state) => state.removeNode);
  const resetNode = useWorkflowStore((state) => state.resetNode);
  const [isUploading, setIsUploading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nodeName, setNodeName] = useState("File");
  const nodeData = data as ImageNodeData;

  const handleDuplicate = useCallback(() => {
    duplicateNode(id);
  }, [id, duplicateNode]);

  const handleRename = useCallback(() => {
    setIsRenaming(true);
  }, []);

  const handleLock = useCallback(() => {
    updateNode(id, { locked: !nodeData?.locked });
  }, [id, nodeData?.locked, updateNode]);

  const handleDeleteNode = useCallback(() => {
    removeNode(id);
  }, [id, removeNode]);

  const handleReset = useCallback(() => {
    resetNode(id);
    toast.success("Node reset successfully");
  }, [id, resetNode]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);
      try {
        const newImages: string[] = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const reader = new FileReader();

          const dataUrl = await new Promise<string>((resolve) => {
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });

          newImages.push(dataUrl);
        }

        const currentImages = nodeData?.images || [];
        updateNode(id, { images: [...currentImages, ...newImages] });
      } catch (error) {
        console.error("Error uploading images:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [id, nodeData?.images, updateNode]
  );

  const removeImage = useCallback(
    (index: number) => {
      const currentImages = nodeData?.images || [];
      const newImages = currentImages.filter((_: any, i: any) => i !== index);
      updateNode(id, { images: newImages });
    },
    [id, nodeData?.images, updateNode]
  );

  const images = nodeData?.images || [];

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
                setNodeName("File");
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
            <DropdownMenuItem onClick={handleDeleteNode} variant="destructive" className="cursor-pointer hover:bg-red-500/10">
              <Trash2 size={14} />
              <span>Delete</span>
              <span className="ml-auto text-xs text-zinc-500">delete / backspace</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Images Display */}
      <div className="space-y-2">
        {images.length > 0 ? (
          images.map((img: string, index: number) => (
            <div
              key={index}
              className="bg-[#1F1F1F] rounded-xl overflow-hidden aspect-square flex items-center justify-center relative group"
            >
              <Image
                src={img}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          ))
        ) : (
          <label
            htmlFor={`image-upload-${id}`}
            className="bg-[#1F1F1F] rounded-xl aspect-square flex flex-col items-center justify-center border border-white/5 border-dashed cursor-pointer hover:border-white/10 hover:bg-[#252525] transition-colors"
          >
            <ImageIcon size={24} className="text-zinc-600 mb-1.5" />
            <span className="text-[10px] text-zinc-500">No images</span>
          </label>
        )}
      </div>

      {/* Upload Button */}
      <label
        htmlFor={`image-upload-${id}`}
        className="mt-2 flex items-center justify-center gap-1.5 text-[10px] text-zinc-500 font-medium cursor-pointer hover:text-zinc-400 transition-colors"
      >
        <Upload size={10} />
        <span>{isUploading ? "Uploading..." : "+ Add more images"}</span>
      </label>
      <input
        id={`image-upload-${id}`}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Output Handle Label */}
      {isHovered && (
        <div className="absolute right-0 translate-x-full pl-3 flex items-center" style={{ top: '50%' }}>
          <span className="text-xs text-[#4ADE80] font-medium whitespace-nowrap">Images</span>
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id={HANDLE_TYPES.IMAGE_OUTPUT}
        className="!w-3 !h-3 !bg-[#4ADE80] !border-[3px] !border-[#1A1A1A] !rounded-full"
        style={{ right: -6 }}
      />
    </div>
  );
});

ImageNode.displayName = "ImageNode";

export default ImageNode;
