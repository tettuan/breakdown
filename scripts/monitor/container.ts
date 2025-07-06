import { MonitoringOptions } from "./models.ts";
import { Logger, CommandExecutor, TimeManager, KeyboardInterruptHandler, RuntimeTracker } from "./services.ts";
import { ArgumentParser } from "./arguments.ts";
import { PaneDataProcessor, StatusAnalyzer, PaneManager, PaneStatusManager } from "./panes.ts";
import { MessageGenerator, PaneCommunicator } from "./communication.ts";
import { PaneDisplayer } from "./display.ts";
import { CIManager } from "./ci.ts";
import { TmuxSession } from "./session.ts";
import { MonitoringEngine } from "./engine.ts";

/**
 * Dependency Injection Container - Single Responsibility: Dependency Management
 */
export class DIContainer {
  private static instance: DIContainer;
  private dependencies: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer();
    }
    return DIContainer.instance;
  }

  register<T>(key: string, factory: () => T): void {
    this.dependencies.set(key, factory);
  }

  get<T>(key: string): T {
    const factory = this.dependencies.get(key);
    if (!factory) {
      throw new Error(`Dependency not found: ${key}`);
    }
    return factory();
  }

  initialize(): void {
    // Core utilities
    this.register('logger', () => new Logger());
    this.register('commandExecutor', () => new CommandExecutor());
    this.register('timeManager', () => new TimeManager());
    this.register('keyboardHandler', () => new KeyboardInterruptHandler());
    this.register('runtimeTracker', () => new RuntimeTracker(14400000));

    // Data processing
    this.register('paneDataProcessor', () => new PaneDataProcessor(this.get('commandExecutor')));
    this.register('statusAnalyzer', () => new StatusAnalyzer(this.get('logger')));
    this.register('messageGenerator', () => new MessageGenerator());

    // Command line processing
    this.register('argumentParser', () => new ArgumentParser(this.get('timeManager'), this.get('logger')));

    // Business logic
    this.register('session', () => TmuxSession.create(
      this.get('commandExecutor'),
      this.get('logger')
    ));

    this.register('paneManager', () => new PaneManager(this.get('logger')));
    this.register('statusManager', () => new PaneStatusManager());

    this.register('communicator', () => PaneCommunicator.create(
      this.get('commandExecutor'),
      this.get('logger')
    ));

    this.register('displayer', () => PaneDisplayer.create(
      this.get('logger')
    ));

    this.register('ciManager', () => CIManager.create(
      this.get('commandExecutor'),
      this.get('logger')
    ));
  }

  createMonitoringEngine(options: MonitoringOptions): MonitoringEngine {
    let scheduledTime: Date | null = null;
    let instructionFile: string | null = null;

    // Extract values from discriminated union
    switch (options.mode.kind) {
      case "Scheduled":
        scheduledTime = options.mode.scheduledTime;
        break;
      case "ScheduledContinuous":
        scheduledTime = options.mode.scheduledTime;
        break;
    }

    switch (options.instruction.kind) {
      case "WithFile":
        instructionFile = options.instruction.filePath;
        break;
    }

    return new MonitoringEngine(
      this.get('session'),
      this.get('paneManager'),
      this.get('communicator'),
      this.get('displayer'),
      this.get('statusManager'),
      this.get('ciManager'),
      this.get('timeManager'),
      this.get('runtimeTracker'),
      this.get('keyboardHandler'),
      this.get('paneDataProcessor'),
      this.get('statusAnalyzer'),
      this.get('messageGenerator'),
      this.get('logger'),
      scheduledTime,
      instructionFile
    );
  }
}
