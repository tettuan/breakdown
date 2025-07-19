/**
 * @fileoverview Behavior tests for PathResolutionOption
 *
 * Tests the behavioral specifications and business logic of PathResolutionOption
 * for different path resolution strategies and validation scenarios.
 *
 * @module types/1_behavior_path_resolution_option_test
 */

import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";
import { PathResolutionOption, PathResolutionPresets } from "./path_resolution_option.ts";

/**
 * Behavior Test Group: Absolute Path Resolution Strategy
 */
Deno.test("PathResolutionOption Behavior - Absolute path resolution", () => {
  const result = PathResolutionOption.absolute("/base/dir");
  assertEquals(result.ok, true);

  if (result.ok) {
    const option = result.data;

    // Absolute paths should remain unchanged
    const absoluteResolve = option.resolve("/absolute/path/file.txt");
    assertEquals(absoluteResolve.ok, true);
    if (absoluteResolve.ok) {
      assertEquals(absoluteResolve.data, "/absolute/path/file.txt");
    }

    // Relative paths should be joined with base directory
    const relativeResolve = option.resolve("relative/path/file.txt");
    assertEquals(relativeResolve.ok, true);
    if (relativeResolve.ok) {
      assertEquals(relativeResolve.data, "/base/dir/relative/path/file.txt");
    }
  }
});

/**
 * Behavior Test Group: Relative Path Resolution Strategy
 */
Deno.test("PathResolutionOption Behavior - Relative path resolution", () => {
  const result = PathResolutionOption.relative("subdir");
  assertEquals(result.ok, true);

  if (result.ok) {
    const option = result.data;
    const cwd = Deno.cwd();

    // Paths should be resolved relative to current working directory + baseDir
    const resolveResult = option.resolve("file.txt");
    assertEquals(resolveResult.ok, true);
    if (resolveResult.ok) {
      assertEquals(resolveResult.data, `${cwd}/subdir/file.txt`);
    }
  }
});

/**
 * Behavior Test Group: Workspace Path Resolution Strategy
 */
Deno.test("PathResolutionOption Behavior - Workspace path resolution", () => {
  const result = PathResolutionOption.workspace("/workspace/root");
  assertEquals(result.ok, true);

  if (result.ok) {
    const option = result.data;

    // Paths should be resolved within workspace
    const resolveResult = option.resolve("src/main.ts");
    assertEquals(resolveResult.ok, true);
    if (resolveResult.ok) {
      assertEquals(resolveResult.data, "/workspace/root/src/main.ts");
    }
  }
});

/**
 * Behavior Test Group: Fallback Resolution Mechanism
 */
Deno.test("PathResolutionOption Behavior - Fallback resolution", () => {
  const result = PathResolutionOption.relative("primary", ["fallback1", "fallback2"]);
  assertEquals(result.ok, true);

  if (result.ok) {
    const option = result.data;

    // Test fallback mechanism (note: this will succeed in path resolution but may fail validation)
    const fallbackResult = option.resolveWithFallbacks("nonexistent.txt");
    // Should resolve to a path (validation might fail later)
    // Since no validation rules are set, the resolution should succeed
    assertEquals(fallbackResult.ok, true);
    if (!fallbackResult.ok) {
      assertEquals(fallbackResult.error.kind, "NoValidFallback");
      if (fallbackResult.error.kind === "NoValidFallback") {
        assertExists(fallbackResult.error.attempts);
      }
    }
  }
});

/**
 * Behavior Test Group: Path Validation Rules
 */
Deno.test("PathResolutionOption Behavior - Path validation rules", () => {
  // Create temp directory for testing
  const tempDir = Deno.makeTempDirSync();
  const testFile = `${tempDir}/test.txt`;
  Deno.writeTextFileSync(testFile, "test content");

  try {
    // Test must-exist validation
    const existResult = PathResolutionOption.create("absolute", tempDir, [], {
      required: ["must-exist"],
    });
    assertEquals(existResult.ok, true);

    if (existResult.ok) {
      const option = existResult.data;

      // Existing path should pass validation
      const validResult = option.validatePath(tempDir);
      assertEquals(validResult.ok, true);

      // Non-existing path should fail validation
      const invalidResult = option.validatePath("/nonexistent/path");
      assertEquals(invalidResult.ok, false);
      if (!invalidResult.ok) {
        assertEquals(invalidResult.error.kind, "PathValidationFailed");
      }
    }

    // Test must-be-directory validation
    const dirResult = PathResolutionOption.create("absolute", tempDir, [], {
      required: ["must-be-directory"],
    });
    assertEquals(dirResult.ok, true);

    if (dirResult.ok) {
      const option = dirResult.data;

      // Directory should pass validation
      const validResult = option.validatePath(tempDir);
      assertEquals(validResult.ok, true);

      // File should fail directory validation
      const invalidResult = option.validatePath(testFile);
      assertEquals(invalidResult.ok, false);
    }

    // Test must-be-file validation
    const fileResult = PathResolutionOption.create("absolute", tempDir, [], {
      required: ["must-be-file"],
    });
    assertEquals(fileResult.ok, true);

    if (fileResult.ok) {
      const option = fileResult.data;

      // File should pass validation
      const validResult = option.validatePath(testFile);
      assertEquals(validResult.ok, true);

      // Directory should fail file validation
      const invalidResult = option.validatePath(tempDir);
      assertEquals(invalidResult.ok, false);
    }
  } finally {
    // Cleanup
    Deno.removeSync(tempDir, { recursive: true });
  }
});

/**
 * Behavior Test Group: Custom Validation Functions
 */
Deno.test("PathResolutionOption Behavior - Custom validation", () => {
  const customValidation = (path: string) => {
    if (path.includes("forbidden")) {
      return { ok: false, error: "Path contains forbidden word" } as const;
    }
    return { ok: true, data: undefined } as const;
  };

  const result = PathResolutionOption.create("absolute", "/test", [], {
    required: [],
    custom: customValidation,
  });
  assertEquals(result.ok, true);

  if (result.ok) {
    const option = result.data;

    // Valid path should pass custom validation
    const validResult = option.validatePath("/valid/path");
    assertEquals(validResult.ok, true);

    // Invalid path should fail custom validation
    const invalidResult = option.validatePath("/forbidden/path");
    assertEquals(invalidResult.ok, false);
    if (!invalidResult.ok) {
      assertEquals(invalidResult.error.kind, "InvalidPath");
    }
  }
});

/**
 * Behavior Test Group: Configuration Retrieval
 */
Deno.test("PathResolutionOption Behavior - Configuration access", () => {
  const fallbacks = ["fallback1", "fallback2"];
  const result = PathResolutionOption.create("workspace", "/base", fallbacks, {
    required: ["must-exist", "must-be-readable"],
  });
  assertEquals(result.ok, true);

  if (result.ok) {
    const option = result.data;
    const config = option.getConfig();

    assertEquals(config.strategy, "workspace");
    assertEquals(config.baseDir, "/base");
    assertEquals(config.fallbacks.length, 2);
    assertEquals(config.fallbacks[0], "fallback1");
    assertEquals(config.fallbacks[1], "fallback2");
    assertEquals(config.validationRules.length, 2);
    assertEquals(config.validationRules.includes("must-exist"), true);
    assertEquals(config.validationRules.includes("must-be-readable"), true);
  }
});

/**
 * Behavior Test Group: Preset Configurations
 */
Deno.test("PathResolutionOption Behavior - Preset configurations", () => {
  const testDir = "/test/workspace";

  // Test prompt templates preset
  const promptResult = PathResolutionPresets.promptTemplates(testDir);
  assertEquals(promptResult.ok, true);
  if (promptResult.ok) {
    const config = promptResult.data.getConfig();
    assertEquals(config.strategy, "workspace");
    assertEquals(config.baseDir, testDir);
    assertEquals(config.fallbacks.length > 0, true);
    assertEquals(config.validationRules.includes("must-exist"), true);
    assertEquals(config.validationRules.includes("must-be-directory"), true);
    assertEquals(config.validationRules.includes("must-be-readable"), true);
  }

  // Test schema files preset
  const schemaResult = PathResolutionPresets.schemaFiles(testDir);
  assertEquals(schemaResult.ok, true);
  if (schemaResult.ok) {
    const config = schemaResult.data.getConfig();
    assertEquals(config.strategy, "workspace");
    assertEquals(config.baseDir, testDir);
    assertEquals(config.fallbacks.length > 0, true);
  }

  // Test config files preset
  const configResult = PathResolutionPresets.configFiles(testDir);
  assertEquals(configResult.ok, true);
  if (configResult.ok) {
    const config = configResult.data.getConfig();
    assertEquals(config.strategy, "workspace");
    assertEquals(config.baseDir, testDir);
  }

  // Test output files preset
  const outputResult = PathResolutionPresets.outputFiles(testDir);
  assertEquals(outputResult.ok, true);
  if (outputResult.ok) {
    const config = outputResult.data.getConfig();
    assertEquals(config.strategy, "relative");
    assertEquals(config.baseDir, testDir);
    assertEquals(config.validationRules.includes("must-be-writable"), true);
  }
});

/**
 * Behavior Test Group: Error Handling Scenarios
 */
Deno.test("PathResolutionOption Behavior - Error handling", () => {
  // Test invalid strategy
  const invalidStrategyResult = PathResolutionOption.create("invalid-strategy", "/test");
  assertEquals(invalidStrategyResult.ok, false);
  if (!invalidStrategyResult.ok) {
    assertEquals(invalidStrategyResult.error.kind, "InvalidStrategy");
    if (invalidStrategyResult.error.kind === "InvalidStrategy") {
      assertEquals(invalidStrategyResult.error.strategy, "invalid-strategy");
    }
  }

  // Test empty base directory
  const emptyBaseDirResult = PathResolutionOption.create("absolute", "");
  assertEquals(emptyBaseDirResult.ok, false);
  if (!emptyBaseDirResult.ok) {
    assertEquals(emptyBaseDirResult.error.kind, "EmptyBaseDir");
  }

  // Test whitespace-only base directory
  const whitespaceBaseDirResult = PathResolutionOption.create("absolute", "   ");
  assertEquals(whitespaceBaseDirResult.ok, false);
  if (!whitespaceBaseDirResult.ok) {
    assertEquals(whitespaceBaseDirResult.error.kind, "EmptyBaseDir");
  }
});

/**
 * Behavior Test Group: Path Normalization
 */
Deno.test("PathResolutionOption Behavior - Path normalization", () => {
  const result = PathResolutionOption.workspace("/base//double//slash");
  assertEquals(result.ok, true);

  if (result.ok) {
    const option = result.data;
    const config = option.getConfig();

    // Base directory should be trimmed
    assertEquals(config.baseDir, "/base//double//slash");

    // Path resolution should handle normalization
    const resolveResult = option.resolve("path//with//double//slashes");
    assertEquals(resolveResult.ok, true);
    if (resolveResult.ok) {
      // Should normalize multiple slashes to single slash
      assertEquals(resolveResult.data, "/base/double/slash/path/with/double/slashes");
    }
  }
});

/**
 * Behavior Test Group: Edge Cases
 */
Deno.test("PathResolutionOption Behavior - Edge cases", () => {
  // Test with empty path
  const result = PathResolutionOption.absolute("/base");
  assertEquals(result.ok, true);

  if (result.ok) {
    const option = result.data;

    // Empty path should be handled gracefully
    const emptyResolve = option.resolve("");
    assertEquals(emptyResolve.ok, true);
    if (emptyResolve.ok) {
      assertEquals(emptyResolve.data, "/base");
    }

    // Dot path should be handled
    const dotResolve = option.resolve(".");
    assertEquals(dotResolve.ok, true);
    if (dotResolve.ok) {
      assertEquals(dotResolve.data, "/base/.");
    }
  }
});
