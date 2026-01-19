import type { WorkflowNode, WorkflowEdge } from "@/store/workflow.store";

/**
 * Detect if the workflow contains cycles (not a DAG)
 * Returns true if cycle is detected
 */
export function detectCycle(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
  const adjacencyList = new Map<string, string[]>();
  
  // Build adjacency list
  nodes.forEach((node) => adjacencyList.set(node.id, []));
  edges.forEach((edge) => {
    const neighbors = adjacencyList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacencyList.set(edge.source, neighbors);
  });

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function hasCycleDFS(nodeId: string): boolean {
    visited.add(nodeId);
    recursionStack.add(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycleDFS(neighbor)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true;
      }
    }

    recursionStack.delete(nodeId);
    return false;
  }

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (hasCycleDFS(node.id)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get all connected input nodes for a target node
 */
export function getConnectedInputs(
  nodeId: string,
  edges: WorkflowEdge[],
  nodes: WorkflowNode[]
): {
  systemPrompt?: string;
  userMessage?: string;
  images: string[];
} {
  const result = {
    systemPrompt: undefined as string | undefined,
    userMessage: undefined as string | undefined,
    images: [] as string[],
  };

  const connectedEdges = edges.filter((edge) => edge.target === nodeId);

  for (const edge of connectedEdges) {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (!sourceNode) continue;

    const targetHandle = edge.targetHandle;

    if (targetHandle === "system-prompt-input" && sourceNode.data.value) {
      result.systemPrompt = sourceNode.data.value;
    } else if (targetHandle === "user-message-input" && sourceNode.data.value) {
      result.userMessage = sourceNode.data.value;
    } else if (targetHandle === "image-input" && sourceNode.data.value) {
      result.images.push(sourceNode.data.value);
    }
  }

  return result;
}

/**
 * Topological sort for workflow execution order
 */
export function topologicalSort(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  nodes.forEach((node) => {
    adjacencyList.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  // Build graph
  edges.forEach((edge) => {
    const neighbors = adjacencyList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacencyList.set(edge.source, neighbors);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  // Find nodes with no incoming edges
  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  const sorted: WorkflowNode[] = [];

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    const node = nodes.find((n) => n.id === nodeId);
    if (node) sorted.push(node);

    const neighbors = adjacencyList.get(nodeId) || [];
    neighbors.forEach((neighbor) => {
      const degree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, degree);
      if (degree === 0) {
        queue.push(neighbor);
      }
    });
  }

  return sorted;
}

/**
 * Export workflow to JSON
 */
export function exportWorkflow(
  name: string,
  description: string | null,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): string {
  const workflow = {
    version: "1.0.0",
    name,
    description,
    nodes,
    edges,
    exportedAt: new Date().toISOString(),
  };

  return JSON.stringify(workflow, null, 2);
}

/**
 * Import workflow from JSON
 */
export function importWorkflow(json: string): {
  name: string;
  description: string | null;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
} {
  try {
    const data = JSON.parse(json);
    
    if (!data.nodes || !data.edges) {
      throw new Error("Invalid workflow format");
    }

    return {
      name: data.name || "Imported Workflow",
      description: data.description || null,
      nodes: data.nodes,
      edges: data.edges,
    };
  } catch (error) {
    throw new Error("Failed to parse workflow JSON");
  }
}
