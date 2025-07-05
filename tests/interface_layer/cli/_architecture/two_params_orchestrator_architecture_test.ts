/**
 * @fileoverview Architecture Test for TwoParamsOrchestrator
 *
 * Validates architectural constraints and design principles
 * for the TwoParamsOrchestrator following Totality principle.
 *
 * Tests verify:
 * - Totality principle compliance (no exceptions, Result types)
 * - Discriminated union error handling
 * - Component separation and orchestration pattern
 * - Dependency direction and layering
 * - Type safety boundaries
 *
 * @module cli/orchestrators/0_architecture_two_params_orchestrator_test
 */

import { assert, assertEquals } from "../../../../lib/deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger as _BreakdownLogger } from "@tettuan/breakdownlogger";

import { TwoParamsOrchestrator } from "../../../../lib/cli/orchestrators/two_params_orchestrator.ts";
import type { TwoParamsHandlerError } from "../../../../lib/cli/handlers/two_params_handler.ts";
import type { TwoParamsValidator } from "../../../../lib/cli/validators/two_params_validator.ts";
import type { TwoParamsStdinProcessor } from "../../../../lib/cli/processors/two_params_stdin_processor.ts";
import { isError } from "../../../lib/deps.ts";

const _logger = new _BreakdownLogger("architecture-two-params-orchestrator");

describe("TwoParamsOrchestrator - Architecture Constraints", () => {
  it("should follow Totality principle with Result types (no exceptions)", async () => {
    _logger.debug("Testing Totality principle compliance");

    const orchestrator = new TwoParamsOrchestrator();

    // Test various invalid inputs that could throw exceptions
    const testCases = [
      { params: [], config: {}, options: {} },
      { params: ["single"], config: {}, options: {} },
      { params: ["demo", "layer"], config: {}, options: {} },
    ];

    for (const { params, config, options } of testCases) {
      try {
        const result = await orchestrator.execute(params, config, options);
        // Should return Result type
        assert("ok" in result);
        assertEquals(result.ok, false); // All test cases should fail
      } catch (e) {
        // Should never throw - violates Totality
        throw new Error(`Totality violation: threw exception instead of returning Result: ${e}`);
      }
    }
  });

  it("should use discriminated unions for error types", async () => {
    _logger.debug("Testing discriminated union error handling");

    const orchestrator = new TwoParamsOrchestrator();

    // Helper to check if error has valid discriminated kind
    function assertValidErrorKind(error: TwoParamsHandlerError): void {
      assert("kind" in error);
      const validKinds = [
        "InvalidParameterCount",
        "InvalidDemonstrativeType",
        "InvalidLayerType",
        "StdinReadError",
        "VariablesBuilderError",
        "PromptGenerationError",
        "FactoryValidationError",
        // Note: "OutputWriteError" removed as OutputWriter component was removed
      ];
      assert(validKinds.includes(error.kind), `Invalid error kind: ${error.kind}`);
    }

    // Test parameter validation error
    const paramResult = await orchestrator.execute([], {}, {});
    if (!paramResult.ok) {
      assertValidErrorKind(paramResult.error);
    }

    // Test with invalid parameters
    const invalidResult = await orchestrator.execute(["invalid"], {}, {});
    if (!invalidResult.ok) {
      assertValidErrorKind(invalidResult.error);
    }
  });

  it("should maintain single responsibility (orchestration only)", async () => {
    _logger.debug("Testing single responsibility principle");

    const orchestrator = new TwoParamsOrchestrator();

    // Verify the orchestrator only exposes orchestration methods
    const publicMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(orchestrator))
      .filter((name) =>
        name !== "constructor" && !name.startsWith("_") && !name.includes("private")
      );

    // The orchestrator has execute method and helper methods (which are private in TypeScript but show up in JS)
    // We check that execute is the main entry point
    assert(publicMethods.includes("execute"));

    // Check that the class doesn't have excessive public methods
    assert(publicMethods.length <= 5, `Too many public methods: ${publicMethods.join(", ")}`);

    // Private methods should be for orchestration steps
    const privateMethods = [
      "_extractCustomVariables",
      "_processVariables",
      "_createCliParams",
      "_generatePrompt",
    ];

    privateMethods.forEach((method) => {
      assert(
        typeof (orchestrator as any as Record<string, unknown>)[method] === "function",
        `Missing orchestration method: ${method}`,
      );
    });
  });

  it("should enforce proper component dependencies", async () => {
    _logger.debug("Testing dependency direction");

    // The orchestrator should depend on:
    // - Validator (for parameter validation)
    // - StdinProcessor (for input processing)
    // - OutputWriter (for output handling)
    // - External factories/builders (PromptVariablesFactory, VariablesBuilder)
    // - External prompt manager (PromptManager)

    // Should NOT depend on:
    // - Other orchestrators
    // - Handlers (except error types)
    // - Implementation details of components

    const orchestrator = new TwoParamsOrchestrator();

    // Verify components are injected/created in constructor
    assert((orchestrator as any as { validator?: unknown }).validator);
    assert((orchestrator as any as { stdinProcessor?: unknown }).stdinProcessor);

    // Components should be instances of expected types
    assertEquals(
      (orchestrator as any as { validator?: { constructor: { name: string } } }).validator
        ?.constructor.name,
      "TwoParamsValidator",
    );
    assertEquals(
      (orchestrator as any as { stdinProcessor?: { constructor: { name: string } } })
        .stdinProcessor?.constructor.name,
      "TwoParamsStdinProcessor",
    );
  });

  it("should support dependency injection for testability", async () => {
    _logger.debug("Testing dependency injection support");

    // Mock components
    const mockValidator = {
      validate: async (params: string[]) => ({
        ok: true as const,
        data: { demonstrativeType: "to", layerType: "project" },
      }),
    };

    const mockStdinProcessor = {
      process: async () => ({
        ok: true as const,
        data: "test input",
      }),
    };

    // Should accept injected dependencies
    const orchestrator = new TwoParamsOrchestrator(
      mockValidator as any as TwoParamsValidator,
      mockStdinProcessor as any as TwoParamsStdinProcessor,
    );

    assert((orchestrator as any as { validator?: unknown }).validator === mockValidator);
    assert(
      (orchestrator as any as { stdinProcessor?: unknown }).stdinProcessor ===
        mockStdinProcessor,
    );
  });

  it("should maintain type safety boundaries", async () => {
    _logger.debug("Testing type safety boundaries");

    const orchestrator = new TwoParamsOrchestrator();

    // Test with various unsafe inputs
    const unsafeInputs = [
      { params: ["to", "project"], config: { nested: { deep: Symbol("test") } }, options: {} },
      { params: ["to", "project"], config: {}, options: { func: () => {} } },
      { params: ["to", "project"], config: { date: new Date() }, options: {} },
    ];

    for (const { params, config, options } of unsafeInputs) {
      const result = await orchestrator.execute(params, config, options);
      // Should handle gracefully without type errors
      assert("ok" in result);
    }
  });

  it("should enforce orchestration flow architecture", async () => {
    _logger.debug("Testing orchestration flow enforcement");

    const orchestrator = new TwoParamsOrchestrator();

    // The flow should be:
    // 1. Validate parameters
    // 2. Read STDIN
    // 3. Extract and process variables
    // 4. Create CLI parameters
    // 5. Generate prompt
    // 6. Write output

    // Test early exit on validation failure
    const validationFailResult = await orchestrator.execute([], {}, {});
    assertEquals(validationFailResult.ok, false);
    if (!validationFailResult.ok) {
      // Should fail at step 1
      assert(
        validationFailResult.error.kind === "InvalidParameterCount" ||
          validationFailResult.error.kind === "InvalidDemonstrativeType" ||
          validationFailResult.error.kind === "InvalidLayerType",
      );
    }

    // Test stdin processing integration
    const stdinResult = await orchestrator.execute(
      ["to", "project"],
      { timeout: 100 }, // Very short timeout to force stdin timeout
      {},
    );
    // Result depends on stdin availability
    assert("ok" in stdinResult);
  });

  it("should separate orchestration from business logic", async () => {
    _logger.debug("Testing separation of concerns");

    const orchestrator = new TwoParamsOrchestrator();

    // Orchestrator should not contain:
    // - Validation logic (delegated to validator)
    // - Input/output processing (delegated to processors)
    // - Prompt generation logic (delegated to factories)

    // Check that orchestrator methods are thin wrappers
    const orchestratorCode = orchestrator.constructor.toString();

    // Should see delegation patterns to actual components
    assert(
      orchestratorCode.includes("validator.validate") ||
        orchestratorCode.includes("this.validator"),
    );
    assert(
      orchestratorCode.includes("stdinProcessor.process") ||
        orchestratorCode.includes("this.stdinProcessor"),
    );
    // Check for actual orchestration logic rather than specific method names
    assert(orchestratorCode.includes("execute") || orchestratorCode.includes("orchestrat"));
  });

  it("should handle component errors consistently", async () => {
    _logger.debug("Testing consistent error propagation");

    // Mock components that return errors
    const errorValidator = {
      validate: async () => ({
        ok: false as const,
        error: {
          kind: "InvalidDemonstrativeType" as const,
          value: "test",
          validTypes: ["to", "summary"],
        },
      }),
    };

    const errorStdinProcessor = {
      process: async () => ({
        ok: false as const,
        error: { message: "Test stdin error" },
      }),
    };

    // Test validation error propagation
    const validationOrchestrator = new TwoParamsOrchestrator(
      errorValidator as any as TwoParamsValidator,
      undefined,
    );
    const validationResult = await validationOrchestrator.execute(["to", "project"], {}, {});
    assertEquals(validationResult.ok, false);
    if (!validationResult.ok) {
      assertEquals(validationResult.error.kind, "InvalidDemonstrativeType");
    }

    // Test stdin error transformation
    const stdinOrchestrator = new TwoParamsOrchestrator(
      undefined,
      errorStdinProcessor as any as TwoParamsStdinProcessor,
    );
    const stdinResult = await stdinOrchestrator.execute(["to", "project"], {}, {});
    assertEquals(stdinResult.ok, false);
    if (!stdinResult.ok) {
      assertEquals(stdinResult.error.kind, "StdinReadError");
    }
  });

  it("should enforce immutability of inputs", async () => {
    _logger.debug("Testing input immutability");

    const orchestrator = new TwoParamsOrchestrator();

    const _params = ["to", "project"];
    const config = { key: "value" };
    const options = { option: "test" };

    // Store original values
    const originalParams = [..._params];
    const originalConfig = { ...config };
    const originalOptions = { ...options };

    await orchestrator.execute(_params, config, options);

    // Inputs should not be mutated
    assertEquals(_params, originalParams);
    assertEquals(config, originalConfig);
    assertEquals(options, originalOptions);
  });

  it("should maintain clear error context", async () => {
    _logger.debug("Testing error context preservation");

    const orchestrator = new TwoParamsOrchestrator();

    // Test that errors provide sufficient context
    const result = await orchestrator.execute(["invalid_demo", "invalid_layer"], {}, {});

    if (!result.ok) {
      // Error should indicate what failed
      assert("kind" in result.error);

      // Depending on error type, should have relevant context
      if ("message" in result.error) {
        assert(typeof result.error.message === "string");
        assert(result.error.message.length > 0);
      }

      if ("errors" in result.error) {
        assert(Array.isArray(result.error.errors));
      }
    }
  });
});
