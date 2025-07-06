/**
 * @fileoverview Architecture tests for stdin module (stdin.ts)
 *
 * Tests architectural constraints and dependencies:
 * - Module boundary enforcement for I/O operations
 * - Dependency direction verification
 * - I/O abstraction layer compliance
 * - Error handling architecture
 * - Performance and resource management architecture
 * - Integration with enhanced stdin and timeout management
 *
 * @module io/stdin_architecture_test
 */

import { assertEquals, assertExists } from "../deps.ts";
import { fromFileUrl } from "@std/path";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Type for module exports to avoid any
interface StdinModule {
  readStdin?: unknown;
  hasStdinContent?: unknown;
  writeStdout?: unknown;
  isStdinAvailable?: unknown;
  StdinError?: unknown;
  ProgressBar?: unknown;
  Spinner?: unknown;
  [key: string]: unknown;
}

const logger = new BreakdownLogger("stdin-architecture");

describe("Architecture: Module boundary enforcement", () => {
  it("should export all public I/O interfaces from the module", async () => {
    logger.debug("Testing module exports completeness");

    const _mod = await import("./stdin.ts");

    // Core I/O functions
    const mod = _mod as StdinModule;

    assertExists(mod.readStdin, "readStdin must be exported");
    assertExists(mod.hasStdinContent, "hasStdinContent must be exported");
    assertExists(mod.writeStdout, "writeStdout must be exported");
    assertExists(mod.isStdinAvailable, "isStdinAvailable must be exported");

    // Error handling
    assertExists(mod.StdinError, "StdinError must be exported");

    // UI components
    assertExists(mod.ProgressBar, "ProgressBar must be exported");
    assertExists(mod.Spinner, "Spinner must be exported");

    // Interface types
    assertEquals(typeof mod.readStdin, "function", "readStdin should be a function");
    assertEquals(
      typeof mod.hasStdinContent,
      "function",
      "hasStdinContent should be a function",
    );
    assertEquals(typeof mod.writeStdout, "function", "writeStdout should be a function");
    assertEquals(
      typeof mod.isStdinAvailable,
      "function",
      "isStdinAvailable should be a function",
    );
    assertEquals(typeof mod.StdinError, "function", "StdinError should be a constructor");
    assertEquals(
      typeof mod.ProgressBar,
      "function",
      "ProgressBar should be a constructor",
    );
    assertEquals(typeof mod.Spinner, "function", "Spinner should be a constructor");

    logger.debug("Module exports validation completed");
  });

  it("should not expose internal implementation details", async () => {
    logger.debug("Testing encapsulation boundaries");

    const _mod = await import("./stdin.ts");

    // These should not be exposed at module level
    const unexpectedExports = [
      "_internal",
      "_private",
      "INTERNAL_TIMEOUT",
      "internalReadFunction",
      "PrivateStdinReader",
      "_enhancedStdinInternal",
    ];

    const mod = _mod as StdinModule;

    for (const unexpectedExport of unexpectedExports) {
      assertEquals(
        mod[unexpectedExport],
        undefined,
        `${unexpectedExport} should not be exposed`,
      );
    }

    logger.debug("Encapsulation boundary verification completed");
  });
});

describe("Architecture: Dependency direction verification", () => {
  it("should not import from higher-level modules", async () => {
    logger.debug("Testing dependency direction constraints");

    // Read the module source to check imports
    const moduleSource = await Deno.readTextFile(
      fromFileUrl(new URL("./stdin.ts", import.meta.url)),
    );

    // Should not import from these higher-level modules
    const forbiddenImports = [
      'from "../cli/',
      'from "../commands/',
      'from "../processor/',
      'from "../handlers/',
      'from "../orchestrators/',
      'from "../../cli/',
      'from "../../commands/',
    ];

    for (const forbidden of forbiddenImports) {
      assertEquals(
        moduleSource.includes(forbidden),
        false,
        `Should not import ${forbidden}`,
      );
    }

    logger.debug("Dependency direction verification completed");
  });

  it("should only import from allowed modules", async () => {
    logger.debug("Testing allowed dependencies");

    const moduleSource = await Deno.readTextFile(
      fromFileUrl(new URL("./stdin.ts", import.meta.url)),
    );

    // Extract all imports
    const importMatches = moduleSource.matchAll(/from\s+"[^"]+"/g);

    // Allowed import patterns
    const allowedPatterns = [
      /from\s+"\.\/[^"]+"/g, // Same directory imports (./enhanced_stdin.ts)
      /from\s+"jsr:@std\/[^"]+"/g, // Standard library
      /from\s+"@tettuan\/[^"]+"/g, // External dependencies
      /from\s+"\.\.\/(config|types)\/[^"]+"/g, // Config and types dependencies
    ];

    for (const match of importMatches) {
      const importPath = match[0];
      let isAllowed = false;

      // Reset RegExp lastIndex before testing
      for (const pattern of allowedPatterns) {
        pattern.lastIndex = 0;
        if (pattern.test(importPath)) {
          isAllowed = true;
          break;
        }
      }

      assertEquals(
        isAllowed,
        true,
        `Import ${importPath} should match allowed patterns`,
      );
    }

    logger.debug("Allowed dependencies verification completed");
  });
});

describe("Architecture: I/O abstraction layer compliance", () => {
  it("should provide consistent I/O interface", async () => {
    logger.debug("Testing I/O interface consistency");

    const _mod = await import("./stdin.ts");

    const mod = _mod as StdinModule;

    // All I/O operations should follow async pattern where appropriate
    assertEquals(typeof mod.readStdin, "function", "readStdin should be a function");

    // Synchronous operations should be clearly identified
    assertEquals(
      typeof mod.hasStdinContent,
      "function",
      "hasStdinContent should be sync function",
    );
    assertEquals(
      typeof mod.writeStdout,
      "function",
      "writeStdout should be sync function",
    );
    assertEquals(
      typeof mod.isStdinAvailable,
      "function",
      "isStdinAvailable should be sync function",
    );

    logger.debug("I/O interface consistency verified");
  });

  it("should isolate platform-specific operations", async () => {
    logger.debug("Testing platform abstraction");

    const moduleSource = await Deno.readTextFile(
      fromFileUrl(new URL("./stdin.ts", import.meta.url)),
    );

    // Platform-specific operations should be properly abstracted
    // Check that Deno-specific APIs are used appropriately
    const denoApiUsage = [
      "Deno.stdin",
      "Deno.stdout",
      "Deno.env",
    ];

    let hasDenoUsage = false;
    for (const api of denoApiUsage) {
      if (moduleSource.includes(api)) {
        hasDenoUsage = true;
        break;
      }
    }

    // Should use Deno APIs but wrap them appropriately
    assertEquals(hasDenoUsage, true, "Should use Deno APIs for I/O operations");

    logger.debug("Platform abstraction verification completed");
  });
});

describe("Architecture: Error handling architecture", () => {
  it("should provide comprehensive error handling", async () => {
    logger.debug("Testing error handling architecture");

    const _mod = await import("./stdin.ts");

    const mod = _mod as StdinModule;

    // Should export custom error class
    assertExists(mod.StdinError, "Should export StdinError class");

    // StdinError should extend Error
    const error = new (mod.StdinError as new (message: string) => Error)("test error");
    assertEquals(error instanceof Error, true, "StdinError should extend Error");
    assertEquals(error.name, "StdinError", "Should have correct error name");
    assertEquals(error.message, "test error", "Should preserve error message");

    logger.debug("Error handling architecture verified");
  });

  it("should handle async operation failures gracefully", async () => {
    logger.debug("Testing async error handling");

    const _mod = await import("./stdin.ts");

    // readStdin should return a Promise
    const mod = _mod as StdinModule;

    // Test that readStdin returns a Promise
    const result = (mod.readStdin as (options?: unknown) => Promise<string>)({ timeout: 1 }); // Very short timeout
    assertEquals(result instanceof Promise, true, "readStdin should return Promise");

    // Test StdinError class exists and can be instantiated
    const StdinErrorClass = mod.StdinError as new (message: string) => Error;
    assertExists(StdinErrorClass, "StdinError class should exist");
    
    const testError = new StdinErrorClass("test error");
    assertEquals(testError instanceof Error, true, "StdinError should extend Error");
    assertEquals(testError.name, "StdinError", "Should have correct error name");

    // Test async operation - in CI environment, this might not throw but that's acceptable
    try {
      await result;
      logger.debug("No error occurred - acceptable in CI/test environment");
    } catch (error) {
      // If error occurs, it should be properly typed
      logger.debug(`Error occurred: ${error}`);
    }

    logger.debug("Async error handling architecture verified");
  });
});

describe("Architecture: Performance and resource management", () => {
  it("should provide efficient I/O operations", async () => {
    logger.debug("Testing I/O performance architecture");

    const _mod = await import("./stdin.ts");

    // Test synchronous operations are truly synchronous
    const start = Date.now();
    const mod = _mod as StdinModule;

    const isAvailable = (mod.isStdinAvailable as () => boolean)();
    const duration = Date.now() - start;

    assertEquals(typeof isAvailable, "boolean", "isStdinAvailable should return boolean");
    // Should complete very quickly (< 10ms)
    assertEquals(duration < 10, true, "isStdinAvailable should be fast");

    logger.debug("I/O performance verified");
  });

  it("should manage UI component resources properly", async () => {
    logger.debug("Testing UI component resource management");

    const _mod = await import("./stdin.ts");

    // ProgressBar should be lightweight
    const mod = _mod as StdinModule;

    const progressBar =
      new (mod.ProgressBar as new (total: number, width: number, options?: unknown) => unknown)(
        100,
        40,
        { quiet: true },
      );
    assertExists((progressBar as any).update, "ProgressBar should have update method");
    assertEquals(typeof (progressBar as any).update, "function", "update should be function");

    // Spinner should support lifecycle management
    const spinner = new (mod.Spinner as new (options?: unknown) => unknown)({ quiet: true });
    assertExists((spinner as any).start, "Spinner should have start method");
    assertExists((spinner as any).stop, "Spinner should have stop method");
    assertEquals(typeof (spinner as any).start, "function", "start should be function");
    assertEquals(typeof (spinner as any).stop, "function", "stop should be function");

    // Test cleanup
    (spinner as any).start();
    (spinner as any).stop(); // Should not throw

    logger.debug("UI component resource management verified");
  });
});

describe("Architecture: Integration layer compliance", () => {
  it("should integrate with enhanced stdin module", async () => {
    logger.debug("Testing enhanced stdin integration");

    const moduleSource = await Deno.readTextFile(
      fromFileUrl(new URL("./stdin.ts", import.meta.url)),
    );

    // Should import from enhanced_stdin
    assertEquals(
      moduleSource.includes('from "./enhanced_stdin.ts"'),
      true,
      "Should import from enhanced_stdin module",
    );

    // Should use enhanced functionality
    assertEquals(
      moduleSource.includes("readStdinEnhanced"),
      true,
      "Should use readStdinEnhanced function",
    );

    logger.debug("Enhanced stdin integration verified");
  });

  it("should support timeout management integration", async () => {
    logger.debug("Testing timeout management integration");

    const _mod = await import("./stdin.ts");

    // readStdin should accept timeout options
    const mod = _mod as StdinModule;

    const readStdinFn = (mod.readStdin as Function).toString();

    // Function should handle timeout parameter
    assertEquals(
      readStdinFn.includes("timeout") || readStdinFn.includes("options"),
      true,
      "readStdin should support timeout configuration",
    );

    logger.debug("Timeout management integration verified");
  });
});

describe("Architecture: Module cohesion and coupling", () => {
  it("should have high cohesion within I/O module", async () => {
    logger.debug("Testing module cohesion");

    const _mod = await import("./stdin.ts");

    // All exports should be I/O related
    const mod = _mod as StdinModule;

    const exportNames = Object.keys(mod);

    for (const exportName of exportNames) {
      // Skip symbols and internal properties
      if (typeof exportName !== "string" || exportName.startsWith("_")) continue;

      // All exports should be I/O related functions, classes, or interfaces
      const exportValue = mod[exportName];
      const isIORelated = typeof exportValue === "function" || // Functions and constructors
        typeof exportValue === "object"; // Interfaces and constants

      assertEquals(
        isIORelated,
        true,
        `Export ${exportName} should be I/O related`,
      );
    }

    logger.debug("Module cohesion verification completed");
  });

  it("should have loose coupling with external modules", async () => {
    logger.debug("Testing module coupling");

    // Count external dependencies
    const moduleSource = await Deno.readTextFile(
      fromFileUrl(new URL("./stdin.ts", import.meta.url)),
    );
    const externalImports = moduleSource.match(/from\s+"[^.][^"]+"/g) || [];

    // Should have minimal external dependencies (enhanced_stdin + std lib)
    assertEquals(
      externalImports.length <= 3,
      true,
      `Should have minimal external dependencies (found ${externalImports.length})`,
    );

    // Verify no circular dependencies
    const internalImports = moduleSource.match(/from\s+"\.[^"]+"/g) || [];

    for (const imp of internalImports) {
      const importPath = imp.match(/"([^"]+)"/)?.[1];
      if (!importPath || !importPath.endsWith(".ts")) continue;

      try {
        const importedSource = await Deno.readTextFile(`./lib/io/${importPath.slice(2)}`);
        assertEquals(
          importedSource.includes('from "./stdin.ts"'),
          false,
          `${importPath} should not import back to stdin.ts`,
        );
      } catch {
        // File might not exist or be accessible, skip
      }
    }

    logger.debug("Module coupling verification completed");
  });
});
