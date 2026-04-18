import { ensureRedis, createRedisSubscriber } from '@/lib/redis';
import { getRunSnapshot } from '@/lib/run-store';
import { getRunChannel } from '@/lib/events';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { runId } = await params;
  await ensureRedis();

  const encoder = new TextEncoder();
  const subscriber = createRedisSubscriber();
  await subscriber.connect();

  const stream = new ReadableStream({
    async start(controller) {
      const snapshot = await getRunSnapshot(runId);

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({
            type: 'snapshot',
            payload: snapshot ?? {},
          })}\n\n`
        )
      );

      const channel = getRunChannel(runId);

      await subscriber.subscribe(channel, (message: string) => {
        controller.enqueue(encoder.encode(`data: ${message}\n\n`));
      });

      const heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15000);

      const cleanup = async () => {
        clearInterval(heartbeat);
        try {
          await subscriber.unsubscribe(channel);
        } catch {}
        try {
          await subscriber.quit();
        } catch {}
      };

      request.signal.addEventListener('abort', async () => {
        await cleanup();
        try {
          controller.close();
        } catch {}
      });
    },

    async cancel() {
      try {
        await subscriber.quit();
      } catch {}
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}