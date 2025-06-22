/**
 * STDIN Test Resource Manager
 * 
 * Purpose:
 * - Manages AbortController instances and cleanup callbacks
 * - Ensures reliable resource cleanup in test environments
 * - Prevents async operation leaks in tests
 * 
 * Design:
 * - Based on tmp/stdin_test_design_proposal.md section 1.1
 * - Provides centralized resource lifecycle management
 * - Guarantees cleanup execution even on test failures
 */

import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("stdin-resource-manager");

/**
 * Represents a managed test resource with cleanup capabilities
 */
export interface StdinTestResource {
  /** Unique identifier for the resource */
  readonly id: string;
  /** AbortController for cancelling async operations */
  readonly abortController: AbortController;
  /** Cleanup callbacks to execute in reverse order */
  readonly cleanupCallbacks: Array<() => Promise<void>>;
  /** Timestamp when the resource was created */
  readonly createdAt: number;
}

/**
 * Manages STDIN test resources with guaranteed cleanup
 * 
 * This class ensures that all AbortControllers are properly aborted
 * and all cleanup callbacks are executed, even if errors occur.
 */
export class StdinTestResourceManager {
  private resources = new Map<string, StdinTestResource>();

  /**
   * Creates a new managed resource
   * @param id Unique identifier for the resource
   * @returns The created resource with AbortController and cleanup tracking
   */
  async createResource(id: string): Promise<StdinTestResource> {
    logger.debug("Creating resource", { id });

    // Check for duplicate IDs
    if (this.resources.has(id)) {
      logger.warn("Resource ID already exists, cleaning up existing", { id });
      await this.cleanupResource(id);
    }

    const resource: StdinTestResource = {
      id,
      abortController: new AbortController(),
      cleanupCallbacks: [],
      createdAt: Date.now(),
    };

    this.resources.set(id, resource);
    logger.debug("Resource created", { id, resourceCount: this.resources.size });

    return resource;
  }

  /**
   * Cleans up a specific resource
   * @param id The resource ID to clean up
   */
  async cleanupResource(id: string): Promise<void> {
    logger.debug("Cleaning up resource", { id });

    const resource = this.resources.get(id);
    if (!resource) {
      logger.debug("Resource not found, skipping cleanup", { id });
      return;
    }

    // 1. Abort all pending operations
    if (!resource.abortController.signal.aborted) {
      logger.debug("Aborting operations for resource", { id });
      resource.abortController.abort();
    }

    // 2. Execute cleanup callbacks in reverse order (LIFO)
    const callbackCount = resource.cleanupCallbacks.length;
    if (callbackCount > 0) {
      logger.debug("Executing cleanup callbacks", { id, callbackCount });
      
      // Create a copy and reverse to avoid modifying during iteration
      const callbacks = [...resource.cleanupCallbacks].reverse();
      
      for (let i = 0; i < callbacks.length; i++) {
        const callback = callbacks[i];
        try {
          logger.debug("Executing cleanup callback", { id, index: i, total: callbackCount });
          await callback();
        } catch (error) {
          // Log error but continue with other cleanups
          logger.error(`Cleanup callback error for ${id}`, { 
            error: error instanceof Error ? error.message : String(error),
            callbackIndex: i,
            totalCallbacks: callbackCount
          });
        }
      }
    }

    // 3. Remove from registry
    this.resources.delete(id);
    logger.debug("Resource cleaned up", { id, remainingResources: this.resources.size });
  }

  /**
   * Cleans up all registered resources
   * Executes cleanups in parallel for efficiency
   */
  async cleanupAll(): Promise<void> {
    const resourceCount = this.resources.size;
    if (resourceCount === 0) {
      logger.debug("No resources to clean up");
      return;
    }

    logger.debug("Cleaning up all resources", { count: resourceCount });

    // Get all IDs before starting cleanup to avoid concurrent modification
    const ids = Array.from(this.resources.keys());
    
    // Execute cleanups in parallel with error handling
    const results = await Promise.allSettled(
      ids.map(id => this.cleanupResource(id))
    );

    // Log any cleanup failures
    const failures = results.filter(r => r.status === 'rejected');
    if (failures.length > 0) {
      logger.error("Some resource cleanups failed", { 
        failureCount: failures.length,
        totalCount: resourceCount 
      });
    }

    logger.debug("All resources cleaned up", { 
      successCount: results.filter(r => r.status === 'fulfilled').length,
      failureCount: failures.length 
    });
  }

  /**
   * Gets the current number of managed resources
   * Useful for debugging and assertions
   */
  getResourceCount(): number {
    return this.resources.size;
  }

  /**
   * Gets information about all managed resources
   * Useful for debugging resource leaks
   */
  getResourceInfo(): Array<{ id: string; age: number; aborted: boolean }> {
    const now = Date.now();
    return Array.from(this.resources.entries()).map(([id, resource]) => ({
      id,
      age: now - resource.createdAt,
      aborted: resource.abortController.signal.aborted,
    }));
  }

  /**
   * Registers a cleanup callback for a specific resource
   * @param resourceId The resource to register the callback for
   * @param callback The cleanup function to execute
   * @throws Error if the resource doesn't exist
   */
  registerCleanup(resourceId: string, callback: () => Promise<void>): void {
    const resource = this.resources.get(resourceId);
    if (!resource) {
      throw new Error(`Resource not found: ${resourceId}`);
    }

    resource.cleanupCallbacks.push(callback);
    logger.debug("Cleanup callback registered", { 
      resourceId, 
      totalCallbacks: resource.cleanupCallbacks.length 
    });
  }

  /**
   * Gets the AbortSignal for a specific resource
   * @param resourceId The resource ID
   * @returns The AbortSignal or undefined if resource not found
   */
  getAbortSignal(resourceId: string): AbortSignal | undefined {
    return this.resources.get(resourceId)?.abortController.signal;
  }
}