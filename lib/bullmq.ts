import { Queue } from 'bullmq';

const connection = {
  url: process.env.REDIS_URL!,
};

export const orchestrationQueue = new Queue('agentflow-orchestration', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 1000,
    removeOnFail: 1000,
  },
});

export { connection as bullmqConnection };
