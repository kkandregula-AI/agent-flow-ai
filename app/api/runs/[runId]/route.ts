import { getRun } from '@/lib/run-history';

type RouteContext = {
  params: Promise<{ runId: string }>;
};

export async function GET(_req: Request, context: RouteContext) {
  const { runId } = await context.params;
  const run = await getRun(runId);
  return Response.json(run);
}