/**
 * Node types supported in the workflow
 */
export const NODE_TYPES = {
  TEXT: "textNode",
  IMAGE: "imageNode",
  UPLOAD_IMAGE: "uploadImageNode",
  CROP_IMAGE: "cropImageNode",
  LLM: "llmNode",
} as const;

export type NodeType = (typeof NODE_TYPES)[keyof typeof NODE_TYPES];

/**
 * Handle types for connections
 */
export const HANDLE_TYPES = {
  TEXT_OUTPUT: "text-output",
  TEXT_INPUT: "text-input",
  IMAGE_OUTPUT: "image-output",
  SYSTEM_PROMPT_INPUT: "system-prompt-input",
  USER_MESSAGE_INPUT: "user-message-input",
  IMAGE_INPUT: "image-input",
  LLM_OUTPUT: "llm-output",
} as const;

export type HandleType = (typeof HANDLE_TYPES)[keyof typeof HANDLE_TYPES];

/**
 * Connection validation rules
 */
export const CONNECTION_RULES: Record<HandleType, HandleType[]> = {
  [HANDLE_TYPES.TEXT_OUTPUT]: [
    HANDLE_TYPES.SYSTEM_PROMPT_INPUT,
    HANDLE_TYPES.USER_MESSAGE_INPUT,
    HANDLE_TYPES.TEXT_INPUT,
  ],
  [HANDLE_TYPES.IMAGE_OUTPUT]: [HANDLE_TYPES.IMAGE_INPUT],
  [HANDLE_TYPES.LLM_OUTPUT]: [
    HANDLE_TYPES.SYSTEM_PROMPT_INPUT,
    HANDLE_TYPES.USER_MESSAGE_INPUT,
    HANDLE_TYPES.TEXT_INPUT,
  ],
  [HANDLE_TYPES.SYSTEM_PROMPT_INPUT]: [],
  [HANDLE_TYPES.USER_MESSAGE_INPUT]: [],
  [HANDLE_TYPES.IMAGE_INPUT]: [],
  [HANDLE_TYPES.TEXT_INPUT]: [],
};

/**
 * Check if a connection between two handles is valid
 */
export function isValidConnection(sourceHandle: string, targetHandle: string): boolean {
  const validTargets = CONNECTION_RULES[sourceHandle as HandleType];
  return validTargets ? validTargets.includes(targetHandle as HandleType) : false;
}

/**
 * Gemini model configurations
 */
export const GEMINI_MODELS = [
    {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Latest fast model with enhanced capabilities",
    supportsVision: true,
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    description: "Fast and efficient model for most tasks",
    supportsVision: true,
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    description: "Most capable model for complex tasks",
    supportsVision: true,
  },
  {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash (Experimental)",
    description: "Latest experimental flash model",
    supportsVision: true,
  },
] as const;

export type GeminiModel = (typeof GEMINI_MODELS)[number]["id"];
