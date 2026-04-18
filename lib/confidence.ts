export type ConfidenceInputs = {
  complexity?: number; // 0..1
  reviewerVerdict?: 'passed' | 'needs_improvement';
  reviewerConfidence?: number; // 0..1
  improvementCount?: number;
  retries?: number;
  failedNodes?: number;
  skippedNodes?: number;
  researchUsed?: boolean;
  sourceCount?: number;
};

export type NodeConfidenceInput = {
  nodeId: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'skipped';
  outputText?: string;
  retries?: number;
  usedSources?: number;
  reviewerScore?: number;
};

function clamp(value: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

export function scoreNodeConfidence(input: NodeConfidenceInput): number {
  if (input.status === 'failed') return 0;
  if (input.status === 'skipped') return 1;

  let score = 0.75;

  const outputLength = input.outputText?.trim().length || 0;

  if (outputLength > 80) score += 0.05;
  if (outputLength > 400) score += 0.05;

  if ((input.usedSources || 0) > 0) score += 0.05;
  if ((input.usedSources || 0) >= 3) score += 0.05;

  if ((input.retries || 0) > 0) score -= 0.08 * (input.retries || 0);

  if (typeof input.reviewerScore === 'number') {
    score = score * 0.5 + input.reviewerScore * 0.5;
  }

  if (input.nodeId === 'reviewer') score += 0.03;
  if (input.nodeId === 'writer') score += 0.02;

  return clamp(score);
}

export function scoreRunConfidence(input: ConfidenceInputs): number {
  let score = 0.82;

  if (typeof input.complexity === 'number') {
    score -= input.complexity * 0.08;
  }

  if (input.reviewerVerdict === 'passed') score += 0.07;
  if (input.reviewerVerdict === 'needs_improvement') score -= 0.10;

  if (typeof input.reviewerConfidence === 'number') {
    score = score * 0.45 + input.reviewerConfidence * 0.55;
  }

  score -= Math.min((input.improvementCount || 0) * 0.03, 0.15);
  score -= Math.min((input.retries || 0) * 0.04, 0.16);
  score -= Math.min((input.failedNodes || 0) * 0.12, 0.30);
  score -= Math.min((input.skippedNodes || 0) * 0.01, 0.05);

  if (input.researchUsed) score += 0.03;
  if ((input.sourceCount || 0) >= 3) score += 0.03;
  if ((input.sourceCount || 0) >= 6) score += 0.02;

  return clamp(score);
}

export function weightedAverageNodeConfidence(
  scores: Partial<Record<string, number>>
): number {
  const weights: Record<string, number> = {
    router: 0.05,
    analyzer: 0.1,
    planner: 0.1,
    research_market: 0.1,
    research_users: 0.1,
    writer: 0.25,
    reviewer: 0.3,
  };

  let weighted = 0;
  let totalWeight = 0;

  for (const [nodeId, score] of Object.entries(scores)) {
    if (typeof score !== 'number') continue;
    const w = weights[nodeId] ?? 0.05;
    weighted += score * w;
    totalWeight += w;
  }

  if (!totalWeight) return 0;

  return clamp(weighted / totalWeight);
}