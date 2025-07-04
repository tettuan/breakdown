/**
 * @fileoverview Integration Test Optimization Manager
 *
 * Provides performance optimization strategies for integration tests:
 * - Parallel execution scheduling
 * - Resource pooling and reuse
 * - Memory-efficient test data management
 * - Test execution monitoring and analytics
 * - Resource leak detection and prevention
 * - Comprehensive cleanup mechanisms
 *
 * @module tests/integration/test_optimization_manager
 */

import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  type LeakDetectionResult,
  ResourceLeakDetector,
  type ResourceSnapshot,
  TestIsolationManager,
  withResourceLeakDetection,
} from "./resource_leak_detector.ts";

const logger = new BreakdownLogger("test-optimization");

/**
 * Test execution metrics for performance monitoring
 */
export interface TestMetrics {
  testName: string;
  duration: number;
  memoryUsage?: number;
  setupTime: number;
  teardownTime: number;
  status: "passed" | "failed" | "skipped";
}

/**
 * Resource pool for reusing test fixtures and mock objects
 */
export class TestResourcePool {
  private static instance: TestResourcePool | null = null;
  private resourceCache = new Map<string, unknown>();
  private creationCounters = new Map<string, number>();

  private constructor() {}

  static getInstance(): TestResourcePool {
    if (!TestResourcePool.instance) {
      TestResourcePool.instance = new TestResourcePool();
    }
    return TestResourcePool.instance;
  }

  /**
   * Get or create a cached resource
   */
  getOrCreate<T>(key: string, factory: () => T): T {
    if (this.resourceCache.has(key)) {
      const counter = this.creationCounters.get(key) || 0;
      this.creationCounters.set(key, counter + 1);
      logger.debug("Resource cache hit", { key, reuseCount: counter + 1 });
      return this.resourceCache.get(key) as T;
    }

    const resource = factory();
    this.resourceCache.set(key, resource);
    this.creationCounters.set(key, 1);
    logger.debug("Resource created and cached", { key });
    return resource;
  }

  /**
   * Clear cached resources to prevent memory leaks
   */
  clear(pattern?: string): void {
    if (pattern) {
      const keysToDelete = Array.from(this.resourceCache.keys())
        .filter((key) => key.includes(pattern));
      keysToDelete.forEach((key) => {
        this.resourceCache.delete(key);
        this.creationCounters.delete(key);
      });
      logger.debug("Partial resource cache cleared", {
        pattern,
        clearedCount: keysToDelete.length,
      });
    } else {
      this.resourceCache.clear();
      this.creationCounters.clear();
      logger.debug("Full resource cache cleared");
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): Record<string, { cacheHits: number }> {
    const stats: Record<string, { cacheHits: number }> = {};
    this.creationCounters.forEach((count, key) => {
      stats[key] = { cacheHits: count };
    });
    return stats;
  }
}

/**
 * Optimized test data factory with memory-efficient patterns
 */
export class OptimizedTestDataFactory {
  private static readonly COMMON_OPTIONS_TEMPLATE = {
    "uv-environment": "test",
    "uv-version": "1.0.0",
    "skipStdin": true,
  };

  /**
   * Create lightweight test data with minimal memory footprint
   */
  static createLightweightTwoParams_Result(overrides: Record<string, unknown> = {}) {
    return {
      type: "two" as const,
      demonstrativeType: "to",
      layerType: "project",
      params: ["to", "project"],
      options: {
        ...OptimizedTestDataFactory.COMMON_OPTIONS_TEMPLATE,
        ...overrides,
      },
    };
  }

  /**
   * Create batch test data efficiently using object pooling
   */
  static createBatchTestData(count: number, baseKey: string): unknown[] {
    const pool = TestResourcePool.getInstance();

    return Array.from({ length: count }, (_, i) => {
      const key = `${baseKey}-${i}`;
      return pool.getOrCreate(key, () =>
        OptimizedTestDataFactory.createLightweightTwoParams_Result({
          [`uv-batch-${i}`]: `value-${i}`,
          [`uv-index`]: i.toString(),
        }));
    });
  }

  /**
   * Create stress test data with controlled memory usage
   */
  static createStressTestData(variableCount: number): Record<string, unknown> {
    const options: Record<string, unknown> = {
      ...OptimizedTestDataFactory.COMMON_OPTIONS_TEMPLATE,
    };

    // Use efficient string generation to avoid memory bloat
    for (let i = 0; i < variableCount; i++) {
      options[`uv-var${i}`] = `val${i}`;
    }

    return options;
  }
}

/**
 * Test execution scheduler for parallel processing with resource leak detection
 */
export class TestExecutionScheduler {
  private concurrencyLimit: number;
  private activeTests = new Set<string>();
  private metrics: TestMetrics[] = [];
  private resourceDetector: ResourceLeakDetector;
  private isolationManager: TestIsolationManager;
  private resourceSnapshots: ResourceSnapshot[] = [];

  constructor(concurrencyLimit = 3) {
    this.concurrencyLimit = concurrencyLimit;
    this.resourceDetector = new ResourceLeakDetector({
      maxMemoryIncrease: 30, // Stricter memory limits for integration tests
      maxFileHandleIncrease: 5,
      maxTimerIncrease: 3,
      maxTestDuration: 60000, // 60 seconds for integration tests
    });
    this.isolationManager = new TestIsolationManager();
  }

  /**
   * Execute tests with optimal parallelization and resource leak detection
   */
  async executeParallel<T>(
    tasks: Array<{ name: string; fn: () => Promise<T> }>,
    options: { batchSize?: number; timeout?: number; enableLeakDetection?: boolean } = {},
  ): Promise<T[]> {
    const { batchSize = this.concurrencyLimit, timeout = 30000, enableLeakDetection = true } =
      options;
    const results: T[] = [];

    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      const batchStartTime = performance.now();

      logger.debug("Executing test batch with resource monitoring", {
        batchIndex: Math.floor(i / batchSize) + 1,
        batchSize: batch.length,
        totalBatches: Math.ceil(tasks.length / batchSize),
        leakDetectionEnabled: enableLeakDetection,
      });

      const batchPromises = batch.map(async (task) => {
        const testStartTime = performance.now();
        this.activeTests.add(task.name);

        // Take pre-test resource snapshot
        let preSnapshot: ResourceSnapshot | null = null;
        if (enableLeakDetection) {
          await this.isolationManager.setupIsolation(task.name);
          preSnapshot = this.resourceDetector.takeSnapshot(task.name, "before");
          this.resourceSnapshots.push(preSnapshot);
        }

        try {
          const timeoutPromise = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Test timeout: ${task.name}`)), timeout)
          );

          const result = await Promise.race([task.fn(), timeoutPromise]);
          const duration = performance.now() - testStartTime;

          this.metrics.push({
            testName: task.name,
            duration,
            setupTime: 0,
            teardownTime: 0,
            status: "passed",
          });

          logger.debug("Test completed", {
            name: task.name,
            duration: `${duration.toFixed(2)}ms`,
            resourceMonitoring: enableLeakDetection ? "enabled" : "disabled",
          });
          return result;
        } catch (error) {
          const duration = performance.now() - testStartTime;
          this.metrics.push({
            testName: task.name,
            duration,
            setupTime: 0,
            teardownTime: 0,
            status: "failed",
          });

          logger.debug("Test failed", {
            name: task.name,
            duration: `${duration.toFixed(2)}ms`,
            error: error instanceof Error ? error.message : String(error),
          });
          throw error;
        } finally {
          // Resource cleanup and leak detection
          if (enableLeakDetection) {
            try {
              const postSnapshot = this.resourceDetector.takeSnapshot(task.name, "after");
              this.resourceSnapshots.push(postSnapshot);

              await this.isolationManager.teardownIsolation(task.name);
              await this.resourceDetector.cleanupAllResources();

              const cleanupSnapshot = this.resourceDetector.takeSnapshot(task.name, "cleanup");
              this.resourceSnapshots.push(cleanupSnapshot);

              // Detect and log leaks
              const leakResult = this.resourceDetector.detectLeaks(task.name);
              if (leakResult.hasLeaks) {
                logger.debug("Resource leaks detected", {
                  testName: task.name,
                  memoryLeak: leakResult.memoryLeak,
                  fileHandleLeak: leakResult.fileHandleLeak,
                  timerLeak: leakResult.timerLeak,
                  recommendations: leakResult.recommendations,
                });
              }
            } catch (cleanupError) {
              logger.debug("Resource cleanup error", {
                testName: task.name,
                error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError),
              });
            }
          }

          this.activeTests.delete(task.name);
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      const batchDuration = performance.now() - batchStartTime;
      logger.debug("Batch completed", {
        batchIndex: Math.floor(i / batchSize) + 1,
        duration: `${batchDuration.toFixed(2)}ms`,
        avgTestTime: `${(batchDuration / batch.length).toFixed(2)}ms`,
      });

      // Force garbage collection between batches to prevent memory buildup
      if (typeof (globalThis as any).gc === "function") {
        (globalThis as any).gc();
        logger.debug("Garbage collection triggered between batches");
      }
    }

    return results;
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): {
    totalTests: number;
    totalDuration: number;
    averageDuration: number;
    successRate: number;
    fastestTest: TestMetrics | null;
    slowestTest: TestMetrics | null;
  } {
    const totalTests = this.metrics.length;
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const passedTests = this.metrics.filter((m) => m.status === "passed").length;

    const sortedByDuration = [...this.metrics].sort((a, b) => a.duration - b.duration);

    return {
      totalTests,
      totalDuration,
      averageDuration: totalTests > 0 ? totalDuration / totalTests : 0,
      successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
      fastestTest: sortedByDuration[0] || null,
      slowestTest: sortedByDuration[sortedByDuration.length - 1] || null,
    };
  }

  /**
   * Clear metrics history
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get resource leak statistics
   */
  getResourceLeakStats(): {
    totalTests: number;
    testsWithLeaks: number;
    leakRate: number;
    commonLeakTypes: string[];
    totalSnapshots: number;
    recommendations: string[];
  } {
    const summary = this.resourceDetector.getSummary();
    const leaksWithDetails = summary.recentLeaks;

    const testsWithLeaks = leaksWithDetails.length;
    const totalTests = this.metrics.length;
    const leakRate = totalTests > 0 ? (testsWithLeaks / totalTests) * 100 : 0;

    const leakTypes = new Map<string, number>();
    const allRecommendations = new Set<string>();

    leaksWithDetails.forEach((leak) => {
      if (leak.memoryLeak) leakTypes.set("memory", (leakTypes.get("memory") || 0) + 1);
      if (leak.fileHandleLeak) leakTypes.set("fileHandle", (leakTypes.get("fileHandle") || 0) + 1);
      if (leak.timerLeak) leakTypes.set("timer", (leakTypes.get("timer") || 0) + 1);

      leak.recommendations.forEach((rec) => allRecommendations.add(rec));
    });

    const commonLeakTypes = Array.from(leakTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type);

    return {
      totalTests,
      testsWithLeaks,
      leakRate,
      commonLeakTypes,
      totalSnapshots: this.resourceSnapshots.length,
      recommendations: Array.from(allRecommendations),
    };
  }
}

/**
 * Memory-efficient mock factory
 */
export class EfficientMockFactory {
  private static mockInstances = new WeakMap<object, unknown>();

  /**
   * Create or reuse mock instances
   */
  static createMock<T extends object>(template: T, key: string): T {
    if (EfficientMockFactory.mockInstances.has(template)) {
      return EfficientMockFactory.mockInstances.get(template) as T;
    }

    const mock = { ...template };
    EfficientMockFactory.mockInstances.set(template, mock);
    logger.debug("Mock created", { key, type: typeof template });
    return mock;
  }

  /**
   * Create processor mock with optimized memory usage
   */
  static createProcessorMock(type: "TwoParams" | "Stdin" | "Variable") {
    const pool = TestResourcePool.getInstance();
    return pool.getOrCreate(`processor-mock-${type}`, () => {
      switch (type) {
        case "TwoParams":
          return {
            process: (data: unknown) => ({ ok: true, data: "processed" }),
          };
        case "Stdin":
          return {
            process: async (data: unknown, options: unknown) => ({ ok: true, data: "" }),
          };
        case "Variable":
          return {
            process: async (data: unknown) => ({ ok: true, data: [] }),
          };
        default:
          throw new Error(`Unknown processor type: ${type}`);
      }
    });
  }
}

/**
 * Performance regression detection
 */
export class PerformanceMonitor {
  private baselines = new Map<string, number>();
  private readonly REGRESSION_THRESHOLD = 1.5; // 50% performance degradation threshold

  /**
   * Set performance baseline for a test
   */
  setBaseline(testName: string, duration: number): void {
    this.baselines.set(testName, duration);
    logger.debug("Performance baseline set", { testName, duration: `${duration.toFixed(2)}ms` });
  }

  /**
   * Check for performance regression
   */
  checkRegression(testName: string, currentDuration: number): {
    hasRegression: boolean;
    performanceRatio: number;
    baseline: number | null;
  } {
    const baseline = this.baselines.get(testName);
    if (!baseline) {
      return { hasRegression: false, performanceRatio: 1, baseline: null };
    }

    const performanceRatio = currentDuration / baseline;
    const hasRegression = performanceRatio > this.REGRESSION_THRESHOLD;

    if (hasRegression) {
      logger.debug("Performance regression detected", {
        testName,
        baseline: `${baseline.toFixed(2)}ms`,
        current: `${currentDuration.toFixed(2)}ms`,
        degradation: `${((performanceRatio - 1) * 100).toFixed(1)}%`,
      });
    }

    return { hasRegression, performanceRatio, baseline };
  }

  /**
   * Get all performance data
   */
  getAllBaselines(): Record<string, number> {
    return Object.fromEntries(this.baselines);
  }
}

// Export singleton instances
export const resourcePool = TestResourcePool.getInstance();
export const performanceMonitor = new PerformanceMonitor();

// Set known performance baselines from the successful processor pipeline test
performanceMonitor.setBaseline("processor-pipeline-integration", 14);
performanceMonitor.setBaseline("integration-suite-total", 33);

logger.debug("Test optimization manager initialized", {
  componentsLoaded: ["ResourcePool", "TestDataFactory", "ExecutionScheduler", "PerformanceMonitor"],
});
