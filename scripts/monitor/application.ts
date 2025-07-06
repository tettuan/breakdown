import { MonitoringOptions } from "./models.ts";
import { Logger } from "./services.ts";
import { ArgumentParser } from "./arguments.ts";
import { DIContainer } from "./container.ts";

/**
 * Main Application Class - Single Responsibility: Application Orchestration
 */
export class Application {
  private container: DIContainer;

  constructor() {
    this.container = DIContainer.getInstance();
    this.container.initialize();
  }

  async run(): Promise<void> {
    const logger = this.container.get<Logger>('logger');
    const argumentParser = this.container.get<ArgumentParser>('argumentParser');
    const keyboardHandler = this.container.get<any>('keyboardHandler');
    const runtimeTracker = this.container.get<any>('runtimeTracker');
    const timeManager = this.container.get<any>('timeManager');

    const optionsResult = argumentParser.parse();
    if (!optionsResult.ok) {
      logger.error(`Failed to parse arguments: ${optionsResult.error.message}`);
      return;
    }
    
    const options = optionsResult.data;
    
    // Log startup information
    runtimeTracker.logStartupInfo(logger, timeManager);

    const scheduledTime = options.getScheduledTime();
    if (scheduledTime) {
      const timeStr = scheduledTime.toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
        hour: "2-digit",
        minute: "2-digit",
      });
      logger.info(`Scheduled execution time: ${timeStr} (Asia/Tokyo)`);
    }

    const instructionFile = options.getInstructionFile();
    if (instructionFile) {
      logger.info(`Instruction file specified: ${instructionFile}`);
    }

    // Set up global keyboard interrupt handler
    logger.info("Press any key to stop monitoring at any time...");
    keyboardHandler.setup();

    try {
      const monitor = this.container.createMonitoringEngine(options);

      if (options.isContinuous()) {
        await monitor.startContinuousMonitoring();
      } else {
        await monitor.monitor();
      }
    } finally {
      // Clean up keyboard interrupt handler
      keyboardHandler.cleanup();
      logger.info("Monitoring stopped.");
    }
  }
}
