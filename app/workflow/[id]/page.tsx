"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  BackgroundVariant,
  Connection,
  Edge,
  Node,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  OnConnect,
  OnNodesChange,
  OnEdgesChange,
  ConnectionLineType,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import {
  Search,
  History,
  Briefcase,
  Layout,
  Play,
  Box,
  Sparkles,
  Image as ImageIcon,
  HelpCircle,
  MessageSquare,
  ArrowLeft,
  Share2,
  ChevronDown,
  Undo2,
  Redo2,
  MousePointer2,
  Hand,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Check,
  Upload,
  Download,
  RotateCcw,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import TextNode from "@/components/workflow/TextNode";
import ImageNode from "@/components/workflow/ImageNode";
import UploadImageNode from "@/components/workflow/UploadImageNode";
import CropImageNode from "@/components/workflow/CropImageNode";
import LLMNode from "@/components/workflow/LLMNode";
import WorkflowSidebar from "@/components/workflow/WorkflowSidebar";
import NodeConfigSidebar from "@/components/workflow/NodeConfigSidebar";
import TaskManager, { type WorkflowExecution } from "@/components/workflow/TaskManager";
import { useWorkflowStore } from "@/store/workflow.store";
import { NODE_TYPES, HANDLE_TYPES, isValidConnection } from "@/lib/workflow-types";
import { topologicalSort, getNodeInputs } from "@/lib/workflow-execution";
import { trpc } from "@/lib/trpc/provider";
import type { NodeTypes } from "@xyflow/react";

const nodeTypes = {
  [NODE_TYPES.TEXT]: TextNode,
  [NODE_TYPES.IMAGE]: ImageNode,
  [NODE_TYPES.UPLOAD_IMAGE]: UploadImageNode,
  [NODE_TYPES.CROP_IMAGE]: CropImageNode,
  [NODE_TYPES.LLM]: LLMNode,
} as NodeTypes;

// Check if connection creates a cycle
function createsCycle(
  edges: Edge[],
  sourceId: string,
  targetId: string
): boolean {
  const adjacencyList = new Map<string, Set<string>>();

  // Build adjacency list from existing edges
  edges.forEach((edge) => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, new Set());
    }
    adjacencyList.get(edge.source)!.add(edge.target);
  });

  // Add the new edge
  if (!adjacencyList.has(sourceId)) {
    adjacencyList.set(sourceId, new Set());
  }
  adjacencyList.get(sourceId)!.add(targetId);

  // DFS to detect cycle
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function hasCycleDFS(node: string): boolean {
    if (recStack.has(node)) return true;
    if (visited.has(node)) return false;

    visited.add(node);
    recStack.add(node);

    const neighbors = adjacencyList.get(node) || new Set();
    for (const neighbor of neighbors) {
      if (hasCycleDFS(neighbor)) return true;
    }

    recStack.delete(node);
    return false;
  }

  // Check for cycles starting from any node
  for (const node of adjacencyList.keys()) {
    if (hasCycleDFS(node)) return true;
  }

  return false;
}

function WorkflowCanvas() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const [connectionLineColor, setConnectionLineColor] = useState("#C084FC");

  // Handle connection start to set color
  const onConnectStart = useCallback((_: any, { handleId }: any) => {
    if (handleId === HANDLE_TYPES.IMAGE_OUTPUT || handleId === HANDLE_TYPES.IMAGE_INPUT) {
      setConnectionLineColor("#4ADE80");
    } else {
      setConnectionLineColor("#C084FC");
    }
  }, []);

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [panMode, setPanMode] = useState<"select" | "pan">("select");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastAutoSavedState = useRef<string | null>(null);
  const [showTasks, setShowTasks] = useState(false);

  const { screenToFlowPosition, fitView, zoomIn, zoomOut } = useReactFlow();

  // Store state
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);
  const setNodes = useWorkflowStore((state) => state.setNodes);
  const setEdges = useWorkflowStore((state) => state.setEdges);
  const addNode = useWorkflowStore((state) => state.addNode);
  const workflowName = useWorkflowStore((state) => state.workflowName);
  const setWorkflowName = useWorkflowStore((state) => state.setWorkflowName);
  const undo = useWorkflowStore((state) => state.undo);
  const redo = useWorkflowStore((state) => state.redo);
  const canUndo = useWorkflowStore((state) => state.canUndo());
  const canRedo = useWorkflowStore((state) => state.canRedo());
  const loadWorkflow = useWorkflowStore((state) => state.loadWorkflow);
  const setWorkflowId = useWorkflowStore((state) => state.setWorkflowId);
  const resetAllNodes = useWorkflowStore((state) => state.resetAllNodes);
  const updateNode = useWorkflowStore((state) => state.updateNode);

  // Load sample workflow
  const loadSampleWorkflow = useCallback(() => {
    const sampleNodes: Node[] = [
      // Image nodes
      {
        id: 'image-1',
        type: NODE_TYPES.IMAGE,
        position: { x: 322, y: -366.5 },
        data: { label: 'Product Photo 1', images: [] },
      },
      {
        id: 'image-2',
        type: NODE_TYPES.IMAGE,
        position: { x: -272, y: 256 },
        data: { label: 'Product Photo 2', images: [] },
      },
      {
        id: 'image-3',
        type: NODE_TYPES.IMAGE,
        position: { x: -262, y: 598 },
        data: { label: 'Product Photo 3', images: [] },
      },
      // Text nodes for input
      {
        id: 'text-system',
        type: NODE_TYPES.TEXT,
        position: { x: -332, y: 972 },
        data: { label: 'System Prompt', value: 'You are a professional e-commerce copywriter and product analyst. Analyze product images and specs to create compelling, SEO-optimized content that drives conversions.' },
      },
      {
        id: 'text-specs',
        type: NODE_TYPES.TEXT,
        position: { x: 32, y: 1162 },
        data: { label: 'Product Name & Specs', value: 'Product Name: Mini Projector\n\nKey Features:\n- 1080p Full HD\n- 200" Display\n- WiFi & Bluetooth' },
      },
      // LLM node: Analyze product
      {
        id: 'llm-analyze',
        type: NODE_TYPES.LLM,
        position: { x: 400, y: 300 },
        data: { label: 'Analyze Product', model: 'gemini-2.5-flash', temperature: 1, thinking: false },
      },
      // LLM node: Amazon listing
      {
        id: 'llm-amazon',
        type: NODE_TYPES.LLM,
        position: { x: 1116, y: -178 },
        data: { label: 'Amazon Listing', model: 'gemini-2.5-flash', temperature: 1, thinking: false },
      },
      // Text output: Amazon
      {
        id: 'text-amazon-output',
        type: NODE_TYPES.TEXT,
        position: { x: 1850, y: 8 },
        data: { label: 'Amazon Output', value: '(Amazon listing will appear here after running)' },
      },
      // LLM node: Instagram caption
      {
        id: 'llm-instagram',
        type: NODE_TYPES.LLM,
        position: { x: 1198, y: 470 },
        data: { label: 'Instagram Caption', model: 'gemini-2.5-flash', temperature: 1, thinking: false },
      },
      // Text output: Instagram
      {
        id: 'text-instagram-output',
        type: NODE_TYPES.TEXT,
        position: { x: 1900, y: 422 },
        data: { label: 'Instagram Output', value: '(Instagram caption will appear here after running)' },
      },
      // LLM node: SEO meta
      {
        id: 'llm-seo',
        type: NODE_TYPES.LLM,
        position: { x: 1228, y: 1116 },
        data: { label: 'SEO Meta', model: 'gemini-2.5-flash', temperature: 1, thinking: false },
      },
      // Text output: SEO
      {
        id: 'text-seo-output',
        type: NODE_TYPES.TEXT,
        position: { x: 2006, y:  916},
        data: { label: 'SEO Output', value: '(SEO meta will appear here after running)' },
      },
    ];

    const sampleEdges: Edge[] = [
      // Images to Analyze LLM
      { id: 'e1', source: 'image-1', sourceHandle: HANDLE_TYPES.IMAGE_OUTPUT, target: 'llm-analyze', targetHandle: HANDLE_TYPES.IMAGE_INPUT, animated: true, style: { stroke: '#4ADE80', strokeWidth: 2 } },
      { id: 'e2', source: 'image-2', sourceHandle: HANDLE_TYPES.IMAGE_OUTPUT, target: 'llm-analyze', targetHandle: HANDLE_TYPES.IMAGE_INPUT, animated: true, style: { stroke: '#4ADE80', strokeWidth: 2 } },
      { id: 'e3', source: 'image-3', sourceHandle: HANDLE_TYPES.IMAGE_OUTPUT, target: 'llm-analyze', targetHandle: HANDLE_TYPES.IMAGE_INPUT, animated: true, style: { stroke: '#4ADE80', strokeWidth: 2 } },
      // System prompt to Analyze LLM
      { id: 'e4', source: 'text-system', sourceHandle: HANDLE_TYPES.TEXT_OUTPUT, target: 'llm-analyze', targetHandle: HANDLE_TYPES.SYSTEM_PROMPT_INPUT, animated: true, style: { stroke: '#C084FC', strokeWidth: 2 } },
      // Specs to Analyze LLM
      { id: 'e5', source: 'text-specs', sourceHandle: HANDLE_TYPES.TEXT_OUTPUT, target: 'llm-analyze', targetHandle: HANDLE_TYPES.USER_MESSAGE_INPUT, animated: true, style: { stroke: '#C084FC', strokeWidth: 2 } },
      // Analyze LLM to Amazon LLM
      { id: 'e6', source: 'llm-analyze', sourceHandle: HANDLE_TYPES.LLM_OUTPUT, target: 'llm-amazon', targetHandle: HANDLE_TYPES.USER_MESSAGE_INPUT, animated: true, style: { stroke: '#C084FC', strokeWidth: 2 } },
      // Amazon LLM to output
      { id: 'e7', source: 'llm-amazon', sourceHandle: HANDLE_TYPES.LLM_OUTPUT, target: 'text-amazon-output', targetHandle: HANDLE_TYPES.TEXT_INPUT, animated: true, style: { stroke: '#C084FC', strokeWidth: 2 } },
      // Analyze LLM to Instagram LLM
      { id: 'e8', source: 'llm-analyze', sourceHandle: HANDLE_TYPES.LLM_OUTPUT, target: 'llm-instagram', targetHandle: HANDLE_TYPES.USER_MESSAGE_INPUT, animated: true, style: { stroke: '#C084FC', strokeWidth: 2 } },
      // Instagram LLM to output
      { id: 'e9', source: 'llm-instagram', sourceHandle: HANDLE_TYPES.LLM_OUTPUT, target: 'text-instagram-output', targetHandle: HANDLE_TYPES.TEXT_INPUT, animated: true, style: { stroke: '#C084FC', strokeWidth: 2 } },
      // Analyze LLM to SEO LLM
      { id: 'e10', source: 'llm-analyze', sourceHandle: HANDLE_TYPES.LLM_OUTPUT, target: 'llm-seo', targetHandle: HANDLE_TYPES.USER_MESSAGE_INPUT, animated: true, style: { stroke: '#C084FC', strokeWidth: 2 } },
      // SEO LLM to output
      { id: 'e11', source: 'llm-seo', sourceHandle: HANDLE_TYPES.LLM_OUTPUT, target: 'text-seo-output', targetHandle: HANDLE_TYPES.TEXT_INPUT, animated: true, style: { stroke: '#C084FC', strokeWidth: 2 } },
      
    ];

    setNodes(sampleNodes);
    setEdges(sampleEdges);
    setWorkflowName('Product Listing Generator');
    setIsSidebarOpen(false);
    toast.success('Sample workflow loaded!');
  }, [setNodes, setEdges, setWorkflowName]);

  // tRPC queries and mutations
  const { data: workflow } = trpc.workflow.get.useQuery(
    { id: workflowId },
    { enabled: workflowId !== "new" }
  );

  const saveWorkflow = trpc.workflow.update.useMutation();
  const createWorkflow = trpc.workflow.create.useMutation();
  const executeLLMMutation = trpc.llm.execute.useMutation();
  const createExecution = trpc.execution.create.useMutation();
  const updateExecution = trpc.execution.update.useMutation();
  const deleteAllExecutions = trpc.execution.deleteAll.useMutation();
  const { data: executions, refetch: refetchExecutions } = trpc.execution.list.useQuery(
    { workflowId: workflowId === "new" ? "draft" : workflowId },
    { 
      enabled: workflowId !== "new",
      refetchInterval: 1000 // Poll every 1 second for real-time updates
    }
  );

  // Load workflow on mount
  useEffect(() => {
    if (workflow) {
      loadWorkflow({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        nodes: (workflow.data as any).nodes || [],
        edges: (workflow.data as any).edges || [],
        viewport: (workflow.data as any).viewport,
      });
      setLastSaved(new Date(workflow.updatedAt));
    }
  }, [workflow, loadWorkflow]);

  // Set workflow ID
  useEffect(() => {
    if (workflowId !== "new") {
      setWorkflowId(workflowId);
    }
  }, [workflowId, setWorkflowId]);

  // Drag and drop from sidebar
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: type,
          value: type === NODE_TYPES.TEXT ? "" : undefined,
          images: type === NODE_TYPES.IMAGE ? [] : undefined,
          model: type === NODE_TYPES.LLM ? "gemini-2.5-flash" : undefined,
        },
      };

      addNode(newNode);
    },
    [screenToFlowPosition, addNode]
  );

  // Connection validation
  const isValidConnectionCallback = useCallback(
    (connection: Connection | Edge) => {
      const { source, target, sourceHandle, targetHandle } = connection;

      if (!source || !target || !sourceHandle || !targetHandle) return false;

      // Check type safety
      if (!isValidConnection(sourceHandle, targetHandle)) {
        return false;
      }

      // Check for cycles (DAG validation)
      if (createsCycle(edges, source, target)) {
        return false;
      }

      return true;
    },
    [edges]
  );

  const onConnect: OnConnect = useCallback(
    (connection) => {
      const { source, target, sourceHandle, targetHandle } = connection;
      
      if (!source || !target || !sourceHandle || !targetHandle) return;

      // Check type safety
      if (!isValidConnection(sourceHandle, targetHandle)) {
        toast.error("Invalid Connection", {
          description: "Cannot connect handles of different types. Please connect matching handle types.",
        });
        return;
      }

      // Check for cycles
      if (createsCycle(edges, source, target)) {
        toast.error("Circular Dependency", {
          description: "This connection would create a cycle. Workflows must be acyclic.",
        });
        return;
      }

      // Valid connection - determine edge color based on handle type
      let edgeColor = "#C084FC"; // default purple for text/LLM connections

      // Check handle types to determine color
      if (sourceHandle === HANDLE_TYPES.IMAGE_OUTPUT || targetHandle === HANDLE_TYPES.IMAGE_INPUT) {
        edgeColor = "#4ADE80"; // green for image connections
      } else if (
        sourceHandle === HANDLE_TYPES.TEXT_OUTPUT || 
        sourceHandle === HANDLE_TYPES.LLM_OUTPUT ||
        targetHandle === HANDLE_TYPES.TEXT_INPUT ||
        targetHandle === HANDLE_TYPES.USER_MESSAGE_INPUT ||
        targetHandle === HANDLE_TYPES.SYSTEM_PROMPT_INPUT
      ) {
        edgeColor = "#C084FC"; // purple for text/LLM connections
      }

      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            animated: true,
            style: { stroke: edgeColor, strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges, edges]
  );

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes((nds) => applyNodeChanges(changes, nds));
    },
    [setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  // Handle node click to open config sidebar
  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (node.type === NODE_TYPES.LLM) {
      setSelectedNodeId(node.id);
    }
  }, []);

  // Handle selection change to close sidebar when node is deselected
  const onSelectionChange = useCallback(({ nodes }: { nodes: Node[] }) => {
    if (nodes.length === 0 || !nodes.some(n => n.id === selectedNodeId)) {
      setSelectedNodeId(null);
    }
  }, [selectedNodeId]);

  // Handle reset all nodes
  const handleResetAllNodes = useCallback(() => {
    resetAllNodes();
    toast.success("All nodes reset successfully");
  }, [resetAllNodes]);

  // Clear all executions
  const handleClearAllExecutions = useCallback(async () => {
    try {
      await deleteAllExecutions.mutateAsync({ workflowId: workflowId === "new" ? "draft" : workflowId });
      await refetchExecutions();
      toast.success("All executions cleared");
    } catch (error: any) {
      toast.error(error.message || "Failed to clear executions");
    }
  }, [deleteAllExecutions, refetchExecutions, workflowId]);

  // Execute all nodes in DAG order
  const handleRunAllNodes = useCallback(async () => {
    try {
      // Get topologically sorted nodes (all nodes, not just LLM)
      const sortedNodes = topologicalSort(nodes, edges);
      const llmNodes = sortedNodes.filter((n: Node) => n.type === NODE_TYPES.LLM);

      if (llmNodes.length === 0) {
        toast.error("No LLM nodes to execute");
        return;
      }

      // Generate unique runId for this execution
      const runId = `run-${Date.now()}`;

      // Count total nodes that will be shown in execution
      const textNodes = sortedNodes.filter((n: Node) => n.type === NODE_TYPES.TEXT);
      const imageNodes = sortedNodes.filter((n: Node) => n.type === NODE_TYPES.IMAGE);
      const totalNodes = textNodes.length + imageNodes.length + llmNodes.length;

      toast.success(`Executing workflow with ${totalNodes} nodes...`);

      // Create execution records for text nodes (inputs)
      for (const node of textNodes) {
        const nodeData = node.data as any;
        await createExecution.mutateAsync({
          workflowId: workflowId === "new" ? "draft" : workflowId,
          nodeId: node.id,
          runId: runId,
          status: "completed",
          input: { value: nodeData.value || "" },
          output: { output: nodeData.value || "" },
        });
      }

      // Create execution records for image nodes (inputs)
      for (const node of imageNodes) {
        const nodeData = node.data as any;
        await createExecution.mutateAsync({
          workflowId: workflowId === "new" ? "draft" : workflowId,
          nodeId: node.id,
          runId: runId,
          status: "completed",
          input: { images: nodeData.images || [] },
          output: { imageCount: (nodeData.images || []).length },
        });
      }

      // Refetch to show input nodes in task manager
      if (workflowId !== "new") {
        await refetchExecutions();
      }

      // Execute LLM nodes one by one
      for (const node of llmNodes) {
        const nodeData = node.data as any;

        // Update node UI
        updateNode(node.id, { isExecuting: true, error: undefined });

        try {
          // Get FRESH nodes from store (so we have updated inputs from previous nodes)
          const currentNodes = useWorkflowStore.getState().nodes;
          const currentEdges = useWorkflowStore.getState().edges;
          
          // Get inputs from connected nodes
          const inputs = getNodeInputs(node.id, currentNodes, currentEdges);

          if (!inputs.userMessage) {
            throw new Error("User message is required");
          }

          // Create execution record in database
          const executionRecord = await createExecution.mutateAsync({
            workflowId: workflowId === "new" ? "draft" : workflowId,
            nodeId: node.id,
            runId: runId,
            status: "running",
            input: {
              model: nodeData.model,
              systemPrompt: inputs.systemPrompt,
              userMessage: inputs.userMessage,
              images: inputs.images,
            },
          });

          // Execute LLM
          const result = await executeLLMMutation.mutateAsync({
            model: nodeData.model || "gemini-2.0-flash-exp",
            systemPrompt: inputs.systemPrompt || "",
            userMessage: inputs.userMessage,
            images: inputs.images || [],
            temperature: nodeData.temperature,
          });

          // Update execution record
          await updateExecution.mutateAsync({
            id: executionRecord.id,
            status: "completed",
            output: { output: result.output },
          });

          // Update node with output
          updateNode(node.id, {
            output: result.output,
            isExecuting: false,
            error: undefined,
          });

          // Propagate output to connected nodes
          const connectedOutputEdges = edges.filter((edge) => edge.source === node.id);
          connectedOutputEdges.forEach((edge) => {
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (!targetNode) return;

            if (targetNode.type === NODE_TYPES.TEXT) {
              updateNode(edge.target, { value: result.output });
            } else if (targetNode.type === NODE_TYPES.LLM) {
              if (edge.targetHandle === HANDLE_TYPES.SYSTEM_PROMPT_INPUT) {
                updateNode(edge.target, { systemPrompt: result.output });
              } else if (edge.targetHandle === HANDLE_TYPES.USER_MESSAGE_INPUT) {
                updateNode(edge.target, { userMessage: result.output });
              }
            }
          });
        } catch (error: any) {
          // Handle error
          const errorMessage = error.message || "Execution failed";

          // Update execution record if exists
          if (createExecution.data) {
            await updateExecution.mutateAsync({
              id: createExecution.data.id,
              status: "failed",
              error: errorMessage,
            });
          }

          // Update node UI
          updateNode(node.id, {
            error: errorMessage,
            isExecuting: false,
          });

          toast.error(`Node "${node.data.label}" failed: ${errorMessage}`);
          break; // Stop execution on first error
        }
      }

      toast.success("All nodes executed successfully!");
      
      // Refetch executions to update UI
      if (workflowId !== "new") {
        await refetchExecutions();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to execute workflow");
    }
  }, [nodes, edges, workflowId, updateNode, createExecution, updateExecution, executeLLMMutation, refetchExecutions]);

  // Save workflow
  const handleSave = useCallback(async () => {
    const data = {
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    setIsSaving(true);
    try {
      if (workflowId === "new") {
        const result = await createWorkflow.mutateAsync({
          name: workflowName,
          data: data as any,
        });
        router.push(`/workflow/${result.id}`);
      } else {
        await saveWorkflow.mutateAsync({
          id: workflowId,
          name: workflowName,
          data: data as any,
        });
      }
      setLastSaved(new Date());
    } catch (error) {
      console.error("Error saving workflow:", error);
    } finally {
      setIsSaving(false);
    }
  }, [nodes, edges, workflowId, workflowName, createWorkflow, saveWorkflow, router]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (
        ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "z") ||
        ((e.ctrlKey || e.metaKey) && e.key === "y")
      ) {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, handleSave]);

  // Autosave effect
  useEffect(() => {
    if (workflowId === "new") return;
    
    // Create a snapshot of current state
    const currentState = JSON.stringify({ nodes, edges, workflowName });
    
    // Skip if state hasn't changed from last autosave
    if (lastAutoSavedState.current === currentState) return;
    
    // Don't trigger on first render when loading from DB
    if (!lastAutoSavedState.current) {
      lastAutoSavedState.current = currentState;
      return;
    }
    
    const autoSaveTimer = setTimeout(() => {
      lastAutoSavedState.current = currentState;
      handleSave();
    }, 3000); // Auto-save after 3 seconds of inactivity

    return () => clearTimeout(autoSaveTimer);
  }, [nodes, edges, workflowName, workflowId]);

  // Import workflow
  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (data.nodes && data.edges) {
        setNodes(data.nodes);
        setEdges(data.edges);
        if (data.name) setWorkflowName(data.name);
        toast.success("Workflow imported successfully");
      } else {
        toast.error("Invalid workflow file format");
      }
    } catch (error) {
      console.error("Error importing workflow:", error);
      toast.error("Failed to import workflow");
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [setNodes, setEdges, setWorkflowName]);

  // Export workflow
  const handleExport = useCallback(() => {
    const data = {
      name: workflowName,
      nodes,
      edges,
      viewport: { x: 0, y: 0, zoom: 1 },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${workflowName.replace(/\s+/g, "-").toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Workflow exported successfully");
  }, [workflowName, nodes, edges]);

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-white font-sans overflow-hidden">
      {/* Primary Sidebar */}
      <aside className="w-14 border-r border-white/5 flex flex-col items-center py-4 gap-6 shrink-0 bg-[#0A0A0A] z-20">
        <Link href="/dashboard" className="mb-4">
          <div className="w-8 h-8 flex items-center justify-center text-white font-bold text-xl hover:bg-white/5 rounded-lg transition-colors">
            w
          </div>
        </Link>
        <div className="flex flex-col gap-6">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`${
              isSidebarOpen ? "text-white bg-white/5" : "text-zinc-500"
            } hover:text-white transition-colors p-2 rounded-lg`}
          >
            <Search size={20} />
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-6">
          <ImageIcon size={20} className="text-zinc-500 cursor-pointer hover:text-white transition-colors" />
          <HelpCircle size={20} className="text-zinc-500 cursor-pointer hover:text-white transition-colors" />
          <MessageSquare size={20} className="text-zinc-500 cursor-pointer hover:text-white transition-colors" />
        </div>
      </aside>

      {/* Secondary Sidebar */}
      <WorkflowSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onLoadSampleWorkflow={loadSampleWorkflow}
      />

      {/* Main Content */}
      <main className="flex-1 relative flex flex-col">
        {/* Top Header */}
        <header className="h-14 flex items-center justify-between px-6 z-30 absolute top-0 left-0 right-0 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 hover:bg-white/5 p-1 rounded-lg transition-colors"
            >
              <ArrowLeft size={16} className="text-zinc-400" />
            </Link>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="bg-[#121212] border border-white/5 px-4 py-1.5 rounded-lg text-xs font-medium text-zinc-300 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            {/* Autosave Status */}
            <div className="flex items-center gap-2 text-xs">
              {isSaving ? (
                <span className="text-zinc-500">Saving...</span>
              ) : lastSaved ? (
                <div className="flex items-center gap-1.5 text-green-400">
                  <Check size={12} />
                  <span>Saved</span>
                </div>
              ) : null}
            </div>

            {/* Import/Export Buttons */}
            <button
              onClick={handleImport}
              className="bg-[#121212] border border-white/5 hover:bg-white/5 px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-medium transition-colors"
            >
              <Upload size={12} />
              <span>Import</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
            />
            <button
              onClick={handleExport}
              className="bg-[#121212] border border-white/5 hover:bg-white/5 px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-medium transition-colors"
            >
              <Download size={12} />
              <span>Export</span>
            </button>

            {/* Tasks Button */}
            <button
              onClick={() => setShowTasks(!showTasks)}
              className="bg-[#121212] border border-white/5 hover:bg-white/5 px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-medium transition-colors"
            >
              <Clock size={12} />
              <span>Tasks</span>
            </button>

            {/* Run All Button */}
            <button
              onClick={handleRunAllNodes}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-medium transition-colors"
            >
              <Play size={12} />
              <span>Run All</span>
            </button>

            {/* Manual Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-[#E9FF97] hover:bg-[#E9FF97]/90 text-black px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share2 size={12} />
              Share
            </button>
          </div>
        </header>

        {/* React Flow Canvas */}
        <div
          ref={reactFlowWrapper}
          className="flex-1"
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onSelectionChange={onSelectionChange}
            onConnectStart={onConnectStart}
            nodeTypes={nodeTypes}
            isValidConnection={isValidConnectionCallback}
            fitView
            panOnDrag={panMode === "pan"}
            selectionOnDrag={panMode === "select"}
            style={{ background: "#1A1A1A" }}
            deleteKeyCode="Delete"
            connectionLineStyle={{
              stroke: connectionLineColor,
              strokeWidth: 2,
            }}
            connectionLineType={ConnectionLineType.SmoothStep}
          >
            <Background
              color="#3A3A3A"
              variant={BackgroundVariant.Dots}
              gap={24}
              size={2}
            />

            {/* Bottom Toolbar */}
            <Panel position="bottom-center" className="mb-6">
              <div className="bg-[#121212] border border-white/5 px-4 py-2 rounded-xl flex items-center gap-4 shadow-2xl">
                {/* Pan/Select Toggle */}
                <button
                  onClick={() => setPanMode("select")}
                  className={`flex items-center p-1.5 rounded-lg cursor-pointer transition-colors ${
                    panMode === "select"
                      ? "bg-[#E9FF97] text-black"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  <MousePointer2 size={16} />
                </button>
                <button
                  onClick={() => setPanMode("pan")}
                  className={`flex items-center p-1.5 rounded-lg cursor-pointer transition-colors ${
                    panMode === "pan"
                      ? "bg-[#E9FF97] text-black"
                      : "text-zinc-500 hover:text-white"
                  }`}
                >
                  <Hand size={16} />
                </button>

                <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

                {/* Undo/Redo */}
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className="disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Undo2
                    size={16}
                    className="text-zinc-500 hover:text-white cursor-pointer"
                  />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className="disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Redo2
                    size={16}
                    className="text-zinc-500 hover:text-white cursor-pointer"
                  />
                </button>

                <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

                {/* Zoom Controls */}
                <button
                  onClick={() => zoomOut()}
                  className="text-zinc-500 hover:text-white cursor-pointer"
                >
                  <ZoomOut size={16} />
                </button>
                <button
                  onClick={() => zoomIn()}
                  className="text-zinc-500 hover:text-white cursor-pointer"
                >
                  <ZoomIn size={16} />
                </button>
                <button
                  onClick={() => fitView()}
                  className="text-zinc-500 hover:text-white cursor-pointer"
                >
                  <Maximize2 size={16} />
                </button>

                <div className="w-[1px] h-4 bg-white/10 mx-1"></div>

                {/* Reset All Nodes */}
                <button
                  onClick={handleResetAllNodes}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-white/5 cursor-pointer transition-colors"
                  title="Reset all nodes"
                >
                  <RotateCcw size={16} />
                  <span className="text-[11px] font-medium whitespace-nowrap">Reset All</span>
                </button>
              </div>
            </Panel>

            <MiniMap
              position="bottom-right"
              className="workflow-minimap"
              nodeColor={(node) => {
                if (node.type === NODE_TYPES.TEXT) return "#A78BFA";
                if (node.type === NODE_TYPES.IMAGE) return "#4ADE80";
                if (node.type === NODE_TYPES.LLM) return "#C084FC";
                return "#8B5CF6";
              }}
              nodeStrokeWidth={3}
              maskColor="rgba(0, 0, 0, 0.4)"
              pannable
              zoomable
              style={{
                backgroundColor: "#1A1A1A",
                borderRadius: "8px",
                border: "1px solid #3F3F46",
                width: 200,
                height: 150,
              }}
            />
            <Controls 
              position="top-right"
              showZoom={false}
              showFitView={false}
              showInteractive={false}
            />
          </ReactFlow>
        </div>
      </main>

      {/* Right Config Sidebar */}
      {selectedNodeId && (
        <NodeConfigSidebar
          nodeId={selectedNodeId}
          onClose={() => setSelectedNodeId(null)}
        />      )}

      {/* Task Manager */}
      {showTasks && (
        <TaskManager
          executions={executions || []}
          onClose={() => setShowTasks(false)}
          onClearAll={handleClearAllExecutions}
        />
      )}
    </div>
  );
}

export default function WorkflowPage() {
  return (
    <ReactFlowProvider>
      <WorkflowCanvas />
    </ReactFlowProvider>
  );
}