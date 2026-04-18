# AgentFlow Studio

A runnable **Next.js + Tailwind + React Flow** UI wired to a basic **BullMQ + Redis + SSE** orchestration backend.

## What is included

- Next.js App Router UI
- Sidebar, prompt workspace, workflow graph, inspector, timeline, final output
- `POST /api/runs` to create a run
- `GET /api/runs/:runId/stream` for SSE live updates
- BullMQ queue and worker process
- Redis-backed run snapshot storage
- Mock orchestration sequence that updates the UI live

## Prerequisites

- Node.js 20+
- Redis running locally or remotely

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Start Redis

Using Docker:

```bash
docker compose up -d
```

Or run your own Redis and point `REDIS_URL` to it.

### 3. Create env file

```bash
cp .env.example .env.local
```

### 4. Start the web app

```bash
npm run dev
```

### 5. Start the worker in a separate terminal

```bash
npm run worker
```

### 6. Open the app

```bash
http://localhost:3000
```

## Flow

```text
UI
  ↓ POST /api/runs
BullMQ queue
  ↓
Worker
  ↓ publish events
Redis Pub/Sub
  ↓
SSE stream
  ↓
UI graph, metrics, timeline, output
```

## Important note

This repo is a **working full-stack prototype**, not a final production backend. The worker currently simulates orchestration and writes a richer PRD-style result, but the transport and repo structure are production-shaped:

- queue
- worker process
- Redis-backed snapshots
- SSE streaming

## Key files

- `app/page.tsx` — main UI and run creation + stream subscription
- `app/api/runs/route.ts` — create run
- `app/api/runs/[runId]/route.ts` — fetch run snapshot
- `app/api/runs/[runId]/stream/route.ts` — SSE endpoint
- `lib/bullmq.ts` — queue setup
- `lib/redis.ts` — Redis client helpers
- `lib/run-store.ts` — Redis-backed run snapshot store
- `lib/events.ts` — publish run events
- `lib/orchestrator.ts` — snapshot builder and PRD section generation
- `workers/orchestrator.worker.ts` — queue worker

## Next upgrade ideas

- Persist files to storage and pass real file content into the worker
- Replace mock orchestration with real planner / agent execution
- Add Postgres for durable history and multi-user runs
- Use finer event types like `node.started`, `tool.called`, `run.completed`
"# agent-flow-ai" 
