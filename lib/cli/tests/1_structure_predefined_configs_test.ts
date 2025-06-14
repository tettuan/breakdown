/**
 * Tests for PREDEFINED_CONFIGS mapping
 *
 * Tests that predefined configuration names are correctly mapped to file paths.
 */

import { assertEquals } from "@std/assert";
import { PREDEFINED_CONFIGS, resolveConfigPath } from "../../../lib/cli/args.ts";

Deno.test("PREDEFINED_CONFIGS - includes production mapping", () => {
  // Check that production is mapped to prod.yml
  assertEquals(
    PREDEFINED_CONFIGS.get("production"),
    ".agent/breakdown/config/prod.yml",
    "production should map to prod.yml",
  );

  // Check that prod is also mapped to prod.yml
  assertEquals(
    PREDEFINED_CONFIGS.get("prod"),
    ".agent/breakdown/config/prod.yml",
    "prod should map to prod.yml",
  );

  // Verify both map to the same file
  assertEquals(
    PREDEFINED_CONFIGS.get("production"),
    PREDEFINED_CONFIGS.get("prod"),
    "production and prod should map to the same file",
  );
});

Deno.test("PREDEFINED_CONFIGS - all predefined configs present", () => {
  const expectedConfigs = ["test", "dev", "prod", "production"];

  for (const configName of expectedConfigs) {
    assertEquals(
      PREDEFINED_CONFIGS.has(configName),
      true,
      `${configName} should be in PREDEFINED_CONFIGS`,
    );
  }
});

Deno.test("resolveConfigPath - handles predefined config names", () => {
  const cwd = Deno.cwd();

  // Test production
  assertEquals(
    resolveConfigPath("production"),
    `${cwd}/.agent/breakdown/config/prod.yml`,
    "production should resolve to prod.yml",
  );

  // Test prod
  assertEquals(
    resolveConfigPath("prod"),
    `${cwd}/.agent/breakdown/config/prod.yml`,
    "prod should resolve to prod.yml",
  );

  // Test dev
  assertEquals(
    resolveConfigPath("dev"),
    `${cwd}/.agent/breakdown/config/dev.yml`,
    "dev should resolve to dev.yml",
  );

  // Test test
  assertEquals(
    resolveConfigPath("test"),
    `${cwd}/.agent/breakdown/config/test.yml`,
    "test should resolve to test.yml",
  );
});

Deno.test("resolveConfigPath - handles custom file paths", () => {
  // Test absolute path
  assertEquals(
    resolveConfigPath("/absolute/path/to/config.yml"),
    "/absolute/path/to/config.yml",
    "absolute paths should be returned as-is",
  );

  // Test relative path with custom working directory
  assertEquals(
    resolveConfigPath("custom/config.yml", "/project"),
    "/project/custom/config.yml",
    "relative paths should be resolved against working directory",
  );

  // Test that non-predefined names are treated as file paths
  assertEquals(
    resolveConfigPath("production.yml"),
    `${Deno.cwd()}/production.yml`,
    "non-predefined names should be treated as file paths",
  );
});
