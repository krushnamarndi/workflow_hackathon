"use client";

import { memo, useCallback, useState, useEffect } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MoreHorizontal, Copy, Edit2, Lock, Trash2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useWorkflowStore } from "@/store/workflow.store";
import { HANDLE_TYPES, type GeminiModel } from "@/lib/workflow-types";
import { trpc } from "@/lib/trpc/provider";
import { getNodeInputs } from "@/lib/workflow-execution";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type LLMNodeData = {
  model?: GeminiModel;
  temperature?: number;
  thinking?: boolean;
  systemPrompt?: string;
  userMessage?: string;
  images?: string[];
  output?: string;
  isExecuting?: boolean;
  error?: string;
  label?: string;
  locked?: boolean;
};

const LLMNode = memo(({ id, data }: NodeProps) => {
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const duplicateNode = useWorkflowStore((state) => state.duplicateNode);
  const removeNode = useWorkflowStore((state) => state.removeNode);
  const resetNode = useWorkflowStore((state) => state.resetNode);
  const workflowId = useWorkflowStore((state) => state.workflowId);
  const [isHovered, setIsHovered] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [nodeName, setNodeName] = useState("Any LLM");
  const nodeData = data as LLMNodeData;
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);

  const createExecution = trpc.execution.create.useMutation();
  const updateExecution = trpc.execution.update.useMutation();
  const utils = trpc.useUtils();

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

  const executeLLM = trpc.llm.execute.useMutation({
    onSuccess: async (result: any) => {
      updateNode(id, { output: result.output, isExecuting: false, error: undefined });
      
      // Update execution record
      if (currentExecutionId) {
        await updateExecution.mutateAsync({
          id: currentExecutionId,
          status: "completed",
          output: { output: result.output },
        });
        setCurrentExecutionId(null);
        
        // Refetch executions to update task manager
        if (workflowId && workflowId !== "new") {
          utils.execution.list.invalidate({ workflowId });
        }
      }
      
      // Propagate output to connected nodes
      const edges = useWorkflowStore.getState().edges;
      const nodes = useWorkflowStore.getState().nodes;
      const connectedOutputEdges = edges.filter((edge) => edge.source === id);
      
      connectedOutputEdges.forEach((edge) => {
        const targetNode = nodes.find(n => n.id === edge.target);
        if (!targetNode) return;
        
        // Update based on node type
        if (targetNode.type === 'textNode') {
          useWorkflowStore.getState().updateNode(edge.target, { value: result.output });
        } else if (targetNode.type === 'llmNode') {
          // Update the appropriate field based on the target handle
          if (edge.targetHandle === HANDLE_TYPES.SYSTEM_PROMPT_INPUT) {
            useWorkflowStore.getState().updateNode(edge.target, { systemPrompt: result.output });
          } else if (edge.targetHandle === HANDLE_TYPES.USER_MESSAGE_INPUT) {
            useWorkflowStore.getState().updateNode(edge.target, { userMessage: result.output });
          }
        }
      });
    },
    onError: async (error: any) => {
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
    },
  });

  // Propagate existing output when new connections are made
  const edges = useWorkflowStore((state) => state.edges);
  useEffect(() => {
    if (!nodeData?.output) return;
    
    const nodes = useWorkflowStore.getState().nodes;
    const connectedOutputEdges = edges.filter((edge) => edge.source === id);
    
    connectedOutputEdges.forEach((edge) => {
      const targetNode = nodes.find(n => n.id === edge.target);
      if (!targetNode) return;
      
      // Update based on node type
      if (targetNode.type === 'textNode') {
        useWorkflowStore.getState().updateNode(edge.target, { value: nodeData.output });
      } else if (targetNode.type === 'llmNode') {
        // Update the appropriate field based on the target handle
        if (edge.targetHandle === HANDLE_TYPES.SYSTEM_PROMPT_INPUT) {
          useWorkflowStore.getState().updateNode(edge.target, { systemPrompt: nodeData.output });
        } else if (edge.targetHandle === HANDLE_TYPES.USER_MESSAGE_INPUT) {
          useWorkflowStore.getState().updateNode(edge.target, { userMessage: nodeData.output });
        }
      }
    });
  }, [edges, id, nodeData?.output]);

  const handleRun = useCallback(async () => {
    // Get connected node data
    const edges = useWorkflowStore.getState().edges;
    const nodes = useWorkflowStore.getState().nodes;

    // Get inputs using the utility function
    const inputs = getNodeInputs(id, nodes, edges);
    
    if (!inputs.userMessage) {
      updateNode(id, { error: "User message is required" });
      return;
    }

    // Generate unique runId for this execution chain
    const runId = `run-${Date.now()}`;

    updateNode(id, { 
      isExecuting: true, 
      error: undefined, 
      systemPrompt: inputs.systemPrompt, 
      userMessage: inputs.userMessage, 
      images: inputs.images 
    });

    // Create execution record in database with runId
    try {
      const executionRecord = await createExecution.mutateAsync({
        workflowId: workflowId || "draft",
        nodeId: id,
        runId: runId,
        status: "running",
        input: {
          model: nodeData?.model || "gemini-flash-2.5",
          systemPrompt: inputs.systemPrompt,
          userMessage: inputs.userMessage,
          images: inputs.images,
        },
      });
      setCurrentExecutionId(executionRecord.id);

      // Refetch executions to show in task manager immediately
      if (workflowId && workflowId !== "new") {
        utils.execution.list.invalidate({ workflowId });
      }
    } catch (error) {
      console.error("Failed to create execution record:", error);
    }

    executeLLM.mutate({
      model: nodeData?.model || "gemini-flash-2.5",
      systemPrompt: inputs.systemPrompt,
      userMessage: inputs.userMessage,
      images: inputs.images,
      temperature: nodeData?.temperature,
    });
  }, [id, nodeData, executeLLM, updateNode, createExecution, workflowId, utils]);

  return (
    <div 
      className="bg-[#2A2A2A] border border-white/8 rounded-2xl w-[480px] shadow-[0_8px_32px_rgba(0,0,0,0.4)] relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
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
                setNodeName("Any LLM");
              }
            }}
            autoFocus
            className="text-base font-medium text-zinc-200 bg-transparent border-b border-white/20 outline-none px-1"
          />
        ) : (
          <h3 className="text-base font-medium text-zinc-200">{nodeName}</h3>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-zinc-500 hover:text-zinc-300 transition-colors">
              <MoreHorizontal size={18} />
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

      {/* Input Handle Labels - Left Side */}
      {isHovered && (
        <>
          <div className="absolute left-0 -translate-x-full pr-3 flex items-center" style={{ top: 100 }}>
            <span className="text-xs text-[#C084FC] font-medium whitespace-nowrap">Prompt*</span>
          </div>
          <div className="absolute left-0 -translate-x-full pr-3 flex items-center" style={{ top: 160 }}>
            <span className="text-xs text-[#C084FC] font-medium whitespace-nowrap">System Prompt</span>
          </div>
          <div className="absolute left-0 -translate-x-full pr-3 flex items-center" style={{ top: 220 }}>
            <span className="text-xs text-[#4ADE80] font-medium whitespace-nowrap">Image 1</span>
          </div>
        </>
      )}

      {/* Input Handles - positioned absolutely outside on the left edge */}
      <Handle
        type="target"
        position={Position.Left}
        id={HANDLE_TYPES.USER_MESSAGE_INPUT}
        className="!w-3 !h-3 !bg-[#C084FC] !border-[3px] !border-[#1A1A1A] !rounded-full !-left-[6px]"
        style={{ top: 100 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id={HANDLE_TYPES.SYSTEM_PROMPT_INPUT}
        className="!w-3 !h-3 !bg-[#C084FC] !border-[3px] !border-[#1A1A1A] !rounded-full !-left-[6px]"
        style={{ top: 160 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id={HANDLE_TYPES.IMAGE_INPUT}
        className="!w-3 !h-3 !bg-[#4ADE80] !border-[3px] !border-[#1A1A1A] !rounded-full !-left-[6px]"
        style={{ top: 220 }}
      />

      {/* Output Display Area */}
      <div className="px-5 py-5">
        <div className="bg-[#3B3B40] rounded-xl p-6 h-[320px] border border-white/5 overflow-y-auto">
          {nodeData?.isExecuting ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-zinc-500 text-base animate-pulse">Generating...</div>
            </div>
          ) : nodeData?.output ? (
            <div className="text-base text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {nodeData.output}
            </div>
          ) : (
            <div className="text-base text-zinc-500">The generated text will appear here</div>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="px-5 pb-5 flex items-center justify-between">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRun();
          }}
          disabled={nodeData?.isExecuting}
          className="bg-transparent hover:bg-white/5 disabled:bg-transparent text-zinc-300 disabled:text-zinc-600 px-5 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:cursor-not-allowed border border-white/10"
        >
          → Run Model
        </button>
      </div>

      {/* Output Handle Label - Right Side */}
      {isHovered && (
        <div className="absolute right-0 translate-x-full pl-3 flex items-center" style={{ top: '50%' }}>
          <span className="text-xs text-[#C084FC] font-medium whitespace-nowrap">Text</span>
        </div>
      )}

      {/* Output Handle - positioned absolutely outside on the right edge */}
      <Handle
        type="source"
        position={Position.Right}
        id={HANDLE_TYPES.LLM_OUTPUT}
        className="!w-3 !h-3 !bg-[#C084FC] !border-[3px] !border-[#1A1A1A] !rounded-full !-right-[6px]"
        style={{ top: '50%' }}
      />
    </div>
  );
});

LLMNode.displayName = "LLMNode";

export default LLMNode;
