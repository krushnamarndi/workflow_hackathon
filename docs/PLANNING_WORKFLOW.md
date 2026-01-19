# Workflow Platform — Production Planning & Execution Document

**Version:** 1.0  
**Date:** January 19, 2026  
**Target Deadline:** Day 15 (February 3, 2026)  
**Current Status:** MVP/Prototype (v0.1.0)

---

## 1. Executive Summary

### Target: Production-Grade Visual Workflow Builder

The hackathon requires building a **production-grade visual workflow builder** for AI generation pipelines with the following core capabilities:

- Drag-and-drop node-based canvas (React Flow)
- 10 specific AI/utility node types with Zod-validated schemas
- Execution engine using Trigger.dev patterns (`triggerAndWait()`, `wait.forToken()`)
- Provider abstraction architecture supporting fallback chains
- Real-time execution status via Trigger.dev Realtime (WebSocket)
- Credits system with estimation, deduction, and ledger
- Complete execution history with per-node details
- Public REST API via trpc-to-openapi with Mintlify documentation
- 100% test coverage (Vitest, RTL, MSW, Playwright)
- Config-driven node system (single source of truth per node)

### Current State: Prototype/MVP

The existing codebase represents an early-stage prototype with:

- Basic React Flow canvas with pan, zoom, minimap
- 5 node types implemented (Text, Image, UploadImage, CropImage, LLM/Gemini)
- Simple topological execution (sequential only)
- Basic undo/redo and auto-save
- One Trigger.dev task (crop-image)
- tRPC API layer with Clerk authentication
- No credits, no testing, no public API, no real-time updates

### Gap Assessment: Critical

| Dimension | Gap Severity |
|-----------|--------------|
| Node Types | **High** — Only 5/10 nodes, wrong LLM provider (Gemini vs OpenRouter) |
| Execution Engine | **Critical** — No `triggerAndWait()`, no `wait.forToken()`, no parallel execution |
| Provider Architecture | **Critical** — No abstraction layer, no fallback chain design |
| Credits System | **Critical** — Completely missing |
| Real-Time Updates | **High** — Uses polling, not Trigger.dev Realtime |
| Testing | **Critical** — 0% coverage, target is 100% |
| Public API | **High** — No REST endpoints, no Mintlify docs |
| Config-Driven Nodes | **High** — Hardcoded node definitions |
| Rate Limiting | **High** — No Upstash Redis integration |
| Package Manager | **Low** — Uses npm instead of pnpm |

**Overall Assessment:** The prototype provides a working canvas foundation but requires significant architectural refactoring and feature development to meet production requirements. Approximately 60-70% of the required system remains to be built or redesigned.

---

## 2. Feature-by-Feature Comparison Table

### 2.1 Visual Workflow Builder

| Feature | Hackathon Requirement | Current Status | Risk Level | Notes |
|---------|----------------------|----------------|------------|-------|
| Canvas (pan, zoom, minimap) | Required | ✅ Implemented | Low | React Flow v12 working |
| Node Palette sidebar | Required | ✅ Implemented | Low | Basic implementation exists |
| Type-safe connections | Required | ✅ Implemented | Low | Connection rules enforced |
| Invalid connection prevention | Required | ✅ Implemented | Low | Toast errors shown |
| Cycle detection | Required | ✅ Implemented | Low | DAG validation working |
| Select, delete, duplicate nodes | Required | ⚠️ Partial | Medium | Delete works, duplicate needs verification |
| Save/restore viewport | Required | ⚠️ Partial | Low | Needs persistence verification |
| Color-coded handles by type | Required | ⚠️ Partial | Medium | Basic colors, not per-spec palette |
| Connection preview (valid/invalid) | Required | ❌ Missing | Medium | Need visual feedback on hover |
| Comments/Sticky Notes | Required | ❌ Missing | Medium | New feature required |
| Snap to Grid | Required (optional toggle) | ⚠️ Partial | Low | May exist, needs verification |
| Zoom to Fit button | Required | ❌ Missing | Low | Simple addition |

### 2.2 Node System & Schemas

| Feature | Hackathon Requirement | Current Status | Risk Level | Notes |
|---------|----------------------|----------------|------------|-------|
| Zod input schemas | Required | ⚠️ Partial | Medium | Basic schemas, not per provider spec |
| Zod output schemas | Required | ⚠️ Partial | Medium | Basic schemas, not per provider spec |
| Black box isolation | Required | ✅ Implemented | Low | Nodes communicate via edges only |
| Provider fallback support | Required (architecture) | ❌ Missing | **Critical** | Must design abstraction layer |
| Configurable parameters | Required | ⚠️ Partial | Medium | Basic, not from provider schemas |
| Input handles for all params | Required | ❌ Missing | **High** | Only basic handles exist |
| Connector-Setting parity | Required | ❌ Missing | **High** | UI-only settings exist without connectors |
| Collapsible Advanced Settings | Required | ❌ Missing | Medium | No grouping implemented |
| Config-driven generation | Required | ❌ Missing | **Critical** | Hardcoded node definitions |

### 2.3 Required Node Types (10 Total)

| Node | Provider | Current Status | Risk Level | Notes |
|------|----------|----------------|------------|-------|
| Seedream 4.5 (Image Gen) | fal | ❌ Missing | **High** | Text-to-image + edit endpoints |
| Seedance 1.5 (Video Gen) | fal | ❌ Missing | **High** | Text-to-video + image-to-video |
| ElevenLabs V3 (Audio) | fal | ❌ Missing | **High** | TTS via fal.ai |
| OpenRouter LLM | OpenRouter | ❌ Missing | **High** | Current uses Gemini (wrong) |
| Sync Lipsync | fal | ❌ Missing | **High** | Audio + video sync |
| Kling O1 (Video Edit) | fal | ❌ Missing | **High** | Video-to-video endpoints |
| Crop Image | internal | ✅ Implemented | Low | FFmpeg + Transloadit working |
| Merge Audio with Video | internal | ❌ Missing | Medium | FFmpeg task needed |
| Merge Multiple Videos | internal | ❌ Missing | Medium | FFmpeg concatenation |
| Extract Audio from Video | internal | ❌ Missing | Medium | FFmpeg extraction |

**Summary:** 1/10 nodes implemented correctly. LLM node exists but uses wrong provider.

### 2.4 Execution Engine

| Feature | Hackathon Requirement | Current Status | Risk Level | Notes |
|---------|----------------------|----------------|------------|-------|
| Full workflow execution | Required | ✅ Implemented | Low | Sequential execution works |
| Single node execution | Required | ⚠️ Partial | Medium | Needs manual input UI |
| Selected nodes execution | Required | ❌ Missing | Medium | Multi-select + run subset |
| Trigger.dev task per node | Required | ⚠️ Partial | **High** | Only crop-image is a task |
| `triggerAndWait()` pattern | Required | ❌ Missing | **Critical** | Not using cost-optimized pattern |
| `wait.forToken()` webhook | Required | ❌ Missing | **Critical** | Not using webhook pattern |
| Topological sort | Required | ✅ Implemented | Low | Working correctly |
| Parallel branch execution | Required | ❌ Missing | **High** | Sequential only |
| Partial results preservation | Required | ⚠️ Partial | Medium | Basic, needs hardening |
| Trigger.dev Realtime | Required | ❌ Missing | **High** | Using polling (1s interval) |

### 2.5 Provider Fallback Chain

| Feature | Hackathon Requirement | Current Status | Risk Level | Notes |
|---------|----------------------|----------------|------------|-------|
| Provider abstraction | Required | ❌ Missing | **Critical** | No interface defined |
| Config-driven provider order | Required | ❌ Missing | **Critical** | No config structure |
| Transparent to orchestrator | Required | ❌ Missing | **Critical** | Direct API calls |
| Provider logging | Required | ❌ Missing | Medium | No tracking |
| Same output schema per node | Required | ❌ Missing | High | No normalization |
| 1 provider implemented/node | Hackathon scope | ❌ Missing | **High** | Architecture not ready |

### 2.6 Workflow Management

| Feature | Hackathon Requirement | Current Status | Risk Level | Notes |
|---------|----------------------|----------------|------------|-------|
| Save/Load workflows | Required | ✅ Implemented | Low | Prisma + tRPC working |
| Auto-save (debounced) | Required | ✅ Implemented | Low | 3s debounce |
| Editable names | Required | ✅ Implemented | Low | Working |
| List view (dashboard) | Required | ✅ Implemented | Low | With folders |
| Delete workflows | Required | ✅ Implemented | Low | Working |

### 2.7 Export/Import

| Feature | Hackathon Requirement | Current Status | Risk Level | Notes |
|---------|----------------------|----------------|------------|-------|
| Export as JSON | Required | ✅ Implemented | Low | Basic working |
| Import JSON | Required | ✅ Implemented | Low | Basic working |
| Schema version | Required | ⚠️ Partial | Medium | Needs versioning field |
| Import validation | Required | ⚠️ Partial | Medium | Needs robust Zod validation |

### 2.8 Execution History

| Feature | Hackathon Requirement | Current Status | Risk Level | Notes |
|---------|----------------------|----------------|------------|-------|
| History panel | Required | ✅ Implemented | Low | TaskManager component |
| Full/partial/single run tracking | Required | ⚠️ Partial | Medium | Basic implementation |
| Per-run entry with metadata | Required | ⚠️ Partial | Medium | Missing scope, duration display |
| Node-level details on expand | Required | ⚠️ Partial | Medium | Basic, needs enhancement |
| Provider used per node | Required | ❌ Missing | Medium | No provider tracking |
| Cost per node | Required | ❌ Missing | **High** | No credits system |
| Failure details + attempted providers | Required | ❌ Missing | Medium | Basic error only |
| Persistence to PostgreSQL | Required | ✅ Implemented | Low | WorkflowExecution model |

### 2.9 Real-Time Execution UI

| Feature | Hackathon Requirement | Current Status | Risk Level | Notes |
|---------|----------------------|----------------|------------|-------|
| Live status updates | Required | ⚠️ Partial | **High** | Manual state updates, no real-time |
| Visual progress indicator | Required | ⚠️ Partial | Medium | Basic node states |
| Streaming asset display | Required | ❌ Missing | **High** | Assets only on completion |
| WebSocket via Trigger.dev | Required (no polling) | ❌ Missing | **Critical** | Uses 1s polling |

### 2.10 Credits System

| Feature | Hackathon Requirement | Current Status | Risk Level | Notes |
|---------|----------------------|----------------|------------|-------|
| Credit balance per user | Required | ❌ Missing | **Critical** | No User credits field |
| Pre-execution estimate | Required | ❌ Missing | **Critical** | No estimation logic |
| Post-execution deduction | Required | ❌ Missing | **Critical** | No deduction logic |
| Insufficient credits block | Required | ❌ Missing | **Critical** | No validation |
| Per-node cost tracking | Required | ❌ Missing | **Critical** | No cost metadata |
| Transaction ledger | Required | ❌ Missing | **Critical** | No CreditTransaction model |

### 2.11 Error Handling

| Feature | Hackathon Requirement | Current Status | Risk Level | Notes |
|---------|----------------------|----------------|------------|-------|
| Provider timeout → fallback | Required | ❌ Missing | **High** | No fallback chain |
| All providers fail → graceful | Required | ❌ Missing | **High** | No fallback |
| Invalid connection prevention | Required | ✅ Implemented | Low | Working |
| Cycle detection + warning | Required | ✅ Implemented | Low | Working |
| Input limit validation | Required | ❌ Missing | Medium | No provider limit checks |
| Mid-execution credit fail | Required | ❌ Missing | **High** | No credits system |
| Network error + backoff | Required | ⚠️ Partial | Medium | Basic try/catch |
| Webhook timeout handling | Required | ❌ Missing | **High** | No webhook pattern |

### 2.12 Testing

| Feature | Hackathon Requirement | Current Status | Risk Level | Notes |
|---------|----------------------|----------------|------------|-------|
| Unit tests (Vitest) | 100% coverage | ❌ Missing | **Critical** | 0% coverage |
| Integration tests | 100% coverage | ❌ Missing | **Critical** | 0% coverage |
| E2E tests (Playwright) | 100% coverage | ❌ Missing | **Critical** | 0% coverage |
| API mocking (MSW) | Required | ❌ Missing | **High** | Not configured |
| CI integration | Required | ❌ Missing | **High** | No CI pipeline |

### 2.13 Theming & Visual Design

| Feature | Hackathon Requirement | Current Status | Risk Level | Notes |
|---------|----------------------|----------------|------------|-------|
| Dark/Light mode | Required | ⚠️ Partial | Medium | Needs verification |
| Theme toggle + persistence | Required | ⚠️ Partial | Low | May exist |
| System preference detection | Required | ❌ Missing | Low | Simple addition |
| CSS variables for theming | Required | ⚠️ Partial | Low | Tailwind + shadcn |
| Color-coded handles by type | Required | ⚠️ Partial | Medium | Needs specific palette |

### 2.14 Editor UX Features

| Feature | Hackathon Requirement | Current Status | Risk Level | Notes |
|---------|----------------------|----------------|------------|-------|
| Undo/Redo (full stack) | Required | ✅ Implemented | Low | 50-item stack |
| Keyboard shortcuts (all) | Required | ⚠️ Partial | Medium | Some exist, not all |
| Multi-select | Required | ⚠️ Partial | Medium | Needs verification |
| Snap to grid (optional) | Required | ⚠️ Partial | Low | May exist |
| Zoom to fit | Required | ❌ Missing | Low | Easy addition |
| Comments/Sticky notes | Required | ❌ Missing | Medium | New component needed |
| Node search/filter | Required | ⚠️ Partial | Low | Basic search may exist |
| Connection preview | Required | ❌ Missing | Medium | Valid/invalid hover |

### 2.15 Public API & Documentation

| Feature | Hackathon Requirement | Current Status | Risk Level | Notes |
|---------|----------------------|----------------|------------|-------|
| trpc-to-openapi conversion | Required | ❌ Missing | **High** | Not configured |
| API key auth | Required | ❌ Missing | **High** | No ApiKey model |
| Rate limiting (Upstash) | Required | ❌ Missing | **High** | No Redis integration |
| OpenAPI spec generation | Required | ❌ Missing | **High** | No setup |
| Mintlify documentation | Required | ❌ Missing | **High** | No integration |
| Required REST endpoints | Required | ❌ Missing | **High** | None implemented |
| API key management UI | Required | ❌ Missing | Medium | Create/list/revoke |
| Webhook callbacks | Required | ❌ Missing | Medium | On execution complete |

---

## 3. Architecture Alignment Analysis

### 3.1 Areas That Match Hackathon Expectations

| Component | Assessment | Notes |
|-----------|------------|-------|
| **React Flow Canvas** | ✅ Aligned | v12 with proper configuration |
| **tRPC + TanStack Query** | ✅ Aligned | Type-safe API layer established |
| **Prisma + PostgreSQL** | ✅ Aligned | Schema exists, needs extensions |
| **Clerk Authentication** | ✅ Aligned | Middleware and context working |
| **Zustand State Management** | ✅ Aligned | Stores properly structured |
| **Zod Validation** | ✅ Aligned | Used in tRPC procedures |
| **Shadcn/ui Components** | ✅ Aligned | 56 components available |
| **Auto-save Pattern** | ✅ Aligned | Debounced implementation |
| **Folder Hierarchy** | ✅ Aligned | Beyond requirements (bonus) |

### 3.2 Areas Requiring Refactoring

| Component | Current State | Required Change | Effort |
|-----------|---------------|-----------------|--------|
| **Node Definitions** | Hardcoded in component files | Config-driven with auto-generation | High |
| **LLM Integration** | Direct Gemini API calls in router | Provider abstraction + OpenRouter | High |
| **Execution Flow** | Sequential tRPC calls from client | Orchestrator Trigger.dev task | High |
| **Handle System** | Fixed handles per node type | Dynamic from config + collapsible | Medium |
| **Execution History** | Basic model | Extended with provider, cost, scope | Medium |
| **Export/Import** | Basic JSON | Versioned schema with validation | Low |
| **Keyboard Shortcuts** | Partial | Complete implementation | Low |

### 3.3 Areas Requiring New Abstractions

| Abstraction | Purpose | Components Needed |
|-------------|---------|-------------------|
| **Provider Interface** | Unified contract for all AI providers | `IProvider<TInput, TOutput>`, `executeWithFallback()` |
| **Node Config Schema** | Single source of truth per node | Config type, schema generators, UI generators |
| **Cost Calculator** | Credit estimation and deduction | `estimateCost()`, `calculateActualCost()`, ledger |
| **Orchestrator Task** | DAG execution with Trigger.dev patterns | Parent task with `triggerAndWait()` per node |
| **Realtime Manager** | WebSocket subscription handling | Trigger.dev Realtime integration |
| **API Key Auth** | REST endpoint authentication | Middleware, key generation, rate limiting |

### 3.4 Temporary Prototype Decisions (Must Change)

| Decision | Current Implementation | Production Requirement |
|----------|------------------------|------------------------|
| LLM Provider | Gemini API directly in router | OpenRouter with provider abstraction |
| Execution | Client orchestrates via tRPC | Trigger.dev orchestrator task |
| Real-time | Polling every 1 second | Trigger.dev Realtime WebSocket |
| Node UI | Hardcoded React components | Generated from config |
| Package Manager | npm | pnpm |
| Testing | None | 100% coverage |

### 3.5 Components to Rewrite vs Extend

| Component | Decision | Rationale |
|-----------|----------|-----------|
| `workflow.store.ts` | **Extend** | Core structure good, add execution state |
| `LLMNode.tsx` | **Rewrite** | Wrong provider, needs config-driven approach |
| Node components (all) | **Rewrite** | Must be config-driven, new handle system |
| `llm.router.ts` | **Replace** | New provider abstraction required |
| Trigger.dev tasks | **Rewrite** | All nodes must be Trigger.dev tasks |
| `WorkflowExecution` model | **Extend** | Add provider, cost, scope fields |
| `workflow-execution.ts` | **Extend** | Add parallel execution support |
| Dashboard UI | **Extend** | Add credits display, API key management |
| TaskManager | **Extend** | Enhanced history view per spec |

---

## 4. Day-by-Day Execution Plan (15 Days)

### Phase 1: Foundation & Architecture (Days 1-5)

#### Day 1 — Environment Setup & Architecture Design

**Goals:**
- Migrate to pnpm
- Design and document core abstractions
- Set up testing infrastructure

**Tasks:**
1. Remove `package-lock.json`, regenerate with pnpm
2. Create provider interface specification (`lib/providers/types.ts`)
3. Design node config schema structure (`lib/nodes/config-schema.ts`)
4. Set up Vitest configuration (`vitest.config.ts`)
5. Set up Playwright configuration (`playwright.config.ts`)
6. Configure MSW for API mocking
7. Create database migration for credits system

**Deliverables:**
- [ ] pnpm working with all dependencies
- [ ] Provider interface documented and typed
- [ ] Node config schema documented and typed
- [ ] Testing infrastructure configured
- [ ] Credits schema migration created

---

#### Day 2 — Provider Abstraction Layer

**Goals:**
- Implement provider abstraction
- Create fallback chain executor
- Integrate fal.ai SDK

**Tasks:**
1. Implement `IProvider` interface with input/output generics
2. Create `ProviderRegistry` for provider management
3. Implement `executeWithFallback()` utility
4. Create fal.ai base provider implementation
5. Add provider logging (which provider succeeded)
6. Write unit tests for provider abstraction

**Deliverables:**
- [ ] Provider abstraction layer complete
- [ ] Fallback chain working
- [ ] fal.ai SDK integrated
- [ ] Unit tests passing for provider layer

---

#### Day 3 — Config-Driven Node System

**Goals:**
- Create node config schema
- Build config-to-Zod generator
- Build config-to-UI generator

**Tasks:**
1. Define complete node config TypeScript type
2. Create first node config: Seedream 4.5
3. Implement Zod schema auto-generation from config
4. Implement React component auto-generation from config
5. Create handle system with collapsible advanced settings
6. Write unit tests for schema/UI generation

**Deliverables:**
- [ ] Node config type complete
- [ ] Seedream 4.5 config created
- [ ] Schema generation working
- [ ] UI generation working
- [ ] Unit tests passing

---

#### Day 4 — Trigger.dev Execution Engine

**Goals:**
- Implement orchestrator task pattern
- Add `triggerAndWait()` and `wait.forToken()` patterns
- Create node execution wrapper

**Tasks:**
1. Create orchestrator Trigger.dev task
2. Implement topological execution in orchestrator
3. Create generic node execution task with webhook handling
4. Implement `wait.forToken()` for fal.ai webhooks
5. Add parallel branch detection and execution
6. Connect orchestrator to tRPC workflow execution endpoint

**Deliverables:**
- [ ] Orchestrator task working
- [ ] `triggerAndWait()` pattern implemented
- [ ] `wait.forToken()` pattern implemented
- [ ] Parallel execution for independent branches
- [ ] Integration tests for execution engine

---

#### Day 5 — Checkpoint 1: Core Architecture Complete

**Goals:**
- Complete real-time updates via Trigger.dev Realtime
- Verify all core architectural patterns working
- Prepare checkpoint demo

**Tasks:**
1. Integrate Trigger.dev Realtime for execution status
2. Remove polling, implement WebSocket subscription
3. Update UI to consume real-time updates
4. End-to-end test: create workflow → execute → see real-time updates
5. Fix any integration issues
6. Document architecture decisions

**Checkpoint 1 Deliverables:**
- [ ] Provider abstraction with fallback chain
- [ ] Config-driven node system (1 node complete)
- [ ] Trigger.dev orchestrator with proper patterns
- [ ] Real-time execution updates (no polling)
- [ ] Unit tests for core systems

---

### Phase 2: Node Implementation & Credits (Days 6-10)

#### Day 6 — Image & Video Generation Nodes

**Goals:**
- Implement Seedream 4.5 (complete)
- Implement Seedance 1.5

**Tasks:**
1. Finalize Seedream 4.5 with text-to-image and edit endpoints
2. Create Seedream Trigger.dev task with webhook handling
3. Create Seedance 1.5 config (text-to-video, image-to-video)
4. Implement Seedance Trigger.dev task
5. Test both nodes end-to-end
6. Write integration tests

**Deliverables:**
- [ ] Seedream 4.5 fully working
- [ ] Seedance 1.5 fully working
- [ ] Integration tests for both nodes

---

#### Day 7 — Audio & LLM Nodes

**Goals:**
- Implement ElevenLabs V3
- Implement OpenRouter LLM (replace Gemini)

**Tasks:**
1. Create ElevenLabs V3 config and task
2. Create OpenRouter LLM config with model selection
3. Implement OpenRouter provider
4. Handle multimodal inputs (text + images)
5. Remove old Gemini LLM implementation
6. Write integration tests

**Deliverables:**
- [ ] ElevenLabs V3 fully working
- [ ] OpenRouter LLM fully working
- [ ] Old Gemini code removed
- [ ] Integration tests passing

---

#### Day 8 — Remaining AI Nodes

**Goals:**
- Implement Sync Lipsync
- Implement Kling O1

**Tasks:**
1. Create Sync Lipsync config and task
2. Test audio + video input handling
3. Create Kling O1 config (video-to-video, edit endpoints)
4. Implement endpoint selection logic
5. Test both nodes end-to-end
6. Write integration tests

**Deliverables:**
- [ ] Sync Lipsync fully working
- [ ] Kling O1 fully working
- [ ] 6/10 nodes complete

---

#### Day 9 — Utility Nodes (FFmpeg)

**Goals:**
- Implement Merge Audio with Video
- Implement Merge Multiple Videos
- Implement Extract Audio from Video

**Tasks:**
1. Create Merge Audio with Video task
2. Create Merge Multiple Videos task with transitions
3. Create Extract Audio from Video task
4. All use FFmpeg via Trigger.dev
5. Upload results to Transloadit
6. Write integration tests

**Deliverables:**
- [ ] Merge Audio with Video working
- [ ] Merge Multiple Videos working
- [ ] Extract Audio from Video working
- [ ] 10/10 nodes complete

---

#### Day 10 — Checkpoint 2: Credits System & All Nodes

**Goals:**
- Implement complete credits system
- Verify all 10 nodes working
- Prepare checkpoint demo

**Tasks:**
1. Add credits field to User model
2. Create CreditTransaction model
3. Implement credit estimation functions per node
4. Implement pre-execution validation
5. Implement post-execution deduction
6. Create credits UI (balance display, transaction history)
7. Full workflow test with credits

**Checkpoint 2 Deliverables:**
- [ ] All 10 nodes implemented and working
- [ ] Credits system complete (estimate, deduct, ledger)
- [ ] Node execution history with provider and cost
- [ ] Integration tests for all nodes

---

### Phase 3: UX, Testing & API (Days 11-14)

#### Day 11 — Editor UX Hardening

**Goals:**
- Complete all keyboard shortcuts
- Add comments/sticky notes
- Polish UI/UX

**Tasks:**
1. Implement all required keyboard shortcuts
2. Create Comment/Sticky Note node type
3. Add zoom to fit button
4. Add node search/filter in sidebar
5. Improve connection preview (valid/invalid highlighting)
6. Verify multi-select and drag selection
7. Ensure dark/light mode complete

**Deliverables:**
- [ ] All keyboard shortcuts working
- [ ] Comments/Sticky Notes feature
- [ ] Connection preview feedback
- [ ] Dark/Light mode polished

---

#### Day 12 — Public API & Rate Limiting

**Goals:**
- Implement trpc-to-openapi REST endpoints
- Add API key authentication
- Integrate Upstash Redis rate limiting

**Tasks:**
1. Configure trpc-to-openapi
2. Create required REST endpoints (workflows, executions, credits)
3. Implement API key generation and management
4. Create ApiKey model with scopes
5. Integrate Upstash Redis for rate limiting
6. Create API key management UI

**Deliverables:**
- [ ] REST API endpoints working
- [ ] API key auth implemented
- [ ] Rate limiting active
- [ ] API key management UI

---

#### Day 13 — Testing Sprint

**Goals:**
- Achieve high test coverage
- Set up CI pipeline

**Tasks:**
1. Write unit tests for all utility functions
2. Write unit tests for all Zustand store actions
3. Write integration tests for tRPC procedures
4. Write E2E tests for critical user flows:
   - Create workflow → add nodes → connect → execute
   - Import/export workflow
   - View execution history
5. Configure GitHub Actions CI
6. Ensure tests run on PR

**Deliverables:**
- [ ] Unit test coverage > 80%
- [ ] Integration tests for all procedures
- [ ] E2E tests for critical flows
- [ ] CI pipeline active

---

#### Day 14 — Checkpoint 3: Polish & Documentation

**Goals:**
- Complete Mintlify documentation
- Final polish pass
- Checkpoint demo

**Tasks:**
1. Set up Mintlify
2. Write API documentation
3. Add inline code documentation
4. Create README with setup instructions
5. Final UI polish (animations, loading states)
6. Fix any remaining bugs
7. Performance optimization pass

**Checkpoint 3 Deliverables:**
- [ ] Mintlify docs deployed
- [ ] All features working
- [ ] Test coverage target met
- [ ] Performance acceptable
- [ ] Documentation complete

---

### Phase 4: Final Submission (Day 15)

#### Day 15 — Final Submission

**Goals:**
- Final testing
- Bug fixes
- Submission before 6:00 PM

**Tasks:**
1. Full regression test (all features)
2. Fix any critical bugs
3. Verify production deployment
4. Test on production URL
5. Final code cleanup
6. Submit before deadline

**Final Deliverables:**
- [ ] All non-negotiables working
- [ ] Production deployed and stable
- [ ] Documentation accessible
- [ ] Code clean and well-documented
- [ ] Submitted on time

---

## 5. Refactoring & Hardening Plan

### 5.1 Files/Modules to Keep

| File | Reason |
|------|--------|
| `store/workflow.store.ts` | Core structure sound, extend with new state |
| `store/ui.store.ts` | Works well, minor extensions needed |
| `lib/prisma.ts` | Standard Prisma singleton |
| `lib/trpc/*` | Provider and client work correctly |
| `server/trpc.ts` | Context and procedures well-structured |
| `server/routers/workflow.router.ts` | CRUD operations are correct |
| `server/routers/folder.router.ts` | Folder management complete |
| `server/routers/execution.router.ts` | Base is good, extend for new fields |
| `components/ui/*` | Shadcn components are correct |
| `app/layout.tsx` | Provider setup is correct |
| `app/dashboard/*` | Dashboard works, extend for credits |
| `prisma/schema.prisma` | Base models correct, extend |

### 5.2 Files/Modules to Refactor

| File | Changes | Reason |
|------|---------|--------|
| `lib/workflow-types.ts` | Add new handle types (video, audio, number) | Support new node types |
| `lib/workflow-execution.ts` | Add parallel execution detection | Performance requirement |
| `components/workflow/WorkflowSidebar.tsx` | Search/filter, dynamic from registry | Config-driven nodes |
| `components/workflow/NodeConfigSidebar.tsx` | Generalize for all node types | Currently LLM-specific |
| `components/workflow/TaskManager.tsx` | Enhanced history display | Per-spec requirements |
| `app/workflow/[id]/page.tsx` | Extract execution logic | Cleaner separation |
| `server/schemas/workflow.schema.ts` | Add versioning, validation | Export/import spec |

### 5.3 Files/Modules to Rewrite

| File | Reason | New Approach |
|------|--------|--------------|
| `components/workflow/TextNode.tsx` | Config-driven system | Generate from config |
| `components/workflow/ImageNode.tsx` | Config-driven system | Generate from config |
| `components/workflow/UploadImageNode.tsx` | Config-driven system | Generate from config |
| `components/workflow/CropImageNode.tsx` | Config-driven system | Generate from config |
| `components/workflow/LLMNode.tsx` | Wrong provider + config-driven | Generate from config |
| `server/routers/llm.router.ts` | Replace with execution router | Orchestrator pattern |
| `src/trigger/crop-image.ts` | Standardize task pattern | Node execution wrapper |

### 5.4 New Files/Modules Required

| File | Purpose |
|------|---------|
| `lib/providers/types.ts` | Provider interface definitions |
| `lib/providers/fal.ts` | fal.ai provider implementation |
| `lib/providers/openrouter.ts` | OpenRouter provider implementation |
| `lib/providers/registry.ts` | Provider registration and lookup |
| `lib/nodes/config-schema.ts` | Node config TypeScript types |
| `lib/nodes/schema-generator.ts` | Config → Zod schema |
| `lib/nodes/ui-generator.tsx` | Config → React component |
| `lib/nodes/registry.ts` | Node type registration |
| `lib/nodes/configs/*.ts` | Individual node configs (10 files) |
| `lib/credits/calculator.ts` | Cost estimation and calculation |
| `lib/credits/ledger.ts` | Transaction management |
| `src/trigger/orchestrator.ts` | Main workflow execution task |
| `src/trigger/node-executor.ts` | Generic node execution wrapper |
| `server/routers/api.router.ts` | Public API endpoints |
| `server/routers/credits.router.ts` | Credits management |
| `server/middleware/rateLimit.ts` | Upstash rate limiting |
| `components/workflow/CommentNode.tsx` | Sticky note component |
| `tests/**/*` | All test files |

### 5.5 Risk Mitigation Strategies

| Risk | Mitigation |
|------|------------|
| Config-driven rewrite breaks existing nodes | Implement new system alongside old, migrate incrementally |
| Trigger.dev patterns complex | Start with simple case, add complexity iteratively |
| fal.ai webhook integration issues | Test with simple endpoint first, debug thoroughly |
| Credits calculation errors | Comprehensive unit tests, manual verification |
| Test coverage pressure | Prioritize critical paths, use AI assistance |
| Time pressure on Day 15 | Complete all features by Day 14, Day 15 for polish |

---

## 6. Documentation & Code Quality Plan

### 6.1 Documentation Requirements

| Documentation | Location | Contents |
|---------------|----------|----------|
| API Reference | Mintlify | All REST endpoints with examples |
| Setup Guide | README.md | Local development, environment variables |
| Architecture Overview | docs/ARCHITECTURE.md | System design, data flow diagrams |
| Node Reference | Mintlify | All 10 nodes with inputs/outputs/examples |
| Deployment Guide | docs/DEPLOYMENT.md | Vercel, Trigger.dev, database setup |

### 6.2 Inline Documentation Standards

```typescript
/**
 * Executes a workflow using Trigger.dev orchestration.
 * 
 * @param workflowId - The workflow to execute
 * @param selectedNodes - Optional subset of nodes to run
 * @returns Execution ID for tracking
 * 
 * @example
 * const execId = await executeWorkflow('wf_123');
 * 
 * @throws {InsufficientCreditsError} When user lacks credits
 * @throws {ValidationError} When workflow has invalid connections
 */
export async function executeWorkflow(
  workflowId: string,
  selectedNodes?: string[]
): Promise<string> {
  // Implementation
}
```

**Requirements:**
- All exported functions have JSDoc with description, params, returns, example
- Complex logic has inline comments explaining "why"
- Zod schemas have `.describe()` on all fields
- Trigger.dev tasks have clear documentation

### 6.3 TypeScript Standards

| Standard | Enforcement |
|----------|-------------|
| Strict mode | `tsconfig.json` strict: true (already set) |
| No `any` types | ESLint rule |
| Explicit return types on exported functions | ESLint rule |
| Zod inference for types | `z.infer<typeof schema>` |
| Discriminated unions for state | `type Status = 'idle' | 'running' | 'completed' | 'failed'` |

### 6.4 Zod Schema Standards

```typescript
// Node config input schema example
export const seedreamInputSchema = z.object({
  prompt: z.string()
    .min(1)
    .max(2000)
    .describe('Text description of the image to generate'),
  image_url: z.string()
    .url()
    .optional()
    .describe('Optional reference image for editing'),
  aspect_ratio: z.enum(['1:1', '16:9', '9:16', '4:3', '3:4'])
    .default('1:1')
    .describe('Output image aspect ratio'),
  num_inference_steps: z.number()
    .int()
    .min(1)
    .max(50)
    .default(25)
    .describe('Number of denoising steps'),
  // ... all fields documented
});
```

### 6.5 Trigger.dev Task Standards

```typescript
export const seedreamTask = task({
  id: 'seedream-image-gen',
  retry: {
    maxAttempts: 3,
    minTimeoutInMs: 1000,
    maxTimeoutInMs: 10000,
  },
  run: async (payload: SeedreamInput, { ctx }) => {
    // 1. Validate input
    const validated = seedreamInputSchema.parse(payload);
    
    // 2. Submit to provider with webhook
    const webhookUrl = await ctx.createWebhookToken();
    const submission = await fal.submit(validated, { webhookUrl });
    
    // 3. Wait for webhook (no billing while waiting)
    const result = await wait.forToken<FalWebhookPayload>();
    
    // 4. Validate output
    const output = seedreamOutputSchema.parse(result);
    
    // 5. Return normalized result
    return output;
  },
});
```

### 6.6 Testing Strategy

| Layer | Tool | Coverage Target | Priority |
|-------|------|-----------------|----------|
| Unit | Vitest | 90%+ | High |
| Integration | Vitest + Supertest | 80%+ | High |
| E2E | Playwright | Critical paths | High |
| Component | RTL | Interactive components | Medium |

**Critical Test Paths:**
1. Workflow creation → node addition → connection → save
2. Workflow execution → real-time updates → history
3. Import/export with validation
4. Credits estimation → execution → deduction
5. API authentication → rate limiting

**Test File Structure:**
```
tests/
├── unit/
│   ├── lib/
│   │   ├── providers/
│   │   ├── nodes/
│   │   └── credits/
│   └── store/
├── integration/
│   ├── routers/
│   └── triggers/
├── e2e/
│   ├── workflow-creation.spec.ts
│   ├── workflow-execution.spec.ts
│   └── api-access.spec.ts
└── mocks/
    └── handlers.ts  # MSW handlers
```

---

## 7. Final Readiness Checklist

Use this checklist on Day 15 to verify production readiness.

### 7.1 Non-Negotiable Features

#### Visual Workflow Builder
- [ ] Canvas with pan, zoom, minimap working
- [ ] Node palette with all 10 node types
- [ ] Type-safe connections enforced
- [ ] Invalid connections prevented with feedback
- [ ] Cycle detection working
- [ ] Select, delete, duplicate nodes working
- [ ] Viewport save/restore working
- [ ] Color-coded handles by data type

#### Node System
- [ ] All 10 nodes implemented and working
- [ ] Zod input schemas per provider spec
- [ ] Zod output schemas per provider spec
- [ ] Provider fallback architecture in place
- [ ] Input handles for all parameters
- [ ] Connector-setting parity enforced
- [ ] Collapsible advanced settings
- [ ] Config-driven node definitions

#### Execution Engine
- [ ] Full workflow execution working
- [ ] Single node execution working
- [ ] Selected nodes execution working
- [ ] All nodes as Trigger.dev tasks
- [ ] `triggerAndWait()` pattern used
- [ ] `wait.forToken()` for webhooks
- [ ] Topological sort correct
- [ ] Parallel branch execution working
- [ ] Partial results preserved on failure
- [ ] Real-time status via Trigger.dev Realtime

#### Provider Fallback Chain
- [ ] Provider abstraction layer exists
- [ ] Config-driven provider order
- [ ] Fallback transparent to orchestrator
- [ ] Provider logging implemented
- [ ] Same output schema all providers

#### Workflow Management
- [ ] Save/load working
- [ ] Auto-save (debounced) working
- [ ] Editable names working
- [ ] List view with all workflows
- [ ] Delete workflows working

#### Export/Import
- [ ] Export as versioned JSON
- [ ] Import with validation
- [ ] Schema version included
- [ ] Invalid JSON rejected gracefully

#### Execution History
- [ ] History panel visible
- [ ] All execution types tracked
- [ ] Per-run entry with metadata
- [ ] Node-level details on expand
- [ ] Provider used per node shown
- [ ] Cost per node shown
- [ ] Failure details shown
- [ ] Persistence to PostgreSQL

#### Real-Time UI
- [ ] Live status updates (no polling)
- [ ] Visual progress indicator
- [ ] Assets appear on completion
- [ ] WebSocket via Trigger.dev Realtime

#### Credits System
- [ ] Credit balance per user
- [ ] Pre-execution estimate shown
- [ ] Post-execution deduction working
- [ ] Insufficient credits blocks execution
- [ ] Per-node cost tracked
- [ ] Transaction ledger maintained

#### Error Handling
- [ ] Provider timeout → fallback
- [ ] All providers fail → graceful failure
- [ ] Invalid connections prevented
- [ ] Cycles prevented
- [ ] Input limits validated
- [ ] Network errors handled with retry

#### Testing
- [ ] Unit test coverage > 80%
- [ ] Integration tests for procedures
- [ ] E2E tests for critical paths
- [ ] CI pipeline running
- [ ] All tests passing

#### Theming
- [ ] Dark mode working
- [ ] Light mode working
- [ ] Theme toggle persists
- [ ] System preference detection

#### Editor UX
- [ ] All keyboard shortcuts working
- [ ] Multi-select working
- [ ] Snap to grid (optional)
- [ ] Zoom to fit button
- [ ] Comments/Sticky Notes
- [ ] Node search/filter
- [ ] Connection preview feedback

#### Public API
- [ ] REST endpoints working
- [ ] API key authentication
- [ ] Rate limiting active
- [ ] OpenAPI spec generated
- [ ] Mintlify docs deployed

### 7.2 Architecture Quality

- [ ] Provider abstraction is clean and extensible
- [ ] Adding a new node requires only a config file
- [ ] Adding a new provider requires only implementing interface
- [ ] No hardcoded provider calls in business logic
- [ ] Execution engine can handle 100+ node types
- [ ] Code is DRY (no duplicate definitions)

### 7.3 Code Quality

- [ ] TypeScript strict mode, no `any` types
- [ ] All exported functions documented
- [ ] Zod schemas have descriptions
- [ ] No ESLint errors
- [ ] No console.log in production code
- [ ] Consistent code formatting

### 7.4 Production Readiness

- [ ] Environment variables documented
- [ ] No secrets in code
- [ ] Error boundaries prevent crashes
- [ ] Loading states for all async operations
- [ ] Empty states designed
- [ ] Mobile-responsive (if applicable)
- [ ] Performance acceptable (no obvious lag)
- [ ] No memory leaks

### 7.5 Documentation

- [ ] README with setup instructions
- [ ] API documentation on Mintlify
- [ ] Architecture documented
- [ ] All nodes documented with examples

---

## Appendix A: Node Implementation Checklist

For each of the 10 nodes, verify:

| Node | Config | Zod In | Zod Out | Task | Provider | UI | Tests |
|------|--------|--------|---------|------|----------|-----|-------|
| Seedream 4.5 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Seedance 1.5 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| ElevenLabs V3 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| OpenRouter LLM | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Sync Lipsync | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Kling O1 | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Crop Image | [x] | [ ] | [ ] | [x] | [ ] | [ ] | [ ] |
| Merge Audio+Video | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Merge Videos | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |
| Extract Audio | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] | [ ] |

---

## Appendix B: Database Schema Extensions

```prisma
// Add to schema.prisma

model User {
  // ... existing fields
  credits        BigInt   @default(0)  // 1M credits = $1
  apiKeys        ApiKey[]
  creditLedger   CreditTransaction[]
}

model ApiKey {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  name        String
  keyHash     String   @unique  // Store hashed key
  lastFour    String   // For display
  scopes      String[] // ['workflows:read', 'workflows:execute']
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  createdAt   DateTime @default(now())
  revokedAt   DateTime?
  
  @@index([userId])
  @@index([keyHash])
}

model CreditTransaction {
  id            String   @id @default(cuid())
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  amount        BigInt   // Positive = credit, Negative = debit
  balance       BigInt   // Balance after transaction
  type          String   // 'execution' | 'topup' | 'refund'
  description   String
  executionId   String?  // Link to WorkflowExecution if applicable
  nodeId        String?  // Which node incurred cost
  provider      String?  // Which provider was used
  createdAt     DateTime @default(now())
  
  @@index([userId])
  @@index([executionId])
}

model WorkflowExecution {
  // ... existing fields
  scope         String   @default("full")  // 'full' | 'partial' | 'single'
  provider      String?  // Provider used
  creditCost    BigInt?  // Actual cost in credits
  estimatedCost BigInt?  // Pre-execution estimate
  duration      Int?     // Execution time in ms
}
```

---

## Appendix C: Key API Contracts

### REST Endpoints (via trpc-to-openapi)

```yaml
# OpenAPI spec overview

/v1/workflows:
  get:
    summary: List user workflows
    security: [ApiKeyAuth]
    
/v1/workflows/{id}:
  get:
    summary: Get workflow by ID
    security: [ApiKeyAuth]

/v1/workflows/{id}/execute:
  post:
    summary: Execute full workflow
    security: [ApiKeyAuth]
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              inputs: object  # Node ID → input values

/v1/workflows/{id}/execute-selected:
  post:
    summary: Execute selected nodes
    security: [ApiKeyAuth]
    requestBody:
      content:
        application/json:
          schema:
            type: object
            properties:
              nodeIds: array
              withDependencies: boolean

/v1/executions/{id}:
  get:
    summary: Get execution status
    security: [ApiKeyAuth]

/v1/credits:
  get:
    summary: Get credit balance
    security: [ApiKeyAuth]
```

---

*Document prepared for hackathon execution planning. All timelines assume full-time effort with AI assistance.*
