import { ensureRedis, createRedisSubscriber } from '@/lib/redis';
import { getRunSnapshot } from '@/lib/run-store';
import { getRunChannel } from '@/lib/events';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function toSse(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

type RouteContext = {
  params: Promise<{ runId: string }> | { runId: string };
};

export async function GET(_req: Request, context: RouteContext) {
  const resolvedParams = await context.params;
  const { runId } = resolvedParams;

  await ensureRedis();

  const encoder = new TextEncoder();
  const channel = getRunChannel(runId);

  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const subscriber = await createRedisSubscriber();
      let ping: ReturnType<typeof setInterval> | null = null;

      const safeEnqueue = (payload: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          closed = true;
        }
      };

      const close = async () => {
        if (closed) return;
        closed = true;

        if (ping) {
          clearInterval(ping);
          ping = null;
        }

        try {
          await subscriber.unsubscribe(channel);
        } catch {}

        try {
          if (subscriber.isOpen) {
            await subscriber.quit();
          }
        } catch {
          try {
            subscriber.disconnect();
          } catch {}
        }

        try {
          controller.close();
        } catch {}
      };

      try {
        const snapshot = await getRunSnapshot(runId);

        if (snapshot) {
          safeEnqueue(
            toSse({
              type: 'snapshot',
              payload: snapshot,
            })
          );
        }

        await subscriber.subscribe(channel, async (message) => {
          if (closed) return;

          safeEnqueue(`data: ${message}\n\n`);

          try {
            const parsed = JSON.parse(message);

            if (
              parsed?.type === 'run.completed' ||
              parsed?.type === 'run.failed' ||
              parsed?.type === 'run.canceled'
            ) {
              await close();
            }
          } catch {
            // ignore malformed event payloads
          }
        });

        safeEnqueue(`: connected\n\n`);

        ping = setInterval(() => {
          if (closed) return;
          safeEnqueue(`: ping\n\n`);
        }, 15000);
      } catch (error) {
        console.error('[stream] failed to start SSE stream:', error);

        safeEnqueue(
          toSse({
            type: 'run.failed',
            error: error instanceof Error ? error.message : 'Stream error',
          })
        );

        try {
          controller.close();
        } catch {}
      }
    },

    async cancel() {
      closed = true;
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}