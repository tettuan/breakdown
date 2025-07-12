/**
 * @fileoverview Unit tests for ConfigProfileName
 *
 * Tests the Totality principle implementation of ConfigProfileName,
 * ensuring proper validation, creation, and behavior according to
 * business rules for configuration profile names.
 */

import { assertEquals } from "../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { ConfigProfileName } from "./config_profile_name.ts";

describe("ConfigProfileName - Unit Tests", () => {
  describe("Valid profile name creation", () => {
    it("should create ConfigProfileName with valid names", () => {
      const validNames = [
        "production",
        "staging",
        "development",
        "test",
        "prod-123",
        "stage_2",
        "dev-environment",
        "local_test_env",
        "a", // minimum length
        "a".repeat(50), // maximum length
      ];

      for (const name of validNames) {
        const profile = ConfigProfileName.create(name);
        assertEquals(profile.ok, true);
        if (profile.ok) {
          assertEquals(profile.data.value, name);
          assertEquals(profile.data.getValue(), name);
        }
      }
    });
  });

  describe("Invalid profile name rejection", () => {
    it("should reject invalid profile names", () => {
      const invalidNames = [
        "", // empty string
        "Production", // uppercase
        "STAGING", // all uppercase
        "test@env", // special character @
        "env#1", // special character #
        "test env", // space
        "test.env", // dot
        "test/env", // slash
        "test\\env", // backslash
        "test(env)", // parentheses
        "test[env]", // brackets
        "test{env}", // braces
        "test+env", // plus
        "test=env", // equals
        "test&env", // ampersand
        "test|env", // pipe
        "test;env", // semicolon
        "test:env", // colon
        "test,env", // comma
        "test<env>", // angle brackets
        "test%env", // percent
        "test!env", // exclamation
        "test?env", // question mark
        "test'env", // single quote
        'test"env', // double quote
        "test`env", // backtick
        "test~env", // tilde
        "a".repeat(51), // too long
      ];

      for (const name of invalidNames) {
        const profile = ConfigProfileName.create(name);
        assertEquals(profile.ok, false);
        if (!profile.ok) {
          assertEquals(typeof profile.error, "object");
        }
      }
    });
  });

  describe("Non-string input handling", () => {
    it("should handle non-string inputs gracefully", () => {
      // TypeScript would prevent these, but test runtime behavior
      const invalidInputs = [
        null as unknown as string, // null
        undefined as unknown as string, // undefined
        123 as unknown as string, // number
        {} as unknown as string, // object
        [] as unknown as string, // array
      ];

      for (const input of invalidInputs) {
        const profile = ConfigProfileName.create(input);
        assertEquals(profile.ok, false, `Invalid input '${input}' should be rejected`);
        if (!profile.ok) {
          assertEquals(typeof profile.error, "object");
        }
      }
    });
  });

  describe("Null handling for invalid inputs", () => {
    it("should return null for invalid inputs", () => {
      // Test that empty string is rejected
      const empty = ConfigProfileName.create("");
      assertEquals(empty.ok, false);
      if (!empty.ok) {
        assertEquals(empty.error.kind, "EmptyInput");
      }

      // Test that whitespace-only string is rejected
      const whitespace = ConfigProfileName.create("   ");
      assertEquals(whitespace.ok, false);
      if (!whitespace.ok) {
        assertEquals(whitespace.error.kind, "EmptyInput");
      }
    });
  });

  describe("Business rules validation", () => {
    it("should validate common profile names", () => {
      // Profile names commonly used in software development
      const commonProfiles = [
        "development",
        "staging",
        "production",
        "test",
        "local",
        "demo",
        "beta",
        "alpha",
        "dev",
        "prod",
        "qa",
        "uat",
      ];

      for (const profileName of commonProfiles) {
        const profile = ConfigProfileName.create(profileName);
        assertEquals(
          profile.ok,
          true,
          `Common profile '${profileName}' should be valid`,
        );
        if (profile.ok) {
          assertEquals(profile.data.value, profileName);
          assertEquals(profile.data.getValue(), profileName);
        }
      }
    });
  });

  describe("Integration with BreakdownConfig pattern", () => {
    it("should integrate with BreakdownConfig usage pattern", () => {
      // Test patterns that would be used with BreakdownConfig
      const profile = ConfigProfileName.create("staging");

      // Simulate BreakdownConfig usage
      assertEquals(profile.ok, true);
      if (profile.ok) {
        const configPrefix = profile.data.getValue();
        assertEquals(configPrefix, "staging");
      }
    });
  });

  describe("Edge cases for pattern matching", () => {
    it("should handle edge cases correctly", () => {
      // Test edge cases around the regex pattern
      const edgeCases = [
        { name: "123", valid: true }, // numbers only
        { name: "abc", valid: true }, // letters only
        { name: "a-b", valid: true }, // with hyphen
        { name: "a_b", valid: true }, // with underscore
        { name: "a-b_c", valid: true }, // mixed separators
        { name: "-abc", valid: true }, // starting with hyphen
        { name: "_abc", valid: true }, // starting with underscore
        { name: "abc-", valid: true }, // ending with hyphen
        { name: "abc_", valid: true }, // ending with underscore
        { name: "a--b", valid: true }, // double hyphen
        { name: "a__b", valid: true }, // double underscore
        { name: "0", valid: true }, // single digit
        { name: "9", valid: true }, // single digit
      ];

      for (const testCase of edgeCases) {
        const profile = ConfigProfileName.create(testCase.name);
        const isValid = profile.ok;
        assertEquals(
          isValid,
          testCase.valid,
          `Profile name '${testCase.name}' should be ${testCase.valid ? "valid" : "invalid"}`,
        );
        if (profile.ok && testCase.valid) {
          assertEquals(profile.data.getValue(), testCase.name);
        }
      }
    });
  });

  describe("Domain methods - isDefault and prefix", () => {
    it("should correctly identify default profile", () => {
      const defaultProfile = ConfigProfileName.create("default");
      assertEquals(defaultProfile.ok, true);
      if (defaultProfile.ok) {
        assertEquals(defaultProfile.data.isDefault, true);
        assertEquals(defaultProfile.data.prefix, null);
      }

      const customProfile = ConfigProfileName.create("staging");
      assertEquals(customProfile.ok, true);
      if (customProfile.ok) {
        assertEquals(customProfile.data.isDefault, false);
        assertEquals(customProfile.data.prefix, "staging");
      }
    });
  });

  describe("createDefault static method", () => {
    it("should create default profile correctly", () => {
      const defaultProfile = ConfigProfileName.createDefault();
      assertEquals(defaultProfile.value, "default");
      assertEquals(defaultProfile.isDefault, true);
      assertEquals(defaultProfile.prefix, null);
    });
  });

  describe("fromCliOption static method", () => {
    it("should create profile from CLI option", () => {
      // Valid CLI option
      const staging = ConfigProfileName.fromCliOption("staging");
      assertEquals(staging.value, "staging");
      assertEquals(staging.isDefault, false);

      // Null/undefined should return default
      const fromNull = ConfigProfileName.fromCliOption(null);
      assertEquals(fromNull.value, "default");
      assertEquals(fromNull.isDefault, true);

      const fromUndefined = ConfigProfileName.fromCliOption(undefined);
      assertEquals(fromUndefined.value, "default");
      assertEquals(fromUndefined.isDefault, true);

      // Empty string should return default
      const fromEmpty = ConfigProfileName.fromCliOption("");
      assertEquals(fromEmpty.value, "default");
      assertEquals(fromEmpty.isDefault, true);

      // Whitespace should return default
      const fromWhitespace = ConfigProfileName.fromCliOption("   ");
      assertEquals(fromWhitespace.value, "default");
      assertEquals(fromWhitespace.isDefault, true);
    });

    it("should fallback to default for invalid CLI options", () => {
      // Invalid format should fallback to default (with warning)
      const invalid = ConfigProfileName.fromCliOption("INVALID");
      assertEquals(invalid.value, "default");
      assertEquals(invalid.isDefault, true);
    });
  });

  describe("getConfigPath method", () => {
    it("should return correct config path", () => {
      const defaultProfile = ConfigProfileName.createDefault();
      assertEquals(defaultProfile.getConfigPath(), "default");

      const staging = ConfigProfileName.fromCliOption("staging");
      assertEquals(staging.getConfigPath(), "staging");
    });
  });

  describe("getDirectiveTypes and getLayerTypes methods", () => {
    it("should return directive and layer types arrays", () => {
      const profile = ConfigProfileName.createDefault();

      const directives = profile.getDirectiveTypes();
      assertEquals(Array.isArray(directives), true);
      assertEquals(directives.includes("to"), true);
      assertEquals(directives.includes("summary"), true);
      assertEquals(directives.includes("defect"), true);

      const layers = profile.getLayerTypes();
      assertEquals(Array.isArray(layers), true);
      assertEquals(layers.includes("project"), true);
      assertEquals(layers.includes("issue"), true);
      assertEquals(layers.includes("task"), true);
    });
  });

  describe("equals method", () => {
    it("should correctly compare ConfigProfileName instances", () => {
      const profile1 = ConfigProfileName.create("staging");
      const profile2 = ConfigProfileName.create("staging");
      const profile3 = ConfigProfileName.create("production");

      assertEquals(profile1.ok, true);
      assertEquals(profile2.ok, true);
      assertEquals(profile3.ok, true);

      if (profile1.ok && profile2.ok && profile3.ok) {
        assertEquals(profile1.data.equals(profile2.data), true);
        assertEquals(profile1.data.equals(profile3.data), false);
      }
    });
  });

  describe("toString method", () => {
    it("should return string representation", () => {
      const profile = ConfigProfileName.create("staging");
      assertEquals(profile.ok, true);
      if (profile.ok) {
        assertEquals(profile.data.toString(), "staging");
      }
    });
  });
});
