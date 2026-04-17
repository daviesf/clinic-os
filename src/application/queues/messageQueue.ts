import { Queue } from "bullmq";
import { redisClient } from "../../infrastructure/redis/client";

export const incomingMessageQueue = new Queue("incoming-message", {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  },
});

export const outboundMessageQueue = new Queue("outbound-message", {
  connection: redisClient,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: "exponential", delay: 2000 },
  },
});
