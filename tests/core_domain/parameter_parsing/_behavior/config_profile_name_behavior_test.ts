/**
 * Unit tests for ConfigProfileName
 *
 * Tests the functional behavior of ConfigProfileName following the Totality principle.
 * Validates that ConfigProfileName correctly handles all profile name scenarios
 * and maintains type safety through Smart Constructor pattern.
 *
 * Test scope:
 * - Profile name creation and validation
 * - Empty profile handling
 * - Pattern matching rules
 * - Value retrieval and existence checks
 */

import { assertEquals } from "../../lib/deps.ts";
import { describe, it } from "jsr:@std/testing@^0.224.0/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import { ConfigProfileName } from "../../../../lib/types/config_profile_name.ts";

const logger = new BreakdownLogger("config-profile-name-unit");

describe("ConfigProfileName - Unit Tests", () => {
  describe("create() - Valid profile names", () => {
    it("should create ConfigProfileName with valid lowercase letters", () => {
      logger.debug("Testing valid lowercase profile names");

      const profiles = ["production", "staging", "development", "test"];

      profiles.forEach((name) => {
        const profileResult = ConfigProfileName.create(name);
        assertEquals(profileResult.ok, true, `Should create profile for ${name}`);
        if (profileResult.ok) {
          assertEquals(profileResult.data.value, name);
        }
      });
    });

    it("should create ConfigProfileName with numbers", () => {
      logger.debug("Testing profile names with numbers");

      const profiles = ["prod1", "test2", "v3", "123"];

      profiles.forEach((name) => {
        const profileResult = ConfigProfileName.create(name);
        assertEquals(profileResult.ok, true, `Should create profile for ${name}`);
        if (profileResult.ok) {
          assertEquals(profileResult.data.value, name);
        }
      });
    });

    it("should create ConfigProfileName with hyphens and underscores", () => {
      logger.debug("Testing profile names with special characters");

      const profiles = ["prod-env", "test_env", "feature-123", "branch_456"];

      profiles.forEach((name) => {
        const profileResult = ConfigProfileName.create(name);
        assertEquals(profileResult.ok, true, `Should create profile for ${name}`);
        if (profileResult.ok) {
          assertEquals(profileResult.data.value, name);
        }
      });
    });

    it("should create ConfigProfileName with mixed valid characters", () => {
      logger.debug("Testing profile names with mixed characters");

      const profiles = ["prod-v2_final", "test_123-beta", "feature_branch-01"];

      profiles.forEach((name) => {
        const profileResult = ConfigProfileName.create(name);
        assertEquals(profileResult.ok, true, `Should create profile for ${name}`);
        if (profileResult.ok) {
          assertEquals(profileResult.data.value, name);
        }
      });
    });

    it("should accept single character profile names", () => {
      logger.debug("Testing single character profile names");

      const profiles = ["a", "z", "0", "9", "-", "_"];

      profiles.forEach((name) => {
        const profileResult = ConfigProfileName.create(name);
        assertEquals(profileResult.ok, true, `Should create profile for ${name}`);
        if (profileResult.ok) {
          assertEquals(profileResult.data.value, name);
        }
      });
    });

    it("should accept maximum length profile names", () => {
      logger.debug("Testing maximum length profile names");

      const maxLength = "a".repeat(50);
      const profileResult = ConfigProfileName.create(maxLength);
      assertEquals(profileResult.ok, true, "Should accept maximum length profile");
      if (profileResult.ok) {
        assertEquals(profileResult.data.value, maxLength);
        assertEquals(profileResult.data.value.length, 50);
      }
    });
  });

  describe("create() - Invalid profile names", () => {
    it("should return empty for uppercase letters", () => {
      logger.debug("Testing uppercase profile names");

      const profiles = ["PRODUCTION", "Production", "productioN", "PROD"];

      profiles.forEach((name) => {
        const profileResult = ConfigProfileName.create(name);
        assertEquals(profileResult.ok, false, `Should reject profile for ${name}`);
      });
    });

    it("should return empty for special characters", () => {
      logger.debug("Testing special character profile names");

      const profiles = [
        "prod@env",
        "test!env",
        "feature#123",
        "branch$456",
        "test.env",
        "prod/env",
      ];

      profiles.forEach((name) => {
        const profileResult = ConfigProfileName.create(name);
        assertEquals(profileResult.ok, false, `Should reject profile for ${name}`);
      });
    });

    it("should return empty for whitespace", () => {
      logger.debug("Testing whitespace in profile names");

      const profiles = ["prod env", " prod", "prod ", "prod\tenv", "prod\nenv", "  "];

      profiles.forEach((name) => {
        const profileResult = ConfigProfileName.create(name);
        assertEquals(profileResult.ok, false, `Should reject profile for ${name}`);
      });
    });

    it("should return empty for empty string", () => {
      logger.debug("Testing empty string");

      const profileResult = ConfigProfileName.create("");
      assertEquals(profileResult.ok, false, "Should reject empty string");
    });

    it("should return empty for exceeding maximum length", () => {
      logger.debug("Testing profile names exceeding maximum length");

      const tooLong = "a".repeat(51);
      const profileResult = ConfigProfileName.create(tooLong);
      assertEquals(profileResult.ok, false, "Should reject too long profile name");
    });

    it("should return empty for non-string values", () => {
      logger.debug("Testing non-string values");

      // @ts-ignore - Testing runtime behavior
      const profile1 = ConfigProfileName.create(null);
      assertEquals(profile1.ok, false, "Should reject null");

      // @ts-ignore - Testing runtime behavior
      const profile2 = ConfigProfileName.create(undefined);
      assertEquals(profile2.ok, false, "Should reject undefined");

      // @ts-ignore - Testing runtime behavior
      const profile3 = ConfigProfileName.create(123);
      assertEquals(profile3.ok, false, "Should reject number");

      // @ts-ignore - Testing runtime behavior
      const profile4 = ConfigProfileName.create({});
      assertEquals(profile4.ok, false, "Should reject object");

      // @ts-ignore - Testing runtime behavior
      const profile5 = ConfigProfileName.create([]);
      assertEquals(profile5.ok, false, "Should reject array");
    });
  });

  describe("Null handling for invalid cases", () => {
    it("should return null for empty string", () => {
      logger.debug("Testing null return for empty string");

      const profileResult = ConfigProfileName.create("");
      assertEquals(profileResult.ok, false, "Should reject empty string");
      if (!profileResult.ok) {
        assertEquals(profileResult.error.kind, "EmptyInput");
      }
    });

    it("should consistently return null for invalid inputs", () => {
      logger.debug("Testing consistent null returns");

      const profile1 = ConfigProfileName.create("");
      const profile2 = ConfigProfileName.create("INVALID");

      assertEquals(profile1.ok, false, "Should reject empty string");
      assertEquals(profile2.ok, false, "Should reject invalid string");
    });
  });

  describe("Edge cases", () => {
    it("should handle boundary length values", () => {
      logger.debug("Testing boundary length values");

      // Length 49 - valid
      const length49 = "a".repeat(49);
      const profile49 = ConfigProfileName.create(length49);
      assertEquals(profile49.ok, true, "Should accept length 49");
      if (profile49.ok) {
        assertEquals(profile49.data.value, length49);
      }

      // Length 50 - valid
      const length50 = "a".repeat(50);
      const profile50 = ConfigProfileName.create(length50);
      assertEquals(profile50.ok, true, "Should accept length 50");
      if (profile50.ok) {
        assertEquals(profile50.data.value, length50);
      }

      // Length 51 - invalid
      const length51 = "a".repeat(51);
      const profile51 = ConfigProfileName.create(length51);
      assertEquals(profile51.ok, false, "Should reject length 51");
    });

    it("should handle unicode and non-ASCII characters", () => {
      logger.debug("Testing unicode and non-ASCII characters");

      const profiles = ["café", "日本語", "🚀", "test™", "prod©"];

      profiles.forEach((name) => {
        const profileResult = ConfigProfileName.create(name);
        assertEquals(profileResult.ok, false, `Should reject profile for ${name}`);
      });
    });

    it("should handle numeric strings at boundaries", () => {
      logger.debug("Testing numeric strings");

      // Pure numbers are valid
      const numeric = ConfigProfileName.create("12345");
      assertEquals(numeric.ok, true, "Should accept numeric string");
      if (numeric.ok) {
        assertEquals(numeric.data.value, "12345");
      }

      // Zero-prefixed numbers are valid
      const zeroPrefixed = ConfigProfileName.create("00123");
      assertEquals(zeroPrefixed.ok, true, "Should accept zero-prefixed numeric");
      if (zeroPrefixed.ok) {
        assertEquals(zeroPrefixed.data.value, "00123");
      }
    });
  });

  describe("Common usage patterns", () => {
    it("should handle typical production profile names", () => {
      logger.debug("Testing typical production profile names");

      const profiles = [
        { input: "prod", expected: "prod" },
        { input: "production", expected: "production" },
        { input: "prod-v2", expected: "prod-v2" },
        { input: "production_2024", expected: "production_2024" },
      ];

      profiles.forEach(({ input, expected }) => {
        const profileResult = ConfigProfileName.create(input);
        assertEquals(profileResult.ok, true, `Should create profile for ${input}`);
        if (profileResult.ok) {
          assertEquals(profileResult.data.value, expected);
        }
      });
    });

    it("should handle typical development profile names", () => {
      logger.debug("Testing typical development profile names");

      const profiles = [
        { input: "dev", expected: "dev" },
        { input: "development", expected: "development" },
        { input: "local", expected: "local" },
        { input: "test", expected: "test" },
        { input: "staging", expected: "staging" },
      ];

      profiles.forEach(({ input, expected }) => {
        const profileResult = ConfigProfileName.create(input);
        assertEquals(profileResult.ok, true, `Should create profile for ${input}`);
        if (profileResult.ok) {
          assertEquals(profileResult.data.value, expected);
        }
      });
    });

    it("should handle feature branch profile names", () => {
      logger.debug("Testing feature branch profile names");

      const profiles = [
        { input: "feature-123", expected: "feature-123" },
        { input: "feature_auth", expected: "feature_auth" },
        { input: "hotfix-456", expected: "hotfix-456" },
        { input: "release_v2", expected: "release_v2" },
      ];

      profiles.forEach(({ input, expected }) => {
        const profileResult = ConfigProfileName.create(input);
        assertEquals(profileResult.ok, true, `Should create profile for ${input}`);
        if (profileResult.ok) {
          assertEquals(profileResult.data.value, expected);
        }
      });
    });
  });
});
