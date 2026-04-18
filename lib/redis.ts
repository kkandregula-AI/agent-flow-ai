import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const redis = createClient({ url: redisUrl });
export const redisPub = createClient({ url: redisUrl });
export const redisSub = createClient({ url: redisUrl });

let connected = false;

export async function ensureRedis() {
  if (connected) return;

  if (!redis.isOpen) await redis.connect();
  if (!redisPub.isOpen) await redisPub.connect();
  if (!redisSub.isOpen) await redisSub.connect();

  connected = true;
}

export function createRedisSubscriber() {
  return createClient({ url: redisUrl });
}

export function createRedisPublisher() {
  return createClient({ url: redisUrl });
}