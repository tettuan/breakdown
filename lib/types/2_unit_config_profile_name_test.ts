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

import { assertEquals } from "@std/assert";
import { describe, it } from "jsr:@std/testing@^0.224.0/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import { ConfigProfileName } from "./config_profile_name.ts";

const _logger = new BreakdownLogger("config-profile-name-unit");

describe("ConfigProfileName - Unit Tests", () => {
  describe("create() - Valid profile names", () => {
    it("should create ConfigProfileName with valid lowercase letters", () => {
      _logger.debug("Testing valid lowercase profile names");

      const profiles = ["production", "staging", "development", "test"];

      profiles.forEach((name) => {
        const profile = ConfigProfileName.create(name);
        assertEquals(profile.value, name);
        assertEquals(profile.value !== null, true);
      });
    });

    it("should create ConfigProfileName with numbers", () => {
      _logger.debug("Testing profile names with numbers");

      const profiles = ["prod1", "test2", "v3", "123"];

      profiles.forEach((name) => {
        const profile = ConfigProfileName.create(name);
        assertEquals(profile.value, name);
        assertEquals(profile.value !== null, true);
      });
    });

    it("should create ConfigProfileName with hyphens and underscores", () => {
      _logger.debug("Testing profile names with special characters");

      const profiles = ["prod-env", "test_env", "feature-123", "branch_456"];

      profiles.forEach((name) => {
        const profile = ConfigProfileName.create(name);
        assertEquals(profile.value, name);
        assertEquals(profile.value !== null, true);
      });
    });

    it("should create ConfigProfileName with mixed valid characters", () => {
      _logger.debug("Testing profile names with mixed characters");

      const profiles = ["prod-v2_final", "test_123-beta", "feature_branch-01"];

      profiles.forEach((name) => {
        const profile = ConfigProfileName.create(name);
        assertEquals(profile.value, name);
        assertEquals(profile.value !== null, true);
      });
    });

    it("should accept single character profile names", () => {
      _logger.debug("Testing single character profile names");

      const profiles = ["a", "z", "0", "9", "-", "_"];

      profiles.forEach((name) => {
        const profile = ConfigProfileName.create(name);
        assertEquals(profile.value, name);
        assertEquals(profile.value !== null, true);
      });
    });

    it("should accept maximum length profile names", () => {
      _logger.debug("Testing maximum length profile names");

      const maxLength = "a".repeat(50);
      const profile = ConfigProfileName.create(maxLength);
      assertEquals(profile.value, maxLength);
      assertEquals(profile.value !== null, true);
      assertEquals(profile.value?.length, 50);
    });
  });

  describe("create() - Invalid profile names", () => {
    it("should return empty for uppercase letters", () => {
      _logger.debug("Testing uppercase profile names");

      const profiles = ["PRODUCTION", "Production", "productioN", "PROD"];

      profiles.forEach((name) => {
        const profile = ConfigProfileName.create(name);
        assertEquals(profile.value, null);
        assertEquals(profile.value !== null, false);
      });
    });

    it("should return empty for special characters", () => {
      _logger.debug("Testing special character profile names");

      const profiles = [
        "prod@env",
        "test!env",
        "feature#123",
        "branch$456",
        "test.env",
        "prod/env",
      ];

      profiles.forEach((name) => {
        const profile = ConfigProfileName.create(name);
        assertEquals(profile.value, null);
        assertEquals(profile.value !== null, false);
      });
    });

    it("should return empty for whitespace", () => {
      _logger.debug("Testing whitespace in profile names");

      const profiles = ["prod env", " prod", "prod ", "prod\tenv", "prod\nenv", "  "];

      profiles.forEach((name) => {
        const profile = ConfigProfileName.create(name);
        assertEquals(profile.value, null);
        assertEquals(profile.value !== null, false);
      });
    });

    it("should return empty for empty string", () => {
      _logger.debug("Testing empty string");

      const profile = ConfigProfileName.create("");
      assertEquals(profile.value, null);
      assertEquals(profile.value !== null, false);
    });

    it("should return empty for exceeding maximum length", () => {
      _logger.debug("Testing profile names exceeding maximum length");

      const tooLong = "a".repeat(51);
      const profile = ConfigProfileName.create(tooLong);
      assertEquals(profile.value, null);
      assertEquals(profile.value !== null, false);
    });

    it("should return empty for non-string values", () => {
      _logger.debug("Testing non-string values");

      // @ts-ignore - Testing runtime behavior
      const profile1 = ConfigProfileName.create(null);
      assertEquals(profile1.value, null);
      assertEquals(profile1.value !== null, false);

      // @ts-ignore - Testing runtime behavior
      const profile2 = ConfigProfileName.create(undefined);
      assertEquals(profile2.value, null);
      assertEquals(profile2.value !== null, false);

      // @ts-ignore - Testing runtime behavior
      const profile3 = ConfigProfileName.create(123);
      assertEquals(profile3.value, null);
      assertEquals(profile3.value !== null, false);

      // @ts-ignore - Testing runtime behavior
      const profile4 = ConfigProfileName.create({});
      assertEquals(profile4.value, null);
      assertEquals(profile4.value !== null, false);

      // @ts-ignore - Testing runtime behavior
      const profile5 = ConfigProfileName.create([]);
      assertEquals(profile5.value, null);
      assertEquals(profile5.value !== null, false);
    });
  });

  describe("Null handling for invalid cases", () => {
    it("should return null for empty string", () => {
      _logger.debug("Testing null return for empty string");

      const profile = ConfigProfileName.create("");
      assertEquals(profile.value, null);
    });

    it("should consistently return null for invalid inputs", () => {
      _logger.debug("Testing consistent null returns");

      const profile1 = ConfigProfileName.create("");
      const profile2 = ConfigProfileName.create("INVALID");

      assertEquals(profile1.value, null);
      assertEquals(profile2.value, null);
    });
  });

  describe("Edge cases", () => {
    it("should handle boundary length values", () => {
      _logger.debug("Testing boundary length values");

      // Length 49 - valid
      const length49 = "a".repeat(49);
      const profile49 = ConfigProfileName.create(length49);
      assertEquals(profile49.value, length49);
      assertEquals(profile49.value !== null, true);

      // Length 50 - valid
      const length50 = "a".repeat(50);
      const profile50 = ConfigProfileName.create(length50);
      assertEquals(profile50.value, length50);
      assertEquals(profile50.value !== null, true);

      // Length 51 - invalid
      const length51 = "a".repeat(51);
      const profile51 = ConfigProfileName.create(length51);
      assertEquals(profile51.value, null);
      assertEquals(profile51.value !== null, false);
    });

    it("should handle unicode and non-ASCII characters", () => {
      _logger.debug("Testing unicode and non-ASCII characters");

      const profiles = ["café", "日本語", "🚀", "test™", "prod©"];

      profiles.forEach((name) => {
        const profile = ConfigProfileName.create(name);
        assertEquals(profile.value, null);
        assertEquals(profile.value !== null, false);
      });
    });

    it("should handle numeric strings at boundaries", () => {
      _logger.debug("Testing numeric strings");

      // Pure numbers are valid
      const numeric = ConfigProfileName.create("12345");
      assertEquals(numeric.value, "12345");
      assertEquals(numeric.value !== null, true);

      // Zero-prefixed numbers are valid
      const zeroPrefixed = ConfigProfileName.create("00123");
      assertEquals(zeroPrefixed.value, "00123");
      assertEquals(zeroPrefixed.value !== null, true);
    });
  });

  describe("Common usage patterns", () => {
    it("should handle typical production profile names", () => {
      _logger.debug("Testing typical production profile names");

      const profiles = [
        { input: "prod", expected: "prod" },
        { input: "production", expected: "production" },
        { input: "prod-v2", expected: "prod-v2" },
        { input: "production_2024", expected: "production_2024" },
      ];

      profiles.forEach(({ input, expected }) => {
        const profile = ConfigProfileName.create(input);
        assertEquals(profile.value, expected);
        assertEquals(profile.value !== null, true);
      });
    });

    it("should handle typical development profile names", () => {
      _logger.debug("Testing typical development profile names");

      const profiles = [
        { input: "dev", expected: "dev" },
        { input: "development", expected: "development" },
        { input: "local", expected: "local" },
        { input: "test", expected: "test" },
        { input: "staging", expected: "staging" },
      ];

      profiles.forEach(({ input, expected }) => {
        const profile = ConfigProfileName.create(input);
        assertEquals(profile.value, expected);
        assertEquals(profile.value !== null, true);
      });
    });

    it("should handle feature branch profile names", () => {
      _logger.debug("Testing feature branch profile names");

      const profiles = [
        { input: "feature-123", expected: "feature-123" },
        { input: "feature_auth", expected: "feature_auth" },
        { input: "hotfix-456", expected: "hotfix-456" },
        { input: "release_v2", expected: "release_v2" },
      ];

      profiles.forEach(({ input, expected }) => {
        const profile = ConfigProfileName.create(input);
        assertEquals(profile.value, expected);
        assertEquals(profile.value !== null, true);
      });
    });
  });
});
