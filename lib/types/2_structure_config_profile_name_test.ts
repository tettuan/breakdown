/**
 * @fileoverview Unit tests for ConfigProfileName
 *
 * Tests the Totality principle implementation of ConfigProfileName,
 * ensuring proper validation, creation, and behavior according to
 * business rules for configuration profile names.
 */

import { assertEquals } from "../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { ConfigProfileName } from "../config/config_profile_name.ts";

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
        assertEquals(profile.value, name);
        assertEquals(profile.value, name);
      }
    });
  });

  describe("Default value for empty or invalid input", () => {
    it("should return default value for empty string", () => {
      const profile = ConfigProfileName.create("");
      assertEquals(profile.value, "default");
      assertEquals(profile.isDefault(), true);
    });

    it("should return default value for null and undefined", () => {
      const profileNull = ConfigProfileName.create(null);
      assertEquals(profileNull.value, "default");
      assertEquals(profileNull.isDefault(), true);

      const profileUndefined = ConfigProfileName.create(undefined);
      assertEquals(profileUndefined.value, "default");
      assertEquals(profileUndefined.isDefault(), true);
    });

    it("should return default value for whitespace-only strings", () => {
      const whitespaceInputs = [
        "   ",
        "\t",
        "\n",
        "  \t\n  ",
      ];

      for (const input of whitespaceInputs) {
        const profile = ConfigProfileName.create(input);
        assertEquals(profile.value, "default");
        assertEquals(profile.isDefault(), true);
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
        assertEquals(profile.value, "default", `Invalid input '${input}' should result in default`);
        assertEquals(profile.isDefault(), true);
      }
    });
  });

  describe("Trimming behavior", () => {
    it("should trim whitespace from valid inputs", () => {
      const testCases = [
        { input: "  staging  ", expected: "staging" },
        { input: "\tproduction\n", expected: "production" },
        { input: "   dev-env   ", expected: "dev-env" },
      ];

      for (const { input, expected } of testCases) {
        const profile = ConfigProfileName.create(input);
        assertEquals(profile.value, expected);
        assertEquals(profile.isDefault(), false);
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
        assertEquals(profile.value, profileName);
        assertEquals(profile.isDefault(), false);
      }
    });
  });

  describe("Integration with BreakdownConfig pattern", () => {
    it("should integrate with BreakdownConfig usage pattern", () => {
      // Test patterns that would be used with BreakdownConfig
      const profile = ConfigProfileName.create("staging");

      // Simulate BreakdownConfig usage
      const configPrefix = profile.value;
      assertEquals(configPrefix, "staging");
    });
  });

  describe("Edge cases for pattern matching", () => {
    it("should handle edge cases correctly", () => {
      // Test edge cases - ConfigProfileName accepts any non-empty string
      const edgeCases = [
        "123", // numbers only
        "abc", // letters only
        "a-b", // with hyphen
        "a_b", // with underscore
        "a-b_c", // mixed separators
        "-abc", // starting with hyphen
        "_abc", // starting with underscore
        "abc-", // ending with hyphen
        "abc_", // ending with underscore
        "a--b", // double hyphen
        "a__b", // double underscore
        "0", // single digit
        "9", // single digit
        "Test.Profile", // with dot
        "test@env", // with @
        "test env", // with space
      ];

      for (const testCase of edgeCases) {
        const profile = ConfigProfileName.create(testCase);
        assertEquals(profile.value, testCase);
        assertEquals(profile.isDefault(), false);
      }
    });
  });

  describe("Domain methods - isDefault and value", () => {
    it("should correctly identify default profile", () => {
      const defaultProfile = ConfigProfileName.create("default");
      assertEquals(defaultProfile.isDefault(), true);
      assertEquals(defaultProfile.value, "default");

      const customProfile = ConfigProfileName.create("staging");
      assertEquals(customProfile.isDefault(), false);
      assertEquals(customProfile.value, "staging");
    });
  });

  describe("createDefault static method", () => {
    it("should create default profile correctly", () => {
      const defaultProfile = ConfigProfileName.createDefault();
      assertEquals(defaultProfile.value, "default");
      assertEquals(defaultProfile.isDefault(), true);
    });
  });

  describe("fromCliOption static method", () => {
    it("should create profile from CLI option", () => {
      // Valid CLI option
      const staging = ConfigProfileName.fromCliOption("staging");
      assertEquals(staging.value, "staging");
      assertEquals(staging.isDefault(), false);

      // Null/undefined should return default
      const fromNull = ConfigProfileName.fromCliOption(null);
      assertEquals(fromNull.value, "default");
      assertEquals(fromNull.isDefault(), true);

      const fromUndefined = ConfigProfileName.fromCliOption(undefined);
      assertEquals(fromUndefined.value, "default");
      assertEquals(fromUndefined.isDefault(), true);

      // Empty string should return default
      const fromEmpty = ConfigProfileName.fromCliOption("");
      assertEquals(fromEmpty.value, "default");
      assertEquals(fromEmpty.isDefault(), true);

      // Whitespace should return default
      const fromWhitespace = ConfigProfileName.fromCliOption("   ");
      assertEquals(fromWhitespace.value, "default");
      assertEquals(fromWhitespace.isDefault(), true);
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
      assertEquals(directives.includes("find"), true);

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

      assertEquals(profile1.equals(profile2), true);
      assertEquals(profile1.equals(profile3), false);
    });
  });

  describe("toString method", () => {
    it("should return string representation", () => {
      const profile = ConfigProfileName.create("staging");
      assertEquals(profile.toString(), "ConfigProfileName(staging)");
    });
  });

  describe("getFilePrefix method", () => {
    it("should return correct file prefix", () => {
      const defaultProfile = ConfigProfileName.create();
      assertEquals(defaultProfile.getFilePrefix(), "default-");

      const staging = ConfigProfileName.create("staging");
      assertEquals(staging.getFilePrefix(), "staging-");
    });
  });

  describe("getConfigFileName method", () => {
    it("should return correct config filename", () => {
      const profile = ConfigProfileName.create("production");
      assertEquals(profile.getConfigFileName("app.yml"), "production-app.yml");
      assertEquals(profile.getConfigFileName("user.yml"), "production-user.yml");

      const defaultProfile = ConfigProfileName.create();
      assertEquals(defaultProfile.getConfigFileName("app.yml"), "default-app.yml");
    });
  });

  describe("createFromConfig method", () => {
    it("should create profile from config object", () => {
      // Test with config object
      const config = { profilePrefix: "production" };
      const profile = ConfigProfileName.createFromConfig(config);
      assertEquals(profile.value, "production");
      assertEquals(profile.isDefault(), false);

      // Test with empty config
      const emptyConfig = {};
      const defaultProfile = ConfigProfileName.createFromConfig(emptyConfig);
      assertEquals(defaultProfile.value, "default");
      assertEquals(defaultProfile.isDefault(), true);

      // Test with null config
      const nullProfile = ConfigProfileName.createFromConfig(null);
      assertEquals(nullProfile.value, "default");
      assertEquals(nullProfile.isDefault(), true);
    });
  });

  describe("createOrError method", () => {
    it("should return Result type with validation feedback", () => {
      // Valid profile name
      const validResult = ConfigProfileName.createOrError("production");
      assertEquals(validResult.ok, true);
      if (validResult.ok) {
        assertEquals(validResult.data.value, "production");
        assertEquals(validResult.data.isDefault(), false);
      }

      // Empty input returns error
      const emptyResult = ConfigProfileName.createOrError("");
      assertEquals(emptyResult.ok, false);
      if (!emptyResult.ok) {
        assertEquals(emptyResult.error.kind, "InvalidInput");
        if (emptyResult.error.kind === "InvalidInput") {
          assertEquals(emptyResult.error.field, "profileName");
        }
      }

      // Null input returns error
      const nullResult = ConfigProfileName.createOrError(null);
      assertEquals(nullResult.ok, false);
      if (!nullResult.ok) {
        assertEquals(nullResult.error.kind, "InvalidInput");
      }
    });
  });

  describe("prefix property", () => {
    it("should return correct prefix", () => {
      const profile = ConfigProfileName.create("staging");
      assertEquals(profile.prefix, "staging");

      const defaultProfile = ConfigProfileName.create();
      assertEquals(defaultProfile.prefix, "default");
    });
  });
});
