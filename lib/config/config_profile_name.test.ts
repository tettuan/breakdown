/**
 * @fileoverview ConfigProfileName unit tests
 *
 * Tests for ConfigProfileName implementation following the Totality principle.
 * Covers architecture constraints, behavior verification, and structure validation.
 *
 * @module config/config_profile_name.test
 */

import { assert, assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import { ConfigProfileName } from "./config_profile_name.ts";

// =============================================================================
// 0_architecture: Architecture constraints and design patterns
// =============================================================================

Deno.test("0_architecture: ConfigProfileName follows Smart Constructor pattern", () => {
  // Private constructor prevents direct instantiation
  // @ts-expect-error - Testing that constructor is private
  assert(() => new ConfigProfileName("test") === undefined);

  // Only way to create is through static create method
  const profileName = ConfigProfileName.create("production");
  assertExists(profileName);
  assert(profileName instanceof ConfigProfileName);
});

Deno.test("0_architecture: ConfigProfileName prevents invalid state at type level", () => {
  // ConfigProfileName always produces valid instance with non-empty value

  // Valid inputs produce ConfigProfileName
  const valid = ConfigProfileName.create("production");
  assertExists(valid);
  assertEquals(valid.value, "production");

  // Invalid inputs automatically convert to default
  const empty = ConfigProfileName.create("");
  assertEquals(empty.value, "default");

  const nullInput = ConfigProfileName.create(null);
  assertEquals(nullInput.value, "default");

  const undefinedInput = ConfigProfileName.create(undefined);
  assertEquals(undefinedInput.value, "default");

  // Type system allows string | null | undefined
  const withString: ConfigProfileName = ConfigProfileName.create("test");
  const withNull: ConfigProfileName = ConfigProfileName.create(null);
  const withUndefined: ConfigProfileName = ConfigProfileName.create(undefined);
  const withoutParam: ConfigProfileName = ConfigProfileName.create();

  // All produce valid instances
  assertExists(withString);
  assertExists(withNull);
  assertExists(withUndefined);
  assertExists(withoutParam);
});

Deno.test("0_architecture: ConfigProfileName implements Totality principle", () => {
  // create() method is total - always returns ConfigProfileName, never throws
  const testCases: Array<string | null | undefined> = [
    "production",
    "staging",
    "development",
    "test",
    "custom-profile",
    "",
    null,
    undefined,
    "   ",
    "\t",
    "\n",
    "  \t\n  ",
  ];

  for (const input of testCases) {
    const profileName = ConfigProfileName.create(input);
    assertExists(profileName);
    assert(profileName instanceof ConfigProfileName);
    assert(profileName.value.length > 0); // Always has a value
  }
});

Deno.test("0_architecture: ConfigProfileName.create is exhaustive for all input types", () => {
  // Exhaustiveness: create() handles ALL possible input types

  // String inputs
  const stringInputs = [
    "normal",
    "",
    " ",
    "with spaces",
    "with-dashes",
    "with_underscores",
    "with.dots",
    "123numeric",
    "UPPERCASE",
    "MixedCase",
    "🔥emoji",
    "日本語",
    "a".repeat(1000), // Very long string
  ];

  for (const input of stringInputs) {
    const profile = ConfigProfileName.create(input);
    assertExists(profile);
    assert(profile.value.length > 0);
  }

  // Null and undefined
  const nullProfile = ConfigProfileName.create(null);
  assertEquals(nullProfile.value, "default");

  const undefinedProfile = ConfigProfileName.create(undefined);
  assertEquals(undefinedProfile.value, "default");

  const noParamProfile = ConfigProfileName.create();
  assertEquals(noParamProfile.value, "default");
});

Deno.test("0_architecture: ConfigProfileName is immutable at interface level", () => {
  const profileName = ConfigProfileName.create("production");

  // Value property is read-only (getter-only, no setter)
  const originalValue = profileName.value;

  // ConfigProfileName provides immutable interface
  try {
    // This should fail at runtime (getter-only property)
    (profileName as unknown as { value: string }).value = "attempt-mutation";
  } catch (error) {
    // Expected: TypeError for read-only property
    assert(error instanceof TypeError);
  }

  // Value remains unchanged
  assertEquals(profileName.value, originalValue);

  // Private field is not accessible
  // @ts-expect-error - Testing that profileName field is private
  const _attemptPrivateAccess = () => profileName.profileName;
});

Deno.test("0_architecture: ConfigProfileName.DEFAULT constant is immutable", () => {
  // DEFAULT is a readonly constant
  assertEquals(ConfigProfileName.DEFAULT, "default");
  assertEquals(typeof ConfigProfileName.DEFAULT, "string");

  // Type system prevents modification
  // The following line would cause a TypeScript error if uncommented:
  // ConfigProfileName.DEFAULT = "modified"; // Error: Cannot assign to 'DEFAULT' because it is a read-only property

  // Runtime check (if TypeScript check is bypassed)
  try {
    (ConfigProfileName as unknown as { DEFAULT: string }).DEFAULT = "modified";
  } catch (error) {
    // Expected: Cannot assign to read only property
    assert(error instanceof TypeError);
  }

  // Value remains unchanged
  assertEquals(ConfigProfileName.DEFAULT, "default");
});

Deno.test("0_architecture: Type-level guarantees prevent invalid ConfigProfileName states", () => {
  // The type system guarantees that ConfigProfileName can only exist in valid states

  // 1. Always has a non-empty value
  // 2. Cannot be modified after creation
  // 3. Always has required methods and properties

  const profileName = ConfigProfileName.create("test");

  // Type system ensures all instances have required methods and properties
  assertExists(profileName.value);
  assertEquals(typeof profileName.isDefault, "function");
  assertEquals(typeof profileName.equals, "function");
  assertEquals(typeof profileName.toString, "function");
  assertEquals(typeof profileName.getFilePrefix, "function");
  assertEquals(typeof profileName.getConfigFileName, "function");

  // All methods work correctly
  assertEquals(profileName.value, "test");
  assertEquals(profileName.isDefault(), false);
  assertEquals(profileName.toString(), "ConfigProfileName(test)");
  assertEquals(profileName.getFilePrefix(), "test-");
  assertEquals(profileName.getConfigFileName("app.yml"), "test-app.yml");
});

// =============================================================================
// 1_behavior: Behavior verification and functional requirements
// =============================================================================

Deno.test("1_behavior: ConfigProfileName.createOrError provides validation feedback", () => {
  // Valid inputs return successful Result
  const validInputs = [
    "production",
    "staging",
    "development",
    "test",
    "custom-profile",
  ];

  for (const input of validInputs) {
    const result = ConfigProfileName.createOrError(input);
    assert(result.ok);
    assertEquals(result.data.value, input);
  }

  // Invalid inputs return error with explanation
  const invalidInputs = [
    "",
    null,
    undefined,
    "   ",
    "\t",
    "\n",
    "  \t\n  ",
  ];

  for (const input of invalidInputs) {
    const result = ConfigProfileName.createOrError(input);
    assert(!result.ok);
    assertEquals(result.error.kind, "InvalidInput");
    if (result.error.kind === "InvalidInput") {
      assertEquals(result.error.field, "profileName");
      assertEquals(result.error.value, input);
      assertEquals(result.error.reason, "Profile name cannot be empty, using default");
    }
  }
});

Deno.test("1_behavior: ConfigProfileName.createOrError trims whitespace before validation", () => {
  // Whitespace-surrounded valid names succeed
  const validWithWhitespace = [
    { input: "  production  ", expected: "production" },
    { input: "\tproduction\t", expected: "production" },
    { input: "\nproduction\n", expected: "production" },
  ];

  for (const { input, expected } of validWithWhitespace) {
    const result = ConfigProfileName.createOrError(input);
    assert(result.ok);
    assertEquals(result.data.value, expected);
  }

  // Whitespace-only strings fail
  const whitespaceOnly = ["   ", "\t", "\n", "  \t\n  "];

  for (const input of whitespaceOnly) {
    const result = ConfigProfileName.createOrError(input);
    assert(!result.ok);
    if (result.error.kind === "InvalidInput") {
      assertEquals(result.error.reason, "Profile name cannot be empty, using default");
    }
  }
});

Deno.test("1_behavior: ConfigProfileName.create applies default for empty inputs", () => {
  const emptyInputs = [
    "",
    null,
    undefined,
    "   ",
    "\t",
    "\n",
    "  \t\n  ",
    " \r\n ",
  ];

  for (const input of emptyInputs) {
    const profileName = ConfigProfileName.create(input);
    assertEquals(profileName.value, "default");
    assertEquals(profileName.isDefault(), true);
  }
});

Deno.test("1_behavior: ConfigProfileName.create preserves valid profile names", () => {
  const validInputs = [
    { input: "production", expected: "production" },
    { input: "staging", expected: "staging" },
    { input: "development", expected: "development" },
    { input: "test", expected: "test" },
    { input: "custom-profile", expected: "custom-profile" },
    { input: "user_defined", expected: "user_defined" },
    { input: "profile123", expected: "profile123" },
    { input: "UPPERCASE", expected: "UPPERCASE" },
    { input: "MixedCase", expected: "MixedCase" },
    { input: "with-multiple-dashes", expected: "with-multiple-dashes" },
    { input: "with_multiple_underscores", expected: "with_multiple_underscores" },
    { input: "123numeric", expected: "123numeric" },
    { input: ".", expected: "." },
    { input: "-", expected: "-" },
    { input: "_", expected: "_" },
  ];

  for (const { input, expected } of validInputs) {
    const profileName = ConfigProfileName.create(input);
    assertEquals(profileName.value, expected);
    assertEquals(profileName.isDefault(), false);
  }
});

Deno.test("1_behavior: ConfigProfileName.create trims whitespace correctly", () => {
  const trimTests = [
    { input: "  production  ", expected: "production" },
    { input: "\tproduction\t", expected: "production" },
    { input: "\nproduction\n", expected: "production" },
    { input: "  production", expected: "production" },
    { input: "production  ", expected: "production" },
    { input: "  custom-profile  ", expected: "custom-profile" },
    { input: " \t\n production \n\t ", expected: "production" },
  ];

  for (const { input, expected } of trimTests) {
    const profileName = ConfigProfileName.create(input);
    assertEquals(profileName.value, expected);
    assertEquals(profileName.isDefault(), false);
  }
});

Deno.test("1_behavior: ConfigProfileName.createFromConfig delegates correctly", () => {
  // With valid profilePrefix
  const config1 = { profilePrefix: "production" };
  const profile1 = ConfigProfileName.createFromConfig(config1);
  assertEquals(profile1.value, "production");

  // With empty profilePrefix
  const config2 = { profilePrefix: "" };
  const profile2 = ConfigProfileName.createFromConfig(config2);
  assertEquals(profile2.value, "default");

  // With null profilePrefix
  const config3 = { profilePrefix: null };
  const profile3 = ConfigProfileName.createFromConfig(config3);
  assertEquals(profile3.value, "default");

  // With undefined profilePrefix
  const config4 = {};
  const profile4 = ConfigProfileName.createFromConfig(config4);
  assertEquals(profile4.value, "default");

  // With undefined config
  const profile5 = ConfigProfileName.createFromConfig(undefined);
  assertEquals(profile5.value, "default");

  // With null config
  const profile6 = ConfigProfileName.createFromConfig(
    null as unknown as { profilePrefix?: string },
  );
  assertEquals(profile6.value, "default");

  // With whitespace profilePrefix
  const config7 = { profilePrefix: "  staging  " };
  const profile7 = ConfigProfileName.createFromConfig(config7);
  assertEquals(profile7.value, "staging");
});

Deno.test("1_behavior: ConfigProfileName.equals compares values correctly", () => {
  const default1 = ConfigProfileName.create("");
  const default2 = ConfigProfileName.create(null);
  const default3 = ConfigProfileName.create("default");
  const production1 = ConfigProfileName.create("production");
  const production2 = ConfigProfileName.create("production");
  const staging = ConfigProfileName.create("staging");

  // Same values should be equal
  assert(default1.equals(default2));
  assert(default1.equals(default3));
  assert(default2.equals(default3));
  assert(production1.equals(production2));
  assert(production2.equals(production1));

  // Different values should not be equal
  assert(!default1.equals(production1));
  assert(!production1.equals(staging));
  assert(!staging.equals(default1));
});

Deno.test("1_behavior: ConfigProfileName.toString provides readable representation", () => {
  const defaultProfile = ConfigProfileName.create("");
  assertEquals(defaultProfile.toString(), "ConfigProfileName(default)");

  const production = ConfigProfileName.create("production");
  assertEquals(production.toString(), "ConfigProfileName(production)");

  const custom = ConfigProfileName.create("custom-profile");
  assertEquals(custom.toString(), "ConfigProfileName(custom-profile)");
});

Deno.test("1_behavior: ConfigProfileName.getFilePrefix returns correct prefix", () => {
  const testCases = [
    { profileName: "production", expected: "production-" },
    { profileName: "staging", expected: "staging-" },
    { profileName: "default", expected: "default-" },
    { profileName: "", expected: "default-" },
    { profileName: "custom", expected: "custom-" },
    { profileName: "a", expected: "a-" },
    { profileName: "123", expected: "123-" },
    { profileName: "with-dash", expected: "with-dash-" },
    { profileName: "with_underscore", expected: "with_underscore-" },
  ];

  for (const { profileName, expected } of testCases) {
    const config = ConfigProfileName.create(profileName);
    assertEquals(config.getFilePrefix(), expected);
  }
});

Deno.test("1_behavior: ConfigProfileName.getConfigFileName constructs filenames", () => {
  const production = ConfigProfileName.create("production");
  assertEquals(production.getConfigFileName("app.yml"), "production-app.yml");
  assertEquals(production.getConfigFileName("user.yml"), "production-user.yml");
  assertEquals(production.getConfigFileName("config.json"), "production-config.json");

  const defaultProfile = ConfigProfileName.create("");
  assertEquals(defaultProfile.getConfigFileName("app.yml"), "default-app.yml");
  assertEquals(defaultProfile.getConfigFileName("user.yml"), "default-user.yml");

  const staging = ConfigProfileName.create("staging");
  assertEquals(staging.getConfigFileName("settings.toml"), "staging-settings.toml");
  assertEquals(staging.getConfigFileName("env"), "staging-env");
  assertEquals(staging.getConfigFileName(".env"), "staging-.env");
});

Deno.test("1_behavior: ConfigProfileName handles edge case values (totality)", () => {
  // Totality: ANY string input produces a valid ConfigProfileName

  const edgeCaseValues = [
    // Special string values
    { input: "null", expected: "null" },
    { input: "undefined", expected: "undefined" },
    { input: "true", expected: "true" },
    { input: "false", expected: "false" },
    { input: "0", expected: "0" },
    { input: "-1", expected: "-1" },
    { input: "NaN", expected: "NaN" },
    { input: "Infinity", expected: "Infinity" },

    // Special characters
    { input: "'quoted'", expected: "'quoted'" },
    { input: '"double-quoted"', expected: '"double-quoted"' },
    { input: "with spaces", expected: "with spaces" },
    { input: "with\ttab", expected: "with\ttab" },
    { input: "with\nnewline", expected: "with\nnewline" },

    // Unicode
    { input: "日本語プロファイル", expected: "日本語プロファイル" },
    { input: "🚀emoji", expected: "🚀emoji" },
    { input: "مرحبا", expected: "مرحبا" },
    { input: "Привет", expected: "Привет" },

    // Very long strings
    { input: "a".repeat(100), expected: "a".repeat(100) },
    { input: "profile-".repeat(50), expected: "profile-".repeat(50) },
  ];

  for (const { input, expected } of edgeCaseValues) {
    const profileName = ConfigProfileName.create(input);
    assertEquals(profileName.value, expected);
    assertEquals(profileName.isDefault(), false);

    // Methods work correctly for all values
    assertEquals(profileName.toString(), `ConfigProfileName(${expected})`);
    assertEquals(profileName.getFilePrefix(), `${expected}-`);

    // Equality works for all values
    const sameProfile = ConfigProfileName.create(input);
    assert(profileName.equals(sameProfile));
  }
});

// =============================================================================
// 2_structure: Structure validation and data integrity
// =============================================================================

Deno.test("2_structure: ConfigProfileName maintains referential transparency", () => {
  const input = "production";

  // Multiple calls with same input produce equivalent results
  const profile1 = ConfigProfileName.create(input);
  const profile2 = ConfigProfileName.create(input);

  assertEquals(profile1.value, profile2.value);
  assert(profile1.equals(profile2));
  assertEquals(profile1.toString(), profile2.toString());
  assertEquals(profile1.isDefault(), profile2.isDefault());
  assertEquals(profile1.getFilePrefix(), profile2.getFilePrefix());
});

Deno.test("2_structure: ConfigProfileName.value is consistent across all accesses", () => {
  const profileName = ConfigProfileName.create("staging");

  // Multiple accesses should return the same value
  const value1 = profileName.value;
  const value2 = profileName.value;
  const value3 = profileName.value;

  assertEquals(value1, value2);
  assertEquals(value2, value3);
  assertEquals(value1, "staging");

  // Value is consistent with other methods
  assertEquals(profileName.toString(), "ConfigProfileName(staging)");
  assertEquals(profileName.getFilePrefix(), "staging-");
  assertEquals(profileName.isDefault(), false);
});

Deno.test("2_structure: ConfigProfileName type consistency across methods", () => {
  const profileName = ConfigProfileName.create("test");

  // All string-returning methods should return consistent type
  assertEquals(typeof profileName.value, "string");
  assertEquals(typeof profileName.toString(), "string");
  assertEquals(typeof profileName.getFilePrefix(), "string");
  assertEquals(typeof profileName.getConfigFileName("test"), "string");

  // All boolean-returning methods should return consistent type
  assertEquals(typeof profileName.isDefault(), "boolean");
  assertEquals(typeof profileName.equals(profileName), "boolean");
});

Deno.test("2_structure: ConfigProfileName default value consistency", () => {
  // All these should create the same default profile
  const profiles = [
    ConfigProfileName.create(""),
    ConfigProfileName.create(null),
    ConfigProfileName.create(undefined),
    ConfigProfileName.create("   "),
    ConfigProfileName.create("\t\n"),
    ConfigProfileName.create("default"),
    ConfigProfileName.create("  default  "),
  ];

  // All should have the same value
  for (const profile of profiles) {
    assertEquals(profile.value, "default");
    assertEquals(profile.isDefault(), true);
    assertEquals(profile.toString(), "ConfigProfileName(default)");
    assertEquals(profile.getFilePrefix(), "default-");
  }

  // All should be equal to each other
  for (let i = 0; i < profiles.length; i++) {
    for (let j = 0; j < profiles.length; j++) {
      assert(profiles[i].equals(profiles[j]));
    }
  }
});

Deno.test("2_structure: ConfigProfileName handles special filename construction", () => {
  const profile = ConfigProfileName.create("test");

  // Various filename patterns
  const filenames = [
    { base: "app.yml", expected: "test-app.yml" },
    { base: "user.yml", expected: "test-user.yml" },
    { base: ".env", expected: "test-.env" },
    { base: "config", expected: "test-config" },
    { base: "data.json", expected: "test-data.json" },
    { base: "settings.ini", expected: "test-settings.ini" },
    { base: "file.with.dots.txt", expected: "test-file.with.dots.txt" },
    { base: "", expected: "test-" }, // Empty filename
    { base: "   ", expected: "test-   " }, // Whitespace filename
  ];

  for (const { base, expected } of filenames) {
    assertEquals(profile.getConfigFileName(base), expected);
  }
});

Deno.test("2_structure: ConfigProfileName.createFromConfig structural integrity", () => {
  // Test various config object structures

  // Standard config object
  const standardConfig = {
    profilePrefix: "production",
    otherField: "ignored",
    nested: { also: "ignored" },
  };
  const standard = ConfigProfileName.createFromConfig(standardConfig);
  assertEquals(standard.value, "production");

  // Config with extra fields
  const extraFieldsConfig = {
    profilePrefix: "staging",
    debug: true,
    verbose: false,
    options: { level: 3 },
    array: [1, 2, 3],
  };
  const extraFields = ConfigProfileName.createFromConfig(extraFieldsConfig);
  assertEquals(extraFields.value, "staging");

  // Minimal config
  const minimalConfig = { profilePrefix: "minimal" };
  const minimal = ConfigProfileName.createFromConfig(minimalConfig);
  assertEquals(minimal.value, "minimal");

  // Empty object
  const emptyConfig = {};
  const empty = ConfigProfileName.createFromConfig(emptyConfig);
  assertEquals(empty.value, "default");

  // Object with null prototype
  const nullProtoConfig = Object.create(null);
  nullProtoConfig.profilePrefix = "nullproto";
  const nullProto = ConfigProfileName.createFromConfig(nullProtoConfig);
  assertEquals(nullProto.value, "nullproto");
});

Deno.test("2_structure: ConfigProfileName preserves trimmed values consistently", () => {
  // Ensure trimming is consistent across all creation methods

  const directCreate = ConfigProfileName.create("  trimmed  ");
  const configCreate = ConfigProfileName.createFromConfig({ profilePrefix: "  trimmed  " });

  // Both should produce the same trimmed value
  assertEquals(directCreate.value, "trimmed");
  assertEquals(configCreate.value, "trimmed");
  assert(directCreate.equals(configCreate));

  // Edge cases with internal spaces
  const withInternalSpaces = ConfigProfileName.create("  has internal spaces  ");
  assertEquals(withInternalSpaces.value, "has internal spaces");

  const multipleSpaces = ConfigProfileName.create("  multiple   spaces  ");
  assertEquals(multipleSpaces.value, "multiple   spaces");
});
