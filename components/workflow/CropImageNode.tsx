"use client";

import { memo, useCallback, useState, useEffect } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MoreHorizontal, Copy, Edit2, Lock, Trash2, RotateCcw, Crop, Play } from "lucide-react";
import { toast } from "sonner";
import { useWorkflowStore } from "@/store/workflow.store";
import { HANDLE_TYPES } from "@/lib/workflow-types";
import Image from "next/image";
import { trpc } from "@/lib/trpc/provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type CropImageNodeData = {
  imageUrl?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  croppedImageUrl?: string;
  isExecuting?: boolean;
  output?: string;
  error?: string;
  label?: string;
  locked?: boolean;
};

const CropImageNode = memo(({ id, data }: NodeProps) => {
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode);
  const removeNode = useWorkflowStore((state) => state.removeNode);
  const resetNode = useWorkflowStore((state) => state.resetNode);
  const edges = useWorkflowStore((state) => state.edges);
  const nodes = useWorkflowStore((state) => state.nodes);
  const workflowId = useWorkflowStore((state) => state.workflowId);
  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nodeName, setNodeName] = useState("Crop Image");
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const nodeData = data as CropImageNodeData;

  const createExecution = trpc.execution.create.useMutation();
  const updateExecution = trpc.execution.update.useMutation();
  const utils = trpc.useUtils();

  // Check if image input is connected
  const imageInputConnected = edges.some(
    (edge) => edge.target === id && edge.targetHandle === HANDLE_TYPES.IMAGE_INPUT
  );

  // Auto-populate imageUrl from connected source nodes
  useEffect(() => {
    const incomingEdges = edges.filter(
      (edge) => edge.target === id && edge.targetHandle === HANDLE_TYPES.IMAGE_INPUT
    );

    if (incomingEdges.length > 0) {
      const sourceEdge = incomingEdges[0]; // Take first connection
      const sourceNode = nodes.find((n) => n.id === sourceEdge.source);
      
      if (sourceNode) {
        // Get image URL from source node (could be from uploadImageNode.imageUrl or imageNode.url)
        const sourceImageUrl = sourceNode.data.imageUrl || sourceNode.data.url || sourceNode.data.output;
        
        if (sourceImageUrl && sourceImageUrl !== nodeData?.imageUrl) {
          updateNode(id, { imageUrl: sourceImageUrl });
        }
      }
    }
  }, [edges, nodes, id, nodeData?.imageUrl, updateNode]);

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

  const executeCrop = trpc.cropImage.execute.useMutation({
    onSuccess: async (result) => {
      updateNode(id, { 
        croppedImageUrl: result.croppedImageUrl, 
        output: result.croppedImageUrl,
        isExecuting: false, 
        error: undefined 
      });
      
      // Update execution record
      if (currentExecutionId) {
        await updateExecution.mutateAsync({
          id: currentExecutionId,
          status: "completed",
          output: { croppedImageUrl: result.croppedImageUrl },
        });
        setCurrentExecutionId(null);
        
        // Refetch executions to update task manager
        if (workflowId && workflowId !== "new") {
          utils.execution.list.invalidate({ workflowId });
        }
      }
      
      // Propagate output to connected nodes
      const connectedOutputEdges = edges.filter((edge) => edge.source === id);
      
      connectedOutputEdges.forEach((edge) => {
        const targetNode = nodes.find(n => n.id === edge.target);
        if (!targetNode) return;
        
        // Update based on node type
        if (targetNode.type === 'imageNode') {
          useWorkflowStore.getState().updateNode(edge.target, { url: result.croppedImageUrl });
        } else if (targetNode.type === 'cropImageNode') {
          useWorkflowStore.getState().updateNode(edge.target, { imageUrl: result.croppedImageUrl });
        }
      });
      
      toast.success("Image cropped successfully!");
    },
    onError: async (error) => {
      updateNode(id, { error: error.message, isExecuting: false });
      
      // Update execution record with error
      if (currentExecutionId) {
        await updateExecution.mutateAsync({
          id: currentExecutionId,
          status: "failed",
          error: error.message,
        });
        setCurrentExecutionId(null);
        
        // Refetch executions to update task manager
        if (workflowId && workflowId !== "new") {
          utils.execution.list.invalidate({ workflowId });
        }
      }
      
      toast.error(`Crop failed: ${error.message}`);
    },
  });

  const handleExecute = async () => {
    if (!nodeData?.imageUrl) {
      toast.error("Please provide an image URL");
      return;
    }

    if (nodeData.x === undefined || nodeData.y === undefined || 
        nodeData.width === undefined || nodeData.height === undefined) {
      toast.error("Please set all crop parameters (X, Y, Width, Height)");
      return;
    }

    try {
      updateNode(id, { isExecuting: true, error: undefined });
      
      // Create execution record
      if (workflowId && workflowId !== "new") {
        const execution = await createExecution.mutateAsync({
          workflowId,
          nodeId: id,
          status: "running",
          input: {
            imageUrl: nodeData.imageUrl,
            x: nodeData.x,
            y: nodeData.y,
            width: nodeData.width,
            height: nodeData.height,
          },
        });
        setCurrentExecutionId(execution.id);
      }

      // Execute crop task via tRPC
      executeCrop.mutate({
        imageUrl: nodeData.imageUrl,
        x: nodeData.x,
        y: nodeData.y,
        width: nodeData.width,
        height: nodeData.height,
      });
    } catch (error) {
      console.error("Error executing crop:", error);
      updateNode(id, { isExecuting: false });
    }
  };

  // Propagate existing output when new connections are made - ONLY if image has been cropped
  useEffect(() => {
    // Don't propagate if no cropped image exists yet
    if (!nodeData?.croppedImageUrl) return;
    
    const connectedOutputEdges = edges.filter((edge) => edge.source === id && edge.sourceHandle === HANDLE_TYPES.IMAGE_OUTPUT);
    
    connectedOutputEdges.forEach((edge) => {
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!targetNode) return;
      
      // Update based on node type - ONLY propagate croppedImageUrl, never the input imageUrl
      if (targetNode.type === 'imageNode') {
        useWorkflowStore.getState().updateNode(edge.target, { url: nodeData.croppedImageUrl });
      } else if (targetNode.type === 'cropImageNode') {
        useWorkflowStore.getState().updateNode(edge.target, { imageUrl: nodeData.croppedImageUrl });
      }
    });
  }, [edges, id, nodeData?.croppedImageUrl, nodes]);

  const handleXChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || !isNaN(Number(value))) {
      updateNode(id, { x: value === '' ? '' : Number(value) });
    }
  };

  const handleXBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(100, Number(e.target.value) || 0));
    updateNode(id, { x: value });
  };

  const handleYChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || !isNaN(Number(value))) {
      updateNode(id, { y: value === '' ? '' : Number(value) });
    }
  };

  const handleYBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = Math.max(0, Math.min(100, Number(e.target.value) || 0));
    updateNode(id, { y: value });
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || !isNaN(Number(value))) {
      updateNode(id, { width: value === '' ? '' : Number(value) });
    }
  };

  const handleWidthBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(100, Number(e.target.value) || 1));
    updateNode(id, { width: value });
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || !isNaN(Number(value))) {
      updateNode(id, { height: value === '' ? '' : Number(value) });
    }
  };

  const handleHeightBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = Math.max(1, Math.min(100, Number(e.target.value) || 1));
    updateNode(id, { height: value });
  };

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateNode(id, { imageUrl: e.target.value });
  };

  const hasCroppedImage = !!nodeData?.croppedImageUrl;

  return (
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
                setNodeName("Crop Image");
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

      {/* Image URL Input - Only show if not connected */}
      {!imageInputConnected && (
        <div className="mb-2">
          <label className="text-[9px] text-zinc-500 uppercase tracking-wide mb-1 block">
            Image URL
          </label>
          <input
            type="text"
            value={nodeData?.imageUrl || ""}
            onChange={handleImageUrlChange}
            disabled={nodeData?.locked || nodeData?.isExecuting}
            placeholder="Enter image URL..."
            className="w-full bg-[#1F1F1F] border border-white/5 rounded-lg px-2 py-1.5 text-[11px] text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-white/10 disabled:opacity-50"
          />
        </div>
      )}

      {/* Crop Coordinates */}
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] text-zinc-500 uppercase tracking-wide mb-1 block">
              X (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={nodeData?.x ?? 0}
              onChange={handleXChange}
              onBlur={handleXBlur}
              disabled={nodeData?.locked || nodeData?.isExecuting}
              className="w-full bg-[#1F1F1F] border border-white/5 rounded-lg px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-white/10 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-[9px] text-zinc-500 uppercase tracking-wide mb-1 block">
              Y (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={nodeData?.y ?? 0}
              onChange={handleYChange}
              onBlur={handleYBlur}
              disabled={nodeData?.locked || nodeData?.isExecuting}
              className="w-full bg-[#1F1F1F] border border-white/5 rounded-lg px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-white/10 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] text-zinc-500 uppercase tracking-wide mb-1 block">
              Width (%)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={nodeData?.width ?? 100}
              onChange={handleWidthChange}
              onBlur={handleWidthBlur}
              disabled={nodeData?.locked || nodeData?.isExecuting}
              className="w-full bg-[#1F1F1F] border border-white/5 rounded-lg px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-white/10 disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-[9px] text-zinc-500 uppercase tracking-wide mb-1 block">
              Height (%)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={nodeData?.height ?? 100}
              onChange={handleHeightChange}
              onBlur={handleHeightBlur}
              disabled={nodeData?.locked || nodeData?.isExecuting}
              className="w-full bg-[#1F1F1F] border border-white/5 rounded-lg px-2 py-1.5 text-[11px] text-zinc-300 focus:outline-none focus:border-white/10 disabled:opacity-50"
            />
          </div>
        </div>
      </div>

      {/* Execute Button */}
      <button
        onClick={handleExecute}
        disabled={nodeData?.locked || nodeData?.isExecuting || !nodeData?.imageUrl}
        className="w-full mt-3 bg-pink-500/10 hover:bg-pink-500/20 border border-pink-500/30 text-pink-400 rounded-lg px-3 py-2 text-[11px] font-medium flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Play size={12} />
        {nodeData?.isExecuting ? "Cropping..." : "Crop Image"}
      </button>

      {/* Cropped Image Preview */}
      {hasCroppedImage && (
        <div className="mt-2">
          <label className="text-[9px] text-zinc-500 uppercase tracking-wide mb-1 block">
            Result
          </label>
          <div className="bg-[#1F1F1F] rounded-xl overflow-hidden aspect-square flex items-center justify-center relative">
            <Image
              src={nodeData.croppedImageUrl || ""}
              alt="Cropped image"
              fill
              className="object-contain"
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      {nodeData?.error && (
        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-[10px] text-red-400">{nodeData.error}</p>
        </div>
      )}

      {/* Executing State */}
      {nodeData?.isExecuting && (
        <div className="mt-2 flex items-center gap-2 text-purple-400">
          <div className="w-3 h-3 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-[10px]">Cropping image...</span>
        </div>
      )}

      {/* Input Handle Label */}
      {isHovered && (
        <div className="absolute left-0 -translate-x-full pr-3 flex items-center" style={{ top: "50%" }}>
          <span className="text-xs text-[#4ADE80] font-medium whitespace-nowrap">Image</span>
        </div>
      )}

      {/* Output Handle Label */}
      {isHovered && hasCroppedImage && (
        <div className="absolute right-0 translate-x-full pl-3 flex items-center" style={{ top: "50%" }}>
          <span className="text-xs text-[#4ADE80] font-medium whitespace-nowrap">Cropped</span>
        </div>
      )}

      {/* Input Handle - Image */}
      <Handle
        type="target"
        position={Position.Left}
        id={HANDLE_TYPES.IMAGE_INPUT}
        className="w-3! h-3! bg-[#4ADE80]! border-[3px]! border-[#1A1A1A]! rounded-full!"
        style={{ left: -6 }}
      />

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        id={HANDLE_TYPES.IMAGE_OUTPUT}
        className="w-3! h-3! bg-[#4ADE80]! border-[3px]! border-[#1A1A1A]! rounded-full!"
        style={{ right: -6 }}
      />
    </div>
  );
});

CropImageNode.displayName = "CropImageNode";

export default CropImageNode;
