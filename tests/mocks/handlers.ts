/**
 * MSW Request Handlers
 * 
 * Define mock API handlers for testing.
 * These intercept network requests and return mock responses.
 */

import { http, HttpResponse, delay } from "msw";

// ============================================================================
// Base URL
// ============================================================================

const API_BASE = "/api/trpc";

// ============================================================================
// Mock Data
// ============================================================================

export const mockUser = {
  id: "test-user-id",
  clerkId: "clerk-test-id",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  credits: 1000000, // 1M credits = $1
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockWorkflow = {
  id: "workflow-1",
  userId: "test-user-id",
  name: "Test Workflow",
  description: "A test workflow",
  data: {
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  },
  folderId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockExecution = {
  id: "exec-1",
  workflowId: "workflow-1",
  userId: "test-user-id",
  nodeId: "node-1",
  runId: "run-1",
  status: "completed",
  input: { prompt: "test" },
  output: { result: "success" },
  error: null,
  createdAt: new Date().toISOString(),
  completedAt: new Date().toISOString(),
};

// ============================================================================
// tRPC Handlers
// ============================================================================

/**
 * Helper to create tRPC response format
 */
function trpcResponse(data: unknown) {
  return [{ result: { data } }];
}

function trpcError(message: string, code: string = "INTERNAL_SERVER_ERROR") {
  return [{ error: { message, code } }];
}

export const handlers = [
  // -------------------------------------------------------------------------
  // Workflow Router
  // -------------------------------------------------------------------------
  
  // workflow.list
  http.get(`${API_BASE}/workflow.list`, async () => {
    await delay(100);
    return HttpResponse.json(trpcResponse([mockWorkflow]));
  }),
  
  // workflow.get
  http.get(`${API_BASE}/workflow.get`, async ({ request }) => {
    const url = new URL(request.url);
    const input = url.searchParams.get("input");
    
    if (input) {
      const { id } = JSON.parse(input);
      if (id === "not-found") {
        return HttpResponse.json(trpcError("Workflow not found", "NOT_FOUND"), {
          status: 404,
        });
      }
    }
    
    await delay(100);
    return HttpResponse.json(trpcResponse(mockWorkflow));
  }),
  
  // workflow.create
  http.post(`${API_BASE}/workflow.create`, async ({ request }) => {
    const body = await request.json();
    await delay(100);
    return HttpResponse.json(
      trpcResponse({
        ...mockWorkflow,
        id: "new-workflow-id",
        ...(body as object),
      })
    );
  }),
  
  // workflow.update
  http.post(`${API_BASE}/workflow.update`, async ({ request }) => {
    const body = await request.json();
    await delay(100);
    return HttpResponse.json(
      trpcResponse({
        ...mockWorkflow,
        ...(body as object),
        updatedAt: new Date().toISOString(),
      })
    );
  }),
  
  // workflow.delete
  http.post(`${API_BASE}/workflow.delete`, async () => {
    await delay(100);
    return HttpResponse.json(trpcResponse({ success: true }));
  }),
  
  // -------------------------------------------------------------------------
  // Execution Router
  // -------------------------------------------------------------------------
  
  // execution.list
  http.get(`${API_BASE}/execution.list`, async () => {
    await delay(100);
    return HttpResponse.json(trpcResponse([mockExecution]));
  }),
  
  // execution.create
  http.post(`${API_BASE}/execution.create`, async ({ request }) => {
    const body = await request.json();
    await delay(100);
    return HttpResponse.json(
      trpcResponse({
        ...mockExecution,
        id: "new-exec-id",
        ...(body as object),
      })
    );
  }),
  
  // execution.update
  http.post(`${API_BASE}/execution.update`, async ({ request }) => {
    const body = await request.json();
    await delay(100);
    return HttpResponse.json(
      trpcResponse({
        ...mockExecution,
        ...(body as object),
      })
    );
  }),
  
  // -------------------------------------------------------------------------
  // LLM Router
  // -------------------------------------------------------------------------
  
  // llm.execute
  http.post(`${API_BASE}/llm.execute`, async () => {
    await delay(500);
    return HttpResponse.json(
      trpcResponse({
        output: "This is a mock LLM response.",
        tokensUsed: { input: 10, output: 20 },
      })
    );
  }),
  
  // llm.getModels
  http.get(`${API_BASE}/llm.getModels`, async () => {
    await delay(100);
    return HttpResponse.json(
      trpcResponse([
        { id: "gpt-4", name: "GPT-4" },
        { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo" },
        { id: "claude-3-opus", name: "Claude 3 Opus" },
      ])
    );
  }),
  
  // -------------------------------------------------------------------------
  // Folder Router
  // -------------------------------------------------------------------------
  
  // folder.listRoot
  http.get(`${API_BASE}/folder.listRoot`, async () => {
    await delay(100);
    return HttpResponse.json(
      trpcResponse({
        folders: [],
        workflows: [mockWorkflow],
      })
    );
  }),
  
  // folder.create
  http.post(`${API_BASE}/folder.create`, async ({ request }) => {
    const body = await request.json();
    await delay(100);
    return HttpResponse.json(
      trpcResponse({
        id: "new-folder-id",
        name: (body as { name?: string }).name || "New Folder",
        parentId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
  }),
  
  // -------------------------------------------------------------------------
  // Credits Router (for future implementation)
  // -------------------------------------------------------------------------
  
  // credits.getBalance
  http.get(`${API_BASE}/credits.getBalance`, async () => {
    await delay(100);
    return HttpResponse.json(
      trpcResponse({
        balance: mockUser.credits,
        currency: "credits",
      })
    );
  }),
  
  // credits.estimate
  http.post(`${API_BASE}/credits.estimate`, async () => {
    await delay(100);
    return HttpResponse.json(
      trpcResponse({
        estimated: 50000, // 50k credits
        breakdown: [
          { nodeId: "node-1", cost: 25000 },
          { nodeId: "node-2", cost: 25000 },
        ],
      })
    );
  }),
  
  // -------------------------------------------------------------------------
  // External API Mocks (for provider testing)
  // -------------------------------------------------------------------------
  
  // fal.ai mock
  http.post("https://fal.run/*", async () => {
    await delay(300);
    return HttpResponse.json({
      request_id: "fal-request-123",
      status: "completed",
      output: {
        image_url: "https://example.com/generated-image.png",
      },
    });
  }),
  
  // OpenRouter mock
  http.post("https://openrouter.ai/api/v1/chat/completions", async () => {
    await delay(300);
    return HttpResponse.json({
      id: "chatcmpl-123",
      choices: [
        {
          message: {
            role: "assistant",
            content: "Mock OpenRouter response",
          },
        },
      ],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
    });
  }),
];

// ============================================================================
// Handler Utilities
// ============================================================================

/**
 * Create a handler that simulates network latency
 */
export function withLatency<T>(data: T, ms: number = 100) {
  return async () => {
    await delay(ms);
    return HttpResponse.json(trpcResponse(data));
  };
}

/**
 * Create a handler that simulates an error
 */
export function withError(message: string, status: number = 500) {
  return async () => {
    await delay(50);
    return HttpResponse.json(trpcError(message), { status });
  };
}
