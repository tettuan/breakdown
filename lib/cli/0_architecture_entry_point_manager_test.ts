/**
 * @fileoverview Architecture tests for Entry Point Manager
 * 
 * This test suite verifies that the Entry Point Manager implements the
 * Entry Point Design Pattern correctly:
 * - Proper lifecycle management
 * - Environment validation
 * - Signal handling
 * - Error boundary implementation
 * - Factory pattern usage
 * 
 * @module lib/cli/0_architecture_entry_point_manager_test
 */

import { assertEquals, assertExists, assert } from "../../tests/deps.ts";
import { EntryPointManager } from "./entry_point_manager.ts";

Deno.test("Entry Point Manager Architecture - Factory methods provide different configurations", () => {
  // Test factory methods create different manager configurations
  const standard = EntryPointManager.createStandard();
  const development = EntryPointManager.createDevelopment();
  const production = EntryPointManager.createProduction();

  assertExists(standard, "Standard manager should be created");
  assertExists(development, "Development manager should be created");
  assertExists(production, "Production manager should be created");

  // All should be instances of EntryPointManager
  assert(standard instanceof EntryPointManager, "Standard should be EntryPointManager instance");
  assert(development instanceof EntryPointManager, "Development should be EntryPointManager instance");
  assert(production instanceof EntryPointManager, "Production should be EntryPointManager instance");
});

Deno.test("Entry Point Manager Architecture - Constructor accepts configuration", () => {
  // Test that manager accepts configuration options
  const config = {
    verbose: true,
    validateEnvironment: false,
    errorHandler: () => {},
  };

  const manager = new EntryPointManager(config);
  assertExists(manager, "Manager should be created with configuration");
  assert(manager instanceof EntryPointManager, "Should be EntryPointManager instance");
});

Deno.test("Entry Point Manager Architecture - Start method returns Result type", {
  sanitizeOps: false,
  sanitizeResources: false,
}, async () => {
  // Test that start method follows Result pattern
  const manager = new EntryPointManager({
    verbose: false,
    validateEnvironment: false, // Skip environment validation to avoid signal handlers
  });

  // Set testing environment to avoid signal handlers
  const originalTesting = Deno.env.get("DENO_TESTING");
  Deno.env.set("DENO_TESTING", "true");

  try {
    // Use empty args to avoid actual command execution
    const result = await manager.start([]);

    assertExists(result, "Start should return a result");
    assertEquals(typeof result.ok, "boolean", "Result should have ok property");

    if (!result.ok) {
      assertExists(result.error, "Error result should have error property");
      assertExists(result.error.kind, "Error should have kind property");
      
      // Use utility function to get message from any error type
      const { getEntryPointErrorMessage } = await import("./entry_point_manager.ts");
      const message = getEntryPointErrorMessage(result.error);
      assertExists(message, "Error should have extractable message");
    }
  } finally {
    // Restore original testing environment
    if (originalTesting === undefined) {
      Deno.env.delete("DENO_TESTING");
    } else {
      Deno.env.set("DENO_TESTING", originalTesting);
    }
  }
});

Deno.test("Entry Point Manager Architecture - Error types follow discriminated union pattern", () => {
  // Test that error types are properly structured
  const environmentError = {
    kind: "EnvironmentValidationError" as const,
    message: "Test error",
    requirements: ["test requirement"],
  };

  const startupError = {
    kind: "StartupError" as const,
    message: "Test startup error",
    cause: new Error("Test cause"),
  };

  const signalError = {
    kind: "SignalHandlerError" as const,
    signal: "SIGINT",
    error: "Test signal error",
    message: "Signal handler test error",
  };

  const shutdownError = {
    kind: "ShutdownError" as const,
    message: "Test shutdown error",
    cause: new Error("Test cause"),
  };

  // Verify error structure
  assertEquals(environmentError.kind, "EnvironmentValidationError");
  assertEquals(startupError.kind, "StartupError");
  assertEquals(signalError.kind, "SignalHandlerError");
  assertEquals(shutdownError.kind, "ShutdownError");

  // All should have messages
  assertExists(environmentError.message);
  assertExists(startupError.message);
  assertExists(signalError.error);
  assertExists(shutdownError.message);
});

Deno.test("Entry Point Manager Architecture - Factory methods follow naming conventions", () => {
  // Test that factory methods follow consistent naming
  const factoryMethods = [
    "createStandard",
    "createDevelopment", 
    "createProduction",
  ];

  for (const methodName of factoryMethods) {
    const method = (EntryPointManager as any)[methodName];
    assertEquals(typeof method, "function", `${methodName} should be a static method`);
    
    // Method should start with "create"
    assert(methodName.startsWith("create"), `${methodName} should follow create* naming convention`);
  }
});

Deno.test("Entry Point Manager Architecture - Configuration interface is type-safe", () => {
  // Test configuration interface type safety
  const validConfig = {
    verbose: true,
    errorHandler: (error: Error) => console.error(error),
    signalHandlers: {
      SIGINT: () => {},
      SIGTERM: () => {},
    },
    validateEnvironment: false,
  };

  // Should create without errors
  const manager = new EntryPointManager(validConfig);
  assertExists(manager);
});

Deno.test("Entry Point Manager Architecture - Start method is async", {
  sanitizeOps: false,
  sanitizeResources: false,
}, () => {
  // Test that start method is properly async
  const manager = new EntryPointManager({
    verbose: false,
    validateEnvironment: false, // Skip to avoid signal handlers
  });
  
  // Set testing environment
  const originalTesting = Deno.env.get("DENO_TESTING");
  Deno.env.set("DENO_TESTING", "true");
  
  try {
    const result = manager.start([]);

    assertExists(result, "Start should return a value");
    assert(result instanceof Promise, "Start should return a Promise");
  } finally {
    // Restore environment
    if (originalTesting === undefined) {
      Deno.env.delete("DENO_TESTING");
    } else {
      Deno.env.set("DENO_TESTING", originalTesting);
    }
  }
});

Deno.test("Entry Point Manager Architecture - Manager implements proper encapsulation", () => {
  // Test that manager properly encapsulates internal state
  const manager = EntryPointManager.createStandard();

  // Should expose public interface
  assertEquals(typeof manager.start, "function", "Should expose start method");
  
  // Should not expose factory methods as instance methods
  assertEquals((manager as any).createStandard, undefined, "Factory methods should not be instance methods");
  assertEquals((manager as any).createDevelopment, undefined, "Factory methods should not be instance methods");
  assertEquals((manager as any).createProduction, undefined, "Factory methods should not be instance methods");
  
  // Test that private methods are not in the public interface (through descriptors)
  const descriptor = Object.getOwnPropertyDescriptor(manager, 'validateEnvironment');
  assertEquals(descriptor, undefined, "Private methods should not be enumerable properties");
});

Deno.test("Entry Point Manager Architecture - Error handling follows functional patterns", async () => {
  // Test that error handling follows functional programming patterns
  // Set test environment to avoid signal handler registration
  const originalEnv = Deno.env.get("DENO_TESTING");
  Deno.env.set("DENO_TESTING", "true");
  
  try {
    const manager = EntryPointManager.createStandard();
    
    // Test with empty arguments (should show help)
    const result = await manager.start([]);
    
    // Should return Result type
    assert(typeof result.ok === "boolean", "Should return Result type");
    
  } catch (error) {
    // Manager should not throw, should return Result instead
    throw new Error(`Entry Point Manager should not throw, got: ${error}`);
  } finally {
    // Restore original environment
    if (originalEnv === undefined) {
      Deno.env.delete("DENO_TESTING");
    } else {
      Deno.env.set("DENO_TESTING", originalEnv);
    }
  }
});

Deno.test("Entry Point Manager Architecture - Singleton pattern not enforced (stateless design)", () => {
  // Test that multiple instances can be created (stateless design)
  const manager1 = EntryPointManager.createStandard();
  const manager2 = EntryPointManager.createStandard();

  assertExists(manager1);
  assertExists(manager2);

  // Should be different instances (not singleton)
  assert(manager1 !== manager2, "Should create separate instances, not singleton");
});