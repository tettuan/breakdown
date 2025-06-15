/**
 * Tests for PREDEFINED_CONFIGS mapping
 *
 * Tests that predefined configuration names are correctly mapped to file paths.
 */

import { assertEquals } from "@std/assert";
import { PREDEFINED_CONFIGS, resolveConfigPath } from "../../../lib/cli/args.ts";

Deno.test("PREDEFINED_CONFIGS - includes production mapping", () => {
  // Check that production is mapped to production-app.yml
  assertEquals(
    PREDEFINED_CONFIGS.get("production"),
    "config/production-app.yml",
    "production should map to production-app.yml",
  );

  // Check that prod is also mapped to prod-app.yml
  assertEquals(
    PREDEFINED_CONFIGS.get("prod"),
    "config/prod-app.yml",
    "prod should map to prod-app.yml",
  );

  // Note: production and prod now map to different files
  // production -> production-app.yml, prod -> prod-app.yml
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
    `${cwd}/config/production-app.yml`,
    "production should resolve to production-app.yml",
  );

  // Test prod
  assertEquals(
    resolveConfigPath("prod"),
    `${cwd}/config/prod-app.yml`,
    "prod should resolve to prod-app.yml",
  );

  // Test dev
  assertEquals(
    resolveConfigPath("dev"),
    `${cwd}/config/dev-app.yml`,
    "dev should resolve to dev-app.yml",
  );

  // Test test
  assertEquals(
    resolveConfigPath("test"),
    `${cwd}/config/test-app.yml`,
    "test should resolve to test-app.yml",
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
