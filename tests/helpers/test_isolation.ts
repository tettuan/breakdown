/**
 * Test Isolation Manager
 *
 * Purpose:
 * - Prevent test interference when running in parallel
 * - Manage unique temporary directories per test
 * - Ensure proper resource cleanup between tests
 * - Handle race conditions in shared resource access
 */

import { ensureDir } from "@std/fs";
import { join, resolve } from "@std/path";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

export interface IsolationOptions {
  /** Base directory for isolated tests */
  baseDir?: string;
  /** Unique identifier for this test session */
  sessionId?: string;
  /** Auto-cleanup after test completion */
  autoCleanup?: boolean;
  /** Maximum parallel test instances */
  maxParallel?: number;
}

export interface IsolatedTestEnvironment {
  /** Unique test directory */
  testDir: string;
  /** Test session identifier */
  sessionId: string;
  /** Cleanup function */
  cleanup: () => Promise<void>;
  /** Lock manager for shared resources */
  lockManager: ResourceLockManager;
}

export class TestIsolationManager {
  private logger = new BreakdownLogger("test-isolation");
  private activeSessions = new Set<string>();
  private baseDir: string;
  private maxParallel: number;

  constructor(options: IsolationOptions = {}) {
    this.baseDir = resolve(options.baseDir || "./tmp");
    this.maxParallel = options.maxParallel || 10;
  }

  /**
   * Create an isolated test environment
   */
  async createIsolatedEnvironment(
    testName: string,
    options: IsolationOptions = {},
  ): Promise<IsolatedTestEnvironment> {
    // Wait if too many parallel tests
    await this.waitForSlot();

    const sessionId = options.sessionId || this.generateSessionId(testName);
    const testDir = join(this.baseDir, `isolated_${sessionId}`);

    this.logger.debug("Creating isolated environment", { testName, sessionId, testDir });

    try {
      // Ensure test directory exists
      await ensureDir(testDir);

      // Create subdirectories for common test artifacts
      await this.createTestStructure(testDir);

      // Register active session
      this.activeSessions.add(sessionId);

      const lockManager = new ResourceLockManager(sessionId);

      const cleanup = async () => {
        await this.cleanupIsolatedEnvironment(sessionId, testDir);
      };

      return {
        testDir,
        sessionId,
        cleanup,
        lockManager,
      };
    } catch (error) {
      this.logger.error("Failed to create isolated environment", { testName, sessionId, error });
      throw error;
    }
  }

  /**
   * Wait for available slot for parallel test execution
   */
  private async waitForSlot(): Promise<void> {
    while (this.activeSessions.size >= this.maxParallel) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(testName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const cleanName = testName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    return `${cleanName}_${timestamp}_${random}`;
  }

  /**
   * Create standard test directory structure
   */
  private async createTestStructure(testDir: string): Promise<void> {
    const subdirs = [
      "config",
      "prompts",
      "schema",
      "temp",
      "output",
      "input",
    ];

    for (const subdir of subdirs) {
      await ensureDir(join(testDir, subdir));
    }
  }

  /**
   * Cleanup isolated test environment
   */
  private async cleanupIsolatedEnvironment(sessionId: string, testDir: string): Promise<void> {
    this.logger.debug("Cleaning up isolated environment", { sessionId, testDir });

    try {
      // Remove from active sessions
      this.activeSessions.delete(sessionId);

      // Remove test directory
      await Deno.remove(testDir, { recursive: true });

      this.logger.debug("Isolated environment cleaned up", { sessionId });
    } catch (error) {
      this.logger.error("Failed to cleanup isolated environment", { sessionId, testDir, error });
    }
  }

  /**
   * Get current active session count
   */
  getActiveSessionCount(): number {
    return this.activeSessions.size;
  }

  /**
   * Cleanup all active sessions (emergency cleanup)
   */
  async cleanupAllSessions(): Promise<void> {
    this.logger.info("Emergency cleanup of all active sessions", {
      activeCount: this.activeSessions.size,
    });

    const cleanupPromises = Array.from(this.activeSessions).map(async (sessionId) => {
      const testDir = join(this.baseDir, `isolated_${sessionId}`);
      await this.cleanupIsolatedEnvironment(sessionId, testDir);
    });

    await Promise.allSettled(cleanupPromises);
    this.activeSessions.clear();
  }
}

/**
 * Resource Lock Manager for preventing race conditions
 */
export class ResourceLockManager {
  private static globalLocks = new Map<string, Promise<void>>();
  private sessionId: string;
  private logger = new BreakdownLogger("resource-lock");

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Acquire lock for a named resource
   */
  async acquireLock(resourceName: string, timeoutMs = 30000): Promise<() => void> {
    const lockKey = `${resourceName}`;

    this.logger.debug("Attempting to acquire lock", {
      sessionId: this.sessionId,
      resourceName,
      lockKey,
    });

    // Wait for existing lock to be released
    const existingLock = ResourceLockManager.globalLocks.get(lockKey);
    if (existingLock) {
      await Promise.race([
        existingLock,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Lock timeout for ${resourceName}`)), timeoutMs)
        ),
      ]);
    }

    // Create new lock
    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    ResourceLockManager.globalLocks.set(lockKey, lockPromise);

    this.logger.debug("Lock acquired", {
      sessionId: this.sessionId,
      resourceName,
      lockKey,
    });

    // Return release function
    return () => {
      ResourceLockManager.globalLocks.delete(lockKey);
      releaseLock!();
      this.logger.debug("Lock released", {
        sessionId: this.sessionId,
        resourceName,
        lockKey,
      });
    };
  }

  /**
   * Execute function with exclusive access to resource
   */
  async withLock<T>(
    resourceName: string,
    fn: () => Promise<T> | T,
    timeoutMs = 30000,
  ): Promise<T> {
    const release = await this.acquireLock(resourceName, timeoutMs);
    try {
      return await fn();
    } finally {
      release();
    }
  }
}

/**
 * Convenience function for creating isolated test environment
 */
export async function createIsolatedTest(
  testName: string,
  options: IsolationOptions = {},
): Promise<IsolatedTestEnvironment> {
  const manager = new TestIsolationManager(options);
  return await manager.createIsolatedEnvironment(testName, options);
}

/**
 * Global test isolation manager instance
 */
export const globalIsolationManager = new TestIsolationManager();

/**
 * Cleanup all isolated test environments (for use in test teardown)
 */
export async function cleanupAllIsolatedTests(): Promise<void> {
  await globalIsolationManager.cleanupAllSessions();
}
