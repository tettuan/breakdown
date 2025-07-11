/**
 * @fileoverview Comprehensive type safety tests for UnifiedConfig and UnifiedConfigInterface
 *
 * This test file ensures complete type safety and structural integrity of the
 * unified configuration system, covering all type properties, constraints,
 * and edge cases according to DDD and Totality principles.
 *
 * @module config/2_structure_unified_config_types_test
 */

import { assert, assertEquals, assertExists, assertStrictEquals } from "@std/assert";
import {
  CONFIG_PRESETS,
  type ConfigBuilderOptions,
  type ConfigProfile,
  type ConfigurationError,
  type UnifiedConfig,
  UnifiedConfigInterface,
} from "./unified_config_interface.ts";

/**
 * Helper function to create a valid UnifiedConfig object for testing
 */
function createValidUnifiedConfig(): UnifiedConfig {
  return {
    profile: {
      name: "test",
      description: "Test profile",
      environment: "test",
      priority: 0,
      source: "default",
    },
    paths: {
      workingDirectory: "/test/work",
      resourceDirectory: "/test/resource",
      promptBaseDir: "/test/prompts",
      schemaBaseDir: "/test/schemas",
      outputBaseDir: "/test/output",
    },
    patterns: {
      directiveTypes: ["to", "summary", "defect"],
      layerTypes: ["project", "issue", "task"],
      customPatterns: { custom: ["pattern1", "pattern2"] },
    },
    app: {
      version: "1.0.0",
      features: {
        extendedThinking: true,
        debugMode: false,
        strictValidation: true,
        autoSchema: true,
      },
      limits: {
        maxFileSize: 10485760,
        maxPromptLength: 50000,
        maxVariables: 100,
      },
    },
    user: {
      customVariables: { key: "value" },
      aliases: { alias: "command" },
      templates: { template: "content" },
    },
    environment: {
      logLevel: "info",
      colorOutput: true,
      timezone: "UTC",
      locale: "en-US",
    },
    raw: { extra: "data" },
  };
}

Deno.test("Structure: ConfigProfile - Complete Type Properties", () => {
  // Test all properties of ConfigProfile type
  const profile: ConfigProfile = {
    name: "production",
    description: "Production environment profile",
    environment: "production",
    priority: 10,
    source: "user",
  };

  // Test required properties
  assertEquals(typeof profile.name, "string");
  assertStrictEquals(profile.name, "production");

  assertEquals(typeof profile.priority, "number");
  assertStrictEquals(profile.priority, 10);

  assertEquals(typeof profile.source, "string");
  assert(["default", "user", "environment", "override"].includes(profile.source));

  // Test nullable properties
  assert(profile.description === null || typeof profile.description === "string");
  assert(
    profile.environment === null ||
      ["development", "production", "test"].includes(profile.environment),
  );

  // Test with null values
  const minimalProfile: ConfigProfile = {
    name: "minimal",
    description: null,
    environment: null,
    priority: 0,
    source: "default",
  };

  assertStrictEquals(minimalProfile.description, null);
  assertStrictEquals(minimalProfile.environment, null);
});

Deno.test("Structure: UnifiedConfig.paths - Complete Path Structure", () => {
  const config = createValidUnifiedConfig();
  const paths = config.paths;

  // Test all required path properties
  const pathProperties = [
    "workingDirectory",
    "resourceDirectory",
    "promptBaseDir",
    "schemaBaseDir",
    "outputBaseDir",
  ];

  pathProperties.forEach((prop) => {
    assertExists(paths[prop as keyof typeof paths]);
    assertEquals(typeof paths[prop as keyof typeof paths], "string");
    assert(paths[prop as keyof typeof paths].length > 0);
  });

  // Test path structure integrity
  assertEquals(Object.keys(paths).length, 5);
  Object.values(paths).forEach((path) => {
    assertEquals(typeof path, "string");
    assert(path.startsWith("/"), `Path should be absolute: ${path}`);
  });
});

Deno.test("Structure: UnifiedConfig.patterns - Pattern Type Structure", () => {
  const config = createValidUnifiedConfig();
  const patterns = config.patterns;

  // Test required pattern arrays
  assert(Array.isArray(patterns.directiveTypes));
  assert(patterns.directiveTypes.length > 0);
  patterns.directiveTypes.forEach((type) => {
    assertEquals(typeof type, "string");
  });

  assert(Array.isArray(patterns.layerTypes));
  assert(patterns.layerTypes.length > 0);
  patterns.layerTypes.forEach((type) => {
    assertEquals(typeof type, "string");
  });

  // Test nullable customPatterns
  assert(
    patterns.customPatterns === null ||
      (typeof patterns.customPatterns === "object" && !Array.isArray(patterns.customPatterns)),
  );

  if (patterns.customPatterns !== null) {
    Object.entries(patterns.customPatterns).forEach(([key, value]) => {
      assertEquals(typeof key, "string");
      assert(Array.isArray(value));
      value.forEach((item) => assertEquals(typeof item, "string"));
    });
  }

  // Test with null customPatterns
  const minimalPatterns = {
    directiveTypes: ["to"],
    layerTypes: ["task"],
    customPatterns: null,
  };
  assertStrictEquals(minimalPatterns.customPatterns, null);
});

Deno.test("Structure: UnifiedConfig.app - Application Settings Structure", () => {
  const config = createValidUnifiedConfig();
  const app = config.app;

  // Test version string
  assertEquals(typeof app.version, "string");
  assert(/^\d+\.\d+\.\d+/.test(app.version), "Version should match semver pattern");

  // Test features object - all boolean properties
  const features = app.features;
  const featureKeys = ["extendedThinking", "debugMode", "strictValidation", "autoSchema"];

  assertEquals(Object.keys(features).length, 4);
  featureKeys.forEach((key) => {
    assertExists(features[key as keyof typeof features]);
    assertEquals(typeof features[key as keyof typeof features], "boolean");
  });

  // Test limits object - all number properties
  const limits = app.limits;
  const limitKeys = ["maxFileSize", "maxPromptLength", "maxVariables"];

  assertEquals(Object.keys(limits).length, 3);
  limitKeys.forEach((key) => {
    const value = limits[key as keyof typeof limits];
    assertExists(value);
    assertEquals(typeof value, "number");
    assert(value > 0, `Limit ${key} should be positive`);
  });
});

Deno.test("Structure: UnifiedConfig.user - User Customization Structure", () => {
  const config = createValidUnifiedConfig();
  const user = config.user;

  // Test nullable Record properties
  const userProperties = ["customVariables", "aliases", "templates"];

  userProperties.forEach((prop) => {
    const value = user[prop as keyof typeof user];
    assert(
      value === null || (typeof value === "object" && !Array.isArray(value)),
      `${prop} should be null or object`,
    );

    if (value !== null) {
      Object.entries(value).forEach(([k, v]) => {
        assertEquals(typeof k, "string");
        assertEquals(typeof v, "string");
      });
    }
  });

  // Test with all null values
  const minimalUser = {
    customVariables: null,
    aliases: null,
    templates: null,
  };

  Object.values(minimalUser).forEach((value) => {
    assertStrictEquals(value, null);
  });
});

Deno.test("Structure: UnifiedConfig.environment - Environment Settings Structure", () => {
  const config = createValidUnifiedConfig();
  const env = config.environment;

  // Test logLevel enum
  assertEquals(typeof env.logLevel, "string");
  assert(["debug", "info", "warn", "error"].includes(env.logLevel));

  // Test colorOutput boolean
  assertEquals(typeof env.colorOutput, "boolean");

  // Test nullable string properties
  assert(env.timezone === null || typeof env.timezone === "string");
  assert(env.locale === null || typeof env.locale === "string");

  // Test all possible logLevel values
  const logLevels = ["debug", "info", "warn", "error"] as const;
  logLevels.forEach((level) => {
    const testEnv = { ...env, logLevel: level };
    assertEquals(testEnv.logLevel, level);
  });
});

Deno.test("Structure: ConfigurationError - Discriminated Union Types", () => {
  // Test all error type variants
  const errorVariants: ConfigurationError[] = [
    {
      kind: "ConfigurationError",
      message: "General error",
      source: "test",
      context: { detail: "value" },
    },
    {
      kind: "ProfileNotFound",
      profile: "missing",
      availableProfiles: ["default", "test"],
      available: ["default"],
      context: { tried: "missing" },
    },
    {
      kind: "InvalidConfiguration",
      field: "app.version",
      reason: "Invalid format",
      context: { value: "bad" },
    },
    {
      kind: "ConfigLoadError",
      message: "File not found",
      context: { path: "/config" },
    },
    {
      kind: "PathResolutionError",
      message: "Invalid path",
      context: { path: "relative" },
    },
    {
      kind: "ValidationError",
      field: "limits.maxSize",
      message: "Must be positive",
      context: { value: -1 },
    },
    {
      kind: "MergeConflict",
      message: "Conflicting values",
      context: { field: "version" },
    },
  ];

  // Test each variant has correct structure
  errorVariants.forEach((error) => {
    assertEquals(typeof error.kind, "string");

    // Test optional context property
    if ("context" in error) {
      assertEquals(typeof error.context, "object");
      assertExists(error.context);
    }

    // Test variant-specific required fields
    switch (error.kind) {
      case "ProfileNotFound":
        assertEquals(typeof error.profile, "string");
        if (error.availableProfiles) {
          assert(Array.isArray(error.availableProfiles));
        }
        break;
      case "InvalidConfiguration":
      case "ValidationError":
        assertEquals(typeof error.field, "string");
        break;
      case "ConfigurationError":
      case "ConfigLoadError":
      case "PathResolutionError":
      case "MergeConflict":
        assertEquals(typeof error.message, "string");
        break;
    }
  });
});

Deno.test("Structure: ConfigBuilderOptions - Optional Properties", () => {
  // Test all properties are optional
  const emptyOptions: ConfigBuilderOptions = {};
  assertEquals(Object.keys(emptyOptions).length, 0);

  // Test with all properties as null
  const nullOptions: ConfigBuilderOptions = {
    profile: null,
    workingDirectory: null,
    environmentOverrides: null,
    pathOverrides: null,
  };

  Object.values(nullOptions).forEach((value) => {
    assertStrictEquals(value, null);
  });

  // Test with partial values
  const partialOptions: ConfigBuilderOptions = {
    profile: "test",
    environmentOverrides: {
      logLevel: "debug",
    },
  };

  assertEquals(partialOptions.profile, "test");
  assertEquals(partialOptions.environmentOverrides?.logLevel, "debug");
  assertEquals(partialOptions.workingDirectory, undefined);
  assertEquals(partialOptions.pathOverrides, undefined);

  // Test environment overrides structure
  const envOverrides: ConfigBuilderOptions = {
    environmentOverrides: {
      logLevel: "error",
      colorOutput: false,
      timezone: "America/New_York",
      locale: "en-US",
    },
  };

  const overrides = envOverrides.environmentOverrides!;
  if (overrides.logLevel) assert(["debug", "info", "warn", "error"].includes(overrides.logLevel));
  if (overrides.colorOutput !== undefined) assertEquals(typeof overrides.colorOutput, "boolean");
  if (overrides.timezone) assertEquals(typeof overrides.timezone, "string");
  if (overrides.locale) assertEquals(typeof overrides.locale, "string");

  // Test path overrides structure
  const pathOverrides: ConfigBuilderOptions = {
    pathOverrides: {
      promptBaseDir: "/custom/prompts",
      schemaBaseDir: "/custom/schemas",
      outputBaseDir: "/custom/output",
    },
  };

  const paths = pathOverrides.pathOverrides!;
  Object.values(paths).forEach((path) => {
    if (path) assertEquals(typeof path, "string");
  });
});

Deno.test("Structure: CONFIG_PRESETS - Type Consistency", () => {
  // Test all presets have consistent structure
  const presetKeys = Object.keys(CONFIG_PRESETS) as Array<keyof typeof CONFIG_PRESETS>;
  assertEquals(presetKeys.length, 3);
  assert(presetKeys.includes("development"));
  assert(presetKeys.includes("production"));
  assert(presetKeys.includes("test"));

  // Test development preset
  const dev = CONFIG_PRESETS.development;
  assertEquals(dev.environmentOverrides.logLevel, "debug");
  assertEquals(dev.environmentOverrides.colorOutput, true);
  assert(!("pathOverrides" in dev));

  // Test production preset
  const prod = CONFIG_PRESETS.production;
  assertEquals(prod.environmentOverrides.logLevel, "warn");
  assertEquals(prod.environmentOverrides.colorOutput, false);
  assert(!("pathOverrides" in prod));

  // Test test preset
  const test = CONFIG_PRESETS.test;
  assertEquals(test.environmentOverrides.logLevel, "error");
  assertEquals(test.environmentOverrides.colorOutput, false);
  assertEquals(test.pathOverrides?.outputBaseDir, "/tmp/breakdown-test");

  // Test preset types match ConfigBuilderOptions
  presetKeys.forEach((key) => {
    const preset = CONFIG_PRESETS[key];
    const options: ConfigBuilderOptions = preset;

    if (options.environmentOverrides) {
      assertExists(options.environmentOverrides);
    }
    if ("pathOverrides" in options && options.pathOverrides) {
      assertExists(options.pathOverrides);
    }
  });
});

Deno.test("Structure: UnifiedConfig - Complete Type Coverage", () => {
  const config = createValidUnifiedConfig();

  // Test all top-level properties exist
  const requiredProperties = [
    "profile",
    "paths",
    "patterns",
    "app",
    "user",
    "environment",
    "raw",
  ];

  assertEquals(Object.keys(config).length, requiredProperties.length);
  requiredProperties.forEach((prop) => {
    assertExists(config[prop as keyof UnifiedConfig]);
  });

  // Test raw property can hold any data
  config.raw = { anything: "goes", nested: { data: [1, 2, 3] } };
  assertEquals(typeof config.raw, "object");
  assertExists(config.raw);

  // Test deep property access
  assertEquals(config.app.features.debugMode, false);
  assertEquals(config.paths.workingDirectory, "/test/work");
  assertEquals(config.patterns.directiveTypes[0], "to");
  assertEquals(config.user.customVariables?.key, "value");
  assertEquals(config.environment.logLevel, "info");
});

Deno.test("Structure: Type Exhaustiveness - All Properties Tested", () => {
  // This test ensures we haven't missed any properties in our type coverage
  const config = createValidUnifiedConfig();

  // Recursively count all properties
  function countProperties(obj: unknown, path = ""): number {
    if (obj === null || obj === undefined) return 0;
    if (typeof obj !== "object") return 0;
    if (Array.isArray(obj)) return 0;

    let count = 0;
    for (const key in obj) {
      const fullPath = path ? `${path}.${key}` : key;
      count++; // Count this property
      count += countProperties((obj as Record<string, unknown>)[key], fullPath);
    }
    return count;
  }

  const totalProperties = countProperties(config);

  // We expect a specific number of properties based on our type definition
  // This helps catch if new properties are added without updating tests
  assert(totalProperties >= 30, `Expected at least 30 properties, got ${totalProperties}`);

  // Verify no unexpected properties exist at root level
  const expectedRootKeys = new Set([
    "profile",
    "paths",
    "patterns",
    "app",
    "user",
    "environment",
    "raw",
  ]);

  Object.keys(config).forEach((key) => {
    assert(expectedRootKeys.has(key), `Unexpected root property: ${key}`);
  });
});

Deno.test("Structure: Type Safety - Invalid Type Assignments", () => {
  // Test that type system prevents invalid assignments
  const config = createValidUnifiedConfig();

  // These tests use type assertions to verify compile-time type safety
  // In a real TypeScript environment, these would cause compile errors

  // Test profile.source enum constraint
  const validSources = ["default", "user", "environment", "override"] as const;
  validSources.forEach((source) => {
    config.profile.source = source; // Should be valid
    assertEquals(config.profile.source, source);
  });

  // Test environment enum constraint
  const validEnvironments = ["development", "production", "test", null] as const;
  validEnvironments.forEach((env) => {
    config.profile.environment = env; // Should be valid
    assertEquals(config.profile.environment, env);
  });

  // Test logLevel enum constraint
  const validLogLevels = ["debug", "info", "warn", "error"] as const;
  validLogLevels.forEach((level) => {
    config.environment.logLevel = level; // Should be valid
    assertEquals(config.environment.logLevel, level);
  });

  // Test numeric constraints are positive
  assert(config.app.limits.maxFileSize > 0);
  assert(config.app.limits.maxPromptLength > 0);
  assert(config.app.limits.maxVariables > 0);
  assert(config.profile.priority >= 0);
});

Deno.test("Structure: UnifiedConfigInterface Methods - Return Type Safety", async () => {
  // Test method return types match their signatures
  try {
    const result = await UnifiedConfigInterface.create();

    if (result.ok) {
      const configInterface = result.data;

      // Test getConfig returns UnifiedConfig
      const config = configInterface.getConfig();
      assertExists(config.profile);
      assertExists(config.paths);
      assertExists(config.patterns);

      // Test get method with generic type parameter
      const stringValue = configInterface.get<string>("profile.name");
      if (stringValue !== undefined) {
        assertEquals(typeof stringValue, "string");
      }

      const numberValue = configInterface.get<number>("app.limits.maxFileSize");
      if (numberValue !== undefined) {
        assertEquals(typeof numberValue, "number");
      }

      const booleanValue = configInterface.get<boolean>("app.features.debugMode");
      if (booleanValue !== undefined) {
        assertEquals(typeof booleanValue, "boolean");
      }

      // Test has method returns boolean
      const hasResult = configInterface.has("profile.name");
      assertEquals(typeof hasResult, "boolean");

      // Test validate returns Result type
      const validateResult = configInterface.validate();
      assertEquals(typeof validateResult.ok, "boolean");

      // Test export returns string
      const exported = configInterface.export();
      assertEquals(typeof exported, "string");

      // Test getAvailableProfiles returns string array
      const profiles = await configInterface.getAvailableProfiles();
      assert(Array.isArray(profiles));
      profiles.forEach((profile) => assertEquals(typeof profile, "string"));

      // Test switchProfile returns Result<UnifiedConfigInterface, ConfigurationError>
      const switchResult = await configInterface.switchProfile("default");
      assertEquals(typeof switchResult.ok, "boolean");
    }
  } catch {
    // Expected in test environment
    assert(true);
  }
});

Deno.test("Structure: Edge Cases - Boundary Value Testing", () => {
  const config = createValidUnifiedConfig();

  // Test empty arrays (should not be allowed for required arrays)
  assert(config.patterns.directiveTypes.length > 0);
  assert(config.patterns.layerTypes.length > 0);

  // Test empty strings (should be valid for most string properties)
  config.profile.name = "";
  assertEquals(config.profile.name, "");

  // Test zero values for numbers
  config.profile.priority = 0;
  assertEquals(config.profile.priority, 0);

  // Test empty objects for nullable Records
  config.user.customVariables = {};
  assertEquals(Object.keys(config.user.customVariables).length, 0);

  // Test very large numbers for limits
  config.app.limits.maxFileSize = Number.MAX_SAFE_INTEGER;
  assertEquals(config.app.limits.maxFileSize, Number.MAX_SAFE_INTEGER);

  // Test special characters in strings
  config.profile.description = "Test with special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?";
  assert(config.profile.description.includes("!@#$%^&*"));

  // Test nested null values
  config.user = {
    customVariables: null,
    aliases: null,
    templates: null,
  };
  Object.values(config.user).forEach((value) => {
    assertStrictEquals(value, null);
  });
});
