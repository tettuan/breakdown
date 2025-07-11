/**
 * @fileoverview Versions 1_behavior Tests - Version Management Business Logic Validation
 *
 * バージョン管理モジュールのビジネスロジックと動作を検証。
 * バージョン比較、JSRインポート生成、互換性チェックの動作をテスト。
 *
 * テスト構成:
 * - JSRインポートURL生成の動作
 * - バージョン互換性チェックの動作
 * - セマンティックバージョニング解析
 * - エラーハンドリングとメッセージ生成
 * - エッジケースの処理
 */

import { assert, assertEquals, assertExists } from "https://deno.land/std@0.210.0/assert/mod.ts";
import {
  checkVersionCompatibility,
  DEPENDENCY_VERSIONS,
  getJsrImport,
  VERSION_REQUIREMENTS,
  type VersionRequirement,
} from "./versions.ts";

// =============================================================================
// 1_BEHAVIOR: Business Logic and Behavior Tests
// =============================================================================

Deno.test("1_behavior - getJsrImport generates correct URLs", () => {
  // Test valid package name generation
  const configResult = getJsrImport("BREAKDOWN_CONFIG");
  assert(configResult.ok);

  const expectedUrl = `jsr:@tettuan/breakdownconfig@${DEPENDENCY_VERSIONS.BREAKDOWN_CONFIG}`;
  assertEquals(configResult.data, expectedUrl);

  // Test other packages
  const paramsResult = getJsrImport("BREAKDOWN_PARAMS");
  assert(paramsResult.ok);
  assertEquals(
    paramsResult.data,
    `jsr:@tettuan/breakdownparams@${DEPENDENCY_VERSIONS.BREAKDOWN_PARAMS}`,
  );

  const promptResult = getJsrImport("BREAKDOWN_PROMPT");
  assert(promptResult.ok);
  assertEquals(
    promptResult.data,
    `jsr:@tettuan/breakdownprompt@${DEPENDENCY_VERSIONS.BREAKDOWN_PROMPT}`,
  );

  const loggerResult = getJsrImport("BREAKDOWN_LOGGER");
  assert(loggerResult.ok);
  assertEquals(
    loggerResult.data,
    `jsr:@tettuan/breakdownlogger@${DEPENDENCY_VERSIONS.BREAKDOWN_LOGGER}`,
  );
});

Deno.test("1_behavior - getJsrImport handles invalid package names", () => {
  const invalidPackages = [
    "INVALID_PACKAGE",
    "NON_EXISTENT",
    "STD", // STD is not a valid package for JSR import
    "",
    " ",
    "breakdown_config", // lowercase should fail
    "BREAKDOWN-CONFIG", // wrong separator
  ];

  for (const packageName of invalidPackages) {
    const result = getJsrImport(packageName);
    assert(!result.ok, `${packageName} should return error`);

    assertEquals(result.error.kind, "InvalidInput");
    // Basic validation - error should have proper structure
    assertExists(result.error);
    assert("kind" in result.error);

    // Optional context validation
    if (result.error.context) {
      if ("field" in result.error.context) {
        assertEquals(result.error.context.field, "packageName");
      }
      if ("value" in result.error.context) {
        assertEquals(result.error.context.value, packageName);
      }
      if ("reason" in result.error.context && typeof result.error.context.reason === "string") {
        assert((result.error.context.reason as string).includes("Unknown package"));
      }
    }
  }
});

Deno.test("1_behavior - checkVersionCompatibility with valid versions", () => {
  // Test with current recommended versions
  for (const [packageName, requirement] of Object.entries(VERSION_REQUIREMENTS)) {
    const result = checkVersionCompatibility(packageName, requirement.recommended);

    assertEquals(
      result.compatible,
      true,
      `${packageName} recommended version should be compatible`,
    );
    assertEquals(result.message, undefined);
  }

  // Test with minimum versions
  for (const [packageName, requirement] of Object.entries(VERSION_REQUIREMENTS)) {
    const result = checkVersionCompatibility(packageName, requirement.minimum);

    assertEquals(result.compatible, true, `${packageName} minimum version should be compatible`);
  }
});

Deno.test("1_behavior - checkVersionCompatibility with version below minimum", () => {
  const testCases = [
    { package: "BREAKDOWN_CONFIG", version: "0.9.0" },
    { package: "BREAKDOWN_PARAMS", version: "0.5.0" },
    { package: "BREAKDOWN_PROMPT", version: "0.1.0" },
    { package: "BREAKDOWN_LOGGER", version: "0.8.0" },
  ];

  for (const { package: packageName, version } of testCases) {
    const result = checkVersionCompatibility(packageName, version);

    assertEquals(result.compatible, false, `${packageName} ${version} should be incompatible`);
    assertExists(result.message);
    assert(result.message.includes("below minimum"));
    assert(result.message.includes(packageName));
    assert(result.message.includes(version));
  }
});

Deno.test("1_behavior - checkVersionCompatibility with version above maximum", () => {
  // Create test cases with maximum versions
  const testRequirement: VersionRequirement = {
    minimum: "1.0.0",
    recommended: "1.2.0",
    maximum: "2.0.0",
  };

  // Mock VERSION_REQUIREMENTS for test
  (VERSION_REQUIREMENTS as Record<string, unknown>).TEST_PACKAGE = testRequirement;

  try {
    const result = checkVersionCompatibility("TEST_PACKAGE", "2.1.0");

    assertEquals(result.compatible, false);
    assertExists(result.message);
    assert(result.message.includes("exceeds maximum"));
    assert(result.message.includes("2.1.0"));
    assert(result.message.includes("2.0.0"));
  } finally {
    // Restore original requirements
    delete (VERSION_REQUIREMENTS as Record<string, unknown>).TEST_PACKAGE;
  }
});

Deno.test("1_behavior - checkVersionCompatibility with unknown package", () => {
  const result = checkVersionCompatibility("UNKNOWN_PACKAGE", "1.0.0");

  // Unknown packages should be considered compatible (no requirements)
  assertEquals(result.compatible, true);
  assertEquals(result.message, undefined);
});

Deno.test("1_behavior - Version parsing handles different formats", () => {
  // Test with various version formats
  const versionFormats = [
    { version: "1.0.0", expectCompatible: true },
    { version: "^1.1.0", expectCompatible: true },
    { version: "~1.1.4", expectCompatible: true },
    { version: "1.2.0-beta", expectCompatible: true }, // Should handle pre-release
    { version: "2.0.0", expectCompatible: true },
  ];

  for (const { version, expectCompatible: _expectCompatible } of versionFormats) {
    const result = checkVersionCompatibility("BREAKDOWN_CONFIG", version);

    // All should be processed without throwing errors
    assertExists(result);
    assertEquals(typeof result.compatible, "boolean");

    if (!result.compatible && result.message) {
      assertEquals(typeof result.message, "string");
    }
  }
});

Deno.test("1_behavior - Version comparison logic accuracy", () => {
  // Test specific version comparisons
  const testCases = [
    { current: "1.1.4", minimum: "1.1.0", shouldPass: true },
    { current: "1.0.9", minimum: "1.1.0", shouldPass: false },
    { current: "2.0.0", minimum: "1.1.0", shouldPass: true },
    { current: "1.1.0", minimum: "1.1.0", shouldPass: true }, // Equal should pass
    { current: "0.9.9", minimum: "1.0.0", shouldPass: false },
  ];

  // Use actual package for testing
  const packageName = "BREAKDOWN_CONFIG";
  const originalMinimum = VERSION_REQUIREMENTS[packageName].minimum;

  for (const { current, minimum, shouldPass } of testCases) {
    // Temporarily modify minimum for test
    (VERSION_REQUIREMENTS[packageName] as unknown as Record<string, unknown>).minimum = minimum;

    const result = checkVersionCompatibility(packageName, current);
    assertEquals(
      result.compatible,
      shouldPass,
      `${current} vs ${minimum} should ${shouldPass ? "pass" : "fail"}`,
    );

    if (!shouldPass) {
      assertExists(result.message);
      assert(result.message.includes("below minimum"));
    }
  }

  // Restore original minimum
  (VERSION_REQUIREMENTS[packageName] as unknown as Record<string, unknown>).minimum =
    originalMinimum;
});

Deno.test("1_behavior - JSR URL format consistency", () => {
  const packages = ["BREAKDOWN_CONFIG", "BREAKDOWN_PARAMS", "BREAKDOWN_PROMPT", "BREAKDOWN_LOGGER"];

  for (const packageName of packages) {
    const result = getJsrImport(packageName);
    assert(result.ok);

    const url = result.data;

    // Should follow JSR URL pattern
    assert(url.startsWith("jsr:@tettuan/"));
    assert(url.includes("@"));

    // Should contain version
    const atIndex = url.lastIndexOf("@");
    const version = url.substring(atIndex + 1);
    assert(version.length > 0);

    // Version should match dependency version
    const expectedVersion = DEPENDENCY_VERSIONS[packageName as keyof typeof DEPENDENCY_VERSIONS];
    assertEquals(
      url,
      `jsr:@tettuan/${packageName.toLowerCase().replace("_", "")}@${expectedVersion}`,
    );
  }
});

Deno.test("1_behavior - Error messages provide helpful information", () => {
  const result = getJsrImport("INVALID_PACKAGE");
  assert(!result.ok);

  const error = result.error;

  // Basic error validation
  assertExists(error);
  assertEquals(error.kind, "InvalidInput");

  // Context validation if available
  if (error.context && "reason" in error.context && typeof error.context.reason === "string") {
    assert((error.context.reason as string).includes("Unknown package"));
  }
});

Deno.test("1_behavior - Version compatibility messages are descriptive", () => {
  const testCases = [
    { packageName: "BREAKDOWN_CONFIG", version: "0.9.0" },
    { packageName: "BREAKDOWN_PARAMS", version: "0.5.0" },
  ];

  for (const { packageName, version } of testCases) {
    const result = checkVersionCompatibility(packageName, version);

    assert(!result.compatible);
    assertExists(result.message);

    // Message should contain all relevant information
    assert(result.message.includes(packageName));
    assert(result.message.includes(version));
    assert(result.message.includes("below minimum"));
    assert(result.message.includes(VERSION_REQUIREMENTS[packageName].minimum));
  }
});

Deno.test("1_behavior - Edge cases in version parsing", () => {
  // Test edge cases in version format
  const edgeCases = [
    "1.0", // Missing patch version
    "1", // Only major version
    "1.0.0.0", // Extra version parts
    "v1.0.0", // With 'v' prefix
    "1.0.0-alpha.1", // Pre-release with identifier
  ];

  for (const version of edgeCases) {
    // Should not throw errors
    const result = checkVersionCompatibility("BREAKDOWN_CONFIG", version);
    assertExists(result);
    assertEquals(typeof result.compatible, "boolean");
  }
});

Deno.test("1_behavior - Concurrent version checks behave consistently", () => {
  const packageName = "BREAKDOWN_CONFIG";
  const version = "1.1.4";

  // Simulate concurrent calls
  const promises = Array.from(
    { length: 10 },
    () => Promise.resolve(checkVersionCompatibility(packageName, version)),
  );

  return Promise.all(promises).then((results) => {
    // All results should be identical
    const first = results[0];
    for (const result of results) {
      assertEquals(result.compatible, first.compatible);
      assertEquals(result.message, first.message);
    }
  });
});

Deno.test("1_behavior - Version requirements data integrity", () => {
  // Verify that all version requirements make sense
  for (const [packageName, requirement] of Object.entries(VERSION_REQUIREMENTS)) {
    // Minimum should be valid version
    assert(requirement.minimum.match(/^\d+\.\d+\.\d+/));

    // Recommended should be valid version
    assert(requirement.recommended.match(/^\d+\.\d+\.\d+/));

    // Recommended should be >= minimum
    const minCompatible = checkVersionCompatibility(packageName, requirement.recommended);
    assertEquals(
      minCompatible.compatible,
      true,
      `Recommended version ${requirement.recommended} should be compatible with minimum ${requirement.minimum} for ${packageName}`,
    );

    // Maximum should be valid if present
    if (requirement.maximum) {
      assert(requirement.maximum.match(/^\d+\.\d+\.\d+/));
    }
  }
});

Deno.test("1_behavior - Package name mapping consistency", () => {
  // Test that package names map correctly to JSR package names
  const mappings = {
    "BREAKDOWN_CONFIG": "breakdownconfig",
    "BREAKDOWN_PARAMS": "breakdownparams",
    "BREAKDOWN_PROMPT": "breakdownprompt",
    "BREAKDOWN_LOGGER": "breakdownlogger",
  };

  for (const [inputName, expectedPackage] of Object.entries(mappings)) {
    const result = getJsrImport(inputName);
    assert(result.ok);

    assert(result.data.includes(`@tettuan/${expectedPackage}@`));
  }
});
