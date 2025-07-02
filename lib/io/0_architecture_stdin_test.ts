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

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const _logger = new BreakdownLogger("stdin-architecture");

describe("Architecture: Module boundary enforcement", () => {
  it("should export all public I/O interfaces from the module", async () => {
    _logger.debug("Testing module exports completeness");

    const _mod = await import("./stdin.ts");

    // Core I/O functions
    assertExists((_mod as any).readStdin, "readStdin must be exported");
    assertExists((_mod as any).hasStdinContent, "hasStdinContent must be exported");
    assertExists((_mod as any).writeStdout, "writeStdout must be exported");
    assertExists((_mod as any).isStdinAvailable, "isStdinAvailable must be exported");

    // Error handling
    assertExists((_mod as any).StdinError, "StdinError must be exported");

    // UI components
    assertExists((_mod as any).ProgressBar, "ProgressBar must be exported");
    assertExists((_mod as any).Spinner, "Spinner must be exported");

    // Interface types
    assertEquals(typeof (_mod as any).readStdin, "function", "readStdin should be a function");
    assertEquals(typeof (_mod as any).hasStdinContent, "function", "hasStdinContent should be a function");
    assertEquals(typeof (_mod as any).writeStdout, "function", "writeStdout should be a function");
    assertEquals(typeof (_mod as any).isStdinAvailable, "function", "isStdinAvailable should be a function");
    assertEquals(typeof (_mod as any).StdinError, "function", "StdinError should be a constructor");
    assertEquals(typeof (_mod as any).ProgressBar, "function", "ProgressBar should be a constructor");
    assertEquals(typeof (_mod as any).Spinner, "function", "Spinner should be a constructor");

    _logger.debug("Module exports validation completed");
  });

  it("should not expose internal implementation details", async () => {
    _logger.debug("Testing encapsulation boundaries");

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

    for (const unexpectedExport of unexpectedExports) {
      assertEquals(
        (mod as unknown)[unexpectedExport],
        undefined,
        `${unexpectedExport} should not be exposed`,
      );
    }

    _logger.debug("Encapsulation boundary verification completed");
  });
});

describe("Architecture: Dependency direction verification", () => {
  it("should not import from higher-level modules", async () => {
    _logger.debug("Testing dependency direction constraints");

    // Read the module source to check imports
    const moduleSource = await Deno.readTextFile(new URL("./stdin.ts", import.meta.url).pathname);

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

    _logger.debug("Dependency direction verification completed");
  });

  it("should only import from allowed modules", async () => {
    _logger.debug("Testing allowed dependencies");

    const moduleSource = await Deno.readTextFile(new URL("./stdin.ts", import.meta.url).pathname);

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
      const isAllowed = false;

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

    _logger.debug("Allowed dependencies verification completed");
  });
});

describe("Architecture: I/O abstraction layer compliance", () => {
  it("should provide consistent I/O interface", async () => {
    _logger.debug("Testing I/O interface consistency");

    const _mod = await import("./stdin.ts");

    // All I/O operations should follow async pattern where appropriate
    assertEquals(typeof (_mod as any).readStdin, "function", "readStdin should be a function");

    // Synchronous operations should be clearly identified
    assertEquals(typeof (_mod as any).hasStdinContent, "function", "hasStdinContent should be sync function");
    assertEquals(typeof (_mod as any).writeStdout, "function", "writeStdout should be sync function");
    assertEquals(
      typeof (_mod as any).isStdinAvailable,
      "function",
      "isStdinAvailable should be sync function",
    );

    _logger.debug("I/O interface consistency verified");
  });

  it("should isolate platform-specific operations", async () => {
    _logger.debug("Testing platform abstraction");

    const moduleSource = await Deno.readTextFile(new URL("./stdin.ts", import.meta.url).pathname);

    // Platform-specific operations should be properly abstracted
    // Check that Deno-specific APIs are used appropriately
    const denoApiUsage = [
      "Deno.stdin",
      "Deno.stdout",
      "Deno.env",
    ];

    const hasDenoUsage = false;
    for (const api of denoApiUsage) {
      if (moduleSource.includes(api)) {
        hasDenoUsage = true;
        break;
      }
    }

    // Should use Deno APIs but wrap them appropriately
    assertEquals(hasDenoUsage, true, "Should use Deno APIs for I/O operations");

    _logger.debug("Platform abstraction verification completed");
  });
});

describe("Architecture: Error handling architecture", () => {
  it("should provide comprehensive error handling", async () => {
    _logger.debug("Testing error handling architecture");

    const _mod = await import("./stdin.ts");

    // Should export custom error class
    assertExists((_mod as any).StdinError, "Should export StdinError class");

    // StdinError should extend Error
    const error = new (_mod as any).StdinError("test error");
    assertEquals(error instanceof Error, true, "StdinError should extend Error");
    assertEquals(error.name, "StdinError", "Should have correct error name");
    assertEquals(error.message, "test error", "Should preserve error message");

    _logger.debug("Error handling architecture verified");
  });

  it("should handle async operation failures gracefully", async () => {
    _logger.debug("Testing async error handling");

    const _mod = await import("./stdin.ts");

    // readStdin should return a Promise
    const _result = (_mod as any).readStdin({ timeout: 1 }); // Very short timeout
    assertEquals(result instanceof Promise, true, "readStdin should return Promise");

    // Should handle timeout gracefully
    try {
      await _result;
      // If no error, that's ok - might be in a test environment
    } catch (error) {
      assertEquals(error instanceof (_mod as any).StdinError, true, "Should throw StdinError");
    }

    _logger.debug("Async error handling verified");
  });
});

describe("Architecture: Performance and resource management", () => {
  it("should provide efficient I/O operations", async () => {
    _logger.debug("Testing I/O performance architecture");

    const _mod = await import("./stdin.ts");

    // Test synchronous operations are truly synchronous
    const start = Date.now();
    const isAvailable = (_mod as any).isStdinAvailable();
    const duration = Date.now() - start;

    assertEquals(typeof isAvailable, "boolean", "isStdinAvailable should return boolean");
    // Should complete very quickly (< 10ms)
    assertEquals(duration < 10, true, "isStdinAvailable should be fast");

    _logger.debug("I/O performance verified");
  });

  it("should manage UI component resources properly", async () => {
    _logger.debug("Testing UI component resource management");

    const _mod = await import("./stdin.ts");

    // ProgressBar should be lightweight
    const progressBar = new (_mod as any).ProgressBar(100, 40, { quiet: true });
    assertExists(progressBar.update, "ProgressBar should have update method");
    assertEquals(typeof progressBar.update, "function", "update should be function");

    // Spinner should support lifecycle management
    const spinner = new (_mod as any).Spinner({ quiet: true });
    assertExists(spinner.start, "Spinner should have start method");
    assertExists(spinner.stop, "Spinner should have stop method");
    assertEquals(typeof spinner.start, "function", "start should be function");
    assertEquals(typeof spinner.stop, "function", "stop should be function");

    // Test cleanup
    spinner.start();
    spinner.stop(); // Should not throw

    _logger.debug("UI component resource management verified");
  });
});

describe("Architecture: Integration layer compliance", () => {
  it("should integrate with enhanced stdin module", async () => {
    _logger.debug("Testing enhanced stdin integration");

    const moduleSource = await Deno.readTextFile(new URL("./stdin.ts", import.meta.url).pathname);

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

    _logger.debug("Enhanced stdin integration verified");
  });

  it("should support timeout management integration", async () => {
    _logger.debug("Testing timeout management integration");

    const _mod = await import("./stdin.ts");

    // readStdin should accept timeout options
    const readStdinFn = (_mod as any).readStdin.toString();

    // Function should handle timeout parameter
    assertEquals(
      readStdinFn.includes("timeout") || readStdinFn.includes("options"),
      true,
      "readStdin should support timeout configuration",
    );

    _logger.debug("Timeout management integration verified");
  });
});

describe("Architecture: Module cohesion and coupling", () => {
  it("should have high cohesion within I/O module", async () => {
    _logger.debug("Testing module cohesion");

    const _mod = await import("./stdin.ts");

    // All exports should be I/O related
    const exportNames = Object.keys(_mod as any);

    for (const exportName of exportNames) {
      // Skip symbols and internal properties
      if (typeof exportName !== "string" || exportName.startsWith("_")) continue;

      // All exports should be I/O related functions, classes, or interfaces
      const exportValue = (mod as unknown)[exportName];
      const isIORelated = typeof exportValue === "function" || // Functions and constructors
        typeof exportValue === "object"; // Interfaces and constants

      assertEquals(
        isIORelated,
        true,
        `Export ${exportName} should be I/O related`,
      );
    }

    _logger.debug("Module cohesion verification completed");
  });

  it("should have loose coupling with external modules", async () => {
    _logger.debug("Testing module coupling");

    // Count external dependencies
    const moduleSource = await Deno.readTextFile(new URL("./stdin.ts", import.meta.url).pathname);
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

    _logger.debug("Module coupling verification completed");
  });
});
