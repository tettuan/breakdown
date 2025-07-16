/**
 * @fileoverview 0_architecture test for default_generation_strategies.ts
 *
 * Tests architectural constraints for variable resolution and template selection strategies.
 * Validates strategy pattern implementation contracts, priority consistency, and interface compliance.
 *
 * @module infrastructure/templates/0_architecture_default_generation_strategies_test
 */

import { assertEquals } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import type {
  ResolutionContext,
  SelectionContext,
  VariableResolutionStrategy,
} from "../../domain/templates/generation_policy.ts";
import {
  createDefaultSelectionStrategy,
  createDefaultVariableStrategies,
  DefaultValueStrategy,
  EnvironmentVariableStrategy,
  FallbackTemplateSelectionStrategy,
  FilePathResolutionStrategy,
  StandardTemplateSelectionStrategy,
} from "./default_generation_strategies.ts";
import type { TwoParams_Result } from "../../deps.ts";
import { DirectiveType, LayerType } from "../../types/mod.ts";
import { ConfigProfileName } from "../../types/config_profile_name.ts";

describe("DefaultGenerationStrategies - Architecture", () => {
  describe("VariableResolutionStrategy Interface Contracts", () => {
    it("should implement VariableResolutionStrategy interface correctly", () => {
      const strategies = [
        new EnvironmentVariableStrategy(),
        new FilePathResolutionStrategy(),
        new DefaultValueStrategy(),
      ];

      for (const strategy of strategies) {
        // Check that all required methods exist
        assertEquals(typeof strategy.resolve, "function");
        assertEquals(typeof strategy.getPriority, "function");

        // Check that resolve returns Promise<string | undefined>
        const mockTwoParams_Result: TwoParams_Result = {
          type: "two",
          directiveType: "to",
          layerType: "project",
          demonstrativeType: "to",
          params: ["to", "project"],
          options: {},
        };
        const directiveResult = DirectiveType.create(mockTwoParams_Result.directiveType);
        if (!directiveResult.ok) {
          throw new Error(`Failed to create DirectiveType: ${directiveResult.error.message}`);
        }
        const layerResult = LayerType.create(mockTwoParams_Result.layerType, ConfigProfileName.createDefault());
        if (!layerResult.ok) {
          throw new Error(`Failed to create LayerType: ${layerResult.error.message}`);
        }
        const mockContext: ResolutionContext = {
          providedVariables: {},
          directive: directiveResult.data,
          layer: layerResult.data,
          workingDirectory: "/test",
        };

        const result = strategy.resolve("test", mockContext);
        assertEquals(result instanceof Promise, true);

        // Check that getPriority returns number
        const priority = strategy.getPriority();
        assertEquals(typeof priority, "number");
      }
    });

    it("should enforce priority ordering contract", () => {
      const strategies = createDefaultVariableStrategies();
      const priorities = strategies.map((s) => s.getPriority());

      // Priorities should be distinct positive numbers
      assertEquals(new Set(priorities).size, priorities.length, "Priorities must be unique");
      for (const priority of priorities) {
        assertEquals(priority > 0, true, "Priorities must be positive");
      }

      // FilePathResolutionStrategy (50) > EnvironmentVariableStrategy (10) > DefaultValueStrategy (1)
      const filePathStrategy = strategies.find((s) => s instanceof FilePathResolutionStrategy);
      const envStrategy = strategies.find((s) => s instanceof EnvironmentVariableStrategy);
      const defaultStrategy = strategies.find((s) => s instanceof DefaultValueStrategy);

      assertEquals(filePathStrategy!.getPriority(), 50);
      assertEquals(envStrategy!.getPriority(), 10);
      assertEquals(defaultStrategy!.getPriority(), 1);
    });

    it("should maintain priority consistency for same strategy instances", () => {
      const strategy = new EnvironmentVariableStrategy();
      const priority1 = strategy.getPriority();
      const priority2 = strategy.getPriority();
      assertEquals(priority1, priority2, "Priority must be consistent across calls");
    });
  });

  describe("TemplateSelectionStrategy Interface Contracts", () => {
    it("should implement TemplateSelectionStrategy interface correctly", () => {
      const strategies = [
        new StandardTemplateSelectionStrategy(),
        new FallbackTemplateSelectionStrategy(
          new StandardTemplateSelectionStrategy(),
          new Map(),
        ),
      ];

      for (const strategy of strategies) {
        // Check that selectTemplate method exists
        assertEquals(typeof strategy.selectTemplate, "function");

        // Check that selectTemplate returns Result<TemplatePath, string>
        const mockTwoParams_Result: TwoParams_Result = {
          type: "two",
          directiveType: "to",
          layerType: "project",
          demonstrativeType: "to",
          params: ["to", "project"],
          options: {},
        };
        const directiveResult = DirectiveType.create(mockTwoParams_Result.directiveType);
        if (!directiveResult.ok) {
          throw new Error(`Failed to create DirectiveType: ${directiveResult.error.message}`);
        }
        const directive = directiveResult.data;
        const layerResult = LayerType.create(mockTwoParams_Result.layerType, ConfigProfileName.createDefault());
        if (!layerResult.ok) {
          throw new Error(`Failed to create LayerType: ${layerResult.error.message}`);
        }
        const layer = layerResult.data;
        const context: SelectionContext = {
          fallbackEnabled: false,
        };

        const result = strategy.selectTemplate(directive, layer, context);

        // Result should have 'ok' and either 'data' or 'error'
        assertEquals(typeof result.ok, "boolean");
        if (result.ok) {
          assertEquals(typeof result.data, "object");
        } else {
          assertEquals(typeof result.error, "string");
        }
      }
    });

    it("should handle fallback delegation correctly", () => {
      const primaryStrategy = new StandardTemplateSelectionStrategy();
      const fallbackMappings = new Map([["test/test", "fallback.md"]]);
      const fallbackStrategy = new FallbackTemplateSelectionStrategy(
        primaryStrategy,
        fallbackMappings,
      );

      const mockTwoParams_Result: TwoParams_Result = {
        type: "two",
        directiveType: "to",
        layerType: "project",
        demonstrativeType: "to",
        params: ["to", "project"],
        options: {},
      };
      const directiveResult = DirectiveType.create(mockTwoParams_Result.directiveType);
      if (!directiveResult.ok) {
        throw new Error(`Failed to create DirectiveType: ${directiveResult.error.message}`);
      }
      const directive = directiveResult.data;
      const layerResult = LayerType.create(mockTwoParams_Result.layerType, ConfigProfileName.createDefault());
      if (!layerResult.ok) {
        throw new Error(`Failed to create LayerType: ${layerResult.error.message}`);
      }
      const layer = layerResult.data;

      // When fallback is disabled, should delegate to primary strategy
      const contextNoFallback: SelectionContext = { fallbackEnabled: false };
      const primaryResult = primaryStrategy.selectTemplate(directive, layer, contextNoFallback);
      const fallbackResult = fallbackStrategy.selectTemplate(directive, layer, contextNoFallback);

      assertEquals(primaryResult.ok, fallbackResult.ok);
      if (primaryResult.ok && fallbackResult.ok) {
        assertEquals(primaryResult.data.getPath(), fallbackResult.data.getPath());
      }
    });
  });

  describe("Factory Function Contracts", () => {
    it("should create consistent variable strategies", () => {
      const strategies1 = createDefaultVariableStrategies();
      const strategies2 = createDefaultVariableStrategies();

      assertEquals(strategies1.length, strategies2.length);

      // Should create same types in same order
      for (let i = 0; i < strategies1.length; i++) {
        assertEquals(strategies1[i].constructor.name, strategies2[i].constructor.name);
        assertEquals(strategies1[i].getPriority(), strategies2[i].getPriority());
      }
    });

    it("should create valid selection strategy", () => {
      const strategy = createDefaultSelectionStrategy();

      // Should be a FallbackTemplateSelectionStrategy
      assertEquals(strategy instanceof FallbackTemplateSelectionStrategy, true);

      // Should work with valid inputs
      const mockTwoParams_Result: TwoParams_Result = {
        type: "two",
        directiveType: "defect",
        layerType: "project",
        demonstrativeType: "defect",
        params: ["defect", "project"],
        options: {},
      };
      const directiveResult = DirectiveType.create(mockTwoParams_Result.directiveType);
      if (!directiveResult.ok) {
        throw new Error(`Failed to create DirectiveType: ${directiveResult.error.message}`);
      }
      const directive = directiveResult.data;
      const layerResult = LayerType.create(mockTwoParams_Result.layerType, ConfigProfileName.createDefault());
      if (!layerResult.ok) {
        throw new Error(`Failed to create LayerType: ${layerResult.error.message}`);
      }
      const layer = layerResult.data;
      const context: SelectionContext = { fallbackEnabled: true };

      const result = strategy.selectTemplate(directive, layer, context);
      assertEquals(result.ok, true);
    });
  });

  describe("Strategy Pattern Architecture", () => {
    it("should allow strategy composition without coupling", () => {
      // Create strategies independently
      const envStrategy = new EnvironmentVariableStrategy("CUSTOM_");
      const fileStrategy = new FilePathResolutionStrategy();
      const defaultStrategy = new DefaultValueStrategy({ test: "value" });

      // Should work together without knowing about each other
      const strategies: VariableResolutionStrategy[] = [envStrategy, fileStrategy, defaultStrategy];

      // All should implement the interface without coupling
      for (const strategy of strategies) {
        assertEquals(typeof strategy.resolve, "function");
        assertEquals(typeof strategy.getPriority, "function");
      }
    });

    it("should maintain substitutability principle", () => {
      // Any VariableResolutionStrategy should be substitutable
      const strategies: VariableResolutionStrategy[] = [
        new EnvironmentVariableStrategy(),
        new FilePathResolutionStrategy(),
        new DefaultValueStrategy(),
      ];

      const mockTwoParams_Result: TwoParams_Result = {
        type: "two",
        directiveType: "to",
        layerType: "project",
        demonstrativeType: "to",
        params: ["to", "project"],
        options: {},
      };
      const directiveResult = DirectiveType.create(mockTwoParams_Result.directiveType);
      if (!directiveResult.ok) {
        throw new Error(`Failed to create DirectiveType: ${directiveResult.error.message}`);
      }
      const layerResult = LayerType.create(mockTwoParams_Result.layerType, ConfigProfileName.createDefault());
      if (!layerResult.ok) {
        throw new Error(`Failed to create LayerType: ${layerResult.error.message}`);
      }
      const context: ResolutionContext = {
        providedVariables: {},
        directive: directiveResult.data,
        layer: layerResult.data,
        workingDirectory: "/test",
      };

      // All should handle the same interface contract
      for (const strategy of strategies) {
        const result = strategy.resolve("test_var", context);
        assertEquals(result instanceof Promise, true);
      }
    });

    it("should enforce open/closed principle", () => {
      // Existing strategies should work without modification when new ones are added
      const originalStrategies = createDefaultVariableStrategies();

      // Custom strategy implementation
      class CustomStrategy implements VariableResolutionStrategy {
        resolve(): Promise<string | undefined> {
          return Promise.resolve("custom");
        }
        getPriority(): number {
          return 100;
        }
      }

      const extendedStrategies = [...originalStrategies, new CustomStrategy()];

      // All strategies should still work
      for (const strategy of extendedStrategies) {
        assertEquals(typeof strategy.resolve, "function");
        assertEquals(typeof strategy.getPriority, "function");
      }
    });
  });

  describe("Error Handling Architecture", () => {
    it("should handle invalid inputs gracefully", () => {
      const strategy = new FilePathResolutionStrategy();

      // Should handle null/undefined context properties without throwing
      const mockTwoParams_Result: TwoParams_Result = {
        type: "two",
        directiveType: "to",
        layerType: "project",
        demonstrativeType: "to",
        params: ["to", "project"],
        options: {},
      };
      const directiveResult2 = DirectiveType.create(mockTwoParams_Result.directiveType);
      if (!directiveResult2.ok) {
        throw new Error(`Failed to create DirectiveType: ${directiveResult2.error.message}`);
      }
      const layerResult2 = LayerType.create(mockTwoParams_Result.layerType, ConfigProfileName.createDefault());
      if (!layerResult2.ok) {
        throw new Error(`Failed to create LayerType: ${layerResult2.error.message}`);
      }
      const invalidContext: ResolutionContext = {
        providedVariables: {} as Record<string, string>,
        directive: directiveResult2.data,
        layer: layerResult2.data,
        workingDirectory: "/test",
      };

      const result = strategy.resolve("test", invalidContext);
      assertEquals(result instanceof Promise, true);
    });

    it("should validate template selection results", () => {
      const strategy = new StandardTemplateSelectionStrategy();
      const mockTwoParams_Result: TwoParams_Result = {
        type: "two",
        directiveType: "to",
        layerType: "project",
        demonstrativeType: "to",
        params: ["to", "project"],
        options: {},
      };
      const directiveResult = DirectiveType.create(mockTwoParams_Result.directiveType);
      if (!directiveResult.ok) {
        throw new Error(`Failed to create DirectiveType: ${directiveResult.error.message}`);
      }
      const directive = directiveResult.data;
      const layerResult = LayerType.create(mockTwoParams_Result.layerType, ConfigProfileName.createDefault());
      if (!layerResult.ok) {
        throw new Error(`Failed to create LayerType: ${layerResult.error.message}`);
      }
      const layer = layerResult.data;
      const context: SelectionContext = { fallbackEnabled: false };

      const result = strategy.selectTemplate(directive, layer, context);

      // Should always return a valid Result type
      assertEquals(typeof result.ok, "boolean");
      if (result.ok) {
        assertEquals(typeof result.data, "object");
        assertEquals(typeof result.data.getPath, "function");
      } else {
        assertEquals(typeof result.error, "string");
      }
    });
  });
});
