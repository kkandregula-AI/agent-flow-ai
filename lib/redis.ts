import { createClient, type RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const redis: RedisClientType = createClient({
  url: redisUrl,
});

// compatibility exports for older files
export const redisPub: RedisClientType = redis;
export const redisSub: RedisClientType = redis;

let connectPromise: Promise<void> | null = null;

redis.on('error', (err) => {
  console.error('[redis] client error:', err);
});

export async function ensureRedis() {
  if (redis.isOpen) return;

  if (!connectPromise) {
    connectPromise = redis.connect().finally(() => {
      connectPromise = null;
    });
  }

  await connectPromise;
}

export async function getRedisClient() {
  await ensureRedis();
  return redis;
}

export async function createRedisSubscriber() {
  const sub = redis.duplicate();

  sub.on('error', (err) => {
    console.error('[redis] subscriber error:', err);
  });

  if (!sub.isOpen) {
    await sub.connect();
  }

  return sub;
}

export async function createRedisPublisher() {
  const pub = redis.duplicate();

  pub.on('error', (err) => {
    console.error('[redis] publisher error:', err);
  });

  if (!pub.isOpen) {
    await pub.connect();
  }

  return pub;
}