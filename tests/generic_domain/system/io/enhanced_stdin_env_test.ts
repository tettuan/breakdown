/**
 * Test for enhanced_stdin environment variable dependency removal
 *
 * Verifies that detectEnvironment can work with injected configuration
 * instead of directly accessing Deno.env
 */

import {
  assertEquals,
  assertExists,
} from "../../../lib/deps.ts";
import {
  detectEnvironment as _detectEnvironment,
  type EnvironmentDetectionConfig as _EnvironmentDetectionConfig,
} from "../../../../lib/io/enhanced_stdin.ts";

Deno.test("detectEnvironment - uses injected configuration instead of Deno.env", () => {
  // Create a mock configuration that doesn't use Deno.env
  const mockEnvVars: Record<string, string> = {
    "CI": "true",
    "GITHUB_ACTIONS": "true",
    "DENO_TESTING": "true",
  };

  const config: _EnvironmentDetectionConfig = {
    getEnvVar: (name: string) => mockEnvVars[name],
    isTerminal: false,
  };

  const result = _detectEnvironment(config);

  // Verify that the function correctly detected CI environment
  assertEquals(result.isCI, true);
  assertEquals(result.ciProvider, "CI");
  assertEquals(result.isTest, true);
  assertEquals(result.isTerminal, false);

  // Verify that the environment variables were captured
  assertEquals(result.envVars["CI"], "true");
  assertEquals(result.envVars["GITHUB_ACTIONS"], "true");
});

Deno.test("detectEnvironment - falls back to Deno.env when no config provided", () => {
  // Test backward compatibility - should still work without config
  const result = _detectEnvironment();

  // Result will depend on actual environment, but should not throw
  assertEquals(typeof result.isCI, "boolean");
  assertEquals(typeof result.isTerminal, "boolean");
  assertEquals(typeof result.isTest, "boolean");
  assertEquals(typeof result.envVars, "object");
});

Deno.test("detectEnvironment - uses envVars map when provided", () => {
  const config: _EnvironmentDetectionConfig = {
    envVars: {
      "CIRCLECI": "true",
      "TEST": "true",
    },
  };

  const result = _detectEnvironment(config);

  // Should detect CI from the provided envVars
  assertEquals(result.isCI, true);
  // CI provider detection may vary based on actual environment
  assertExists(result.ciProvider);
  assertEquals(result.envVars["CIRCLECI"], "true");
});

Deno.test("detectEnvironment - respects override flags", () => {
  const config: _EnvironmentDetectionConfig = {
    getEnvVar: () => undefined, // No env vars
    isTerminal: true,
    isTest: true,
  };

  const result = _detectEnvironment(config);

  // Should use the override values
  assertEquals(result.isTerminal, true);
  assertEquals(result.isTest, true);
  assertEquals(result.isCI, false); // No CI env vars found
});
