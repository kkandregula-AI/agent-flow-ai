type RouteContext = {
  params: Promise<{ runId: string }>;
};

export async function POST(_req: Request, context: RouteContext) {
  const { runId } = await context.params;

  // your cancel logic here

  return Response.json({ ok: true, runId });
}

 