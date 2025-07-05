/**
 * @fileoverview Resource Leak Detector for Integration Tests
 *
 * Comprehensive resource monitoring and leak detection system:
 * - Memory usage tracking and leak detection
 * - File handle monitoring and cleanup
 * - Test isolation validation
 * - Resource constraint enforcement
 * - Automatic cleanup mechanisms
 *
 * @module tests/integration/resource_leak_detector
 */

import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("resource-leak-detector");

/**
 * Resource usage snapshot for monitoring
 */
export interface ResourceSnapshot {
  timestamp: number;
  memoryUsage: number;
  openFileHandles: number;
  activeTimers: number;
  testName: string;
  phase: "before" | "after" | "cleanup";
}

/**
 * Resource leak detection result
 */
export interface LeakDetectionResult {
  hasLeaks: boolean;
  memoryLeak: boolean;
  fileHandleLeak: boolean;
  timerLeak: boolean;
  details: {
    memoryDelta: number;
    fileHandleDelta: number;
    timerDelta: number;
    threshold: ResourceThresholds;
  };
  recommendations: string[];
}

/**
 * Resource thresholds for leak detection
 */
export interface ResourceThresholds {
  maxMemoryIncrease: number; // MB
  maxFileHandleIncrease: number;
  maxTimerIncrease: number;
  maxTestDuration: number; // ms
}

/**
 * Comprehensive resource leak detector
 */
export class ResourceLeakDetector {
  private snapshots: ResourceSnapshot[] = [];
  private activeResources = new Set<string>();
  private cleanupCallbacks = new Map<string, (() => Promise<void> | void)[]>();
  private resourceThresholds: ResourceThresholds;

  constructor(thresholds?: Partial<ResourceThresholds>) {
    this.resourceThresholds = {
      maxMemoryIncrease: 50, // 50MB
      maxFileHandleIncrease: 10,
      maxTimerIncrease: 5,
      maxTestDuration: 30000, // 30 seconds
      ...thresholds,
    };
  }

  /**
   * Take a resource usage snapshot
   */
  takeSnapshot(testName: string, phase: "before" | "after" | "cleanup"): ResourceSnapshot {
    const snapshot: ResourceSnapshot = {
      timestamp: Date.now(),
      memoryUsage: this.getMemoryUsage(),
      openFileHandles: this.getFileHandleCount(),
      activeTimers: this.getActiveTimerCount(),
      testName,
      phase,
    };

    this.snapshots.push(snapshot);
    logger.debug("Resource snapshot taken", {
      testName,
      phase,
      memory: `${snapshot.memoryUsage.toFixed(2)}MB`,
      fileHandles: snapshot.openFileHandles,
      timers: snapshot.activeTimers,
    });

    return snapshot;
  }

  /**
   * Register a resource for tracking
   */
  registerResource(resourceId: string, cleanupCallback?: () => Promise<void> | void): void {
    this.activeResources.add(resourceId);

    if (cleanupCallback) {
      if (!this.cleanupCallbacks.has(resourceId)) {
        this.cleanupCallbacks.set(resourceId, []);
      }
      this.cleanupCallbacks.get(resourceId)!.push(cleanupCallback);
    }

    logger.debug("Resource registered", { resourceId, hasCleanup: !!cleanupCallback });
  }

  /**
   * Unregister a resource
   */
  unregisterResource(resourceId: string): void {
    this.activeResources.delete(resourceId);
    this.cleanupCallbacks.delete(resourceId);
    logger.debug("Resource unregistered", { resourceId });
  }

  /**
   * Force cleanup of a specific resource
   */
  async cleanupResource(resourceId: string): Promise<void> {
    const callbacks = this.cleanupCallbacks.get(resourceId);
    if (callbacks) {
      for (const callback of callbacks) {
        try {
          await callback();
        } catch (error) {
          logger.debug("Resource cleanup error", {
            resourceId,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }
    this.unregisterResource(resourceId);
  }

  /**
   * Cleanup all registered resources
   */
  async cleanupAllResources(): Promise<void> {
    const resourceIds = Array.from(this.activeResources);
    logger.debug("Cleaning up all resources", { count: resourceIds.length });

    for (const resourceId of resourceIds) {
      await this.cleanupResource(resourceId);
    }

    // Force garbage collection if available
    if (typeof (globalThis as any).gc === "function") {
      (globalThis as any).gc();
      logger.debug("Garbage collection triggered");
    }
  }

  /**
   * Detect resource leaks between snapshots
   */
  detectLeaks(testName: string): LeakDetectionResult {
    const beforeSnapshot = this.snapshots.find((s) =>
      s.testName === testName && s.phase === "before"
    );
    const afterSnapshot = this.snapshots.find((s) =>
      s.testName === testName && s.phase === "after"
    );

    if (!beforeSnapshot || !afterSnapshot) {
      return {
        hasLeaks: false,
        memoryLeak: false,
        fileHandleLeak: false,
        timerLeak: false,
        details: {
          memoryDelta: 0,
          fileHandleDelta: 0,
          timerDelta: 0,
          threshold: this.resourceThresholds,
        },
        recommendations: ["Unable to detect leaks - missing snapshots"],
      };
    }

    const memoryDelta = afterSnapshot.memoryUsage - beforeSnapshot.memoryUsage;
    const fileHandleDelta = afterSnapshot.openFileHandles - beforeSnapshot.openFileHandles;
    const timerDelta = afterSnapshot.activeTimers - beforeSnapshot.activeTimers;

    const memoryLeak = memoryDelta > this.resourceThresholds.maxMemoryIncrease;
    const fileHandleLeak = fileHandleDelta > this.resourceThresholds.maxFileHandleIncrease;
    const timerLeak = timerDelta > this.resourceThresholds.maxTimerIncrease;

    const hasLeaks = memoryLeak || fileHandleLeak || timerLeak;

    const recommendations: string[] = [];
    if (memoryLeak) {
      recommendations.push(`Memory leak detected: ${memoryDelta.toFixed(2)}MB increase`);
      recommendations.push("Add explicit object cleanup and null references");
    }
    if (fileHandleLeak) {
      recommendations.push(`File handle leak: ${fileHandleDelta} handles not closed`);
      recommendations.push("Ensure all file operations use try/finally or proper cleanup");
    }
    if (timerLeak) {
      recommendations.push(`Timer leak: ${timerDelta} timers not cleared`);
      recommendations.push("Clear all timeouts and intervals in test cleanup");
    }

    if (hasLeaks) {
      logger.debug("Resource leaks detected", {
        testName,
        memoryDelta: `${memoryDelta.toFixed(2)}MB`,
        fileHandleDelta,
        timerDelta,
        recommendations,
      });
    }

    return {
      hasLeaks,
      memoryLeak,
      fileHandleLeak,
      timerLeak,
      details: {
        memoryDelta,
        fileHandleDelta,
        timerDelta,
        threshold: this.resourceThresholds,
      },
      recommendations,
    };
  }

  /**
   * Get current memory usage in MB
   */
  private getMemoryUsage(): number {
    if (typeof Deno !== "undefined" && Deno.memoryUsage) {
      const usage = Deno.memoryUsage();
      return (usage.rss || usage.heapUsed || 0) / (1024 * 1024);
    }
    return 0;
  }

  /**
   * Get approximate file handle count
   */
  private getFileHandleCount(): number {
    // This is an approximation - actual implementation would require platform-specific code
    return this.activeResources.size;
  }

  /**
   * Get active timer count
   */
  private getActiveTimerCount(): number {
    // Approximate timer count based on tracked resources
    return Array.from(this.activeResources).filter((id) =>
      id.includes("timer") || id.includes("interval")
    ).length;
  }

  /**
   * Clear all snapshots and reset state
   */
  reset(): void {
    this.snapshots = [];
    this.activeResources.clear();
    this.cleanupCallbacks.clear();
    logger.debug("Resource detector reset");
  }

  /**
   * Get leak detection summary
   */
  getSummary(): {
    totalSnapshots: number;
    activeResources: number;
    pendingCleanups: number;
    recentLeaks: LeakDetectionResult[];
  } {
    // Get leaks from last 5 tests
    const recentTests = [...new Set(this.snapshots.slice(-10).map((s) => s.testName))];
    const recentLeaks = recentTests.map((testName) => this.detectLeaks(testName))
      .filter((result) => result.hasLeaks);

    return {
      totalSnapshots: this.snapshots.length,
      activeResources: this.activeResources.size,
      pendingCleanups: this.cleanupCallbacks.size,
      recentLeaks,
    };
  }
}

/**
 * Test isolation manager for preventing cross-test interference
 */
export class TestIsolationManager {
  private tempDirectories = new Set<string>();
  private mockStates = new Map<string, unknown>();
  private originalEnvVars = new Map<string, string | undefined>();

  /**
   * Setup test isolation
   */
  async setupIsolation(testName: string): Promise<void> {
    logger.debug("Setting up test isolation", { testName });

    // Store original environment variables
    this.storeEnvironmentState();

    // Create isolated temp directory
    const tempDir = await this.createIsolatedTempDir(testName);
    this.tempDirectories.add(tempDir);
  }

  /**
   * Teardown test isolation
   */
  async teardownIsolation(testName: string): Promise<void> {
    logger.debug("Tearing down test isolation", { testName });

    // Restore environment variables
    this.restoreEnvironmentState();

    // Cleanup temp directories
    await this.cleanupTempDirectories();

    // Clear mock states
    this.mockStates.clear();
  }

  /**
   * Create isolated temporary directory
   */
  private async createIsolatedTempDir(testName: string): Promise<string> {
    const tempDir = await Deno.makeTempDir({
      prefix: `test_${testName.replace(/[^a-zA-Z0-9]/g, "_")}_`,
    });

    logger.debug("Created isolated temp directory", { testName, tempDir });
    return tempDir;
  }

  /**
   * Store current environment state
   */
  private storeEnvironmentState(): void {
    // Store LOG_LEVEL and other test-relevant env vars
    const envVarsToTrack = ["LOG_LEVEL", "LOG_KEY", "LOG_LENGTH"];

    for (const varName of envVarsToTrack) {
      this.originalEnvVars.set(varName, Deno.env.get(varName));
    }
  }

  /**
   * Restore environment state
   */
  private restoreEnvironmentState(): void {
    for (const [varName, originalValue] of this.originalEnvVars) {
      if (originalValue === undefined) {
        Deno.env.delete(varName);
      } else {
        Deno.env.set(varName, originalValue);
      }
    }
    this.originalEnvVars.clear();
  }

  /**
   * Cleanup all temporary directories
   */
  private async cleanupTempDirectories(): Promise<void> {
    for (const tempDir of this.tempDirectories) {
      try {
        await Deno.remove(tempDir, { recursive: true });
        logger.debug("Cleaned up temp directory", { tempDir });
      } catch (error) {
        logger.debug("Failed to cleanup temp directory", {
          tempDir,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    this.tempDirectories.clear();
  }
}

/**
 * Enhanced test wrapper with resource leak detection
 */
export function withResourceLeakDetection<T>(
  testName: string,
  testFn: () => Promise<T> | T,
  options: {
    thresholds?: Partial<ResourceThresholds>;
    enableIsolation?: boolean;
    enforceCleanup?: boolean;
  } = {},
): () => Promise<T> {
  const detector = new ResourceLeakDetector(options.thresholds);
  const isolation = options.enableIsolation ? new TestIsolationManager() : null;

  return async (): Promise<T> => {
    // Setup phase
    detector.takeSnapshot(testName, "before");
    if (isolation) {
      await isolation.setupIsolation(testName);
    }

    let result: T;
    let testError: unknown;

    try {
      // Execute test
      result = await testFn();
    } catch (error) {
      testError = error;
      throw error;
    } finally {
      // Cleanup phase
      try {
        detector.takeSnapshot(testName, "after");

        if (isolation) {
          await isolation.teardownIsolation(testName);
        }

        await detector.cleanupAllResources();
        detector.takeSnapshot(testName, "cleanup");

        // Detect leaks
        const leakResult = detector.detectLeaks(testName);
        if (leakResult.hasLeaks) {
          logger.debug("Resource leaks detected in test", {
            testName,
            leaks: leakResult,
            enforcement: options.enforceCleanup ? "strict" : "warning",
          });

          if (options.enforceCleanup) {
            throw new Error(
              `Resource leaks detected in ${testName}: ${leakResult.recommendations.join(", ")}`,
            );
          }
        }
      } catch (cleanupError) {
        logger.debug("Cleanup error", {
          testName,
          error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
        });

        if (!testError) {
          throw cleanupError;
        }
      }
    }

    return result!;
  };
}

// Export singleton instances
export const globalResourceDetector = new ResourceLeakDetector();
export const globalIsolationManager = new TestIsolationManager();

logger.debug("Resource leak detector initialized", {
  componentsLoaded: ["ResourceLeakDetector", "TestIsolationManager", "withResourceLeakDetection"],
});
