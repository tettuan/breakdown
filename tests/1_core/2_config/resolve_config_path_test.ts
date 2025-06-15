/**
 * Unit tests for resolveConfigPath function
 *
 * Tests configuration path resolution including:
 * - Predefined configuration names
 * - Absolute file paths
 * - Relative file paths
 * - Working directory handling
 * - Error cases
 */

import { assertEquals } from "@std/assert";
import { join } from "@std/path";
import { PREDEFINED_CONFIGS, resolveConfigPath } from "../../../lib/cli/args.ts";

Deno.test("resolveConfigPath - predefined config names", () => {
  // Test predefined config name "test"
  const testConfigPath = resolveConfigPath("test");
  const expectedTestPath = join(Deno.cwd(), "config/test-app.yml");
  assertEquals(testConfigPath, expectedTestPath);

  // Test predefined config name "dev"
  const devConfigPath = resolveConfigPath("dev");
  const expectedDevPath = join(Deno.cwd(), "config/dev-app.yml");
  assertEquals(devConfigPath, expectedDevPath);

  // Test predefined config name "prod"
  const prodConfigPath = resolveConfigPath("prod");
  const expectedProdPath = join(Deno.cwd(), "config/prod-app.yml");
  assertEquals(prodConfigPath, expectedProdPath);
});

Deno.test("resolveConfigPath - predefined config names with custom working directory", () => {
  const customWorkingDir = "/tmp/custom";

  const testConfigPath = resolveConfigPath("test", customWorkingDir);
  const expectedPath = join(customWorkingDir, "config/test-app.yml");
  assertEquals(testConfigPath, expectedPath);

  const devConfigPath = resolveConfigPath("dev", customWorkingDir);
  const expectedDevPath = join(customWorkingDir, "config/dev-app.yml");
  assertEquals(devConfigPath, expectedDevPath);
});

Deno.test("resolveConfigPath - absolute file paths", () => {
  const absolutePath = "/absolute/path/to/config.yml";
  const result = resolveConfigPath(absolutePath);
  assertEquals(result, absolutePath);

  // Test absolute path with custom working directory (should ignore working dir)
  const resultWithWorkingDir = resolveConfigPath(absolutePath, "/tmp/custom");
  assertEquals(resultWithWorkingDir, absolutePath);
});

Deno.test("resolveConfigPath - relative file paths", () => {
  const relativePath = "config/custom.yml";
  const result = resolveConfigPath(relativePath);
  const expectedPath = join(Deno.cwd(), relativePath);
  assertEquals(result, expectedPath);
});

Deno.test("resolveConfigPath - relative file paths with custom working directory", () => {
  const relativePath = "config/custom.yml";
  const customWorkingDir = "/tmp/custom";
  const result = resolveConfigPath(relativePath, customWorkingDir);
  const expectedPath = join(customWorkingDir, relativePath);
  assertEquals(result, expectedPath);
});

Deno.test("resolveConfigPath - edge cases", () => {
  // Test empty string (should be treated as relative path)
  const emptyResult = resolveConfigPath("");
  assertEquals(emptyResult, Deno.cwd());

  // Test single dot (current directory)
  const dotResult = resolveConfigPath(".");
  assertEquals(dotResult, join(Deno.cwd(), "."));

  // Test double dot (parent directory)
  const doubleDotResult = resolveConfigPath("..");
  assertEquals(doubleDotResult, join(Deno.cwd(), ".."));

  // Test path with spaces
  const pathWithSpaces = "path with spaces/config.yml";
  const spacesResult = resolveConfigPath(pathWithSpaces);
  assertEquals(spacesResult, join(Deno.cwd(), pathWithSpaces));
});

Deno.test("resolveConfigPath - case sensitivity", () => {
  // Test case sensitivity for predefined configs
  // "Test" should not match "test" predefined config
  const caseResult = resolveConfigPath("Test");
  const expectedPath = join(Deno.cwd(), "Test");
  assertEquals(caseResult, expectedPath);

  // Verify that lowercase "test" still works as predefined
  const lowerResult = resolveConfigPath("test");
  const expectedLowerPath = join(Deno.cwd(), "config/test-app.yml");
  assertEquals(lowerResult, expectedLowerPath);
});

Deno.test("resolveConfigPath - special characters in paths", () => {
  // Test path with special characters
  const specialPath = "config/my-config_v1.2.yml";
  const result = resolveConfigPath(specialPath);
  assertEquals(result, join(Deno.cwd(), specialPath));

  // Test absolute path with special characters
  const absoluteSpecialPath = "/tmp/my-config_v1.2.yml";
  const absoluteResult = resolveConfigPath(absoluteSpecialPath);
  assertEquals(absoluteResult, absoluteSpecialPath);
});

Deno.test("resolveConfigPath - predefined configs constant verification", () => {
  // Verify PREDEFINED_CONFIGS contains expected mappings
  assertEquals(PREDEFINED_CONFIGS.get("test"), "config/test-app.yml");
  assertEquals(PREDEFINED_CONFIGS.get("dev"), "config/dev-app.yml");
  assertEquals(PREDEFINED_CONFIGS.get("prod"), "config/prod-app.yml");

  // Verify non-existent predefined config
  assertEquals(PREDEFINED_CONFIGS.get("nonexistent"), undefined);
});

Deno.test("resolveConfigPath - working directory parameter validation", () => {
  const configName = "custom.yml";

  // Test with undefined working directory (should use Deno.cwd())
  const undefinedResult = resolveConfigPath(configName, undefined);
  assertEquals(undefinedResult, join(Deno.cwd(), configName));

  // Test with empty string working directory (should use current directory)
  const emptyWorkingDirResult = resolveConfigPath(configName, "");
  assertEquals(emptyWorkingDirResult, join(Deno.cwd(), configName));
});

Deno.test("resolveConfigPath - error handling and boundary conditions", () => {
  // Test with very long paths
  const longPath = "a".repeat(255) + ".yml";
  const longResult = resolveConfigPath(longPath);
  assertEquals(longResult, join(Deno.cwd(), longPath));

  // Test with path containing only slashes
  const slashOnlyPath = "///";
  const slashResult = resolveConfigPath(slashOnlyPath);
  assertEquals(slashResult, slashOnlyPath); // Should be treated as absolute

  // Test with Windows-style paths (even on non-Windows systems)
  const windowsStylePath = "C:\\config\\file.yml";
  const windowsResult = resolveConfigPath(windowsStylePath);
  assertEquals(windowsResult, join(Deno.cwd(), windowsStylePath)); // Treated as relative on Unix

  // Test with multiple consecutive dots
  const multiDotsPath = "...config.yml";
  const multiDotsResult = resolveConfigPath(multiDotsPath);
  assertEquals(multiDotsResult, join(Deno.cwd(), multiDotsPath));
});
