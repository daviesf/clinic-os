import cron from "node-cron";
import { SchedulingService } from "../../modules/scheduling/service";
import { ILogRepository } from "../../application/interfaces/repositories";
import { RedisLock } from "../../infrastructure/redis/RedisLock";
import { logger } from "../../lib/logger";
import { ConsolidationWorker } from "../../application/workers/consolidationWorker";
import { FollowUpWorker } from "../../application/workers/followUpWorker";
import { ILLMProvider } from "../llm/ILLMProvider";

const LOCK_TTL_SECONDS = 60;

export function startCronJobs(
  schedulingService: SchedulingService,
  logRepo: ILogRepository,
  llmProvider?: ILLMProvider
) {
  const lock = new RedisLock();

  // Todo dia 08:00
  cron.schedule("0 8 * * *", async () => {
    const acquired = await lock.acquire("cron:daily_reminders", LOCK_TTL_SECONDS);
    if (!acquired) {
      logger.info({ event: "cron.daily_reminders.skipped", reason: "lock_not_acquired" });
      return;
    }

    try {
      logger.info({ event: "cron.daily_reminders.start" });
      await schedulingService.sendDailyReminders();
    } finally {
      await lock.release("cron:daily_reminders");
    }
  });

  // Todo dia 03:00 (Log cleanup)
  cron.schedule("0 3 * * *", async () => {
    const acquired = await lock.acquire("cron:log_cleanup", LOCK_TTL_SECONDS);
    if (!acquired) {
      logger.info({ event: "cron.log_cleanup.skipped", reason: "lock_not_acquired" });
      return;
    }

    try {
      logger.info({ event: "cron.log_cleanup.start" });
      const threshold = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 14 days
      await logRepo.deleteOlderThan(threshold);
    } catch (error) {
      logger.error({ event: "cron.log_cleanup.error", error });
    } finally {
      await lock.release("cron:log_cleanup");
    }
  });

  // A cada hora (Consolidação de memória)
  if (llmProvider) {
    cron.schedule("0 * * * *", async () => {
      const acquired = await lock.acquire("cron:consolidation", LOCK_TTL_SECONDS);
      if (!acquired) return;

      try {
        const worker = new ConsolidationWorker(llmProvider);
        await worker.run(2); // 2 horas de inatividade
      } finally {
        await lock.release("cron:consolidation");
      }
    });

    // A cada 10 minutos (Follow-ups automáticos)
    cron.schedule("*/10 * * * *", async () => {
      const acquired = await lock.acquire("cron:follow_ups", LOCK_TTL_SECONDS);
      if (!acquired) return;

      try {
        const worker = new FollowUpWorker(llmProvider);
        await worker.run();
      } finally {
        await lock.release("cron:follow_ups");
      }
    });
  }

  logger.info({ event: "cron.jobs_started" });
}
