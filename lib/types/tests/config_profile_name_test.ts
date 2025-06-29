/**
 * @fileoverview Unit tests for ConfigProfileName
 * 
 * Tests the Totality principle implementation of ConfigProfileName,
 * ensuring proper validation, creation, and behavior according to
 * business rules for configuration profile names.
 */

import { assertEquals } from "jsr:@std/assert@^1.0.8";
import { ConfigProfileName } from "../config_profile_name.ts";

Deno.test("ConfigProfileName - Valid profile name creation", () => {
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
    assertEquals(profile.getValue(), name);
    assertEquals(profile.exists(), true);
  }
});

Deno.test("ConfigProfileName - Invalid profile name rejection", () => {
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
    assertEquals(profile.getValue(), "");
    assertEquals(profile.exists(), false);
  }
});

Deno.test("ConfigProfileName - Non-string input handling", () => {
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
    assertEquals(profile.getValue(), "");
    assertEquals(profile.exists(), false);
  }
});

Deno.test("ConfigProfileName - Empty profile creation", () => {
  const emptyProfile = ConfigProfileName.empty();
  
  assertEquals(emptyProfile.getValue(), "");
  assertEquals(emptyProfile.exists(), false);
});

Deno.test("ConfigProfileName - Business rules validation", () => {
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
    assertEquals(profile.exists(), true, `Common profile '${profileName}' should be valid`);
    assertEquals(profile.getValue(), profileName);
  }
});

Deno.test("ConfigProfileName - Integration with BreakdownConfig pattern", () => {
  // Test patterns that would be used with BreakdownConfig
  const profile = ConfigProfileName.create("staging");
  
  // Simulate BreakdownConfig usage
  const configPrefix = profile.exists() ? profile.getValue() : undefined;
  assertEquals(configPrefix, "staging");
});

Deno.test("ConfigProfileName - Edge cases for pattern matching", () => {
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
    const isValid = profile.exists();
    assertEquals(
      isValid, 
      testCase.valid, 
      `Profile name '${testCase.name}' should be ${testCase.valid ? 'valid' : 'invalid'}`
    );
  }
});
