import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { G2bulkPriceMonitorService } from './g2bulk-price-monitor.service';

@Injectable()
export class G2bulkPriceSchedulerService {
  private readonly logger = new Logger(G2bulkPriceSchedulerService.name);

  constructor(private priceMonitor: G2bulkPriceMonitorService) {}

  /** Poll G2Bulk prices every 10 minutes (respects internal cooldown). */
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleScheduledPriceCheck() {
    try {
      const result = await this.priceMonitor.checkPrices();
      if (result.newAlerts > 0) {
        this.logger.log(
          `G2Bulk price check: ${result.checked} items, ${result.newAlerts} new alert(s), ${result.pricesUpdated} price(s) synced`,
        );
      }
    } catch (err) {
      this.logger.warn(
        `Scheduled G2Bulk price check failed: ${err instanceof Error ? err.message : 'error'}`,
      );
    }
  }
}
