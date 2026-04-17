import { Worker } from "bullmq";
import { redisClient } from "../../infrastructure/redis/client";
import { ProcessIncomingMessageUseCase } from "../useCases/ProcessIncomingMessageUseCase";
import { IMessageRepository } from "../interfaces/repositories";
import { logger } from "../../lib/logger";
import { handleStatus } from "../../modules/webhook/handlers/handleStatus";

export function startIncomingMessageWorker(useCase: ProcessIncomingMessageUseCase) {
  const worker = new Worker("incoming-message", async (job) => {
    const value = job.data;
    await handleStatus(value);
    await useCase.execute(value);
  }, { connection: redisClient });

  worker.on("failed", (job, err) => {
    logger.error({ msg: "incoming_message_worker_failed", jobId: job?.id, error: err });
  });

  return worker;
}

export function startOutboundMessageWorker(messageRepo: IMessageRepository, whatsappService: any) {
  const worker = new Worker("outbound-message", async (job) => {
    const { messageId, phone, content } = job.data;

    try {
      await whatsappService.sendMessage({ type: "text", to: phone, text: content });
      await messageRepo.updateStatus(messageId, "SENT");
    } catch (error) {
      await messageRepo.updateStatus(messageId, "FAILED");
      throw error; // Let BullMQ retry based on queue settings
    }
  }, { connection: redisClient });

  worker.on("failed", (job, err) => {
    logger.error({ msg: "outbound_message_worker_failed", jobId: job?.id, error: err });
  });

  return worker;
}
