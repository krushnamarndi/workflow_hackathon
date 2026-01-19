import { Node, Edge } from "@xyflow/react";
import { NODE_TYPES, HANDLE_TYPES } from "./workflow-types";

/**
 * Performs topological sort on workflow nodes to determine execution order
 */
export function topologicalSort(nodes: Node[], edges: Edge[]): Node[] {
  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  nodes.forEach((node) => {
    adjacencyList.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  // Build adjacency list and in-degree count
  edges.forEach((edge) => {
    const neighbors = adjacencyList.get(edge.source) || [];
    neighbors.push(edge.target);
    adjacencyList.set(edge.source, neighbors);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  });

  // Find all nodes with no incoming edges
  const queue: string[] = [];
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  const sortedIds: string[] = [];

  // Process nodes in topological order
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    sortedIds.push(nodeId);

    const neighbors = adjacencyList.get(nodeId) || [];
    neighbors.forEach((neighbor) => {
      const newDegree = (inDegree.get(neighbor) || 0) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    });
  }

  // Convert sorted IDs back to nodes
  return sortedIds
    .map((id) => nodes.find((n) => n.id === id))
    .filter((n): n is Node => n !== undefined);
}

/**
 * Gets input data for a node from its connected sources
 */
export function getNodeInputs(
  nodeId: string,
  nodes: Node[],
  edges: Edge[]
): {
  systemPrompt?: string;
  userMessage?: string;
  images?: string[];
} {
  const connectedEdges = edges.filter((edge) => edge.target === nodeId);

  let systemPrompt = "";
  let userMessage = "";
  const images: string[] = [];

  connectedEdges.forEach((edge) => {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (!sourceNode) return;

    if (edge.targetHandle === HANDLE_TYPES.SYSTEM_PROMPT_INPUT) {
      systemPrompt = String(sourceNode.data.value || sourceNode.data.output || "");
    } else if (edge.targetHandle === HANDLE_TYPES.USER_MESSAGE_INPUT) {
      userMessage = String(sourceNode.data.value || sourceNode.data.output || "");
    } else if (edge.targetHandle === HANDLE_TYPES.IMAGE_INPUT) {
      const nodeImages = Array.isArray(sourceNode.data.images) ? sourceNode.data.images : [];
      images.push(...nodeImages);
    }
  });

  return { systemPrompt, userMessage, images };
}

/**
 * Checks if a node can be executed (all dependencies satisfied)
 */
export function canExecuteNode(
  nodeId: string,
  nodes: Node[],
  edges: Edge[],
  executedNodes: Set<string>
): boolean {
  const incomingEdges = edges.filter((edge) => edge.target === nodeId);

  // Check if all source nodes have been executed
  return incomingEdges.every((edge) => executedNodes.has(edge.source));
}
