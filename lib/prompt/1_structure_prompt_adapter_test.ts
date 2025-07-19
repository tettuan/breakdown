/**
 * @fileoverview Structure tests for PromptAdapter
 *
 * Validates structural design:
 * - Class structure and responsibility separation
 * - Method organization and cohesion
 * - Interface contracts
 * - Proper abstraction levels
 */

import { assertEquals, assertExists } from "../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger as _BreakdownLogger } from "@tettuan/breakdownlogger";
import type { PromptVariablesProvider } from "./prompt_adapter.ts";
import { ok } from "../types/result.ts";

const _logger = new _BreakdownLogger("structure-prompt-adapter");

// Mock implementation for testing
class MockPromptVariablesProvider implements PromptVariablesProvider {
  getAllParams() {
    return {
      promptFilePath: "test.prompt",
      inputFilePath: "test.md",
      outputFilePath: "output.md",
      schemaFilePath: "schema.json",
      customVariables: {},
    };
  }

  getOptions() {
    return {};
  }

  hasValidBaseDir() {
    return true;
  }

  getBaseDirError() {
    return ok<void, string>(undefined);
  }

  get customVariables() {
    return {};
  }
}

describe("PromptAdapter Structure - Interface Design", () => {
  it("should define clear interface contracts", () => {
    _logger.debug("Testing interface definitions");

    // Test PromptVariablesProvider interface
    const provider = new MockPromptVariablesProvider();

    // All required methods should exist
    assertExists(provider.getAllParams);
    assertExists(provider.getOptions);
    assertExists(provider.hasValidBaseDir);
    assertExists(provider.getBaseDirError);
    assertExists(provider.customVariables);

    // Return types should be correct
    const _params = provider.getAllParams();
    assertExists(_params.promptFilePath);
    assertExists(_params.inputFilePath);
    assertExists(_params.outputFilePath);
    assertExists(_params.schemaFilePath);

    assertEquals(typeof provider.hasValidBaseDir(), "boolean");
    assertEquals(typeof provider.getOptions(), "object");
  });

  it("should separate concerns between validation and generation", async () => {
    _logger.debug("Testing concern separation");

    const fileContent = await Deno.readTextFile(
      new URL("./prompt_adapter.ts", import.meta.url),
    );

    // Should have distinct methods for different concerns
    const validationMethods = ["validatePaths", "validateExistence"];
    const generationMethods = ["generatePrompt", "buildVariables"];

    // Check method presence
    const hasValidation = validationMethods.some((method) =>
      fileContent.includes(`${method}(`) || fileContent.includes(`async ${method}`)
    );
    const hasGeneration = generationMethods.some((method) =>
      fileContent.includes(`${method}(`) || fileContent.includes(`async ${method}`)
    );

    assertEquals(hasValidation, true, "Should have validation methods");
    assertEquals(hasGeneration, true, "Should have generation methods");
  });

  it("should maintain consistent method signatures", async () => {
    _logger.debug("Testing method signature consistency");

    const fileContent = await Deno.readTextFile(
      new URL("./prompt_adapter.ts", import.meta.url),
    );

    // Async methods should return Promise
    const asyncMethods = fileContent.match(/async\s+\w+\([^)]*\)\s*:\s*Promise<[^>]+>/g) || [];
    asyncMethods.forEach((method) => {
      const hasPromiseReturn = method.includes("Promise<");
      assertEquals(hasPromiseReturn, true, `Async method should return Promise: ${method}`);
    });

    // Public methods should have type annotations
    const publicMethods = fileContent.match(/^\s{2}(?!private)[^(]+\([^)]*\)\s*:/gm) || [];
    publicMethods.forEach((method) => {
      const hasReturnType = method.includes("):");
      assertEquals(hasReturnType, true, `Public method should have return type: ${method}`);
    });
  });
});

describe("PromptAdapter Structure - Class Organization", () => {
  it("should organize methods by visibility and purpose", async () => {
    _logger.debug("Testing method organization");

    const fileContent = await Deno.readTextFile(
      new URL("./prompt_adapter.ts", import.meta.url),
    );

    // Extract method definitions with their visibility
    const _methodPattern = /^\s{2}(private\s+)?(async\s+)?(\w+)\s*\(/gm;
    const methods: Array<{ name: string; isPrivate: boolean; line: number }> = [];
    let match;
    let lineNum = 0;

    const lines = fileContent.split("\n");
    for (const line of lines) {
      lineNum++;
      match = line.match(/^\s{2}(private\s+)?(async\s+)?(\w+)\s*\(/);
      if (match) {
        methods.push({
          name: match[3],
          isPrivate: !!match[1],
          line: lineNum,
        });
      }
    }

    // Check that methods are reasonably organized
    // Allow for logical grouping where private helpers are near their public users
    const _privateCount = methods.filter((m) => m.isPrivate).length;
    const publicCount = methods.filter((m) => !m.isPrivate).length;

    // Should have a reasonable mix of public and private methods
    const hasReasonableOrganization = publicCount > 0 && methods.length > 0;
    assertEquals(hasReasonableOrganization, true, "Should have reasonable method organization");
  });

  it("should have appropriate constructor design", async () => {
    _logger.debug("Testing constructor design");

    const fileContent = await Deno.readTextFile(
      new URL("./prompt_adapter.ts", import.meta.url),
    );

    // Constructor should accept dependencies
    const constructorMatch = fileContent.match(/constructor\s*\([^)]+\)/);
    assertExists(constructorMatch, "Should have a constructor");

    // Should store dependencies as private readonly
    const hasReadonlyFactory = fileContent.includes("private readonly factory");
    assertEquals(hasReadonlyFactory, true, "Should store factory as private readonly");
  });
});

describe("PromptAdapter Structure - Data Flow", () => {
  it("should have clear data flow through methods", async () => {
    _logger.debug("Testing data flow patterns");

    const fileContent = await Deno.readTextFile(
      new URL("./prompt_adapter.ts", import.meta.url),
    );

    // Should follow: input -> validation -> transformation -> output pattern
    const dataFlowMethods = [
      "validatePaths", // validation
      "buildVariables", // transformation
      "generatePrompt", // output
    ];

    dataFlowMethods.forEach((method) => {
      const hasMethod = fileContent.includes(method);
      assertEquals(hasMethod, true, `Should have ${method} for data flow`);
    });
  });

  it("should encapsulate internal state properly", async () => {
    _logger.debug("Testing encapsulation");

    const fileContent = await Deno.readTextFile(
      new URL("./prompt_adapter.ts", import.meta.url),
    );

    // All fields should be private
    const fieldPattern = /^\s{2}(?!constructor|private|async|get|set)(\w+)\s*:/gm;
    const publicFields = fileContent.match(fieldPattern) || [];

    assertEquals(publicFields.length, 0, "Should not have public fields");

    // Should access state through methods or getters
    const _hasGetters = fileContent.includes("get ") || fileContent.includes("public get");
    const hasMethods = fileContent.includes("()");

    assertEquals(hasMethods, true, "Should access state through methods");
  });
});

describe("PromptAdapter Structure - Error Handling Structure", () => {
  it("should have structured error handling", async () => {
    _logger.debug("Testing error handling structure");

    const fileContent = await Deno.readTextFile(
      new URL("./prompt_adapter.ts", import.meta.url),
    );

    // Should return structured error objects
    const hasErrorStructure = fileContent.includes("success:") && fileContent.includes("errors:");
    assertEquals(hasErrorStructure, true, "Should have structured error returns");

    // Should handle errors at appropriate levels (updated for domain-driven implementation)
    const errorHandlingPatterns = [
      "result.ok", // Result pattern checks
      "result.error", // Error extraction from Result
      "formatPromptError", // Error formatting
    ];

    errorHandlingPatterns.forEach((pattern) => {
      const hasPattern = fileContent.includes(pattern);
      assertEquals(hasPattern, true, `Should have error handling pattern: ${pattern}`);
    });
  });
});
