import { ensureRedis, redisPub } from '@/lib/redis';

const channelName = (runId: string) => `agentflow:run:${runId}:events`;

export async function publishRunEvent(runId: string, event: unknown) {
  await ensureRedis();
  await redisPub.publish(channelName(runId), JSON.stringify(event));
}

export function getRunChannel(runId: string) {
  return channelName(runId);
}