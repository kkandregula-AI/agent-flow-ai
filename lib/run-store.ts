import { ensureRedis, redis } from '@/lib/redis';

const runKey = (runId: string) => `agentflow:run:${runId}`;

export async function saveRun(snapshot: any) {
  await ensureRedis();
  await redis.set(runKey(snapshot.runId), JSON.stringify(snapshot));
}

export async function getRunSnapshot(runId: string) {
  await ensureRedis();
  const raw = await redis.get(runKey(runId));
  return raw ? JSON.parse(raw) : null;
}

export async function updateRunSnapshot(
  runId: string,
  updater: (current: any) => any
) {
  await ensureRedis();
  const current = await getRunSnapshot(runId);
  if (!current) return null;

  const next = updater(current);
  await redis.set(runKey(runId), JSON.stringify(next));
  return next;
}