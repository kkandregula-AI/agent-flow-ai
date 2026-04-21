import { listRuns } from '@/lib/run-history';

export async function GET() {
  const runs = await listRuns();
  return Response.json(runs);
}