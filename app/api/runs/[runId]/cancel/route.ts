import { NextResponse } from 'next/server';
import { getRunSnapshot, updateRunSnapshot } from '@/lib/run-store';
import { publishRunEvent } from '@/lib/events';

type RouteContext = {
  params: Promise<{ runId: string }>;
};

export async function POST(_req: Request, context: RouteContext) {
  const { runId } = await context.params;

  // your cancel logic here

  return Response.json({ ok: true, runId });
}

  await updateRunSnapshot(runId, (snapshot: any) => ({
    ...snapshot,
    runStatus: 'canceled',
    connectionLabel: 'Cancel requested',
  }));

  await publishRunEvent(runId, {
    type: 'run.canceled',
    runId,
  });

  return NextResponse.json({ ok: true });
}