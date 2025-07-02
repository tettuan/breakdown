/**
 * STDIN Test Helpers - Main Export Module
 *
 * Purpose:
 * - Provides centralized exports for STDIN test utilities
 * - Simplifies imports in test files
 * - Documents the available test helpers
 *
 * Usage:
 * ```typescript
 * import {
 *   StdinTestResourceManager,
 *   TestStdinReaderFactory,
 *   MockStdinReader,
 *   type StdinReader
 * } from "./helpers/stdin/index.ts";
 * ```
 */

// Core interfaces
export type {
  MockStdinConfig,
  StdinReader,
  StdinReaderFactory,
  StdinReadOptions,
} from "./interfaces.ts";

// Resource management
export { type StdinTestResource, StdinTestResourceManager } from "./resource_manager.ts";
import { StdinTestResourceManager as _StdinTestResourceManager } from "./resource_manager.ts";

// Mock implementation
export { MockStdinReader } from "./mock_stdin_reader.ts";

// Factory pattern
export { createTestFactory, TestStdinReaderFactory } from "./factory.ts";
import { TestStdinReaderFactory as _TestStdinReaderFactory } from "./factory.ts";

/**
 * Quick setup helper for common test scenarios
 * Creates a resource manager and factory for immediate use
 */
export function setupStdinTest() {
  const resourceManager = new StdinTestResourceManager();
  const factory = new TestStdinReaderFactory(resourceManager);

  return {
    resourceManager,
    factory,
    cleanup: async () => {
      factory.clearReaders();
      await resourceManager.cleanupAll();
    },
  };
}
