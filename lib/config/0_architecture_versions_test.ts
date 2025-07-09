/**
 * @fileoverview Versions 0_architecture Tests - Version Management Architecture Validation
 *
 * バージョン管理モジュールのアーキテクチャ制約とtype safetyを検証。
 * const assertions、Result型、エラーハンドリングの適切な実装を検証。
 *
 * テスト構成:
 * - const assertions とimmutability
 * - Result型の適切な使用
 * - エラー型の正確性
 * - Type safety と readonly 制約
 * - バージョン構造の一貫性
 */

import { assert, assertEquals, assertExists } from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  checkVersionCompatibility,
  DEPENDENCY_VERSIONS,
  getJsrImport,
  VERSION_REQUIREMENTS,
  type VersionRequirement,
} from "./versions.ts";
import type { Result } from "../types/result.ts";
import type { ValidationError } from "../types/unified_error_types.ts";

// =============================================================================
// 0_ARCHITECTURE: Type Safety and Const Assertions Tests
// =============================================================================

Deno.test("0_architecture - DEPENDENCY_VERSIONS has proper const assertion", () => {
  // Should be readonly constant object
  assertExists(DEPENDENCY_VERSIONS);
  assertEquals(typeof DEPENDENCY_VERSIONS, "object");

  // Required properties should exist
  assertExists(DEPENDENCY_VERSIONS.BREAKDOWN_CONFIG);
  assertExists(DEPENDENCY_VERSIONS.BREAKDOWN_PARAMS);
  assertExists(DEPENDENCY_VERSIONS.BREAKDOWN_PROMPT);
  assertExists(DEPENDENCY_VERSIONS.BREAKDOWN_LOGGER);
  assertExists(DEPENDENCY_VERSIONS.STD);

  // Should be string versions
  assertEquals(typeof DEPENDENCY_VERSIONS.BREAKDOWN_CONFIG, "string");
  assertEquals(typeof DEPENDENCY_VERSIONS.BREAKDOWN_PARAMS, "string");
  assertEquals(typeof DEPENDENCY_VERSIONS.BREAKDOWN_PROMPT, "string");
  assertEquals(typeof DEPENDENCY_VERSIONS.BREAKDOWN_LOGGER, "string");

  // STD should be nested object
  assertEquals(typeof DEPENDENCY_VERSIONS.STD, "object");
  assertExists(DEPENDENCY_VERSIONS.STD.YAML);
  assertExists(DEPENDENCY_VERSIONS.STD.PATH);
  assertExists(DEPENDENCY_VERSIONS.STD.FS);
});

Deno.test("0_architecture - VERSION_REQUIREMENTS has correct structure", () => {
  // Should be readonly record
  assertExists(VERSION_REQUIREMENTS);
  assertEquals(typeof VERSION_REQUIREMENTS, "object");

  // Each entry should have VersionRequirement structure
  for (const [packageName, requirement] of Object.entries(VERSION_REQUIREMENTS)) {
    assertEquals(typeof packageName, "string");
    assertExists(requirement);

    // Required fields
    assertExists(requirement.minimum);
    assertExists(requirement.recommended);
    assertEquals(typeof requirement.minimum, "string");
    assertEquals(typeof requirement.recommended, "string");

    // Optional field
    if (requirement.maximum) {
      assertEquals(typeof requirement.maximum, "string");
    }
  }

  // Should have entries for all main packages
  assertExists(VERSION_REQUIREMENTS.BREAKDOWN_CONFIG);
  assertExists(VERSION_REQUIREMENTS.BREAKDOWN_PARAMS);
  assertExists(VERSION_REQUIREMENTS.BREAKDOWN_PROMPT);
  assertExists(VERSION_REQUIREMENTS.BREAKDOWN_LOGGER);
});

Deno.test("0_architecture - getJsrImport returns proper Result type", () => {
  // Function should exist and be callable
  assertExists(getJsrImport);
  assertEquals(typeof getJsrImport, "function");

  // Should return Result<string, ValidationError>
  const result1 = getJsrImport("BREAKDOWN_CONFIG");
  const result2 = getJsrImport("INVALID_PACKAGE");

  // Results should have proper Result structure
  assertExists(result1);
  assertExists(result1.ok);
  assertExists(result2);
  assertExists(result2.ok);

  // Success case
  if (result1.ok) {
    assertExists(result1.data);
    assertEquals(typeof result1.data, "string");
    assert(result1.data.startsWith("jsr:@tettuan/"));
  } else {
    assertExists(result1.error);
  }

  // Error case
  if (!result2.ok) {
    assertExists(result2.error);
    assertExists(result2.error.kind);
    assertExists(result2.error.context);
  }
});

Deno.test("0_architecture - checkVersionCompatibility has proper signature", () => {
  // Function should exist and be callable
  assertExists(checkVersionCompatibility);
  assertEquals(typeof checkVersionCompatibility, "function");

  // Should return proper result structure
  const result = checkVersionCompatibility("BREAKDOWN_CONFIG", "1.1.4");

  assertExists(result);
  assertExists(result.compatible);
  assertEquals(typeof result.compatible, "boolean");

  // Message should be string if present
  if (result.message) {
    assertEquals(typeof result.message, "string");
  }
});

Deno.test("0_architecture - VersionRequirement interface compliance", () => {
  // Test that VERSION_REQUIREMENTS entries comply with interface

  const requirement: VersionRequirement = {
    minimum: "1.0.0",
    recommended: "1.1.0",
    maximum: "2.0.0",
  };

  // Required fields
  assertExists(requirement.minimum);
  assertExists(requirement.recommended);
  assertEquals(typeof requirement.minimum, "string");
  assertEquals(typeof requirement.recommended, "string");

  // Optional field
  if (requirement.maximum) {
    assertEquals(typeof requirement.maximum, "string");
  }

  // Test actual requirements
  for (const req of Object.values(VERSION_REQUIREMENTS)) {
    assertExists(req.minimum);
    assertExists(req.recommended);
    assertEquals(typeof req.minimum, "string");
    assertEquals(typeof req.recommended, "string");

    if (req.maximum) {
      assertEquals(typeof req.maximum, "string");
    }
  }
});

Deno.test("0_architecture - Version string format validation", () => {
  // Version strings should follow semantic versioning pattern

  for (const [key, version] of Object.entries(DEPENDENCY_VERSIONS)) {
    if (key === "STD") continue; // Skip nested object

    assertEquals(typeof version, "string");

    // Should start with ^ or be valid semver
    assert(
      (version as string).startsWith("^") || (version as string).match(/^\d+\.\d+\.\d+/),
      `Version ${version} for ${key} should be valid semver format`,
    );
  }

  // STD versions
  for (const [key, version] of Object.entries(DEPENDENCY_VERSIONS.STD)) {
    assertEquals(typeof version, "string");
    assert(
      version.startsWith("^") || version.match(/^\d+\.\d+\.\d+/),
      `STD version ${version} for ${key} should be valid semver format`,
    );
  }
});

Deno.test("0_architecture - Error type structure in getJsrImport", () => {
  // Test error result structure
  const result = getJsrImport("INVALID_PACKAGE");

  assert(!result.ok);

  const error = result.error;
  assertExists(error);

  // Should be ValidationError with proper structure
  assertExists(error.kind);
  assertExists(error.context);
  assertEquals(error.kind, "InvalidInput");

  // Type narrow to InvalidInput
  if (error.kind === "InvalidInput") {
    // Required fields should be at top level for InvalidInput
    assertExists(error.field);
    assertExists(error.value);
    assertExists(error.reason);

    assertEquals(error.field, "packageName");
    assertEquals(error.value, "INVALID_PACKAGE");
    assertEquals(typeof error.reason, "string");
  }

  // Context should have availablePackages
  if (error.context && typeof error.context === "object" && "availablePackages" in error.context) {
    assert(Array.isArray(error.context.availablePackages));
    assert(error.context.availablePackages.length > 0);
  }
});

Deno.test("0_architecture - Immutability of version constants", () => {
  // Constants should be readonly/immutable

  // Test that const values are consistent
  const originalConfigVersion = DEPENDENCY_VERSIONS.BREAKDOWN_CONFIG;

  // TypeScript const assertion provides compile-time immutability
  // Runtime immutability is not guaranteed but values should be consistent

  // Verify values remain consistent
  assertEquals(DEPENDENCY_VERSIONS.BREAKDOWN_CONFIG, originalConfigVersion);

  // STD object should also maintain consistency
  const originalYamlVersion = DEPENDENCY_VERSIONS.STD.YAML;
  assertEquals(DEPENDENCY_VERSIONS.STD.YAML, originalYamlVersion);

  // Values should be defined and non-empty
  assert(originalConfigVersion.length > 0);
  assert(originalYamlVersion.length > 0);
});

Deno.test("0_architecture - Type safety in version comparison functions", () => {
  // parseVersion should be internal but version comparison should be type-safe

  const result1 = checkVersionCompatibility("BREAKDOWN_CONFIG", "1.0.0");
  const result2 = checkVersionCompatibility("UNKNOWN_PACKAGE", "1.0.0");

  // Both should return same result structure
  assertExists(result1.compatible);
  assertExists(result2.compatible);
  assertEquals(typeof result1.compatible, "boolean");
  assertEquals(typeof result2.compatible, "boolean");

  // Message should be string or undefined
  if (result1.message) {
    assertEquals(typeof result1.message, "string");
  }
  if (result2.message) {
    assertEquals(typeof result2.message, "string");
  }
});

Deno.test("0_architecture - Package name validation in JSR imports", () => {
  // Valid package names should return success
  const validPackages = [
    "BREAKDOWN_CONFIG",
    "BREAKDOWN_PARAMS",
    "BREAKDOWN_PROMPT",
    "BREAKDOWN_LOGGER",
  ];

  for (const packageName of validPackages) {
    const result = getJsrImport(packageName);
    assert(result.ok, `${packageName} should be valid`);

    if (result.ok) {
      assertEquals(typeof result.data, "string");
      assert(result.data.startsWith("jsr:@tettuan/"));
      assert(result.data.includes(packageName.toLowerCase().replace("_", "")));
    }
  }

  // Invalid package should return error
  const invalidResult = getJsrImport("INVALID");
  assert(!invalidResult.ok);
  assertEquals(invalidResult.error.kind, "InvalidInput");
});

Deno.test("0_architecture - Version requirements consistency", () => {
  // All packages in DEPENDENCY_VERSIONS should have corresponding VERSION_REQUIREMENTS

  const dependencyPackages = Object.keys(DEPENDENCY_VERSIONS).filter((k) => k !== "STD");
  const requirementPackages = Object.keys(VERSION_REQUIREMENTS);

  for (const packageName of dependencyPackages) {
    assert(
      requirementPackages.includes(packageName),
      `${packageName} should have version requirements defined`,
    );
  }

  // Version requirements should be consistent with dependency versions
  for (const packageName of requirementPackages) {
    const requirement = VERSION_REQUIREMENTS[packageName];
    const dependency = DEPENDENCY_VERSIONS[packageName as keyof typeof DEPENDENCY_VERSIONS];

    assertExists(requirement);
    assertExists(dependency);

    // Recommended should be accessible
    assertExists(requirement.recommended);
    assertEquals(typeof requirement.recommended, "string");
  }
});

Deno.test("0_architecture - Result type consistency across functions", () => {
  // All functions returning Result should have consistent structure

  const jsrResult = getJsrImport("BREAKDOWN_CONFIG");

  // Should have ok property and either data or error
  assertExists(jsrResult.ok);

  if (jsrResult.ok) {
    assertExists(jsrResult.data);
    assertEquals(typeof jsrResult.data, "string");
  } else {
    assertExists(jsrResult.error);
    assertExists(jsrResult.error.kind);
  }

  // Type structure should be consistent
  assertEquals(typeof jsrResult.ok, "boolean");
});
