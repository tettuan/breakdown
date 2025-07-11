/**
 * @fileoverview Architecture tests for PromptAdapterValidator
 *
 * Validates architectural constraints:
 * - Single responsibility for validation
 * - No business logic leakage
 * - Proper error type definitions
 * - Clean dependency structure
 */

import { assertEquals } from "../deps.ts";
import { fromFileUrl } from "@std/path";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger as _BreakdownLogger } from "@tettuan/breakdownlogger";

const _logger = new _BreakdownLogger("architecture-prompt-adapter-validator");

describe("PromptAdapterValidator Architecture - Module Dependencies", () => {
  it("should have minimal external dependencies", async () => {
    _logger.debug("Testing external dependencies");

    const fileContent = await Deno.readTextFile(
      fromFileUrl(new URL("./prompt_adapter_validator.ts", import.meta.url)),
    );
    const imports = fileContent.match(/import.*from\s+["']([^"']+)["']/g) || [];

    const externalImports = imports
      .map((imp) => imp.match(/from\s+["']([^"']+)["']/)?.[1])
      .filter(Boolean)
      .filter((imp) => !imp?.startsWith("."));

    // Should only depend on standard libraries
    const allowedExternals = [
      "@std/path",
      "@std/fs",
      "https://deno.land/std",
    ];

    externalImports.forEach((imp) => {
      const isAllowed = allowedExternals.some((allowed) => imp?.includes(allowed));
      assertEquals(isAllowed, true, `Unexpected external dependency: ${imp}`);
    });
  });

  it("should not depend on higher-level modules", async () => {
    _logger.debug("Testing dependency direction");

    const fileContent = await Deno.readTextFile(
      fromFileUrl(new URL("./prompt_adapter_validator.ts", import.meta.url)),
    );

    // Should not import from these higher-level modules
    const forbiddenImports = [
      "promptadapter.ts",
      "../cli/",
      "../commands/",
      "../factory/prompt_variables_factory",
      "PromptManager",
    ];

    forbiddenImports.forEach((forbidden) => {
      const hasImport = fileContent.includes(forbidden);
      assertEquals(hasImport, false, `Should not depend on ${forbidden}`);
    });
  });

  it("should define clear validation interfaces", async () => {
    _logger.debug("Testing interface definitions");

    const fileContent = await Deno.readTextFile(
      fromFileUrl(new URL("./prompt_adapter_validator.ts", import.meta.url)),
    );

    // Should export validation result types
    const requiredExports = [
      "ValidationResult",
      "ValidationErrorType",
      "PromptAdapterValidator",
    ];

    requiredExports.forEach((required) => {
      const hasExport = fileContent.includes(`export ${required}`) ||
        fileContent.includes(`export enum ${required}`) ||
        fileContent.includes(`export class ${required}`) ||
        fileContent.includes(`export type ${required}`) ||
        fileContent.includes(`export interface ${required}`);
      assertEquals(hasExport, true, `Should export ${required}`);
    });
  });
});

describe("PromptAdapterValidator Architecture - Single Responsibility", () => {
  it("should only handle validation concerns", () => {
    _logger.debug("Testing single responsibility");

    const fileContent = Deno.readTextFileSync(
      fromFileUrl(new URL("./prompt_adapter_validator.ts", import.meta.url)),
    );

    // Should not contain these non-validation responsibilities
    const forbiddenResponsibilities = [
      "generatePrompt",
      "buildVariables",
      "readFile(", // Should use Deno.stat, not read content
      "writeFile",
      "PromptManager",
      "transform",
      "parse(",
    ];

    forbiddenResponsibilities.forEach((forbidden) => {
      const hasResponsibility = fileContent.includes(forbidden);
      assertEquals(hasResponsibility, false, `Should not handle ${forbidden}`);
    });

    // Should contain validation methods
    const validationMethods = [
      "validate",
      "sanitize",
      "isValid",
    ];

    const hasValidationMethods = validationMethods.some((method) => fileContent.includes(method));
    assertEquals(hasValidationMethods, true, "Should have validation methods");
  });

  it("should maintain pure validation functions", async () => {
    _logger.debug("Testing function purity");

    const fileContent = await Deno.readTextFile(
      fromFileUrl(new URL("./prompt_adapter_validator.ts", import.meta.url)),
    );

    // Validation methods should be predictable
    const sideEffectPatterns = [
      "console.log", // No direct logging
      "process.exit", // No process control
      "Deno.exit", // No process control
      "throw new", // Should return Results, not throw
    ];

    sideEffectPatterns.forEach((pattern) => {
      const hasSideEffect = fileContent.includes(pattern);
      assertEquals(hasSideEffect, false, `Should not have side effect: ${pattern}`);
    });
  });
});

describe("PromptAdapterValidator Architecture - Error Type System", () => {
  it("should use enum for error types", async () => {
    _logger.debug("Testing error type system");

    const fileContent = await Deno.readTextFile(
      fromFileUrl(new URL("./prompt_adapter_validator.ts", import.meta.url)),
    );

    // Should define error types as enum
    const hasErrorEnum = fileContent.includes("export enum ValidationErrorType");
    assertEquals(hasErrorEnum, true, "Should define ValidationErrorType as enum");

    // Should have comprehensive error types
    const expectedErrorTypes = [
      "InvalidPath",
      "NotFound",
      "NotFile",
      "NotDirectory",
    ];

    expectedErrorTypes.forEach((errorType) => {
      const hasErrorType = fileContent.includes(errorType);
      assertEquals(hasErrorType, true, `Should define ${errorType} error type`);
    });
  });

  it("should return structured validation results", async () => {
    _logger.debug("Testing result structure");

    const fileContent = await Deno.readTextFile(
      fromFileUrl(new URL("./prompt_adapter_validator.ts", import.meta.url)),
    );

    // Should define ValidationResult type
    const hasResultType = fileContent.includes("ValidationResult") ||
      fileContent.includes("type ValidationResult");
    assertEquals(hasResultType, true, "Should define ValidationResult type");

    // Result should follow discriminated union pattern
    const hasDiscriminatedUnion = fileContent.includes("ok:") ||
      (fileContent.includes("success:") && fileContent.includes("error:"));
    assertEquals(hasDiscriminatedUnion, true, "Should use discriminated union for results");
  });
});

describe("PromptAdapterValidator Architecture - Stateless Design", () => {
  it("should be stateless with no instance variables for state", async () => {
    _logger.debug("Testing stateless design");

    const fileContent = await Deno.readTextFile(
      fromFileUrl(new URL("./prompt_adapter_validator.ts", import.meta.url)),
    );

    // Should not have state-holding instance variables
    const statePatterns = [
      /private\s+\w+\s*:\s*\w+\[\]/, // Arrays for state
      /private\s+\w+\s*=\s*\[/, // Initialized arrays
      /private\s+cache/, // Cache variables
      /private\s+state/, // State variables
    ];

    statePatterns.forEach((pattern) => {
      const hasState = pattern.test(fileContent);
      assertEquals(hasState, false, `Should not have stateful pattern: ${pattern}`);
    });
  });

  it("should have methods that don't depend on instance state", async () => {
    _logger.debug("Testing method independence");

    const fileContent = await Deno.readTextFile(
      fromFileUrl(new URL("./prompt_adapter_validator.ts", import.meta.url)),
    );

    // Methods could potentially be static
    const thisUsageInMethods = fileContent.match(/this\.\w+/g) || [];

    // If using 'this', should only be for calling other methods, not accessing state
    thisUsageInMethods.forEach((usage) => {
      const isMethodCall = usage.includes("this.validate") ||
        usage.includes("this.sanitize") ||
        usage.includes("this.isValid") ||
        usage.includes("this.getPathStringError") ||
        usage.includes("this.getFileExistsError") ||
        usage.includes("this.getDirectoryExistsError");
      assertEquals(isMethodCall, true, `'this' usage should be for method calls: ${usage}`);
    });
  });
});

describe("PromptAdapterValidator Architecture - Public API Design", () => {
  it("should expose a minimal public API", async () => {
    _logger.debug("Testing public API minimalism");

    const fileContent = await Deno.readTextFile(
      fromFileUrl(new URL("./prompt_adapter_validator.ts", import.meta.url)),
    );

    // Count public methods (not marked as private, excluding control flow)
    const publicMethods = fileContent.match(/^\s+public\s+(async\s+)?(\w+)\s*\(/gm) || [];
    const filteredMethods = publicMethods.filter((m) => {
      const match = m.match(/(\w+)\s*\(/);
      const name = match ? match[1] : "";
      // Exclude control flow keywords
      return !["if", "else", "for", "while", "switch", "catch"].includes(name);
    });
    const publicMethodNames = filteredMethods.map((m) => {
      const match = m.match(/(\w+)\s*\(/);
      return match ? match[1] : "";
    }).filter((name) => name !== "constructor");

    // Should have focused public API
    assertEquals(
      publicMethodNames.length <= 5,
      true,
      `Should have minimal public methods, found: ${publicMethodNames.join(", ")}`,
    );

    // Essential public methods - check if validation methods exist in file content
    const hasValidateFile = fileContent.includes("validateFile");
    const hasValidateDir = fileContent.includes("validateDirectory");
    const hasValidateBaseDir = fileContent.includes("validateBaseDir");

    assertEquals(
      hasValidateFile || hasValidateDir || hasValidateBaseDir,
      true,
      "Should have validation methods",
    );
  });
});
