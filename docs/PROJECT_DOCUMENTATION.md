# Weavy AI — Technical Documentation

**Version:** 0.1.0  
**Last Updated:** January 2026  
**Status:** Development / MVP

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [System Architecture](#3-system-architecture)
4. [Folder & File Structure](#4-folder--file-structure)
5. [Core Logic & Workflows](#5-core-logic--workflows)
6. [UI & UX](#6-ui--ux)
7. [API & Integrations](#7-api--integrations)
8. [Configuration & Environment](#8-configuration--environment)
9. [Performance & Scalability](#9-performance--scalability)
10. [Setup & Development Guide](#10-setup--development-guide)
11. [Production Readiness](#11-production-readiness)

---

## 1. Project Overview

### Purpose

Weavy AI is a **visual workflow builder** for creating and executing AI-powered pipelines. It allows users to construct complex AI workflows using a drag-and-drop node-based interface, connect nodes to form execution pipelines, and run workflows with real-time progress visualization.

### Key Features

| Feature | Description |
|---------|-------------|
| **Visual Canvas** | React Flow-powered canvas with pan, zoom, minimap, and grid snapping |
| **Node Types** | Text, Image, Upload Image, Crop Image, and LLM (Gemini) nodes |
| **Type-Safe Connections** | Enforced connection validation (text→text, image→image) |
| **Cycle Detection** | Prevents circular dependencies in workflow DAGs |
| **Topological Execution** | Executes nodes in correct dependency order |
| **Real-Time Execution** | Live status updates with execution history tracking |
| **Undo/Redo** | Full history stack for canvas operations |
| **Auto-Save** | Debounced auto-save with 3-second delay |
| **Import/Export** | JSON-based workflow serialization |
| **Folder Organization** | Hierarchical folder structure for workflow management |
| **Background Jobs** | Trigger.dev integration for image processing tasks |

### Target Users / Use Cases

- **Content Creators**: Build AI-assisted content generation pipelines
- **E-commerce Teams**: Generate product descriptions, listings, and marketing copy
- **Developers**: Prototype AI workflows before implementing in production
- **Data Analysts**: Create multimodal analysis workflows combining text and images

---

## 2. Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | App Router-based React framework |
| **React 19** | UI library |
| **TypeScript (strict)** | Type-safe development |
| **React Flow (v12)** | Visual workflow canvas |
| **Tailwind CSS 4** | Utility-first styling |
| **Framer Motion** | Animations and transitions |
| **Radix UI** | Accessible UI primitives |
| **Lucide React** | Icon library |
| **Sonner** | Toast notifications |

### Backend

| Technology | Purpose |
|------------|---------|
| **Next.js API Routes** | Serverless API endpoints |
| **tRPC** | End-to-end type-safe API layer |
| **Zod** | Runtime schema validation |
| **Prisma** | Database ORM |
| **Trigger.dev** | Background job execution |

### Database

| Technology | Purpose |
|------------|---------|
| **PostgreSQL** | Primary relational database |
| **Prisma Client** | Type-safe database access |

### Third-Party Services / APIs

| Service | Purpose |
|---------|---------|
| **Clerk** | Authentication & user management |
| **Google Generative AI (Gemini)** | LLM inference (1.5 Flash, 1.5 Pro, 2.0, 2.5 Flash) |
| **Transloadit** | Image upload, processing, and CDN delivery |
| **Svix** | Webhook signature verification |

### Tooling & DevOps

| Tool | Purpose |
|------|---------|
| **pnpm/npm** | Package management |
| **ESLint** | Code linting |
| **Prisma Migrate** | Database migrations |
| **Trigger.dev CLI** | Background job deployment |
| **Vercel** | Recommended hosting platform |

---

## 3. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                           CLIENT                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  React Flow │  │   Zustand   │  │  TanStack Query + tRPC  │  │
│  │   Canvas    │  │   Stores    │  │     Data Fetching       │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTP/WS
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                       NEXT.JS SERVER                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      tRPC Router                             ││
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐││
│  │  │ workflow │ │   llm    │ │  folder  │ │    execution     │││
│  │  │  router  │ │  router  │ │  router  │ │     router       │││
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Clerk Auth Middleware                     ││
│  └─────────────────────────────────────────────────────────────┘│
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │ Google Gemini│   │  Trigger.dev │
│   (Prisma)   │   │     API      │   │  (FFmpeg jobs)│
└──────────────┘   └──────────────┘   └──────────────┘
                                              │
                                              ▼
                                      ┌──────────────┐
                                      │ Transloadit  │
                                      │  (CDN/Upload)│
                                      └──────────────┘
```

### Data Flow Between Major Components

```
User Interaction → React Flow Canvas → Zustand Store → tRPC Mutation
                                                            │
                                         ┌──────────────────┴─────────────────┐
                                         ▼                                    ▼
                                  Prisma (CRUD)                     External API
                                         │                          (Gemini/Transloadit)
                                         ▼                                    │
                                   PostgreSQL                                 ▼
                                                                      Response
                                                                           │
                                         ┌─────────────────────────────────┘
                                         ▼
                               tRPC Query Invalidation → UI Update
```

### Async/Background Processing

Background jobs are handled by **Trigger.dev** for computationally intensive tasks:

| Task | Description |
|------|-------------|
| `crop-image` | FFmpeg-based image cropping with Transloadit upload |

**Task Execution Flow:**
1. Client invokes tRPC procedure
2. Server triggers Trigger.dev task
3. Task downloads image, processes with FFmpeg
4. Result uploaded to Transloadit CDN
5. CDN URL returned to client

---

## 4. Folder & File Structure

```
weavy-ai/
├── app/                          # Next.js App Router
│   ├── api/
│   │   ├── trpc/[trpc]/route.ts  # tRPC API handler
│   │   └── webhooks/clerk/       # Clerk webhook handler
│   ├── dashboard/page.tsx        # Main dashboard
│   ├── folder/[id]/page.tsx      # Folder view
│   ├── workflow/[id]/page.tsx    # Workflow editor (main canvas)
│   ├── sso-callback/page.tsx     # SSO redirect handler
│   ├── layout.tsx                # Root layout (Clerk + tRPC providers)
│   ├── globals.css               # Global styles
│   └── page.tsx                  # Landing/home page
│
├── components/
│   ├── sections/                 # Layout sections
│   │   ├── auth-card.tsx
│   │   ├── profile-dropdown.tsx
│   │   └── signin-*.tsx
│   ├── ui/                       # Shadcn/Radix components (56 files)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   └── ...
│   └── workflow/                 # Workflow-specific components
│       ├── TextNode.tsx          # Text input/output node
│       ├── ImageNode.tsx         # Image display node
│       ├── UploadImageNode.tsx   # Image upload node
│       ├── CropImageNode.tsx     # Image cropping node
│       ├── LLMNode.tsx           # Gemini LLM execution node
│       ├── WorkflowSidebar.tsx   # Node palette sidebar
│       ├── NodeConfigSidebar.tsx # Node configuration panel
│       └── TaskManager.tsx       # Execution history panel
│
├── hooks/
│   ├── use-mobile.ts             # Mobile detection hook
│   └── use-workflow-operations.ts
│
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── trpc/
│   │   ├── client.ts             # tRPC client utilities
│   │   └── provider.tsx          # TRPCProvider component
│   ├── utils.ts                  # General utilities (cn, etc.)
│   ├── react-flow-config.ts      # React Flow configuration
│   ├── workflow-types.ts         # Node/handle type definitions
│   ├── workflow-utils.ts         # Workflow utilities
│   └── workflow-execution.ts     # Topological sort, input resolution
│
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration history
│
├── server/
│   ├── index.ts                  # Main tRPC router composition
│   ├── trpc.ts                   # tRPC context & procedures
│   ├── routers/
│   │   ├── workflow.router.ts    # Workflow CRUD
│   │   ├── llm.router.ts         # Gemini LLM execution
│   │   ├── folder.router.ts      # Folder management
│   │   ├── execution.router.ts   # Execution history
│   │   └── cropImage.router.ts   # Crop image trigger
│   └── schemas/
│       └── workflow.schema.ts    # Zod validation schemas
│
├── src/trigger/
│   ├── index.ts                  # Trigger.dev task exports
│   └── crop-image.ts             # Image cropping task
│
├── store/
│   ├── workflow.store.ts         # Workflow state (nodes, edges, history)
│   └── ui.store.ts               # UI state (sidebar, modals)
│
├── types/
│   └── index.ts                  # Shared TypeScript types
│
├── trigger.config.ts             # Trigger.dev configuration
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json                  # Dependencies & scripts
```

### Key Files and Responsibilities

| File | Responsibility |
|------|----------------|
| `app/workflow/[id]/page.tsx` | Main workflow canvas, execution logic, keyboard shortcuts |
| `store/workflow.store.ts` | Zustand store for nodes, edges, undo/redo, execution state |
| `server/routers/llm.router.ts` | Gemini API integration for LLM execution |
| `lib/workflow-execution.ts` | Topological sort, dependency resolution |
| `lib/workflow-types.ts` | Node types, handle types, connection rules |
| `prisma/schema.prisma` | User, Folder, Workflow, WorkflowExecution models |
| `src/trigger/crop-image.ts` | FFmpeg-based image cropping job |

---

## 5. Core Logic & Workflows

### Key Business Logic

#### 1. Node Type System

Nodes are defined with specific input/output handle types:

```typescript
export const NODE_TYPES = {
  TEXT: "textNode",
  IMAGE: "imageNode",
  UPLOAD_IMAGE: "uploadImageNode",
  CROP_IMAGE: "cropImageNode",
  LLM: "llmNode",
} as const;

export const HANDLE_TYPES = {
  TEXT_OUTPUT: "text-output",
  TEXT_INPUT: "text-input",
  IMAGE_OUTPUT: "image-output",
  SYSTEM_PROMPT_INPUT: "system-prompt-input",
  USER_MESSAGE_INPUT: "user-message-input",
  IMAGE_INPUT: "image-input",
  LLM_OUTPUT: "llm-output",
} as const;
```

#### 2. Connection Validation Rules

Connections are type-safe and validated:

```typescript
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
  // Input handles have empty arrays (cannot be sources)
};
```

#### 3. Cycle Detection

DAG validation prevents circular dependencies:

```typescript
function createsCycle(edges: Edge[], sourceId: string, targetId: string): boolean {
  // Build adjacency list
  // DFS to detect back edges
  // Returns true if adding edge creates cycle
}
```

### Main Workflows (Step-by-Step)

#### Workflow Execution Flow

```
1. User clicks "Run All" button
   │
2. Topological sort of all nodes
   │
3. For each node in sorted order:
   │
   ├── If Text/Image node:
   │   └── Create execution record with current value
   │
   └── If LLM node:
       │
       ├── a. Get inputs from connected nodes (systemPrompt, userMessage, images)
       ├── b. Create execution record (status: "running")
       ├── c. Call Gemini API via tRPC
       ├── d. Update node with output
       ├── e. Propagate output to connected downstream nodes
       └── f. Update execution record (status: "completed" or "failed")
   │
4. Refetch execution history to update Task Manager
```

#### Node Input Resolution

```typescript
export function getNodeInputs(nodeId, nodes, edges) {
  // Find all edges targeting this node
  // For each connected source node:
  //   - Extract value/output based on handle type
  //   - Build systemPrompt, userMessage, images object
  return { systemPrompt, userMessage, images };
}
```

### Background Jobs / Tasks

#### Crop Image Task (Trigger.dev)

```
1. Receive payload: imageUrl, x, y, width, height (percentages)
2. Download image to temp file
3. Get dimensions via FFprobe
4. Convert percentages to pixels
5. Execute FFmpeg crop command
6. Upload result to Transloadit
7. Poll assembly for completion
8. Return CDN URL
9. Cleanup temp files
```

### Error Handling & Edge Cases

| Scenario | Handling |
|----------|----------|
| Invalid connection type | Toast error + connection rejected |
| Cycle detected | Toast warning + connection rejected |
| LLM API failure | Node shows error state, execution marked "failed" |
| Missing user message | Validation error, execution blocked |
| FFmpeg failure | Task returns error, job marked failed |
| Transloadit timeout | 30-second polling limit, throws error |
| Clerk webhook signature invalid | 400 response |

---

## 6. UI & UX

### Layout Structure

```
┌────────────────────────────────────────────────────────────────┐
│ Primary Sidebar (56px) │ Secondary Sidebar │    Main Canvas    │
│ (Icon navigation)      │ (Node palette)    │   (React Flow)    │
│                        │ - Quick access    │                   │
│ [w] Logo               │ - Sample workflows│   ┌─────────────┐ │
│ [Search]               │                   │   │   Nodes     │ │
│                        │                   │   │   & Edges   │ │
│ [Image]                │                   │   │             │ │
│ [Help]                 │                   │   └─────────────┘ │
│ [Chat]                 │                   │                   │
│                        │                   │   [Bottom Toolbar]│
│                        │                   │   [MiniMap]       │
└────────────────────────────────────────────────────────────────┘
```

### Major Screens/Pages

| Route | Description |
|-------|-------------|
| `/` | Landing/home page |
| `/dashboard` | Workflow library, folder browser |
| `/workflow/[id]` | Workflow editor canvas |
| `/workflow/new` | New workflow (unsaved) |
| `/folder/[id]` | Folder contents view |
| `/sso-callback` | Clerk SSO redirect handler |

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `WorkflowCanvas` | Main editor, drag-drop, execution logic |
| `WorkflowSidebar` | Node palette with draggable node cards |
| `NodeConfigSidebar` | LLM node configuration panel |
| `TaskManager` | Execution history with grouped runs |
| `TextNode` | Text input/output with editable textarea |
| `LLMNode` | LLM execution with output display |
| `ImageNode` | Image display/upload |

### State Management Approach

**Zustand Stores:**

1. **`workflow.store.ts`** — Primary state
   - `nodes`, `edges`, `viewport` — React Flow state
   - `history`, `historyIndex` — Undo/redo stack (50-item limit)
   - `executingNodes`, `nodeOutputs`, `nodeErrors` — Execution state
   - `workflowId`, `workflowName`, `hasUnsavedChanges` — Metadata
   - Persisted to localStorage (partial)

2. **`ui.store.ts`** — UI state
   - `isSidebarCollapsed`, `sidebarWidth`
   - `isWorkflowSettingsOpen`, `selectedNodeId`
   - `notifications` — Toast queue
   - `isLoadingWorkflow`

### Loading, Error, and Empty States

| State | Implementation |
|-------|----------------|
| Loading workflow | Query loading state, skeleton UI |
| LLM executing | Node shows "Generating..." with pulse animation |
| Execution error | Red error message in node, error in Task Manager |
| Empty dashboard | "No files or folders yet" message |
| Empty Task Manager | Clock icon + "No executions yet" |
| Connection invalid | Toast error with description |

---

## 7. API & Integrations

### Internal APIs (tRPC Routers)

#### Workflow Router (`workflow.router.ts`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `create` | Mutation | Create new workflow |
| `update` | Mutation | Update workflow (name, data) |
| `delete` | Mutation | Delete workflow |
| `get` | Query | Get workflow by ID |
| `list` | Query | List all user workflows |
| `duplicate` | Mutation | Clone a workflow |
| `rename` | Mutation | Rename workflow |
| `move` | Mutation | Move to folder |

#### LLM Router (`llm.router.ts`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `execute` | Mutation | Execute Gemini model (text + optional images) |
| `getModels` | Query | List available Gemini models |

#### Folder Router (`folder.router.ts`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `create` | Mutation | Create folder |
| `update` | Mutation | Rename folder |
| `delete` | Mutation | Delete folder (cascades) |
| `get` | Query | Get folder with children/workflows |
| `listRoot` | Query | List root-level items |
| `listAll` | Query | List all folders (for move dialog) |
| `getBreadcrumb` | Query | Get folder path |
| `search` | Query | Search folders/workflows |
| `move` | Mutation | Move folder (prevents cycles) |

#### Execution Router (`execution.router.ts`)

| Procedure | Type | Description |
|-----------|------|-------------|
| `create` | Mutation | Create execution record |
| `update` | Mutation | Update status/output |
| `list` | Query | List executions by workflow |
| `get` | Query | Get execution by ID |
| `delete` | Mutation | Delete execution |
| `deleteAll` | Mutation | Clear all executions for workflow |

### External Services

#### Google Gemini API

```typescript
// Configuration
const model = genAI.getGenerativeModel({
  model: input.model, // gemini-2.5-flash, gemini-1.5-pro, etc.
  systemInstruction: input.systemPrompt,
  generationConfig: {
    temperature: input.temperature,
    maxOutputTokens: input.maxTokens,
  },
});

// Multimodal support
if (input.images?.length > 0) {
  content = [input.userMessage, ...imageParts];
}
```

#### Transloadit (via Trigger.dev)

```typescript
// Assembly creation
const params = {
  auth: { key: payload.transloaditKey },
  steps: {
    ":original": { robot: "/upload/handle" },
  },
};

// Polling for completion
while (status.ok !== "ASSEMBLY_COMPLETED") {
  await fetch(assemblyStatus.assembly_url);
}
```

### Authentication & Authorization Flow

```
1. User visits protected route
2. Clerk middleware checks session
3. If unauthenticated → redirect to sign-in
4. If authenticated:
   a. Clerk provides userId in context
   b. tRPC procedures check ctx.userId
   c. All queries filter by userId (data isolation)
```

**Protected Procedure:**

```typescript
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to perform this action",
    });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId } });
});
```

### Validation & Security Considerations

| Area | Implementation |
|------|----------------|
| Input validation | Zod schemas on all tRPC inputs |
| SQL injection | Prisma ORM (parameterized queries) |
| XSS | React's built-in escaping |
| CSRF | tRPC + same-origin |
| Auth | Clerk middleware + userId filtering |
| Webhook verification | Svix signature validation |
| API key protection | Server-side only (not exposed to client) |

---

## 8. Configuration & Environment

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/weavy_ai"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=AIza...

# Trigger.dev
TRIGGER_PROJECT_ID=proj_...
TRIGGER_API_KEY=tr_...

# Transloadit
TRANSLOADIT_AUTH_KEY=...

# Optional
PORT=3000
VERCEL_URL=your-app.vercel.app
```

### Secrets Handling

| Secret | Storage |
|--------|---------|
| Database URL | Environment variable |
| Clerk keys | Environment variable |
| Gemini API key | Server-side env only |
| Transloadit key | Passed to Trigger.dev task |
| Webhook secret | Server-side env only |

### Local vs Production Setup

| Aspect | Local | Production |
|--------|-------|------------|
| Database | Local PostgreSQL | Hosted (Supabase, Neon, etc.) |
| Clerk | Development instance | Production instance |
| Trigger.dev | Dev mode (`enabledInDev: true`) | Cloud deployment |
| Transloadit | Test account | Production account |

---

## 9. Performance & Scalability

### Optimizations Used

| Optimization | Implementation |
|--------------|----------------|
| React memoization | `memo()` on all node components |
| Query caching | TanStack Query with 5s stale time |
| Debounced auto-save | 3-second delay before save |
| Lazy loading | Component-level code splitting |
| Connection batching | tRPC httpBatchLink |
| History limit | 50-item undo/redo stack |

### Parallelism / Async Execution

| Area | Approach |
|------|----------|
| Node execution | Sequential (respects DAG dependencies) |
| API calls | Parallel possible for independent branches |
| Background jobs | Trigger.dev handles concurrency |
| Database queries | Prisma connection pooling |

### Known Bottlenecks & Future Improvements

| Bottleneck | Current State | Improvement |
|------------|---------------|-------------|
| Sequential LLM calls | One at a time | Parallel independent branches |
| Full workflow save | Saves entire workflow JSON | Patch-based updates |
| Execution history | Fetched every 1s | WebSocket/SSE for real-time |
| Image processing | Single Trigger.dev worker | Scale workers |
| Large workflows | No virtualization | React Flow node virtualization |

---

## 10. Setup & Development Guide

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Clerk account (free tier available)
- Google AI API key
- (Optional) Trigger.dev account
- (Optional) Transloadit account

### Installation Steps

```bash
# 1. Clone repository
git clone <repository-url>
cd weavy-ai

# 2. Install dependencies
npm install
# or
pnpm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your credentials

# 4. Generate Prisma client
npx prisma generate

# 5. Run database migrations
npx prisma migrate dev

# 6. Start development server
npm run dev
```

### Running Locally

```bash
# Development server
npm run dev          # Next.js dev server on port 3000

# Database management
npx prisma studio    # Visual database browser
npx prisma migrate dev --name <name>  # Create migration

# Trigger.dev (for background jobs)
npx trigger.dev dev  # Local Trigger.dev dev server

# Linting
npm run lint
```

### Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Prisma client outdated | `npx prisma generate` |
| Database connection failed | Check DATABASE_URL, ensure PostgreSQL is running |
| Clerk session issues | Clear cookies, check Clerk dashboard |
| Gemini API rate limited | Implement backoff, check quota |
| Trigger.dev task not found | Run `npx trigger.dev dev`, check `trigger.config.ts` |
| FFmpeg not found | Install FFmpeg or use Trigger.dev's extension |

---

## 11. Production Readiness

### Logging & Monitoring

| Area | Current Implementation |
|------|------------------------|
| Server logs | `console.log/error` (structured logs recommended) |
| Client errors | Toast notifications |
| API errors | tRPC error formatter |
| Trigger.dev logs | Built-in dashboard logging |

**Recommendations:**
- Integrate Sentry for error tracking
- Add structured logging (Pino/Winston)
- Implement application monitoring (Vercel Analytics, PostHog)

### Error Tracking

| Layer | Current | Recommended |
|-------|---------|-------------|
| Client | Toast notifications | Sentry React SDK |
| Server | console.error | Sentry Node SDK |
| Background | Trigger.dev dashboard | Sentry + Trigger.dev integration |

### Deployment Flow

```
1. Push to main branch
2. Vercel auto-deploys
3. Environment variables configured in Vercel dashboard
4. Prisma migrations run via postinstall hook
5. Trigger.dev tasks deployed separately via CLI
```

**Trigger.dev Deployment:**

```bash
npx trigger.dev deploy
```

### Best Practices Followed

| Practice | Status |
|----------|--------|
| TypeScript strict mode | ✅ Enabled |
| Input validation | ✅ Zod on all endpoints |
| Auth on all mutations | ✅ protectedProcedure |
| Data isolation by user | ✅ userId filtering |
| Optimistic updates | ⚠️ Partial (some refetches) |
| Error boundaries | ⚠️ Not implemented |
| Rate limiting | ⚠️ Not implemented |
| API versioning | ⚠️ Not implemented |
| Database indexes | ✅ On userId, folderId, workflowId |

---

## Architectural Risks & Technical Debt

| Risk/Debt | Description | Severity |
|-----------|-------------|----------|
| No rate limiting | API vulnerable to abuse | High |
| No error boundaries | Unhandled errors crash app | Medium |
| Sequential execution only | Cannot parallelize independent nodes | Medium |
| Polling for updates | 1s interval wastes resources | Medium |
| No test coverage | No unit/integration/E2E tests | High |
| localStorage persistence | Can conflict across tabs | Low |
| No API versioning | Breaking changes affect all clients | Medium |
| Hardcoded sample workflow | Not user-configurable | Low |

---

## Appendix: Database Schema

```prisma
model User {
  id           String   @id @default(cuid())
  clerkId      String   @unique
  email        String   @unique
  firstName    String?
  lastName     String?
  profileImage String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model Folder {
  id        String     @id @default(cuid())
  userId    String
  name      String
  parentId  String?
  parent    Folder?    @relation("FolderHierarchy", ...)
  children  Folder[]   @relation("FolderHierarchy")
  workflows Workflow[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model Workflow {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?
  data        Json     // { nodes, edges, viewport }
  folderId    String?
  folder      Folder?  @relation(...)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model WorkflowExecution {
  id          String    @id @default(cuid())
  workflowId  String
  userId      String
  nodeId      String
  runId       String?
  status      String    // 'running' | 'completed' | 'failed'
  input       Json?
  output      Json?
  error       String?
  createdAt   DateTime  @default(now())
  completedAt DateTime?
}
```

---

*Documentation generated for Weavy AI v0.1.0*
