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
  StdinReader,
  StdinReadOptions,
  StdinReaderFactory,
  MockStdinConfig,
} from "./interfaces.ts";

// Resource management
export {
  StdinTestResourceManager,
  type StdinTestResource,
} from "./resource_manager.ts";

// Mock implementation
export { MockStdinReader } from "./mock_stdin_reader.ts";

// Factory pattern
export {
  TestStdinReaderFactory,
  createTestFactory,
} from "./factory.ts";

/**
 * Quick setup helper for common test scenarios
 * Creates a resource manager and factory for immediate use
 */
export function setupStdinTest(): {
  resourceManager: StdinTestResourceManager;
  factory: TestStdinReaderFactory;
  cleanup: () => Promise<void>;
} {
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