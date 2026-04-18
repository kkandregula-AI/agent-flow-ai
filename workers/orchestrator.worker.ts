import 'dotenv/config';

import { Worker } from 'bullmq';
import { bullmqConnection } from '../lib/bullmq';
import { publishRunEvent } from '../lib/events';
import { routerAgent } from '../lib/router';

import {
  analyzerAgent,
  plannerAgent,
  researchAgent,
  writerAgent,
  reviewerAgent,
  singleAgent,
  chunkTextForStreaming,
} from '../lib/agents';

import {
  scoreNodeConfidence,
  scoreRunConfidence,
  weightedAverageNodeConfidence,
} from '../lib/confidence';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const worker = new Worker(
  'agentflow-orchestration',
  async (job) => {
    console.log(`[worker] job received: id=${job.id} name=${job.name}`);

    if (job.name !== 'start-run') return;

    const { runId, prompt, mode } = job.data;

    console.log(`[worker] processing start-run for runId=${runId}`);

    let totalCost = 0;
    let totalTokens = 0;

    const nodeScores: Record<string, number> = {};

    const stream = async (text: string) => {
      const chunks = chunkTextForStreaming(text);
      for (const c of chunks) {
        await publishRunEvent(runId, {
          type: 'token.delta',
          delta: c,
        });
        await wait(20);
      }
    };

    const sendUsage = async () => {
      await publishRunEvent(runId, {
        type: 'token.usage',
        totalCost,
        totalTokens,
      });
    };

    try {
      await publishRunEvent(runId, { type: 'run.started' });

      // ROUTER
      await publishRunEvent(runId, {
        type: 'node.started',
        nodeId: 'router',
      });

      const decision = await routerAgent(prompt);

      totalCost += decision.cost || 0;
      totalTokens += decision.usage?.total_tokens || 0;
      await sendUsage();

      const routerConf = scoreNodeConfidence({
        nodeId: 'router',
        status: 'completed',
        outputText: JSON.stringify(decision),
      });

      nodeScores.router = routerConf;

      await publishRunEvent(runId, {
        type: 'node.completed',
        nodeId: 'router',
        output: decision,
        cost: decision.cost || 0,
        confidence: routerConf,
      });

      // SINGLE ROUTE
      if (decision.route === 'single') {
        await publishRunEvent(runId, {
          type: 'node.started',
          nodeId: 'writer',
        });

        const res = await singleAgent(prompt);

        totalCost += res.cost || 0;
        totalTokens += res.usage?.total_tokens || 0;
        await sendUsage();

        const singleConf = scoreNodeConfidence({
          nodeId: 'writer',
          status: 'completed',
          outputText: res.text,
        });

        nodeScores.writer = singleConf;

        await stream(res.text);

        await publishRunEvent(runId, {
          type: 'node.completed',
          nodeId: 'writer',
          output: res.text,
          cost: res.cost || 0,
          confidence: singleConf,
        });

        await publishRunEvent(runId, {
          type: 'node.skipped',
          nodeId: 'analyzer',
          reason: 'Skipped in single route',
        });

        await publishRunEvent(runId, {
          type: 'node.skipped',
          nodeId: 'planner',
          reason: 'Skipped in single route',
        });

        await publishRunEvent(runId, {
          type: 'node.skipped',
          nodeId: 'research_market',
          reason: 'Skipped in single route',
        });

        await publishRunEvent(runId, {
          type: 'node.skipped',
          nodeId: 'research_users',
          reason: 'Skipped in single route',
        });

        await publishRunEvent(runId, {
          type: 'node.skipped',
          nodeId: 'reviewer',
          reason: 'Skipped in single route',
        });

        await publishRunEvent(runId, {
          type: 'run.completed',
          output: res.text,
          totalCost,
          totalTokens,
          avgConfidence: routerConf,
        });

        return;
      }

      // ANALYZER
      await publishRunEvent(runId, {
        type: 'node.started',
        nodeId: 'analyzer',
      });

      const analysis = await analyzerAgent(prompt);

      totalCost += analysis.cost || 0;
      totalTokens += analysis.usage?.total_tokens || 0;
      await sendUsage();

      const analyzerConf = scoreNodeConfidence({
        nodeId: 'analyzer',
        status: 'completed',
        outputText: analysis.summary,
      });

      nodeScores.analyzer = analyzerConf;

      await publishRunEvent(runId, {
        type: 'node.completed',
        nodeId: 'analyzer',
        output: analysis.summary,
        cost: analysis.cost || 0,
        confidence: analyzerConf,
      });

      // PLANNER
      await publishRunEvent(runId, {
        type: 'node.started',
        nodeId: 'planner',
      });

      const plan = await plannerAgent(prompt, mode);

      totalCost += plan.cost || 0;
      totalTokens += plan.usage?.total_tokens || 0;
      await sendUsage();

      const plannerConf = scoreNodeConfidence({
        nodeId: 'planner',
        status: 'completed',
        outputText: plan.rationale,
      });

      nodeScores.planner = plannerConf;

      await publishRunEvent(runId, {
        type: 'node.completed',
        nodeId: 'planner',
        output: plan.rationale,
        cost: plan.cost || 0,
        confidence: plannerConf,
      });

      let marketText = '';
      let userText = '';

      // LIGHT ROUTE
      if (decision.route === 'light') {
        await publishRunEvent(runId, {
          type: 'node.skipped',
          nodeId: 'research_market',
          reason: 'Skipped in light route',
        });

        await publishRunEvent(runId, {
          type: 'node.skipped',
          nodeId: 'research_users',
          reason: 'Skipped in light route',
        });
      } else {
        // MULTI ROUTE RESEARCH
        await publishRunEvent(runId, {
          type: 'node.started',
          nodeId: 'research_market',
        });

        const market = await researchAgent(prompt, 'market');

        totalCost += market.cost || 0;
        totalTokens += market.usage?.total_tokens || 0;
        await sendUsage();

        const marketConf = scoreNodeConfidence({
          nodeId: 'research_market',
          status: 'completed',
          outputText: market.text,
        });

        nodeScores.research_market = marketConf;
        marketText = market.text;

        await publishRunEvent(runId, {
          type: 'node.completed',
          nodeId: 'research_market',
          output: market.text,
          cost: market.cost || 0,
          confidence: marketConf,
        });

        await publishRunEvent(runId, {
          type: 'node.started',
          nodeId: 'research_users',
        });

        const users = await researchAgent(prompt, 'users');

        totalCost += users.cost || 0;
        totalTokens += users.usage?.total_tokens || 0;
        await sendUsage();

        const usersConf = scoreNodeConfidence({
          nodeId: 'research_users',
          status: 'completed',
          outputText: users.text,
        });

        nodeScores.research_users = usersConf;
        userText = users.text;

        await publishRunEvent(runId, {
          type: 'node.completed',
          nodeId: 'research_users',
          output: users.text,
          cost: users.cost || 0,
          confidence: usersConf,
        });
      }

      // WRITER
      await publishRunEvent(runId, {
        type: 'node.started',
        nodeId: 'writer',
      });

      const writer = await writerAgent(
        prompt,
        `${analysis.summary}\n${plan.rationale}\n${marketText}\n${userText}`,
        mode
      );

      totalCost += writer.cost || 0;
      totalTokens += writer.usage?.total_tokens || 0;
      await sendUsage();

      const writerConf = scoreNodeConfidence({
        nodeId: 'writer',
        status: 'completed',
        outputText: writer.text,
      });

      nodeScores.writer = writerConf;

      await stream(writer.text);

      await publishRunEvent(runId, {
        type: 'run.partial_output',
        section: 'Artifact',
        content: writer.text,
      });

      await publishRunEvent(runId, {
        type: 'node.completed',
        nodeId: 'writer',
        output: writer.text,
        cost: writer.cost || 0,
        confidence: writerConf,
      });

      let review: Awaited<ReturnType<typeof reviewerAgent>> | null = null;

      // REVIEWER ONLY FOR MULTI
      if (decision.route === 'multi') {
        await publishRunEvent(runId, {
          type: 'node.started',
          nodeId: 'reviewer',
        });

        review = await reviewerAgent(writer.text);

        totalCost += review.cost || 0;
        totalTokens += review.usage?.total_tokens || 0;
        await sendUsage();

        const reviewerConf = scoreNodeConfidence({
          nodeId: 'reviewer',
          status: 'completed',
          outputText: review.summary,
          reviewerScore: review.confidence,
        });

        nodeScores.reviewer = reviewerConf;

        await publishRunEvent(runId, {
          type: 'node.completed',
          nodeId: 'reviewer',
          output: review,
          cost: review.cost || 0,
          confidence: reviewerConf,
        });
      } else {
        await publishRunEvent(runId, {
          type: 'node.skipped',
          nodeId: 'reviewer',
          reason: 'Skipped in light route',
        });
      }

      const finalConfidence = scoreRunConfidence({
        complexity: analysis.complexity,
        reviewerVerdict: review?.verdict,
        reviewerConfidence: review?.confidence,
        improvementCount: review?.improvements?.length || 0,
        researchUsed: decision.route === 'multi',
      });

      const weighted = weightedAverageNodeConfidence(nodeScores);
      const avgConfidence = Math.min(1, weighted * 0.4 + finalConfidence * 0.6);

      await publishRunEvent(runId, {
        type: 'run.completed',
        output: writer.text,
        totalCost,
        totalTokens,
        avgConfidence,
      });
    } catch (err: any) {
      console.error(`[worker] job failed for runId=${runId}:`, err);
      await publishRunEvent(runId, {
        type: 'run.failed',
        error: err?.message || 'Worker error',
      });
    }
  },
  { connection: bullmqConnection }
);

worker.on('error', (err) => {
  console.error('[worker] worker error:', err);
});

worker.on('failed', (job, err) => {
  console.error(`[worker] job failed: id=${job?.id} name=${job?.name}`, err);
});

console.log('🚀 Intelligent Confidence Worker running');