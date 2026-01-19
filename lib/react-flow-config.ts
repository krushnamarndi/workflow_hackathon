import { type Edge, type Connection, MarkerType } from "@xyflow/react";
import { isValidConnection, HANDLE_TYPES } from "./workflow-types";

/**
 * Default edge style matching Weavy's design
 */
export const defaultEdgeOptions = {
  type: "smoothstep",
  animated: true,
  style: {
    stroke: "#8B5CF6", // Purple color
    strokeWidth: 2,
  },
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#8B5CF6",
  },
};

/**
 * Validate if a connection is allowed based on handle types
 */
export function isConnectionAllowed(connection: Connection): boolean {
  if (!connection.source || !connection.target) return false;
  if (!connection.sourceHandle || !connection.targetHandle) return false;

  return isValidConnection(connection.sourceHandle, connection.targetHandle);
}

/**
 * Generate a unique edge ID from connection
 */
export function getEdgeId(connection: Connection): string {
  return `${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`;
}

/**
 * Create an edge from a connection
 */
export function createEdge(connection: Connection): Edge {
  return {
    id: getEdgeId(connection),
    source: connection.source!,
    target: connection.target!,
    sourceHandle: connection.sourceHandle!,
    targetHandle: connection.targetHandle!,
    ...defaultEdgeOptions,
  };
}

/**
 * Default node types configuration for React Flow
 */
export const nodeTypes = {
  textNode: "textNode",
  imageNode: "imageNode",
  uploadImageNode: "uploadImageNode",
  cropImageNode: "cropImageNode",
  llmNode: "llmNode",
};

/**
 * Get node color based on type
 */
export function getNodeColor(nodeType: string): string {
  switch (nodeType) {
    case "textNode":
      return "#10B981"; // Green
    case "imageNode":
      return "#3B82F6"; // Blue
    case "uploadImageNode":
      return "#F59E0B"; // Amber/Orange
    case "cropImageNode":
      return "#EC4899"; // Pink
    case "llmNode":
      return "#8B5CF6"; // Purple
    default:
      return "#6B7280"; // Gray
  }
}

/**
 * React Flow configuration for the canvas
 */
export const reactFlowConfig = {
  defaultViewport: { x: 0, y: 0, zoom: 1 },
  minZoom: 0.1,
  maxZoom: 2,
  snapToGrid: true,
  snapGrid: [15, 15] as [number, number],
  connectionMode: "loose" as const,
  fitView: false,
  attributionPosition: "bottom-left" as const,
};

/**
 * Generate a unique node ID
 */
export function generateNodeId(type: string): string {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
