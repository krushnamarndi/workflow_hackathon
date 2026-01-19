"use client";

import { trpc } from "@/lib/trpc/provider";
import { useWorkflowStore } from "@/store/workflow.store";
import { useUIStore } from "@/store/ui.store";
import { useCallback } from "react";

/**
 * Hook for workflow CRUD operations with automatic state synchronization
 */
export function useWorkflowOperations() {
  const {
    workflowId,
    workflowName,
    workflowDescription,
    nodes,
    edges,
    viewport,
    setWorkflowId,
    markSaved,
    markUnsaved,
    loadWorkflow,
    resetWorkflow,
  } = useWorkflowStore();

  const { addNotification, setLoadingWorkflow } = useUIStore();

  const utils = trpc.useUtils();

  // Create workflow mutation
  const createMutation = trpc.workflow.create.useMutation({
    onSuccess: (data) => {
      setWorkflowId(data.id);
      markSaved();
      addNotification("success", "Workflow created successfully");
      utils.workflow.list.invalidate();
    },
    onError: (error) => {
      addNotification("error", `Failed to create workflow: ${error.message}`);
    },
  });

  // Update workflow mutation
  const updateMutation = trpc.workflow.update.useMutation({
    onSuccess: () => {
      markSaved();
      addNotification("success", "Workflow saved successfully");
      utils.workflow.list.invalidate();
    },
    onError: (error) => {
      addNotification("error", `Failed to save workflow: ${error.message}`);
    },
  });

  // Delete workflow mutation
  const deleteMutation = trpc.workflow.delete.useMutation({
    onSuccess: () => {
      resetWorkflow();
      addNotification("success", "Workflow deleted successfully");
      utils.workflow.list.invalidate();
    },
    onError: (error) => {
      addNotification("error", `Failed to delete workflow: ${error.message}`);
    },
  });

  // Get workflow query
  const getWorkflowQuery = trpc.workflow.get.useQuery(
    { id: workflowId! },
    {
      enabled: !!workflowId,
    }
  );

  // Handle workflow data loading
  if (getWorkflowQuery.data && workflowId) {
    const data = getWorkflowQuery.data;
    const workflowData = data.data as any;
    
    if (data.id !== workflowId) {
      loadWorkflow({
        id: data.id,
        name: data.name,
        description: data.description,
        nodes: workflowData.nodes || [],
        edges: workflowData.edges || [],
        viewport: workflowData.viewport,
      });
      setLoadingWorkflow(false);
    }
  }

  if (getWorkflowQuery.error) {
    addNotification("error", `Failed to load workflow: ${getWorkflowQuery.error.message}`);
    setLoadingWorkflow(false);
  }

  // List workflows query
  const listWorkflowsQuery = trpc.workflow.list.useQuery();

  // Save current workflow
  const saveWorkflow = useCallback(async () => {
    const workflowData = {
      nodes: nodes.map(node => ({
        ...node,
        type: node.type || 'default',
      })),
      edges,
      viewport,
    };

    if (workflowId) {
      // Update existing workflow
      await updateMutation.mutateAsync({
        id: workflowId,
        name: workflowName,
        description: workflowDescription || undefined,
        data: workflowData as any,
      });
    } else {
      // Create new workflow
      await createMutation.mutateAsync({
        name: workflowName,
        description: workflowDescription || undefined,
        data: workflowData as any,
      });
    }
  }, [
    workflowId,
    workflowName,
    workflowDescription,
    nodes,
    edges,
    viewport,
    createMutation,
    updateMutation,
  ]);

  // Delete current workflow
  const deleteWorkflow = useCallback(async () => {
    if (!workflowId) return;
    await deleteMutation.mutateAsync({ id: workflowId });
  }, [workflowId, deleteMutation]);

  // Load a specific workflow
  const loadWorkflowById = useCallback(
    (id: string) => {
      setWorkflowId(id);
      setLoadingWorkflow(true);
    },
    [setWorkflowId, setLoadingWorkflow]
  );

  return {
    // State
    workflows: listWorkflowsQuery.data || [],
    isLoadingWorkflows: listWorkflowsQuery.isLoading,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isDeleting: deleteMutation.isPending,

    // Actions
    saveWorkflow,
    deleteWorkflow,
    loadWorkflowById,
    createNewWorkflow: resetWorkflow,

    // Queries
    refetchWorkflows: listWorkflowsQuery.refetch,
  };
}

/**
 * Hook for LLM operations
 */
export function useLLMOperations() {
  const { addNotification } = useUIStore();
  const { setNodeExecuting, setNodeOutput, setNodeError } = useWorkflowStore();

  // Execute LLM mutation
  const executeMutation = trpc.llm.execute.useMutation({
    onSuccess: (data, variables) => {
      // Note: variables only contains the LLM parameters, not nodeId
      // nodeId needs to be tracked separately in the executeLLM function
      addNotification("success", "LLM executed successfully");
    },
    onError: (error) => {
      addNotification("error", `LLM execution failed: ${error.message}`);
    },
  });

  // Get available models
  const modelsQuery = trpc.llm.getModels.useQuery();

  // Execute LLM node
  const executeLLM = useCallback(
    async (params: {
      workflowId: string;
      nodeId: string;
      model: string;
      systemPrompt?: string;
      userMessage: string;
      images?: string[];
      temperature?: number;
    }) => {
      setNodeExecuting(params.nodeId, true);
      setNodeError(params.nodeId, null);

      try {
        // Only pass LLM-related parameters to the mutation
        const result = await executeMutation.mutateAsync({
          model: params.model,
          systemPrompt: params.systemPrompt,
          userMessage: params.userMessage,
          images: params.images,
          temperature: params.temperature,
        });
        
        // Update node state after successful execution
        setNodeExecuting(params.nodeId, false);
        setNodeOutput(params.nodeId, result.output);
        
        return result;
      } catch (error) {
        setNodeExecuting(params.nodeId, false);
        setNodeError(params.nodeId, error instanceof Error ? error.message : 'Unknown error');
        throw error;
      }
    },
    [executeMutation, setNodeExecuting, setNodeError, setNodeOutput]
  );

  return {
    // State
    models: modelsQuery.data || [],
    isLoadingModels: modelsQuery.isLoading,
    isExecuting: executeMutation.isPending,

    // Actions
    executeLLM,
  };
}
