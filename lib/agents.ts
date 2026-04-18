import OpenAI from 'openai';
import { calculateCost } from './cost';

export type RunMode = 'fast' | 'smart' | 'deep';

type NormalizedUsage = {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
};

type LLMResult = {
  text: string;
  cost: number;
  usage: NormalizedUsage;
  model: string;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getModel(mode: RunMode) {
  return mode === 'fast'
    ? 'gpt-4o-mini'
    : mode === 'smart'
    ? 'gpt-4o'
    : 'gpt-4.1';
}

function normalizeUsage(usage: any): NormalizedUsage {
  const input_tokens = usage?.input_tokens ?? 0;
  const output_tokens = usage?.output_tokens ?? 0;
  const total_tokens =
    usage?.total_tokens ?? input_tokens + output_tokens;

  return {
    input_tokens,
    output_tokens,
    total_tokens,
  };
}

async function callLLM(prompt: string, mode: RunMode): Promise<LLMResult> {
  const model = getModel(mode);

  const res = await openai.responses.create({
    model,
    input: prompt,
  });

  const usage = normalizeUsage(res.usage);
  const text = res.output_text ?? '';
  const cost = calculateCost(usage, model);

  return {
    text,
    cost,
    usage,
    model,
  };
}

// ------------------
// ANALYZER
// ------------------
export async function analyzerAgent(prompt: string) {
  const res = await callLLM(
    `Analyze this task and summarize the goal, constraints, and likely complexity:\n${prompt}`,
    'smart'
  );

  return {
    summary: res.text,
    complexity: Math.min(1, Math.max(0.1, prompt.length / 1000)),
    cost: res.cost,
    usage: res.usage,
  };
}

// ------------------
// PLANNER
// ------------------
export async function plannerAgent(prompt: string, mode: RunMode) {
  const res = await callLLM(
    `Create an execution plan for this task. Explain what steps are needed and why:\n${prompt}`,
    mode
  );

  return {
    rationale: res.text,
    cost: res.cost,
    usage: res.usage,
  };
}

// ------------------
// RESEARCH
// ------------------
export async function researchAgent(prompt: string, type: 'market' | 'users') {
  const res = await callLLM(
    type === 'market'
      ? `Do concise market research for this task, including positioning, trends, and relevant context:\n${prompt}`
      : `Do concise user research for this task, including personas, JTBD, and pain points:\n${prompt}`,
    'smart'
  );

  return {
    text: res.text,
    cost: res.cost,
    usage: res.usage,
  };
}

// ------------------
// WRITER
// ------------------
export async function writerAgent(prompt: string, context: string, mode: RunMode) {
  const res = await callLLM(
    `Write the final output for this task.

TASK:
${prompt}

CONTEXT:
${context}

Return a polished, structured answer.`,
    mode
  );

  return {
    text: res.text,
    cost: res.cost,
    usage: res.usage,
  };
}

// ------------------
// REVIEWER (INTELLIGENT CONFIDENCE)
// ------------------
export async function reviewerAgent(text: string) {
  const res = await callLLM(
    `Review the following output.

Return ONLY valid JSON:
{
  "verdict": "passed" | "needs_improvement",
  "summary": "...",
  "improvements": ["..."],
  "confidence": 0.0
}

Rules:
- confidence must be between 0 and 1
- confidence should reflect completeness, clarity, usefulness, and structure

OUTPUT:
${text}`,
    'smart'
  );

  try {
    const parsed = JSON.parse(res.text);

    return {
      verdict: (
        parsed.verdict === 'needs_improvement'
          ? 'needs_improvement'
          : 'passed'
      ) as 'needs_improvement' | 'passed',
      summary: parsed.summary || '',
      improvements: Array.isArray(parsed.improvements)
        ? parsed.improvements
        : [],
      confidence:
        typeof parsed.confidence === 'number'
          ? Math.max(0, Math.min(1, parsed.confidence))
          : 0.85,
      cost: res.cost,
      usage: res.usage,
    };
  } catch {
    return {
      verdict: 'passed' as const,
      summary: res.text,
      improvements: [],
      confidence: 0.8,
      cost: res.cost,
      usage: res.usage,
    };
  }
}

// ------------------
// SINGLE AGENT
// ------------------
export async function singleAgent(prompt: string) {
  const res = await callLLM(prompt, 'fast');

  return {
    text: res.text,
    cost: res.cost,
    usage: res.usage,
  };
}

// ------------------
// STREAMING HELPER
// ------------------
export function chunkTextForStreaming(text: string, size = 20) {
  const safeText = text ?? '';
  const chunks: string[] = [];

  for (let i = 0; i < safeText.length; i += size) {
    chunks.push(safeText.slice(i, i + size));
  }

  return chunks;
}