import { getRedisClient } from './redis';

const RUN_LIST_KEY = 'agentflow:runs:list';

export async function saveCompletedRun(run: any) {
  const redis = await getRedisClient();
  const key = `agentflow:run:${run.runId}`;

  await redis.set(key, JSON.stringify(run));
  await redis.lPush(RUN_LIST_KEY, run.runId);
  await redis.lTrim(RUN_LIST_KEY, 0, 49);
}

export async function listRuns() {
  const redis = await getRedisClient();

  const ids = await redis.lRange(RUN_LIST_KEY, 0, 20);

  const runs = await Promise.all(
    ids.map(async (id) => {
      const data = await redis.get(`agentflow:run:${id}`);
      return data ? JSON.parse(data) : null;
    })
  );

  return runs.filter(Boolean);
}

export async function getRun(runId: string) {
  const redis = await getRedisClient();
  const data = await redis.get(`agentflow:run:${runId}`);
  return data ? JSON.parse(data) : null;
}