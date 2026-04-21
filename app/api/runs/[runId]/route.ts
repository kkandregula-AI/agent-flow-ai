import { getRun } from '@/lib/run-history';

export async function GET(
  req: Request,
  { params }: { params: { runId: string } }
) {
  const run = await getRun(params.runId);
  return Response.json(run);
}