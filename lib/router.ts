import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type RouteDecision = {
  route: 'single' | 'light' | 'multi';
  complexity: number; // 0–1
  needsResearch: boolean;
  needsReview: boolean;
  needsArtifact: boolean;
  reason: string;
};

export async function routerAgent(prompt: string): Promise<RouteDecision> {
  const response = await openai.responses.create({
    model: 'gpt-4o-mini',
    input: [
      {
        role: 'system',
        content: `
You are a routing AI.

Decide how complex the user request is.

Return JSON only.

Rules:
- "single" → simple Q&A, explanation, rewrite
- "light" → moderate task, short structured answer
- "multi" → complex tasks needing research, planning, multi-step output

Output JSON:
{
  "route": "single | light | multi",
  "complexity": number (0 to 1),
  "needsResearch": boolean,
  "needsReview": boolean,
  "needsArtifact": boolean,
  "reason": string
}
        `,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const text = response.output_text || '{}';

  try {
    const parsed = JSON.parse(text);

    return {
      route: parsed.route || 'single',
      complexity: parsed.complexity || 0.3,
      needsResearch: parsed.needsResearch || false,
      needsReview: parsed.needsReview || false,
      needsArtifact: parsed.needsArtifact || false,
      reason: parsed.reason || 'Default routing',
    };
  } catch {
    // fallback
    return {
      route: 'single',
      complexity: 0.3,
      needsResearch: false,
      needsReview: false,
      needsArtifact: false,
      reason: 'Fallback route',
    };
  }
}