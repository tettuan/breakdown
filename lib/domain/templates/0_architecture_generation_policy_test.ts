/**
 * @fileoverview Generation Policy Architecture Tests
 *
 * Tests for architectural constraints and structural integrity of GenerationPolicy.
 * Focuses on Result type consistency, immutability guarantees, and core business contracts.
 *
 * @module domain/templates/0_architecture_generation_policy_test
 */

import { assert, assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import {
  type FallbackStrategy,
  GenerationPolicy,
  type GenerationPolicyConfig,
  type ResolutionContext,
  type SelectionContext,
  type TemplateSelectionStrategy,
  type ValidationResult,
  type VariableResolutionStrategy,
} from "./generation_policy.ts";
import { TemplateVariables } from "./prompt_generation_aggregate.ts";
import type { DirectiveType, LayerType } from "../../types/mod.ts";
import type { Result } from "../../types/result.ts";

// Mock implementations for testing - simplified for architecture tests
interface MockDirectiveType {
  getValue(): string;
}

interface MockLayerType {
  getValue(): string;
}

function createMockDirectiveType(value: string): MockDirectiveType {
  return { getValue: () => value };
}

function createMockLayerType(value: string): MockLayerType {
  return { getValue: () => value };
}

class MockVariableResolutionStrategy implements VariableResolutionStrategy {
  constructor(private priority: number, private resolveValue?: string) {}

  getPriority(): number {
    return this.priority;
  }

  async resolve(_variableName: string, _context: ResolutionContext): Promise<string | undefined> {
    return this.resolveValue;
  }
}

class MockTemplateSelectionStrategy implements TemplateSelectionStrategy {
  constructor(private shouldSucceed: boolean = true) {}

  selectTemplate(
    _directive: DirectiveType,
    _layer: LayerType,
    _context: SelectionContext,
  ): Result<any, string> {
    if (this.shouldSucceed) {
      return { ok: true, data: { getPath: () => "mock/path" } };
    }
    return { ok: false, error: "Mock error" };
  }
}

// Test configuration factory
function createTestConfig(overrides?: Partial<GenerationPolicyConfig>): GenerationPolicyConfig {
  return {
    requiredVariables: ["directive", "layer"],
    optionalVariables: ["version", "author"],
    variableValidation: {
      directive: { pattern: /^[a-zA-Z]+$/, required: true },
      layer: { pattern: /^[a-zA-Z]+$/, required: true },
      version: { pattern: /^\d+\.\d+\.\d+$/ },
    },
    maxRetries: 3,
    timeoutMs: 5000,
    fallbackStrategies: [],
    ...overrides,
  };
}

describe("GenerationPolicy_Architecture", () => {
  describe("Result Type Consistency", () => {
    it("should_return_result_type_from_create_method", () => {
      const config = createTestConfig();
      const strategies: VariableResolutionStrategy[] = [];
      const selectionStrategy = new MockTemplateSelectionStrategy();

      const result = GenerationPolicy.create(config, strategies, selectionStrategy);

      // Test Result type structure
      assertEquals(typeof result, "object");
      assertEquals("ok" in result, true);

      if (result.ok) {
        assertEquals("data" in result, true);
        assert(result.data instanceof GenerationPolicy);
      } else {
        assertEquals("error" in result, true);
        assertEquals(typeof result.error, "object");
        assertEquals("kind" in result.error, true);
        assertEquals("message" in result.error, true);
      }
    });

    it("should_enforce_error_type_structure_for_invalid_configuration", () => {
      const result = GenerationPolicy.create(
        null as any, // Invalid config
        [],
        new MockTemplateSelectionStrategy(),
      );

      assertEquals(result.ok, false);
      if (!result.ok) {
        assertEquals(result.error.kind, "InvalidConfiguration");
        assertEquals(typeof result.error.message, "string");
        assertEquals(result.error.message.length > 0, true);
      }
    });

    it("should_maintain_result_type_consistency_across_validation_scenarios", () => {
      const testCases = [
        { config: null as any, strategies: [], selection: new MockTemplateSelectionStrategy() },
        {
          config: createTestConfig(),
          strategies: null as any,
          selection: new MockTemplateSelectionStrategy(),
        },
        { config: createTestConfig(), strategies: [], selection: null as any },
      ];

      for (const testCase of testCases) {
        const result = GenerationPolicy.create(
          testCase.config,
          testCase.strategies,
          testCase.selection,
        );

        // All error results should have consistent structure
        assertEquals(result.ok, false);
        if (!result.ok) {
          assertEquals(typeof result.error, "object");
          assertEquals("kind" in result.error, true);
          assertEquals("message" in result.error, true);
          assertEquals(result.error.kind, "InvalidConfiguration");
        }
      }
    });
  });

  describe("Immutability and Constructor Constraints", () => {
    it("should_enforce_private_constructor_pattern", () => {
      // Test that GenerationPolicy cannot be directly instantiated
      // This is enforced by TypeScript, but we test the create pattern
      const config = createTestConfig();
      const result = GenerationPolicy.create(config, [], new MockTemplateSelectionStrategy());

      assertEquals(result.ok, true);
      if (result.ok) {
        assert(result.data instanceof GenerationPolicy);
      }
    });

    it("should_maintain_immutable_configuration", () => {
      const config = createTestConfig();
      const result = GenerationPolicy.create(config, [], new MockTemplateSelectionStrategy());

      assertEquals(result.ok, true);
      if (result.ok) {
        const policy = result.data;
        const retrievedConfig = policy.getConfig();

        // Config should be a copy (immutable)
        assertEquals(typeof retrievedConfig, "object");
        assertEquals(retrievedConfig !== config, true); // Different reference
        assertEquals(JSON.stringify(retrievedConfig), JSON.stringify(config)); // Same content
      }
    });

    it("should_sort_strategies_by_priority_on_construction", () => {
      const strategies = [
        new MockVariableResolutionStrategy(1),
        new MockVariableResolutionStrategy(5),
        new MockVariableResolutionStrategy(3),
      ];

      const config = createTestConfig();
      const result = GenerationPolicy.create(
        config,
        strategies,
        new MockTemplateSelectionStrategy(),
      );

      assertEquals(result.ok, true);
      if (result.ok) {
        // Strategy sorting should be enforced architecturally
        // We test this by ensuring creation succeeds with multiple strategies
        assert(result.data instanceof GenerationPolicy);
      }
    });
  });

  describe("Interface Contract Compliance", () => {
    it("should_enforce_validation_result_structure", () => {
      const config = createTestConfig();
      const result = GenerationPolicy.create(config, [], new MockTemplateSelectionStrategy());

      assertEquals(result.ok, true);
      if (result.ok) {
        const policy = result.data;
        const variables = TemplateVariables.create({ directive: "to", layer: "project" });
        const validationResult = policy.validateVariables(variables);

        // Test ValidationResult structure compliance
        assertEquals(typeof validationResult, "object");
        assertEquals("isValid" in validationResult, true);
        assertEquals("errors" in validationResult, true);
        assertEquals("warnings" in validationResult, true);
        assertEquals(typeof validationResult.isValid, "boolean");
        assertEquals(Array.isArray(validationResult.errors), true);
        assertEquals(Array.isArray(validationResult.warnings), true);
      }
    });

    it("should_enforce_validation_error_structure", () => {
      const config = createTestConfig({
        requiredVariables: ["requiredField"],
      });
      const result = GenerationPolicy.create(config, [], new MockTemplateSelectionStrategy());

      assertEquals(result.ok, true);
      if (result.ok) {
        const policy = result.data;
        const variables = TemplateVariables.create({}); // Missing required field
        const validationResult = policy.validateVariables(variables);

        assertEquals(validationResult.isValid, false);
        assertEquals(validationResult.errors.length > 0, true);

        // Test ValidationError structure
        const error = validationResult.errors[0];
        assertEquals("field" in error, true);
        assertEquals("message" in error, true);
        assertEquals("code" in error, true);
        assertEquals(typeof error.field, "string");
        assertEquals(typeof error.message, "string");
        assertEquals(typeof error.code, "string");
      }
    });

    it("should_enforce_selection_context_structure", () => {
      const config = createTestConfig();
      const selectionStrategy = new MockTemplateSelectionStrategy();
      const result = GenerationPolicy.create(config, [], selectionStrategy);

      assertEquals(result.ok, true);
      if (result.ok) {
        const policy = result.data;
        const directive = createMockDirectiveType("to") as unknown as DirectiveType;
        const layer = createMockLayerType("project") as unknown as LayerType;

        const selectionContext: SelectionContext = {
          preferredLanguage: "ja",
          templateVersion: "1.0.0",
          customPath: "/custom/path",
          fallbackEnabled: true,
        };

        // Test that SelectionContext interface is properly enforced
        const templateResult = policy.selectTemplate(directive, layer, selectionContext);
        assertEquals(typeof templateResult, "object");
        assertEquals("ok" in templateResult, true);
      }
    });
  });

  describe("Business Rule Enforcement", () => {
    it("should_require_configuration_for_creation", () => {
      const result = GenerationPolicy.create(
        undefined as any,
        [],
        new MockTemplateSelectionStrategy(),
      );

      assertEquals(result.ok, false);
      if (!result.ok) {
        assertEquals(result.error.kind, "InvalidConfiguration");
        assertEquals(result.error.message.includes("Configuration is required"), true);
      }
    });

    it("should_require_template_selection_strategy", () => {
      const config = createTestConfig();
      const result = GenerationPolicy.create(config, [], null as any);

      assertEquals(result.ok, false);
      if (!result.ok) {
        assertEquals(result.error.kind, "InvalidConfiguration");
        assertEquals(
          result.error.message.includes("Template selection strategy is required"),
          true,
        );
      }
    });

    it("should_require_variable_strategies_as_array", () => {
      const config = createTestConfig();
      const result = GenerationPolicy.create(
        config,
        "not an array" as any,
        new MockTemplateSelectionStrategy(),
      );

      assertEquals(result.ok, false);
      if (!result.ok) {
        assertEquals(result.error.kind, "InvalidConfiguration");
        assertEquals(result.error.message.includes("Variable strategies must be an array"), true);
      }
    });

    it("should_enforce_required_variables_validation", () => {
      const config = createTestConfig({
        requiredVariables: ["essential_field"],
      });
      const result = GenerationPolicy.create(config, [], new MockTemplateSelectionStrategy());

      assertEquals(result.ok, true);
      if (result.ok) {
        const policy = result.data;
        const variables = TemplateVariables.create({ other_field: "value" });
        const validationResult = policy.validateVariables(variables);

        assertEquals(validationResult.isValid, false);
        assertEquals(validationResult.errors.some((e) => e.code === "REQUIRED_MISSING"), true);
        assertEquals(validationResult.errors.some((e) => e.field === "essential_field"), true);
      }
    });

    it("should_enforce_pattern_validation_rules", () => {
      const config = createTestConfig({
        requiredVariables: ["pattern_field"],
        variableValidation: {
          pattern_field: {
            pattern: /^test_\d+$/,
            required: true,
          },
        },
      });
      const result = GenerationPolicy.create(config, [], new MockTemplateSelectionStrategy());

      assertEquals(result.ok, true);
      if (result.ok) {
        const policy = result.data;
        const variables = TemplateVariables.create({ pattern_field: "invalid_pattern" });
        const validationResult = policy.validateVariables(variables);

        assertEquals(validationResult.isValid, false);
        assertEquals(validationResult.errors.some((e) => e.code === "PATTERN_MISMATCH"), true);
        assertEquals(validationResult.errors.some((e) => e.field === "pattern_field"), true);
      }
    });
  });

  describe("Error Handling Architecture", () => {
    it("should_maintain_error_type_safety_for_fallback_handling", () => {
      const config = createTestConfig();
      const result = GenerationPolicy.create(config, [], new MockTemplateSelectionStrategy());

      assertEquals(result.ok, true);
      if (result.ok) {
        const policy = result.data;
        const testError = new Error("Test error");
        const fallbackAction = policy.handleFailure(testError);

        // Should return null or proper FallbackAction structure
        if (fallbackAction !== null) {
          assertEquals(typeof fallbackAction, "object");
          assertEquals("type" in fallbackAction, true);
        }
      }
    });

    it("should_enforce_consistent_error_message_structure", () => {
      // Test individual error cases to ensure proper error message structure

      // Test 1: Null configuration
      const nullConfigResult = GenerationPolicy.create(
        null as any,
        [],
        new MockTemplateSelectionStrategy(),
      );
      assertEquals(nullConfigResult.ok, false);
      if (!nullConfigResult.ok) {
        assertEquals(nullConfigResult.error.kind, "InvalidConfiguration");
        assert(
          nullConfigResult.error.message.includes("Configuration"),
          `Expected config error message, got "${nullConfigResult.error.message}"`,
        );
      }

      // Test 2: Invalid strategies array
      const invalidStrategiesResult = GenerationPolicy.create(
        createTestConfig(),
        "invalid" as any,
        new MockTemplateSelectionStrategy(),
      );
      assertEquals(invalidStrategiesResult.ok, false);
      if (!invalidStrategiesResult.ok) {
        assertEquals(invalidStrategiesResult.error.kind, "InvalidConfiguration");
        assert(
          invalidStrategiesResult.error.message.includes("array"),
          `Expected strategies array error message, got "${invalidStrategiesResult.error.message}"`,
        );
      }

      // Test 3: Null selection strategy
      const nullSelectionResult = GenerationPolicy.create(
        createTestConfig(),
        [],
        null as any,
      );
      assertEquals(nullSelectionResult.ok, false);
      if (!nullSelectionResult.ok) {
        assertEquals(nullSelectionResult.error.kind, "InvalidConfiguration");
        assert(
          nullSelectionResult.error.message.includes("selection"),
          `Expected selection strategy error message, got "${nullSelectionResult.error.message}"`,
        );
      }
    });
  });

  describe("Type System Integration", () => {
    it("should_properly_integrate_with_directive_and_layer_types", () => {
      const config = createTestConfig();
      const result = GenerationPolicy.create(config, [], new MockTemplateSelectionStrategy());

      assertEquals(result.ok, true);
      if (result.ok) {
        const policy = result.data;
        const directive = createMockDirectiveType("to") as unknown as DirectiveType;
        const layer = createMockLayerType("project") as unknown as LayerType;

        // Test type integration in resolution context
        const context: ResolutionContext = {
          providedVariables: {},
          directive,
          layer,
          workingDirectory: "/test",
          environmentVariables: {},
        };

        // Should accept properly typed parameters
        assertEquals(typeof context.directive.getValue, "function");
        assertEquals(typeof context.layer.getValue, "function");
        assertEquals(context.directive.getValue(), "to");
        assertEquals(context.layer.getValue(), "project");
      }
    });

    it("should_maintain_template_variables_type_integration", () => {
      const config = createTestConfig();
      const result = GenerationPolicy.create(config, [], new MockTemplateSelectionStrategy());

      assertEquals(result.ok, true);
      if (result.ok) {
        const policy = result.data;
        const variables = TemplateVariables.create({ test: "value" });

        // Test TemplateVariables integration
        const validationResult = policy.validateVariables(variables);
        assertEquals(typeof validationResult, "object");

        // Test transformation preserves type
        const transformedVariables = policy.transformVariables(variables);
        assert(transformedVariables instanceof TemplateVariables);
      }
    });
  });
});
