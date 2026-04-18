import { openai } from './openai';

export type MemoryRecord = {
  id: string;
  text: string;
  title?: string;
  url?: string;
  kind: 'memory' | 'rag';
  userId: string;
  metadata?: Record<string, unknown>;
};

export type RetrievedChunk = {
  id: string;
  score?: number;
  text: string;
  metadata?: Record<string, unknown>;
};

const EMBEDDING_MODEL =
  process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';

function pineconeHost() {
  const host = process.env.PINECONE_INDEX_HOST?.trim();
  if (!host) return null;
  return host.startsWith('https://') ? host : `https://${host}`;
}

function pineconeApiKey() {
  return process.env.PINECONE_API_KEY?.trim() || null;
}

async function withTimeout<T>(promise: Promise<T>, ms = 20000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export async function embedText(input: string): Promise<number[]> {
  const res = await withTimeout(
    openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input,
    }),
    20000
  );

  return res.data[0]?.embedding || [];
}

export function namespaceFor(kind: 'memory' | 'rag', userId: string) {
  return `${kind}:${userId}`;
}

export async function upsertRecords(records: MemoryRecord[]) {
  const host = pineconeHost();
  const apiKey = pineconeApiKey();

  if (!host || !apiKey || !records.length) return { upsertedCount: 0 };

  const vectors = await Promise.all(
    records.map(async (record) => {
      const values = await embedText(record.text);
      return {
        id: record.id,
        values,
        metadata: {
          text: record.text,
          title: record.title || '',
          url: record.url || '',
          kind: record.kind,
          userId: record.userId,
          ...(record.metadata || {}),
        },
      };
    })
  );

  const byNamespace = new Map<string, typeof vectors>();

  for (let i = 0; i < records.length; i += 1) {
    const record = records[i];
    const vector = vectors[i];
    const ns = namespaceFor(record.kind, record.userId);
    const existing = byNamespace.get(ns) || [];
    existing.push(vector);
    byNamespace.set(ns, existing);
  }

  let upsertedCount = 0;

  for (const [namespace, nsVectors] of byNamespace.entries()) {
    const response = await withTimeout(
      fetch(`${host}/vectors/upsert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': apiKey,
        },
        body: JSON.stringify({
          namespace,
          vectors: nsVectors,
        }),
      }),
      25000
    );

    if (!response.ok) {
      throw new Error(`Pinecone upsert failed: ${response.status}`);
    }

    upsertedCount += nsVectors.length;
  }

  return { upsertedCount };
}

export async function queryNamespace(params: {
  kind: 'memory' | 'rag';
  userId: string;
  queryText: string;
  topK?: number;
}): Promise<RetrievedChunk[]> {
  const host = pineconeHost();
  const apiKey = pineconeApiKey();

  if (!host || !apiKey) return [];

  const vector = await embedText(params.queryText);

  const response = await withTimeout(
    fetch(`${host}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Api-Key': apiKey,
      },
      body: JSON.stringify({
        vector,
        namespace: namespaceFor(params.kind, params.userId),
        topK: params.topK || 5,
        includeMetadata: true,
      }),
    }),
    25000
  );

  if (!response.ok) {
    throw new Error(`Pinecone query failed: ${response.status}`);
  }

  const json = (await response.json()) as {
    matches?: Array<{
      id: string;
      score?: number;
      metadata?: Record<string, unknown>;
    }>;
  };

  return (json.matches || []).map((match) => ({
    id: match.id,
    score: match.score,
    text:
      typeof match.metadata?.text === 'string'
        ? match.metadata.text
        : '',
    metadata: match.metadata,
  }));
}

export async function saveRunMemory(params: {
  userId: string;
  runId: string;
  prompt: string;
  artifact: string;
  reviewSummary?: string;
}) {
  if (!params.userId || !params.artifact?.trim()) return { upsertedCount: 0 };

  const records: MemoryRecord[] = [
    {
      id: `${params.runId}:prompt`,
      text: `Prompt:\n${params.prompt}`,
      title: 'Prompt memory',
      kind: 'memory',
      userId: params.userId,
      metadata: {
        runId: params.runId,
        type: 'prompt',
      },
    },
    {
      id: `${params.runId}:artifact`,
      text: params.artifact,
      title: 'Artifact memory',
      kind: 'memory',
      userId: params.userId,
      metadata: {
        runId: params.runId,
        type: 'artifact',
      },
    },
  ];

  if (params.reviewSummary?.trim()) {
    records.push({
      id: `${params.runId}:review`,
      text: params.reviewSummary,
      title: 'Review summary',
      kind: 'memory',
      userId: params.userId,
      metadata: {
        runId: params.runId,
        type: 'review',
      },
    });
  }

  return upsertRecords(records);
}