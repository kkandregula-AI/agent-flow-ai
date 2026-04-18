import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { orchestrationQueue } from '@/lib/bullmq';
import { buildInitialRunSnapshot } from '@/lib/orchestrator';
import { saveRun } from '@/lib/run-store';
import type { RunCreatePayload } from '@/lib/server-types';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RunCreatePayload;

    const runId = randomUUID();
    const snapshot = buildInitialRunSnapshot({
      runId,
      prompt: body.prompt,
      mode: body.mode,
      attachments: body.attachments ?? [],
      sourceLinks: body.sourceLinks ?? [],
    });

    await saveRun(snapshot);

    await orchestrationQueue.add('start-run', {
      runId,
      prompt: body.prompt,
      mode: body.mode,
      attachments: body.attachments ?? [],
      sourceLinks: body.sourceLinks ?? [],
      userId: body.userId ?? 'local-user',
    });

    return NextResponse.json({ runId });
  } catch (error) {
    console.error('[POST /api/runs] Failed to create run:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}