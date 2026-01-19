"use client";

import { memo, useCallback, useState } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MoreHorizontal, X, Copy, Edit2, Lock, Trash2, RotateCcw, Image as ImageIcon } from "lucide-react";
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

export type UploadImageNodeData = {
  imageUrl?: string;
  imagePreview?: string;
  fileName?: string;
  uploadStatus?: "idle" | "uploading" | "success" | "error";
  label?: string;
  locked?: boolean;
  isExecuting?: boolean;
};

const UploadImageNode = memo(({ id, data }: NodeProps) => {
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode);
  const removeNode = useWorkflowStore((state) => state.removeNode);
  const resetNode = useWorkflowStore((state) => state.resetNode);
  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nodeName, setNodeName] = useState("Upload Image");
  const [imageError, setImageError] = useState(false);
  const nodeData = data as UploadImageNodeData;

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

  const handleRemoveImage = useCallback(() => {
    updateNode(id, {
      imageUrl: undefined,
      imagePreview: undefined,
      fileName: undefined,
      uploadStatus: "idle",
    });
    setImageError(false);
  }, [id, updateNode]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const transloaditKey = process.env.NEXT_PUBLIC_TRANSLOADIT_KEY;
      
      if (!transloaditKey) {
        toast.error("Transloadit key is not configured");
        return;
      }

      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type. Please upload JPG, PNG, WEBP, or GIF");
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      updateNode(id, { uploadStatus: "uploading" });

      try {
        // Create a FormData object for Transloadit
        const formData = new FormData();
        
        // Transloadit assembly parameters - simplified without S3 storage
        const params = {
          auth: { key: transloaditKey },
          steps: {
            ":original": {
              robot: "/upload/handle",
            },
            resize: {
              use: ":original",
              robot: "/image/resize",
              width: 2048,
              height: 2048,
              resize_strategy: "fit",
              imagemagick_stack: "v3.0.1",
            },
          },
        };

        formData.append("params", JSON.stringify(params));
        formData.append("file", file);

        // Upload to Transloadit
        const response = await fetch("https://api2.transloadit.com/assemblies", {
          method: "POST",
          body: formData,
        });

        // Check if response is ok first
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Transloadit HTTP error:", response.status, errorText);
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Transloadit initial response:", result);

        if (result.error) {
          console.error("Transloadit API error:", result);
          throw new Error(result.message || result.error || "Upload processing failed");
        }

        // Poll for assembly completion
        const assemblyUrl = result.assembly_url;
        console.log("Assembly URL:", assemblyUrl);
        let assemblyStatus = result;
        let attempts = 0;
        const maxAttempts = 30; // 30 seconds max

        // Wait for assembly to complete
        while (
          assemblyStatus.ok !== "ASSEMBLY_COMPLETED" && 
          assemblyStatus.ok !== "REQUEST_ABORTED" &&
          attempts < maxAttempts
        ) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          attempts++;
          
          const statusResponse = await fetch(assemblyUrl);
          assemblyStatus = await statusResponse.json();

          console.log(`Assembly status (attempt ${attempts}):`, assemblyStatus.ok);

          if (assemblyStatus.error) {
            throw new Error(assemblyStatus.message || "Upload processing failed");
          }

          // Break if completed
          if (assemblyStatus.ok === "ASSEMBLY_COMPLETED") {
            console.log("Assembly completed! Results:", assemblyStatus.results);
            break;
          }
        }

        // Get the CDN URL from the results (Transloadit temporary storage)
        const resizeResults = assemblyStatus.results?.resize;
        const originalResults = assemblyStatus.results?.[":original"];
        
        if (resizeResults && resizeResults.length > 0) {
          const uploadedFile = resizeResults[0];
          const cdnUrl = uploadedFile.ssl_url || uploadedFile.url;

          console.log("Upload successful! CDN URL:", cdnUrl);

          updateNode(id, {
            imageUrl: cdnUrl,
            imagePreview: cdnUrl,
            fileName: file.name,
            uploadStatus: "success",
          });

          setImageError(false);
          toast.success("Image uploaded successfully!");
        } else if (originalResults && originalResults.length > 0) {
          // Fallback to original if resize failed
          const uploadedFile = originalResults[0];
          const cdnUrl = uploadedFile.ssl_url || uploadedFile.url;

          console.log("Upload successful! CDN URL (original):", cdnUrl);

          updateNode(id, {
            imageUrl: cdnUrl,
            imagePreview: cdnUrl,
            fileName: file.name,
            uploadStatus: "success",
          });

          setImageError(false);
          toast.success("Image uploaded successfully!");
        } else {
          console.error("Assembly status:", assemblyStatus);
          console.error("Results:", JSON.stringify(assemblyStatus.results, null, 2));
          throw new Error("No image URL returned from Transloadit. Check assembly results.");
        }
      } catch (error) {
        console.error("Upload error:", error);
        updateNode(id, { uploadStatus: "error" });
        toast.error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }

      // Reset the input
      e.target.value = "";
    },
    [id, updateNode]
  );

  const isUploading = nodeData?.uploadStatus === "uploading";
  const hasImage = !!nodeData?.imageUrl;

  return (
    <>
      <div
        className="bg-[#2A2A2A] border border-white/8 rounded-2xl p-3 w-60 shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative"
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
                  setNodeName("Upload Image");
                }
              }}
              autoFocus
              className="text-[10px] font-medium text-zinc-300 bg-transparent border-b border-white/20 outline-none uppercase tracking-wide"
            />
          ) : (
            <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide">
              {nodeName}
            </span>
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
              <DropdownMenuItem
                onClick={handleDelete}
                variant="destructive"
                className="cursor-pointer hover:bg-red-500/10"
              >
                <Trash2 size={14} />
                <span>Delete</span>
                <span className="ml-auto text-xs text-zinc-500">delete / backspace</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Image Preview or Upload Area */}
        <div className="space-y-2">
          {hasImage ? (
            <div className="bg-[#1F1F1F] rounded-xl overflow-hidden aspect-square flex items-center justify-center relative group">
              {!imageError ? (
                <Image
                  src={nodeData.imagePreview || nodeData.imageUrl || ""}
                  alt={nodeData.fileName || "Uploaded image"}
                  fill
                  className="object-cover"
                  onError={() => {
                    console.error("Image failed to load:", nodeData.imagePreview || nodeData.imageUrl);
                    setImageError(true);
                  }}
                  unoptimized={true}
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-4 text-center">
                  <ImageIcon size={32} className="text-zinc-600 mb-2" />
                  <span className="text-[10px] text-zinc-500">Preview unavailable</span>
                  <span className="text-[9px] text-zinc-600 mt-1">Image uploaded successfully</span>
                </div>
              )}
              <button
                onClick={handleRemoveImage}
                className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
              >
                <X size={12} className="text-white" />
              </button>
            </div>
          ) : (
            <label
              htmlFor={`upload-image-${id}`}
              className="bg-[#1F1F1F] rounded-xl aspect-square w-full flex flex-col items-center justify-center border border-white/5 border-dashed cursor-pointer hover:border-white/10 hover:bg-[#252525] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <span className="text-[10px] text-zinc-500">Uploading...</span>
                </>
              ) : (
                <>
                  <ImageIcon size={24} className="text-zinc-600 mb-1.5" />
                  <span className="text-[10px] text-zinc-500">Click to upload</span>
                  <span className="text-[9px] text-zinc-600 mt-1">JPG, PNG, WEBP, GIF</span>
                </>
              )}
            </label>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          id={`upload-image-${id}`}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.gif"
          onChange={handleFileChange}
          disabled={isUploading || nodeData?.locked}
          className="hidden"
        />

        {/* Upload Status */}
        {nodeData?.fileName && (
          <div className="mt-2 text-[9px] text-zinc-600 truncate">{nodeData.fileName}</div>
        )}

        {/* Output Handle Label */}
        {isHovered && hasImage && (
          <div className="absolute right-0 translate-x-full pl-3 flex items-center" style={{ top: "50%" }}>
            <span className="text-xs text-[#4ADE80] font-medium whitespace-nowrap">Image URL</span>
          </div>
        )}

        {/* Output Handle - Only show when image is uploaded */}
        {hasImage && (
          <Handle
            type="source"
            position={Position.Right}
            id={HANDLE_TYPES.IMAGE_OUTPUT}
            className="w-3! h-3! bg-[#4ADE80]! border-[3px]! border-[#1A1A1A]! rounded-full!"
            style={{ right: -6 }}
          />
        )}
      </div>
    </>
  );
});

UploadImageNode.displayName = "UploadImageNode";

export default UploadImageNode;
