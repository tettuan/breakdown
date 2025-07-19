/**
 * @fileoverview Architecture tests for TwoParams domain object
 *
 * Tests the core architecture patterns and constraints:
 * - Smart Constructor pattern implementation
 * - Result type usage for error handling
 * - Immutable value object design
 * - Type safety and brand enforcement
 *
 * @module types/two_params_architecture_test
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import { describe, it } from "@std/testing/bdd";
import { TwoParams } from "../domain/core/aggregates/two_params_optimized.ts";
import { ConfigProfileName } from "../config/config_profile_name.ts";

describe("TwoParams Architecture", () => {
  describe("Smart Constructor Pattern", () => {
    it("should have private constructor", () => {
      // The constructor should not be directly accessible
      // We test this indirectly by ensuring we can only create instances through static methods
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create("to", "project", profile);

      assertEquals(result.ok, true);
      if (result.ok) {
        assertExists(result.data);
        assertEquals(typeof result.data, "object");
      }
    });

    it("should provide create static method with Result type", () => {
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create("to", "project", profile);

      // Should return Result type
      assertExists(result);
      assertEquals(typeof result.ok, "boolean");

      if (result.ok) {
        assertEquals(typeof result.data, "object");
        assertExists(result.data.directive);
        assertExists(result.data.layer);
        assertExists(result.data.profile);
      }
    });

    it("should provide createWithCliOption static method", () => {
      const result = TwoParams.createWithCliOption("to", "project", null);

      assertEquals(result.ok, true);
      if (result.ok) {
        assertExists(result.data);
        assertEquals(result.data.profile.isDefault(), true);
      }
    });

    it("should handle null/undefined CLI options with default profile", () => {
      const resultNull = TwoParams.createWithCliOption("to", "project", null);
      const resultUndefined = TwoParams.createWithCliOption("to", "project", undefined);

      assertEquals(resultNull.ok, true);
      assertEquals(resultUndefined.ok, true);

      if (resultNull.ok && resultUndefined.ok) {
        assertEquals(resultNull.data.profile.isDefault(), true);
        assertEquals(resultUndefined.data.profile.isDefault(), true);
      }
    });
  });

  describe("Immutable Value Object", () => {
    it("should create immutable instances", () => {
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create("to", "project", profile);

      assertEquals(result.ok, true);
      if (result.ok) {
        const twoParams = result.data;

        // Object should be frozen
        assertEquals(Object.isFrozen(twoParams), true);

        // Properties should be readonly (TypeScript enforces this)
        assertExists(twoParams.directive);
        assertExists(twoParams.layer);
        assertExists(twoParams.profile);
      }
    });

    it("should have readonly properties", () => {
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create("to", "project", profile);

      assertEquals(result.ok, true);
      if (result.ok) {
        const twoParams = result.data;

        // Properties should exist and be accessible
        assertExists(twoParams.directive);
        assertExists(twoParams.layer);
        assertExists(twoParams.profile);

        // These properties are readonly by TypeScript type system
        // Note: DirectiveType and LayerType are implemented as domain objects
        assertEquals(typeof twoParams.directive, "object");
        assertEquals(typeof twoParams.layer, "object");
        assertEquals(typeof twoParams.profile, "object");
      }
    });
  });

  describe("Result Type Usage", () => {
    it("should return ok Result for valid inputs", () => {
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create("to", "project", profile);

      assertEquals(result.ok, true);
      if (result.ok) {
        assertExists(result.data);
        assertEquals(TwoParams.is(result.data), true);
      }
    });

    it("should return error Result for invalid directive", () => {
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create("", "project", profile);

      assertEquals(result.ok, false);
      if (!result.ok) {
        assertEquals(result.error.kind, "InvalidDirective");
        if (result.error.kind === "InvalidDirective") {
          assertExists(result.error.directive);
          assertExists(result.error.profile);
        }
      }
    });

    it("should return error Result for invalid layer", () => {
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create("to", "", profile);

      assertEquals(result.ok, false);
      if (!result.ok) {
        assertEquals(result.error.kind, "InvalidLayer");
        if (result.error.kind === "InvalidLayer") {
          assertExists(result.error.layer);
        }
      }
    });

    it("should never throw exceptions from create methods", () => {
      const profile = ConfigProfileName.createDefault();

      // These should all return Result types, never throw
      let didThrow = false;
      try {
        TwoParams.create("", "", profile);
        TwoParams.create("invalid", "invalid", profile);
        TwoParams.createWithCliOption("", "", "invalid");
      } catch {
        didThrow = true;
      }

      assertEquals(didThrow, false, "Smart Constructors should never throw");
    });
  });

  describe("Type Safety", () => {
    it("should provide type guard", () => {
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create("to", "project", profile);

      assertEquals(result.ok, true);
      if (result.ok) {
        assertEquals(TwoParams.is(result.data), true);
        assertEquals(TwoParams.is(null), false);
        assertEquals(TwoParams.is(undefined), false);
        assertEquals(TwoParams.is({}), false);
        assertEquals(TwoParams.is("string"), false);
      }
    });

    it("should maintain type safety through operations", () => {
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create("to", "project", profile);

      assertEquals(result.ok, true);
      if (result.ok) {
        const twoParams = result.data;

        // All operations should return typed results
        const command = twoParams.toCommand();
        assertEquals(typeof command, "object");
        assertExists(command.directive);
        assertExists(command.layer);
        assertExists(command.profile);
        assertExists(command.timestamp);

        const validation = twoParams.validate();
        assertEquals(typeof validation.ok, "boolean");

        const stringRep = twoParams.toString();
        assertEquals(typeof stringRep, "string");
      }
    });
  });

  describe("Domain Method Architecture", () => {
    it("should provide domain operations", () => {
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create("to", "project", profile);

      assertEquals(result.ok, true);
      if (result.ok) {
        const twoParams = result.data;

        // Domain operations should exist
        assertExists(twoParams.toCommand);
        assertExists(twoParams.validate);
        assertExists(twoParams.getPromptPath);
        assertExists(twoParams.getSchemaPath);
        assertExists(twoParams.resolvePromptFilePath);
        assertExists(twoParams.resolveSchemaFilePath);
        assertExists(twoParams.equals);
        assertExists(twoParams.toString);

        // All should be functions
        assertEquals(typeof twoParams.toCommand, "function");
        assertEquals(typeof twoParams.validate, "function");
        assertEquals(typeof twoParams.getPromptPath, "function");
        assertEquals(typeof twoParams.getSchemaPath, "function");
        assertEquals(typeof twoParams.resolvePromptFilePath, "function");
        assertEquals(typeof twoParams.resolveSchemaFilePath, "function");
        assertEquals(typeof twoParams.equals, "function");
        assertEquals(typeof twoParams.toString, "function");
      }
    });

    it("should have path resolution methods return Result types", () => {
      const profile = ConfigProfileName.createDefault();
      const result = TwoParams.create("to", "project", profile);

      assertEquals(result.ok, true);
      if (result.ok) {
        const twoParams = result.data;

        // Path resolution methods should return structured objects
        const promptPath = twoParams.getPromptPath();
        assertExists(promptPath.directive);
        assertExists(promptPath.layer);
        assertEquals(typeof promptPath.resolve, "function");

        const schemaPath = twoParams.getSchemaPath();
        assertExists(schemaPath.directive);
        assertExists(schemaPath.layer);
        assertEquals(typeof schemaPath.resolve, "function");

        // File path resolution methods return strings
        const promptFilePath = twoParams.resolvePromptFilePath("prompts", "task");
        assertEquals(typeof promptFilePath, "string");

        const schemaFilePath = twoParams.resolveSchemaFilePath("schemas");
        assertEquals(typeof schemaFilePath, "string");
      }
    });
  });

  describe("Factory Functions", () => {
    it("should use safe factory methods with Result types", () => {
      const profile = ConfigProfileName.createDefault();

      // Should work for valid inputs via static create method
      const result = TwoParams.create("to", "project", profile);
      assertEquals(result.ok, true);
      if (result.ok) {
        assertExists(result.data);
        assertEquals(TwoParams.is(result.data), true);
      }
    });

    it("should return error for invalid inputs via safe factory", () => {
      const profile = ConfigProfileName.createDefault();

      // Should return error result for invalid inputs
      const result = TwoParams.create("", "project", profile);
      assertEquals(result.ok, false);
      if (!result.ok) {
        assertExists(result.error);
      }
    });
  });
});
