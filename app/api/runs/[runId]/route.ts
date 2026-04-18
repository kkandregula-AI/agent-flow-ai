import { NextResponse } from 'next/server';
import { getRunSnapshot } from '@/lib/run-store';

export async function GET(_request: Request, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const snapshot = await getRunSnapshot(runId);

  if (!snapshot) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }

  return NextResponse.json(snapshot);
}
