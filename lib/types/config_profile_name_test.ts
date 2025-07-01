/**
 * @fileoverview Unit tests for ConfigProfileName
 * 
 * Tests the Totality principle implementation of ConfigProfileName,
 * ensuring proper validation, creation, and behavior according to
 * business rules for configuration profile names.
 */

import { assertEquals } from "@std/assert";
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
        "a",  // minimum length
        "a".repeat(50), // maximum length
      ];

      for (const name of validNames) {
        const profile = ConfigProfileName.create(name);
        assertEquals(profile.value, name);
        assertEquals(profile.value !== null, true);
      }
    });
  });

  describe("Invalid profile name rejection", () => {
    it("should reject invalid profile names", () => {
      const invalidNames = [
    "",           // empty string
    "Production", // uppercase
    "STAGING",    // all uppercase
    "test@env",   // special character @
    "env#1",      // special character #
    "test env",   // space
    "test.env",   // dot
    "test/env",   // slash
    "test\\env",  // backslash
    "test(env)",  // parentheses
    "test[env]",  // brackets
    "test{env}",  // braces
    "test+env",   // plus
    "test=env",   // equals
    "test&env",   // ampersand
    "test|env",   // pipe
    "test;env",   // semicolon
    "test:env",   // colon
    "test,env",   // comma
    "test<env>",  // angle brackets
    "test%env",   // percent
    "test!env",   // exclamation
    "test?env",   // question mark
    "test'env",   // single quote
    "test\"env",  // double quote
    "test`env",   // backtick
    "test~env",   // tilde
    "a".repeat(51), // too long
  ];

      for (const name of invalidNames) {
        const profile = ConfigProfileName.create(name);
        assertEquals(profile.value, null);
        assertEquals(profile.value !== null, false);
      }
    });
  });

  describe("Non-string input handling", () => {
    it("should handle non-string inputs gracefully", () => {
  // TypeScript would prevent these, but test runtime behavior
  const invalidInputs = [
    null as unknown as string,      // null
    undefined as unknown as string, // undefined
    123 as unknown as string,       // number
    {} as unknown as string,        // object
    [] as unknown as string,        // array
  ];

      for (const input of invalidInputs) {
        const profile = ConfigProfileName.create(input);
        assertEquals(profile.value, null, `Invalid input '${input}' should have null value`);
        assertEquals(profile.value !== null, false);
      }
    });
  });

  describe("Null handling for invalid inputs", () => {
    it("should return null for invalid inputs", () => {
      // Test that empty string returns null value
      const empty = ConfigProfileName.create("");
      assertEquals(empty.value, null);
      assertEquals(empty.value !== null, false);
      
      // Test that whitespace-only string returns null value
      const whitespace = ConfigProfileName.create("   ");
      assertEquals(whitespace.value, null);
      assertEquals(whitespace.value !== null, false);
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
        assertEquals(profile.value !== null, true, `Common profile '${profileName}' should be valid`);
        assertEquals(profile.value, profileName);
      }
    });
  });

  describe("Integration with BreakdownConfig pattern", () => {
    it("should integrate with BreakdownConfig usage pattern", () => {
      // Test patterns that would be used with BreakdownConfig
      const profile = ConfigProfileName.create("staging");
      
      // Simulate BreakdownConfig usage
      const configPrefix = profile.value || undefined;
      assertEquals(configPrefix, "staging");
    });
  });

  describe("Edge cases for pattern matching", () => {
    it("should handle edge cases correctly", () => {
  // Test edge cases around the regex pattern
  const edgeCases = [
    { name: "123", valid: true },       // numbers only
    { name: "abc", valid: true },       // letters only
    { name: "a-b", valid: true },       // with hyphen
    { name: "a_b", valid: true },       // with underscore
    { name: "a-b_c", valid: true },     // mixed separators
    { name: "-abc", valid: true },      // starting with hyphen
    { name: "_abc", valid: true },      // starting with underscore
    { name: "abc-", valid: true },      // ending with hyphen
    { name: "abc_", valid: true },      // ending with underscore
    { name: "a--b", valid: true },      // double hyphen
    { name: "a__b", valid: true },      // double underscore
    { name: "0", valid: true },         // single digit
    { name: "9", valid: true },         // single digit
  ];

      for (const testCase of edgeCases) {
        const profile = ConfigProfileName.create(testCase.name);
        const isValid = profile.value !== null;
        assertEquals(
          isValid, 
          testCase.valid, 
          `Profile name '${testCase.name}' should be ${testCase.valid ? 'valid' : 'invalid'}`
        );
      }
    });
  });
});
