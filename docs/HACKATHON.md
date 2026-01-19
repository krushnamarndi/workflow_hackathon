# Workflow Platform Hackathon — Document v1.1

## Welcome to Galaxy.ai

Congratulations on making it through. You've demonstrated foundational understanding of workflow builders. Now, it's time to prove you can build **production-grade software** under pressure.

---

## The Hackathon

### Duration

**15 days** — Starting Day 1 (today) through Day 15

### Structure

- **Daily Check-ins**: Every day share of progress
- **Checkpoints**: Days 5, 10, and 14
- **Final Submission**: Day 15, 6:00 PM sharp

Checkpoints are when we evaluate if you're on track, and if it's not working out, it's better to know early.

### Expectations

This is not a typical onboarding. This is a **high-intensity evaluation period** where we assess:

- How you handle ambiguity
- Your architectural thinking
- Code quality under pressure
- Your ability to ship production-ready software

**You may need to work extended hours.** This is intentional. We're looking for people who thrive in fast-paced AI environments. Those who qualify will join a team building cutting-edge AI infrastructure.

**Keep your work strictly individual for the duration of this hackathon.** This is in your best interest.

We're evaluating **your** problem-solving ability, **your** architectural thinking, and **your** capacity to ship under pressure. When you collaborate with other candidates, you obscure exactly what we're trying to measure.

Team collaboration comes later. Right now, we need to see what *you* can do independently.

The people who thrive here are those who can own problems end-to-end, push through ambiguity alone, and deliver results without hand-holding. This hackathon is your chance to demonstrate exactly that.

**Show us what *you* can do.**

---

## Your Mission

Build a **production-grade visual workflow builder** for AI generation pipelines.

Users should be able to:

1. Drag and drop nodes onto a canvas
2. Connect nodes to form execution pipelines
3. Run workflows and see real-time progress
4. View execution history with per-node details
5. Export/import workflows as JSON

---

## Core Architecture Concepts

Before diving into features, understand these architectural principles.

### Node as Black Box

Each node is an **isolated Trigger.dev task** with strict contracts:

Zod Input Schema → [Execution] → Zod Output Schema

- **Contract-based**: Consumer doesn't care HOW it works, only WHAT goes in/out
- **Type-safe end-to-end**: TypeScript infers types from Zod schemas
- **Isolated**: Nodes only communicate via schemas, never directly

### Provider Fallback Chain (Durability)

```
providers: ["fal", "replicate", "wavespeed"];

// Try fal → fail? → replicate → fail? → wavespeed
```

// Each provider has own execution logic but SAME output schema

// Fallback is transparent to orchestrator

- Config per node: `{ providers: [...], timeout: "2m", retryPerProvider: 2 }`
- Logs which provider succeeded for debugging/cost analysis

### Trigger.dev Patterns (Cost Optimization)

**Why this matters**: AI jobs can take minutes. Without proper patterns, you'd burn compute costs waiting.

| Pattern | Use Case | Billing |
|---------|----------|---------|
| `triggerAndWait()` | Orchestrator calls child node jobs | Parent pauses, no billing while waiting |
| `wait.forToken()` | Webhook-based providers (fal, Replicate) | Job pauses until webhook arrives, no billing |

**Key insight**: Everything runs on Trigger.dev. No Vercel webhook endpoints needed. Trigger handles both job execution AND receives the webhook callback internally.

### Cost Model

| State | Billing |
|-------|---------|
| Job running (doing work) | ✅ Billed |
| Job in `wait.forToken()` | ⏸ Paused, no billing |
| Job in `triggerAndWait()` | ⏸ Paused, no billing |

**Result**: Entire workflow can span hours with minimal compute cost.

### Execution Flow

Orchestrator Task:

1. Topological sort nodes

2. For each node (respecting dependencies):

→ triggerAndWait(childNodeTask)

→ Update context with result

→ Continue to next node

3. Return final results

Child Node Task:

→ Validate input (Zod)

→ Submit to provider with webhook URL

→ wait.forToken() (paused, no cost)

→ Webhook arrives → resume

→ Validate output (Zod)

→ Return result

---

## Evaluation Criteria

### What We're Judging (Priority Order)

| Priority | Criteria | Weight |
|----------|----------|--------|
| 1 | **Architecture & Scalability** — Can this scale to 100 node types? 1000 concurrent executions? | 30% |
| 2 | **Reliability & Error Handling** — Does it fail gracefully? Are edge cases handled? | 25% |
| 3 | **Code Quality** — Clean, minimal, well-typed, documented where necessary | 20% |
| 4 | **Feature Completeness** — All non-negotiables working | 15% |
| 5 | **Polish & UX** — Does it feel like a real product? | 10% |

### What Differentiates Winners

- **Least lines of code** for the same functionality
- **Best abstractions** — easy to add new nodes, new providers
- **Most thoughtful error handling** — partial failures, retries, user feedback
- **Performance optimizations** — no unnecessary re-renders, efficient queries
- **Going beyond minimum** — creative features that add real value

Once you've completed all non-negotiable features, this is where you stand out.

⚠ **Do NOT add more nodes to differentiate.** Stick to exactly 10 nodes. We evaluate architecture, reliability, code quality, and UX — not node count.

### How to Find Ideas

Sign up for accounts on **all reference platforms** and explore them thoroughly:

- https://www.krea.ai/nodes
- https://fal.ai/workflows
- https://app.weavy.ai/
- https://www.segmind.com/pixelflows

Pay attention to:

- How they handle edge cases
- UX patterns that feel polished
- Features that make workflows easier to build/debug
- Architecture decisions visible in their UI

**Your creativity matters here.**

---

## Tech Stack

### Required (Non-negotiable)

| Layer | Technology |
|-------|------------|
| Package Manager | pnpm |
| Framework | Next.js (App Router) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL |
| ORM | Prisma |

| Layer | Technology |
|-------|------------|
| Auth | Clerk |
| API Layer | tRPC |
| Data Fetching | TanStack Query (via @trpc/react-query) |
| Canvas | React Flow |
| Job Execution | Trigger.dev |
| File Storage | Transloadit |
| State Management | Zustand |
| Validation | Zod |
| UI Components | Shadcn/ui |
| Styling | Tailwind CSS |
| Unit/Integration | Vitest + React Testing Library |
| API Mocking | MSW (Mock Service Worker) |
| E2E Testing | Playwright |
| OpenAPI | trpc-to-openapi |
| API Docs | Mintlify |
| Rate Limiting | Upstash Redis |

**Transloadit**: Use for all file uploads, transformations, and storage. Handles image/video/audio processing, resizing, format conversion, and CDN delivery.

**trpc-to-openapi**: Converts tRPC procedures to OpenAPI REST endpoints for external API access.

---

## Accounts & API Keys

⚠ **Important**: Sign up for **all services** (GitHub, Vercel, Clerk, Trigger.dev, etc.) using your **@team.galaxy.ai** email.

- **API Keys**: Request from us as needed if free tier is not enough.
- **Cost Awareness**: Video and image generation models are **expensive**. Use cautiously during development. Test with minimal iterations, cache results where possible.

---

## Non-Negotiable Features

These **must** be working in your final submission. Missing any = automatic disqualification.

### 1. Visual Workflow Builder

| Feature | Requirement |
|---------|-------------|
| Canvas | React Flow with pan, zoom, minimap |
| Node Palette | Sidebar with draggable node types |
| Connections | Type-safe edges (text→text, image→image) |
| Validation | Prevent invalid connections, cycle detection |
| Selection | Select, delete, duplicate nodes |
| Viewport | Save/restore viewport position |

### 2. Node System

| Feature | Requirement |
|---------|-------------|
| Input Schema | Every node has Zod-validated input schema |
| Output Schema | Every node has Zod-validated output schema |
| Black Box | Nodes are isolated — only communicate via schemas |

| Feature | Requirement |
|---------|-------------|
| Provider Fallback | Nodes with external APIs must support multiple providers |
| Configuration | Nodes have configurable parameters (model, style, etc.) |
| Input Limits | Validate provider limits (file size, duration, resolution) |
| Input Handles | Left-side connectors for all inputs from provider schema |

**Model Limits**: Many providers have constraints — max file size, max video duration, supported resolutions, etc.

**Node Input Handles**: Each node must expose connectors (handles) on the **left side** for all available inputs as defined by the provider's model schema (e.g., fal.ai). This includes parameters like `prompt`, `image_url`, `aspect_ratio`, `duration`, `num_inference_steps`, `guidance_scale`, `seed`, etc. These connectors must enforce **type-safe connections** — only compatible output types can connect to matching input types (e.g., image outputs → image inputs, text outputs → text inputs, number outputs → number inputs). Invalid connections must be visually disallowed.

⚠ **CRITICAL — Connector-Setting Parity: Every setting that is configurable in the node's UI MUST have a corresponding input connector (handle).** If a user can manually enter a value (e.g., `seed`, `guidance_scale`, `num_inference_steps`), there MUST be a connector on the left side for that same parameter so it can receive values from upstream nodes. This enables full workflow automation — no parameter should be "UI-only" without a connector equivalent. **Connectors and UI inputs are two ways to set the same parameter.**

**Connector Layout**: The connector circle (handle) must be positioned **adjacent to its label/name** which appears inside the node. This provides visual clarity — users can immediately see which connector corresponds to which parameter. Do not separate connectors from their labels.

**Managing Connector Clutter**: Nodes with many parameters (e.g., 10+ inputs) can become visually overwhelming. To maintain a clean UI while preserving full connectivity:

- **Primary inputs** (e.g., `prompt`, `image_url`, `audio_url`) should always be visible
- **Advanced/optional inputs** (e.g., `seed`, `num_inference_steps`, `guidance_scale`) can be grouped under a collapsible "Advanced Settings" section within the node
- When collapsed, these connectors are hidden but still functional when the section is expanded
- This keeps the default node view clean while ensuring all parameters remain connectable

### 3. Execution Engine

| Feature | Requirement |
|---------|-------------|
| Run Workflow | Execute entire DAG in topological order |
| Run Node | Execute single node for testing (with mock/manual inputs) |
| Trigger.dev | All node execution via Trigger.dev tasks |
| Topological Sort | Correct execution order based on dependencies |
| Parallel Execution | Independent branches run in parallel |
| Wait Patterns | Use `triggerAndWait()` and `wait.forToken()` appropriately |
| Partial Results | If node 5 fails, nodes 1-4 results are preserved |
| Real-time Status | Live updates via Trigger.dev Realtime |

### Run Workflow vs Run Node vs Run Selected Nodes

- **Run Workflow**: Button that executes the entire workflow from start to finish. Respects DAG order, runs parallel branches concurrently, deducts credits for all nodes.

- **Run Node**: Button on each node to test it independently. User provides inputs manually or uses connected node's last output. Useful for debugging without running full workflow. Still deducts credits for that node.

- **Run Selected**: Execute only selected subset of nodes. | Feature | Requirement | | :---- | :---- | | Selection | Multi-select via Shift+Click, Ctrl+Click, or drag box | | Trigger | "Run Selected" button when 2+ nodes selected | | Modes | "With Dependencies" (default) or "Selected Only" (cached inputs) | | History | Tag partial executions distinctly |

### 4. Provider Fallback Chain

**Hackathon Scope**: Implement **one provider per node type** only. However, your architecture **must be designed** to support multiple providers with fallback in the future. We will evaluate your abstraction quality.

```javascript
// Target architecture (implement one provider now, design for this)

{
  providers: ["fal", "replicate", "together"],
  timeout: "2m",
  retriesPerProvider: 2
}

// Your code should look like this (even with one provider)

const imageGenProviders = {
  fal: async (input) => { /* fal implementation */ },
  // replicate: async (input) => { ... },  // Future
  // together: async (input) => { ... },   // Future
};

async function executeWithFallback(input, providerOrder) {
  for (const provider of providerOrder) {
    try {
      return await imageGenProviders[provider](input);
    } catch (e) {
      continue; // Try next provider
    }
  }
  throw new Error("All providers failed");
}
```

| Feature | Requirement |
|---------|-------------|
| Provider Abstraction | Each provider behind same interface — easy to add new ones |
| Config-Driven | Provider order defined in config, not hardcoded |
| Transparent to Orchestrator | Orchestrator calls node, doesn't know which provider runs |
| Logging | Record which provider was used for each execution |
| Same Output Schema | All providers for a node type produce identical output schema |
| **Hackathon**: 1 Provider | Implement one working provider per node; architecture supports adding more |

### 5. Workflow Management

| Feature | Requirement |
|---------|-------------|
| Save/Load | Workflows persist to database |
| Auto-save | Debounced auto-save (no manual save button needed) |
| Naming | Editable workflow names |
| List View | Home page showing all user's workflows |
| Delete | Ability to delete workflows |

### 6. Export/Import

| Feature | Requirement |
|---------|-------------|
| Export JSON | Download workflow as versioned JSON file |
| Import JSON | Upload JSON to recreate workflow |
| Schema Version | JSON includes version for future migrations |
| Validation | Imported JSON validated before applying |

### 7. Execution History

| Feature | Requirement |
|---------|-------------|
| History Panel | Right sidebar showing list of all workflow runs |
| Execution Scope | History tracks all execution types: full workflow runs, single node runs, and selected node group runs |
| Run Entry | Each entry shows: timestamp, status (success/failed/partial), duration, and scope (full/partial/single) |
| Click to Expand | Clicking a run shows **node-level execution details** |
| Node-Level History | For each node: status, inputs used, outputs generated, provider used, execution time |
| Partial Runs | Show which nodes ran successfully even if workflow failed |
| Visual Indicators | Color-coded status badges (green=success, red=failed, yellow=running) |
| Outputs Access | View/download generated assets from history |
| Failure Details | Failed nodes show error message + attempted providers |
| Persistence | All history must persist to PostgreSQL database |

#### Node-Level History View

When clicking on a workflow run, display detailed node-level information:

**Full Workflow Run Example:**

Run #123 - Jan 14, 2026 3:45 PM (Full Workflow)

├── Text Node (node-1) ✅ 0.1s
│   └── Output: "Generate a product description..."

├── Seedream 4.5 (node-2) ✅ 12.3s
│   └── Output: https://cdn.example.com/image.png
│   └── Provider: fal
│   └── Cost: 15,000 credits

├── Seedance 1.5 (node-3) ✅ 45.2s
│   └── Output: https://cdn.example.com/video.mp4
│   └── Provider: fal
│   └── Cost: 120,000 credits

├── OpenRouter LLM (node-4) ✅ 4.2s
│   └── Output: "Introducing our premium..."
│   └── Provider: openrouter (claude-sonnet-4.5)
│   └── Cost: 2,500 credits

└── Kling O1 (node-5) ❌ Failed
    └── Error: "Invalid video format"
    └── Provider: fal (attempted)

**Selected Nodes Run Example:**

Run #124 - Jan 14, 2026 4:12 PM (3 nodes selected)

├── Seedream 4.5 (node-2) ✅ 11.5s
│   └── Output: https://cdn.example.com/edited.png

├── ElevenLabs V3 (node-3) ✅ 8.1s
│   └── Output: https://cdn.example.com/audio.mp3

└── Sync Lipsync (node-4) ✅ 23.4s
    └── Output: https://cdn.example.com/lipsynced.mp4

**Single Node Run Example:**

Run #125 - Jan 14, 2026 4:30 PM (Single Node)

└── OpenRouter LLM (node-4) ✅ 2.8s
    └── Input: "Quick test prompt..."
    └── Output: "Quick test response..."
    └── Provider: openrouter (gemini-2.5-flash)
    └── Cost: 800 credits

### 8. Real-time Execution UI

| Feature | Requirement |
|---------|-------------|
| Live Status | Nodes update: idle → running → completed/failed |
| Progress | Visual indicator of current execution position |
| Streaming | Generated assets appear as they complete |
| No Polling | WebSocket-based via Trigger.dev Realtime |

### 9. Credits System

| Feature | Requirement |
|---------|-------------|
| Credit Balance | Users have credit balance |
| Cost Estimation | Show **estimated** cost before running workflow |
| Deduction | Deduct **actual** cost after execution |
| Insufficient Credits | Block execution if insufficient, show clear message |
| Per-Node Cost | Track cost per node in execution history |
| Ledger | Maintain transaction log of all credit changes |

**Credit Conversion**: 1,000,000 credits = $1.00 provider cost

**Why estimated?** Many models price based on inputs (duration, resolution, token count, etc.). Pre-execution cost is always an estimate. Actual cost is known only after provider returns pricing info. Always deduct actual cost, but use estimates to prevent users from starting workflows they don't have enough credits for.

### 10. Error Handling

| Scenario | Required Behavior |
|----------|-------------------|
| Provider timeout | Try next provider in chain |
| All providers fail | Mark node as failed, preserve prior results |
| Invalid connection | Prevent connection, show tooltip |
| Cycle detected | Prevent connection, show warning |
| Input exceeds limits | Block execution, show specific limit (e.g., "Video must be < 30s") |
| Execution mid-workflow | Credits insufficient → stop gracefully, show partial results |
| Network error | Retry with backoff, eventually show error state |
| Webhook never arrives | Timeout after configured duration, try next provider |

### 11. Testing Requirements

Production-grade software requires comprehensive test coverage. Target **100% test coverage** across the codebase.

| Test Type | Requirement |
|-----------|-------------|
| Unit Tests | Test individual functions, hooks, and components in isolation |
| Integration Tests | Test how components, APIs, and server logic work together |
| UI / E2E Tests | Test full user flows in a real browser from start to finish |
| Coverage Target | 100% code coverage across all test types |
| CI Integration | Tests must run on every PR and block merge if failing |

#### Testing Stack

| Layer | Technology |
|-------|------------|
| Unit/Integration | Vitest |
| Component | React Testing Library |
| API Mocking | MSW |
| API Testing | Supertest |
| E2E | Playwright |

#### What to Test

- **Unit**: Zod schemas, utility functions, Zustand store actions, custom hooks
- **Integration**: tRPC procedures, API routes, component + store interactions
- **E2E**: Full workflow creation, node connections, workflow execution, export/import

### 12. Theming & Visual Design

| Feature | Requirement |
|---------|-------------|
| Dark / Light Mode | Full support for both themes with system preference detection |
| Theme Toggle | User can manually switch themes; preference persists |
| Consistent Styling | All components (nodes, sidebar, modals) respect active theme |
| CSS Variables | Use CSS variables for theme colors to enable easy switching |

#### Color-Coded Node Handles

Node input/output handles must be **color-coded by data type** for instant visual recognition:

| Data Type | Color (Example) |
|-----------|-----------------|
| Text | Blue #3B82F6 |
| Image | Purple #8B5CF6 |
| Video | Red #EF4444 |
| Audio | Green #22C55E |
| Number | Orange #F97316 |
| Boolean | Yellow #EAB308 |
| Settings | Gray #6B7280 |

**Note**: These colors are examples. Choose your own palette — what matters is that each data type has a distinct, consistent color throughout the UI.

| Feature | Requirement |
|---------|-------------|
| Type-Matched Colors | Connection lines inherit color from their data type |
| Invalid Connection | Show red/error color when hovering incompatible handles |
| Consistent Palette | Same colors used in sidebar, node headers, and connection lines |

### 13. Editor UX Features

| Feature | Requirement |
|---------|-------------|
| Undo / Redo | Full undo/redo stack for all canvas operations (add, delete, move, connect) |
| Keyboard Shortcuts | Standard shortcuts for common actions |
| Multi-Select | Select multiple nodes (Shift+Click or drag selection box) |
| Snap to Grid | Optional grid snapping for clean node alignment |
| Zoom to Fit | Button to auto-fit entire workflow to viewport |
| Comments / Sticky Notes | Add text annotations to canvas for documentation |
| Node Search / Filter | Search bar in sidebar to filter available node types |
| Connection Preview | While dragging connection, highlight valid/invalid target handles |

#### Required Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Shift + Z | Redo |
| Ctrl/Cmd + C | Copy selected nodes |
| Ctrl/Cmd + V | Paste nodes |
| Ctrl/Cmd + D | Duplicate selected nodes |
| Delete / Backspace | Delete selected nodes |
| Ctrl/Cmd + A | Select all nodes |
| Escape | Deselect all / Cancel operation |
| Ctrl/Cmd + S | Manual save (even with auto-save) |
| Ctrl/Cmd + E | Export workflow |
| Space + Drag | Pan canvas |
| Ctrl/Cmd + +/- | Zoom in/out |
| Ctrl/Cmd + 0 | Zoom to fit |

#### Undo/Redo Stack

| Tracked Operations |
|--------------------|
| Add node |
| Delete node(s) |
| Move node(s) |
| Connect nodes |
| Disconnect nodes |
| Edit node configuration |
| Paste nodes |
| Add/edit comments |

**Important**: Undo/redo should work across all canvas operations. Users expect Ctrl+Z to reliably undo their last action.

### 14. Config-Driven Node System

**DRY Principle**: Each node type has a **single configuration file** as source of truth for UI, validation, credits, and execution.

| Feature | Requirement |
|---------|-------------|
| Single Source of Truth | One config file per node defines everything |
| Auto-Generated UI | Node UI, handles, labels derived from config |
| Auto-Generated Schemas | Zod input/output schemas derived from config |
| Credit Functions | Estimation and calculation functions in config |
| Zero Duplication | Change once → UI, validation, execution all update |

#### Config Contains

- **Metadata**: id, name, description, category, icon, version
- **Providers**: provider order, endpoints per provider
- **Inputs**: type, required, label, validation constraints, UI hints, `isAdvanced` flag
- **Outputs**: type, label, description
- **Credits**: `estimate(inputs)` and `calculate(inputs, response)` functions
- **Execution**: endpoint selection, input/output transformers
- **UI**: color, width, section groupings

⚠ **Important**: Each input in config generates BOTH a UI control AND a connector handle. The `isAdvanced: true` flag determines if the input appears in the collapsible "Advanced Settings" section. This ensures connector-setting parity is enforced at the config level — you cannot have a UI-only setting without a connector.

#### Auto-Generated From Config

- Zod input/output schemas
- React Flow node component
- Sidebar palette entry
- Trigger.dev task wrapper
- TypeScript types

#### Node Registry

All nodes auto-register from their config files. Adding a new node = creating one config file.

---

## Required Node Types (Exactly 10 Nodes)

Implement **exactly** these 10 nodes. Each must follow the black-box pattern with Zod schemas.

**Important**: Differentiation for final submission should NOT be adding more nodes. Focus on architecture, reliability, code quality, and UX — not node count. For input/output schemas, refer to the fal.ai model pages directly.

---

### Image Generation / Editing

#### 1. Seedream 4.5

| | |
|---------|-------------|
| Provider | fal |
| Docs | text-to-image · edit |

**Logic**: If user attaches optional image(s) → use `/edit` endpoint. Otherwise → use `/text-to-image` endpoint. Same node, endpoint selection based on inputs.

---

### Video Generation

#### 2. Seedance 1.5

| | |
|---------|-------------|
| Provider | fal |
| Docs | text-to-video · image-to-video |

**Logic**: If user attaches image → use `/image-to-video` endpoint. Otherwise → use `/text-to-video` endpoint.

---

### Audio Generation

#### 3. ElevenLabs V3

| | |
|---------|-------------|
| Provider | fal |
| Docs | eleven-v3 |

---

### LLM / Vision

#### 4. OpenRouter LLM

| | |
|---------|-------------|
| Provider | OpenRouter |
| Docs | OpenRouter Quickstart |
| Models | `gemini-2.5-flash`, `claude-sonnet-4.5` |

**Logic**: If user attaches image(s) → multimodal request. Text-only → standard completion.

---

### Video + Audio

#### 5. Sync Lipsync

| | |
|---------|-------------|
| Provider | fal |
| Docs | sync-lipsync |

---

### Video Editing

#### 6. Kling O1

| | |
|---------|-------------|
| Provider | fal |
| Docs | video-to-video · video-to-video/edit |

**Logic**: If user provides optional `images` or `elements` → use `/video-to-video/edit` endpoint. Otherwise → use `/video-to-video/reference` endpoint. Same node, endpoint selection based on inputs.

---

### Utility Nodes (Internal / FFmpeg)

These nodes run on your own infrastructure (Transloadit or FFmpeg via Trigger.dev). No external provider fallback needed.

#### 7. Crop Image

| | |
|---------|-------------|
| Provider | internal (Transloadit or sharp) |

**Inputs:**

- `image_url` (required) — jpg, jpeg, png, webp, gif, avif

**Config:**

- `x_percent` — X position as percentage (0-100)
- `y_percent` — Y position as percentage (0-100)
- `width_percent` — Crop width as percentage
- `height_percent` — Crop height as percentage

**Output:** `image_url`

---

#### 8. Merge Audio with Video

| | |
|---------|-------------|
| Provider | internal (FFmpeg) |

**Inputs:**

- `audio_url` (required) — mp3, ogg, wav, m4a, aac
- `video_url` (required) — mp4, mov, webm, m4v, gif

**Output:** `video_url` (video with new audio track)

---

#### 9. Merge Multiple Videos

| | |
|---------|-------------|
| Provider | internal (FFmpeg) |

**Inputs:**

- `video_urls` (required) — Array of video URLs to concatenate
- Accepted formats: mp4, mov, webm, m4v

**Config:**

- `transition` (optional) — none, fade, dissolve

**Output:** `video_url` (single concatenated video)

---

#### 10. Extract Audio from Video

| | |
|---------|-------------|
| Provider | internal (FFmpeg) |

**Inputs:**

- `video_url` (required) — mp4, mov, webm, m4v, gif

**Config:**

- `audio_format` — mp3, wav, aac, ogg
- `audio_bitrate` — 128k, 192k, 256k, 320k

**Output:** `audio_url`

---

### 15. Public API & Documentation

Expose workflow execution via REST API with auto-generated OpenAPI docs hosted on Mintlify.

| Feature | Requirement |
|---------|-------------|
| tRPC to OpenAPI | Use `trpc-to-openapi` to expose procedures as REST |
| API Key Auth | API key authentication for external access |
| Rate Limiting | Per-API-key rate limits (Upstash Redis) |
| OpenAPI Spec | Auto-generate OpenAPI specification |
| Mintlify Docs | Host interactive API documentation |

#### Required Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/workflows` | List user's workflows |
| GET | `/v1/workflows/{id}` | Get workflow by ID |
| POST | `/v1/workflows/{id}/execute` | Execute full workflow |
| POST | `/v1/workflows/{id}/execute-selected` | Execute selected nodes |
| GET | `/v1/executions/{id}` | Get execution status |
| GET | `/v1/credits` | Get credit balance |

#### API Key Management

| Feature | Requirement |
|---------|-------------|
| Create Key | Generate API keys with name/description |
| List Keys | View all keys (masked) with usage stats |
| Revoke Key | Disable key immediately |
| Webhooks | Optional callback URL on execution completion |

---

## AI-Assisted Development

We provide Cursor with access to **Claude Opus 4.5** and **GPT 5.2**. You are expected to use it extensively.

⚠ **Do not use "Auto" mode.** Explicitly select Claude Opus 4.5 or GPT 5.2 for best results. These are state-of-the-art models — use them.

**This hackathon is designed assuming heavy AI assistance.** Without leveraging these tools effectively, completing all requirements in 15 days is not realistic. Learn to prompt well, review AI output critically, and iterate fast.

---

## Resources

### Technical Documentation

- React Flow Documentation
- Trigger.dev Docs
- Trigger.dev Realtime
- Trigger.dev Wait Patterns
- Trigger.dev Webhook Handling
- Clerk Documentation
- Clerk + Next.js
- Transloadit Documentation
- OpenRouter Documentation
- fal.ai Documentation
- Vercel Workflow Builder Template

### Testing Documentation

- Vitest Documentation
- React Testing Library
- MSW (Mock Service Worker)
- Playwright Documentation
- Testing tRPC

### API & Documentation

- trpc-to-openapi — Convert tRPC to OpenAPI/REST
- Mintlify Documentation — API documentation platform
- Upstash Redis — Serverless Redis for rate limiting

### Video Reference

- YouTube: Workflow Platform Overview
