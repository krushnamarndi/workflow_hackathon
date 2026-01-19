import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Node, Edge, Viewport } from "@xyflow/react";

export type NodeData = {
  label?: string;
  value?: string;
  model?: string;
  systemPrompt?: string;
  userMessage?: string;
  images?: string[];
  output?: string;
  isExecuting?: boolean;
  error?: string;
  [key: string]: any;
};

export type WorkflowNode = Node<NodeData>;
export type WorkflowEdge = Edge;

interface HistoryState {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface WorkflowState {
  // Workflow metadata
  workflowId: string | null;
  workflowName: string;
  workflowDescription: string | null;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;

  // React Flow state
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport: Viewport;

  // History for undo/redo
  history: HistoryState[];
  historyIndex: number;

  // Node execution state
  executingNodes: Set<string>;
  nodeOutputs: Map<string, string>;
  nodeErrors: Map<string, string>;

  // Actions - Workflow
  setWorkflowId: (id: string | null) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (description: string | null) => void;
  setIsSaving: (saving: boolean) => void;
  markSaved: () => void;
  markUnsaved: () => void;

  // Actions - Nodes
  setNodes: (nodes: WorkflowNode[] | ((nodes: WorkflowNode[]) => WorkflowNode[])) => void;
  addNode: (node: WorkflowNode) => void;
  updateNode: (nodeId: string, data: Partial<NodeData>) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  removeNode: (nodeId: string) => void;

  // Actions - Edges
  setEdges: (edges: WorkflowEdge[] | ((edges: WorkflowEdge[]) => WorkflowEdge[])) => void;
  addEdge: (edge: WorkflowEdge) => void;
  deleteEdge: (edgeId: string) => void;

  // Actions - Viewport
  setViewport: (viewport: Viewport) => void;

  // Actions - History
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  pushHistory: () => void;

  // Actions - Node execution
  setNodeExecuting: (nodeId: string, executing: boolean) => void;
  setNodeOutput: (nodeId: string, output: string) => void;
  setNodeError: (nodeId: string, error: string | null) => void;
  clearNodeExecution: (nodeId: string) => void;

  // Actions - Reset
  resetNode: (nodeId: string) => void;
  resetAllNodes: () => void;
  resetWorkflow: () => void;
  loadWorkflow: (data: {
    id: string;
    name: string;
    description: string | null;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    viewport?: Viewport;
  }) => void;
}

const initialState = {
  workflowId: null,
  workflowName: "Untitled Workflow",
  workflowDescription: null,
  isSaving: false,
  lastSaved: null,
  hasUnsavedChanges: false,
  nodes: [],
  edges: [],
  viewport: { x: 0, y: 0, zoom: 1 },
  history: [] as HistoryState[],
  historyIndex: -1,
  executingNodes: new Set<string>(),
  nodeOutputs: new Map<string, string>(),
  nodeErrors: new Map<string, string>(),
};

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Workflow actions
        setWorkflowId: (id) => set({ workflowId: id }),
        setWorkflowName: (name) => set({ workflowName: name, hasUnsavedChanges: true }),
        setWorkflowDescription: (description) =>
          set({ workflowDescription: description, hasUnsavedChanges: true }),
        setIsSaving: (saving) => set({ isSaving: saving }),
        markSaved: () => set({ lastSaved: new Date(), hasUnsavedChanges: false }),
        markUnsaved: () => set({ hasUnsavedChanges: true }),

        // Node actions
        setNodes: (nodes) => {
          const state = get();
          const newNodes = typeof nodes === "function" ? nodes(state.nodes) : nodes;
          set({ nodes: newNodes, hasUnsavedChanges: true });
          get().pushHistory();
        },

        addNode: (node) => {
          set((state) => ({
            nodes: [...state.nodes, node],
            hasUnsavedChanges: true,
          }));
          get().pushHistory();
        },

        updateNode: (nodeId, data) => {
          set((state) => ({
            nodes: state.nodes.map((node) => {
              if (node.id === nodeId) {
                const updatedData = { ...node.data, ...data };
                return {
                  ...node,
                  data: updatedData,
                  draggable: !updatedData.locked,
                  connectable: !updatedData.locked,
                  deletable: !updatedData.locked,
                };
              }
              return node;
            }),
            hasUnsavedChanges: true,
          }));
        },

        deleteNode: (nodeId) => {
          set((state) => ({
            nodes: state.nodes.filter((node) => node.id !== nodeId),
            edges: state.edges.filter(
              (edge) => edge.source !== nodeId && edge.target !== nodeId
            ),
            hasUnsavedChanges: true,
          }));
          get().pushHistory();
        },

        duplicateNode: (nodeId) => {
          const state = get();
          const nodeToDuplicate = state.nodes.find((node) => node.id === nodeId);
          if (!nodeToDuplicate) return;

          const newNode: WorkflowNode = {
            ...nodeToDuplicate,
            id: `${nodeToDuplicate.type}-${Date.now()}`,
            position: {
              x: nodeToDuplicate.position.x + 100,
              y: nodeToDuplicate.position.y + 100,
            },
            data: { ...nodeToDuplicate.data },
            selected: false,
            dragging: false,
          };

          set((state) => ({
            nodes: [...state.nodes.map(n => ({ ...n, selected: false })), newNode],
            hasUnsavedChanges: true,
          }));
          get().pushHistory();
        },

        removeNode: (nodeId) => {
          get().deleteNode(nodeId);
        },

        // Edge actions
        setEdges: (edges) => {
          const state = get();
          const newEdges = typeof edges === "function" ? edges(state.edges) : edges;
          set({ edges: newEdges, hasUnsavedChanges: true });
          get().pushHistory();
        },

        addEdge: (edge) => {
          set((state) => ({
            edges: [...state.edges, edge],
            hasUnsavedChanges: true,
          }));
          get().pushHistory();
        },

        deleteEdge: (edgeId) => {
          set((state) => ({
            edges: state.edges.filter((edge) => edge.id !== edgeId),
            hasUnsavedChanges: true,
          }));
          get().pushHistory();
        },

        // Viewport actions
        setViewport: (viewport) => set({ viewport }),

        // History actions
        pushHistory: () => {
          const state = get();
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push({
            nodes: JSON.parse(JSON.stringify(state.nodes)),
            edges: JSON.parse(JSON.stringify(state.edges)),
          });
          
          // Limit history to 50 items
          if (newHistory.length > 50) {
            newHistory.shift();
            set({ history: newHistory, historyIndex: newHistory.length - 1 });
          } else {
            set({ history: newHistory, historyIndex: newHistory.length - 1 });
          }
        },

        undo: () => {
          const state = get();
          if (state.historyIndex > 0) {
            const newIndex = state.historyIndex - 1;
            const historyState = state.history[newIndex];
            set({
              nodes: JSON.parse(JSON.stringify(historyState.nodes)),
              edges: JSON.parse(JSON.stringify(historyState.edges)),
              historyIndex: newIndex,
              hasUnsavedChanges: true,
            });
          }
        },

        redo: () => {
          const state = get();
          if (state.historyIndex < state.history.length - 1) {
            const newIndex = state.historyIndex + 1;
            const historyState = state.history[newIndex];
            set({
              nodes: JSON.parse(JSON.stringify(historyState.nodes)),
              edges: JSON.parse(JSON.stringify(historyState.edges)),
              historyIndex: newIndex,
              hasUnsavedChanges: true,
            });
          }
        },

        canUndo: () => {
          const state = get();
          return state.historyIndex > 0;
        },

        canRedo: () => {
          const state = get();
          return state.historyIndex < state.history.length - 1;
        },

        // Node execution actions
        setNodeExecuting: (nodeId, executing) =>
          set((state) => {
            const newExecutingNodes = new Set(state.executingNodes);
            if (executing) {
              newExecutingNodes.add(nodeId);
            } else {
              newExecutingNodes.delete(nodeId);
            }
            return { executingNodes: newExecutingNodes };
          }),

        setNodeOutput: (nodeId, output) =>
          set((state) => {
            const newOutputs = new Map(state.nodeOutputs);
            newOutputs.set(nodeId, output);
            return { nodeOutputs: newOutputs };
          }),

        setNodeError: (nodeId, error) =>
          set((state) => {
            const newErrors = new Map(state.nodeErrors);
            if (error) {
              newErrors.set(nodeId, error);
            } else {
              newErrors.delete(nodeId);
            }
            return { nodeErrors: newErrors };
          }),

        clearNodeExecution: (nodeId) =>
          set((state) => {
            const newExecutingNodes = new Set(state.executingNodes);
            const newOutputs = new Map(state.nodeOutputs);
            const newErrors = new Map(state.nodeErrors);

            newExecutingNodes.delete(nodeId);
            newOutputs.delete(nodeId);
            newErrors.delete(nodeId);

            return {
              executingNodes: newExecutingNodes,
              nodeOutputs: newOutputs,
              nodeErrors: newErrors,
            };
          }),

        // Reset actions
        resetNode: (nodeId) => {
          get().clearNodeExecution(nodeId);
          set((state) => ({
            nodes: state.nodes.map((node) => {
              if (node.id === nodeId) {
                // Clear data based on node type
                const resetData = { ...node.data };
                
                // Clear LLM node data
                delete resetData.output;
                delete resetData.error;
                delete resetData.isExecuting;
                
                // Clear Text node data
                if (node.type === 'textNode') {
                  resetData.value = '';
                }
                
                // Clear Image node data
                if (node.type === 'imageNode') {
                  resetData.images = [];
                }
                
                return { ...node, data: resetData };
              }
              return node;
            }),
            hasUnsavedChanges: true,
          }));
        },

        resetAllNodes: () => {
          const state = get();
          // Clear all execution states
          state.executingNodes.clear();
          state.nodeOutputs.clear();
          state.nodeErrors.clear();

          set((state) => ({
            nodes: state.nodes.map((node) => {
              // Clear data based on node type
              const resetData = { ...node.data };
              
              // Clear LLM node data
              delete resetData.output;
              delete resetData.error;
              delete resetData.isExecuting;
              
              // Clear Text node data
              if (node.type === 'textNode') {
                resetData.value = '';
              }
              
              // Clear Image node data
              if (node.type === 'imageNode') {
                resetData.images = [];
              }
              
              return { ...node, data: resetData };
            }),
            executingNodes: new Set(),
            nodeOutputs: new Map(),
            nodeErrors: new Map(),
            hasUnsavedChanges: true,
          }));
        },

        resetWorkflow: () => set(initialState),

        loadWorkflow: (data) =>
          set({
            workflowId: data.id,
            workflowName: data.name,
            workflowDescription: data.description,
            nodes: data.nodes,
            edges: data.edges,
            viewport: data.viewport || { x: 0, y: 0, zoom: 1 },
            hasUnsavedChanges: false,
            lastSaved: new Date(),
            executingNodes: new Set(),
            nodeOutputs: new Map(),
            nodeErrors: new Map(),
          }),
      }),
      {
        name: "workflow-storage",
        partialize: (state) => ({
          workflowId: state.workflowId,
          workflowName: state.workflowName,
          workflowDescription: state.workflowDescription,
          nodes: state.nodes,
          edges: state.edges,
          viewport: state.viewport,
        }),
      }
    )
  )
);
