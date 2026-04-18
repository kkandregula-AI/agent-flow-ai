import { NextResponse } from 'next/server';
import { getRunSnapshot, updateRunSnapshot } from '@/lib/run-store';
import { publishRunEvent } from '@/lib/events';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  const current: any = await getRunSnapshot(runId);

  if (!current) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
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