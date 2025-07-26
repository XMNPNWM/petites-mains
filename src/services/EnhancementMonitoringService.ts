import { EnhancementTimeoutService } from '@/services/EnhancementTimeoutService';

/**
 * REQUIREMENT 3: Background service to monitor and cleanup enhancement processes
 */
class EnhancementMonitoringService {
  private static intervalId: NodeJS.Timeout | null = null;
  private static readonly CLEANUP_INTERVAL_MINUTES = 10; // Run cleanup every 10 minutes

  /**
   * Start background monitoring for abandoned enhancements
   */
  static startBackgroundMonitoring(): void {
    // Don't start multiple intervals
    if (this.intervalId) {
      return;
    }

    console.log('🔄 Starting background enhancement monitoring service');

    this.intervalId = setInterval(async () => {
      try {
        await EnhancementTimeoutService.cleanupAbandonedEnhancements();
      } catch (error) {
        console.error('❌ Background enhancement cleanup failed:', error);
      }
    }, this.CLEANUP_INTERVAL_MINUTES * 60 * 1000);
  }

  /**
   * Stop background monitoring
   */
  static stopBackgroundMonitoring(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('🛑 Background enhancement monitoring stopped');
    }
  }
}

// Auto-start the monitoring service
EnhancementMonitoringService.startBackgroundMonitoring();

export { EnhancementMonitoringService };