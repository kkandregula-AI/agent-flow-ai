export type ModelPricing = {
  input: number;
  output: number;
};

export const PRICING: Record<string, ModelPricing> = {
  'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'gpt-4o': { input: 0.005, output: 0.015 },
  'gpt-5': { input: 0.01, output: 0.03 },
};

export function calculateCost(usage: any, model: string) {
  if (!usage) return 0;

  const pricing = PRICING[model] || PRICING['gpt-4o-mini'];

  const input = usage.input_tokens || 0;
  const output = usage.output_tokens || 0;

  return (
    (input / 1000) * pricing.input +
    (output / 1000) * pricing.output
  );
}

export function estimateRunCost(promptLength: number, mode: 'fast' | 'smart' | 'deep') {
  const baseTokens = promptLength / 4;

  const multiplier =
    mode === 'fast' ? 1.5 :
    mode === 'smart' ? 3 :
    6;

  const estimatedTokens = baseTokens * multiplier;

  const avgPrice = 0.0005;

  return (estimatedTokens / 1000) * avgPrice;
}