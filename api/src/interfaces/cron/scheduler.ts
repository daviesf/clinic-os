import cron from "node-cron";
import { SchedulingService } from "../../modules/scheduling/service";
import { PrismaLogRepository } from "../../infrastructure/persistence/PrismaRepositories";
import { prisma } from "../../lib/prisma";
import { logger } from "../../lib/logger";

export function startCronJobs(
  schedulingService: SchedulingService,
  logRepo: PrismaLogRepository
) {
  // Todo dia 08:00
  cron.schedule("0 8 * * *", async () => {
    logger.info({ msg: "running_daily_reminders" });
    await schedulingService.sendDailyReminders();
  });

  // Todo dia 03:00 (Log cleanup)
  cron.schedule("0 3 * * *", async () => {
    logger.info({ msg: "running_log_cleanup" });
    try {
      const threshold = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000); // 14 days
      await logRepo.deleteOlderThan(threshold);
    } catch (error) {
      logger.error({ msg: "log_cleanup_failed", error });
    }
  });

  logger.info({ msg: "cron_jobs_started" });
}
