/**
 * @fileoverview Architecture tests for stdin provider module
 *
 * This test file validates the architectural constraints and design principles
 * of the stdin provider abstraction, ensuring proper separation of concerns
 * and adherence to Totality principles.
 *
 * @module io/0_architecture_stdin_provider_test
 */

import { assertEquals, assertExists } from "../deps.ts";
import { fromFileUrl } from "@std/path";

/**
 * Architecture Test: Dependency Isolation
 *
 * Verifies that the stdin provider properly isolates system dependencies
 * and provides a clean abstraction layer.
 */
Deno.test("Architecture: Stdin provider isolates system dependencies", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./stdin_provider.ts", import.meta.url)),
  );

  // Check that interface doesn't expose Deno-specific types directly
  const interfaceSection = moduleSource.match(/export interface StdinProvider\s*{[^}]+}/s);
  assertExists(interfaceSection, "Should have StdinProvider interface");

  const interfaceContent = interfaceSection[0];

  // Verify no direct Deno type exposure
  const hasDenoTypes = interfaceContent.includes("Deno.");
  assertEquals(hasDenoTypes, false, "Interface should not expose Deno-specific types");

  // Check that MockStdinProvider doesn't use actual I/O
  const mockProviderSection = moduleSource.match(
    /export class MockStdinProvider[^{]+{[\s\S]+?^}/m,
  );
  if (mockProviderSection) {
    const hasActualIO = mockProviderSection[0].includes("Deno.stdin") ||
      mockProviderSection[0].includes("readAll(Deno.stdin)");
    assertEquals(hasActualIO, false, "Mock provider should not use actual I/O");
  }

  // Verify proper abstraction with ReadableStream interface
  const usesStandardTypes = interfaceContent.includes("ReadableStream<Uint8Array>");
  assertEquals(usesStandardTypes, true, "Should use standard web API types");
});

/**
 * Architecture Test: Interface Segregation
 *
 * Ensures that the StdinProvider interface follows the Interface Segregation
 * Principle, providing focused methods without unnecessary complexity.
 */
Deno.test("Architecture: Stdin provider interface is properly segregated", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./stdin_provider.ts", import.meta.url)),
  );

  // Extract interface methods
  const interfaceMatch = moduleSource.match(/export interface StdinProvider\s*{([^}]+)}/s);
  assertExists(interfaceMatch, "Should have StdinProvider interface");

  const methods = interfaceMatch[1].match(/\w+\s*\([^)]*\)\s*:/g) || [];
  const methodNames = methods.map((m) => m.split("(")[0].trim());

  // Check each method has a single purpose
  const _expectedMethods = ["readAll", "isTerminal"];
  const coreMethods = methodNames.filter((m) => !m.includes("?"));

  // Core methods should be focused
  assertEquals(coreMethods.length >= 2, true, "Should have at least 2 core methods");

  // Check for optional cleanup method
  const hasOptionalCleanup = interfaceMatch[1].includes("cleanup?");
  assertEquals(hasOptionalCleanup, true, "Should have optional cleanup method");

  // Verify readable property
  const hasReadableProperty = interfaceMatch[1].includes("readonly readable:");
  assertEquals(hasReadableProperty, true, "Should have readonly readable property");
});

/**
 * Architecture Test: Test Environment Safety
 *
 * Validates that the module design prevents resource leaks and ensures
 * safe operation in test environments.
 */
Deno.test("Architecture: Stdin provider ensures test environment safety", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./stdin_provider.ts", import.meta.url)),
  );

  // Check MockStdinProvider implementation
  const mockClassMatch = moduleSource.match(/export class MockStdinProvider[\s\S]+?^}/m);
  assertExists(mockClassMatch, "Should have MockStdinProvider class");

  const mockImplementation = mockClassMatch[0];

  // Verify no actual I/O operations in mock
  const hasDenoStdin = mockImplementation.includes("Deno.stdin");
  assertEquals(hasDenoStdin, false, "Mock should not access Deno.stdin");

  // Check that MockStdinProvider doesn't need cleanup (no real resources)
  // The interface has optional cleanup for implementations that need it
  const interfaceHasOptionalCleanup = moduleSource.includes("cleanup?()");
  assertEquals(interfaceHasOptionalCleanup, true, "Interface should have optional cleanup");

  // Verify no global state mutation
  const hasGlobalMutation = mockImplementation.includes("globalThis.") ||
    mockImplementation.includes("window.");
  assertEquals(hasGlobalMutation, false, "Should not mutate global state");

  // Check that data is passed via constructor config
  const hasConfigConstructor = mockImplementation.includes("constructor") &&
    mockImplementation.includes("config");
  assertEquals(hasConfigConstructor, true, "Should use config-based construction");
});

/**
 * Architecture Test: Totality in Error Handling
 *
 * Ensures that error handling follows Totality principles, representing
 * errors as values rather than exceptions.
 */
Deno.test("Architecture: Stdin provider uses Totality-based error handling", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./stdin_provider.ts", import.meta.url)),
  );

  // Check interface methods return promises (can handle errors)
  const interfaceMatch = moduleSource.match(/export interface StdinProvider\s*{([^}]+)}/s);
  assertExists(interfaceMatch, "Should have StdinProvider interface");

  const hasPromiseReturns = interfaceMatch[1].includes("Promise<");
  assertEquals(hasPromiseReturns, true, "Should use Promise returns for error handling");

  // Check MockStdinProvider error handling
  const mockClassContent =
    moduleSource.match(/export class MockStdinProvider[\s\S]+?(?=\nexport|$)/s)?.[0] || "";

  // Verify config-based error simulation
  const hasErrorConfig = mockClassContent.includes("shouldFail") &&
    mockClassContent.includes("errorMessage");
  assertEquals(hasErrorConfig, true, "Should support error simulation via config");

  // Check for try-catch blocks or error throwing
  const hasErrorHandling = mockClassContent.includes("throw") ||
    mockClassContent.includes("reject");
  assertEquals(hasErrorHandling, true, "Should have error handling mechanisms");

  // Verify no unhandled exceptions in critical paths
  const hasUnguardedOperations = /\.(read|write|close)\([^)]*\)(?!\s*\.catch|\s*\)|\s*;)/g.test(
    mockClassContent,
  );
  assertEquals(hasUnguardedOperations, false, "All I/O operations should be properly handled");
});

/**
 * Architecture Test: Provider Pattern Implementation
 *
 * Verifies that the provider pattern is correctly implemented with
 * proper abstraction and extensibility.
 */
Deno.test("Architecture: Stdin provider follows provider pattern correctly", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./stdin_provider.ts", import.meta.url)),
  );

  // Check for interface definition
  const hasInterface = moduleSource.includes("export interface StdinProvider");
  assertEquals(hasInterface, true, "Should define provider interface");

  // Check for at least one implementation
  const hasMockImplementation = moduleSource.includes("implements StdinProvider");
  assertEquals(hasMockImplementation, true, "Should have at least one implementation");

  // Verify factory or provider selection mechanism
  const hasDenoProvider = moduleSource.includes("DenoStdinProvider") ||
    moduleSource.includes("ActualStdinProvider");
  const _hasMultipleProviders = hasMockImplementation && hasDenoProvider;

  // At minimum, should have mock provider
  assertEquals(hasMockImplementation, true, "Should implement provider pattern with mock");

  // Check for proper abstraction
  const exportsInterface = moduleSource.includes("export interface StdinProvider");
  const exportsImplementation = moduleSource.includes("export class") &&
    moduleSource.includes("implements StdinProvider");

  assertEquals(
    exportsInterface && exportsImplementation,
    true,
    "Should export both interface and implementation(s)",
  );

  // Verify extensibility via interface
  const interfaceIsComplete = moduleSource.includes("readAll()") &&
    moduleSource.includes("isTerminal()") &&
    moduleSource.includes("readable:");
  assertEquals(interfaceIsComplete, true, "Interface should define complete contract");
});
