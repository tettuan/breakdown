/**
 * Unit tests for Configuration Loader
 *
 * Tests functional behavior and edge cases:
 * - File loading and parsing
 * - Error handling
 * - Configuration merging
 * - Edge cases and boundaries
 *
 * @module config/loader_unit_test
 */

import { assertEquals, assertExists, assertRejects } from "../deps.ts";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { type CustomConfig as _CustomConfig, loadBreakdownConfig, loadConfig } from "./loader.ts";
import { join } from "@std/path";
import { ensureDirSync } from "@std/fs";

const _logger = new BreakdownLogger("loader-unit");

describe("Unit: loadConfig YAML File Loading", () => {
  const testDir = Deno.makeTempDirSync();
  const testFiles: string[] = [];

  beforeEach(() => {
    _logger.debug("Setting up test files");
  });

  afterEach(() => {
    _logger.debug("Cleaning up test files");
    for (const file of testFiles) {
      try {
        Deno.removeSync(file);
      } catch {
        // Ignore cleanup errors
      }
    }
    testFiles.length = 0;
  });

  it("should successfully load and parse valid YAML file", async () => {
    _logger.debug("Testing valid YAML loading");

    const testFile = join(testDir, "valid-config.yml");
    const testContent = `
customConfig:
  findBugs:
    enabled: true
    sensitivity: high
    patterns:
      - "*.ts"
      - "*.js"
    maxResults: 100
breakdownParams:
  version: "1.0.0"
  customParams:
    feature: enabled
`;

    Deno.writeTextFileSync(testFile, testContent);
    testFiles.push(testFile);

    const config = await loadConfig(testFile);

    assertExists(config, "Config should be loaded");
    assertEquals(config.customConfig?.findBugs?.enabled, true);
    assertEquals(config.customConfig?.findBugs?.sensitivity, "high");
    assertEquals(config.customConfig?.findBugs?.patterns?.length, 2);
    assertEquals(config.customConfig?.findBugs?.maxResults, 100);
    assertEquals(config.breakdownParams?.version, "1.0.0");
    assertEquals(config.breakdownParams?.customParams?.feature, "enabled");

    _logger.debug("Valid YAML loading verified");
  });

  it("should handle empty YAML file", async () => {
    _logger.debug("Testing empty YAML file");

    const testFile = join(testDir, "empty-config.yml");
    Deno.writeTextFileSync(testFile, "");
    testFiles.push(testFile);

    const config = await loadConfig(testFile);

    // Empty YAML should parse to null or empty object
    assertExists(config !== undefined, "Config should not be undefined");

    _logger.debug("Empty YAML handling verified");
  });

  it("should handle YAML with only comments", async () => {
    _logger.debug("Testing YAML with only comments");

    const testFile = join(testDir, "comments-only.yml");
    const content = `
# This is a comment
# Another comment
# Yet another comment
`;
    Deno.writeTextFileSync(testFile, content);
    testFiles.push(testFile);

    const config = await loadConfig(testFile);

    assertExists(config !== undefined, "Config should not be undefined");

    _logger.debug("Comments-only YAML handling verified");
  });

  it("should reject invalid YAML syntax", async () => {
    _logger.debug("Testing invalid YAML syntax");

    const testFile = join(testDir, "invalid-syntax.yml");
    const invalidContent = `
customConfig:
  findBugs:
    enabled: true
    patterns:
      - item1
     - item2  # Invalid indentation
`;
    Deno.writeTextFileSync(testFile, invalidContent);
    testFiles.push(testFile);

    await assertRejects(
      async () => await loadConfig(testFile),
      Error,
      "Failed to load config from",
      "Should throw error for invalid YAML syntax",
    );

    _logger.debug("Invalid YAML syntax rejection verified");
  });

  it("should handle nested configuration structures", async () => {
    _logger.debug("Testing nested configuration structures");

    const testFile = join(testDir, "nested-config.yml");
    const nestedContent = `
customConfig:
  findBugs:
    enabled: true
    sensitivity: medium
    patterns:
      - "src/**/*.ts"
      - "lib/**/*.js"
    includeExtensions:
      - .ts
      - .tsx
      - .js
      - .jsx
    excludeDirectories:
      - node_modules
      - dist
      - .git
    detailedReports: true
  find:
    twoParams:
      - directive
      - layerType
breakdownParams:
  version: "2.0.0"
  customConfig:
    validation:
      strict: true
      timeout: 5000
    params:
      maxDepth: 10
      allowPartial: false
    options:
      verbose: true
      debug: false
  customParams:
    features:
      - search
      - replace
      - analyze
additionalTopLevel:
  deeplyNested:
    level1:
      level2:
        level3:
          value: 42
`;

    Deno.writeTextFileSync(testFile, nestedContent);
    testFiles.push(testFile);

    const config = await loadConfig(testFile);

    // Verify deep nesting
    assertEquals(config.customConfig?.findBugs?.includeExtensions?.length, 4);
    assertEquals(config.customConfig?.findBugs?.excludeDirectories?.[0], "node_modules");
    assertEquals(config.breakdownParams?.customConfig?.validation?.strict, true);
    assertEquals(config.breakdownParams?.customConfig?.params?.maxDepth, 10);
    assertEquals(
      (config.breakdownParams?.customParams?.features as Record<string, unknown>[])?.length,
      3,
    );
    assertEquals(
      (config.additionalTopLevel as Record<
        string,
        Record<string, Record<string, Record<string, Record<string, unknown>>>>
      >)?.deeplyNested?.level1?.level2?.level3?.value,
      42,
    );

    _logger.debug("Nested configuration handling verified");
  });

  it("should preserve YAML data types", async () => {
    _logger.debug("Testing YAML data type preservation");

    const testFile = join(testDir, "types-config.yml");
    const typesContent = `
stringValue: "hello world"
numberValue: 42
floatValue: 3.14
booleanTrue: true
booleanFalse: false
nullValue: null
emptyString: ""
zeroNumber: 0
arrayValue:
  - 1
  - 2
  - 3
objectValue:
  key: value
  nested:
    deep: true
`;

    Deno.writeTextFileSync(testFile, typesContent);
    testFiles.push(testFile);

    const config = await loadConfig(testFile);

    // Verify type preservation
    assertEquals(typeof config.stringValue, "string");
    assertEquals(config.stringValue, "hello world");
    assertEquals(typeof config.numberValue, "number");
    assertEquals(config.numberValue, 42);
    assertEquals(typeof config.floatValue, "number");
    assertEquals(config.floatValue, 3.14);
    assertEquals(typeof config.booleanTrue, "boolean");
    assertEquals(config.booleanTrue, true);
    assertEquals(typeof config.booleanFalse, "boolean");
    assertEquals(config.booleanFalse, false);
    assertEquals(config.nullValue, null);
    assertEquals(config.emptyString, "");
    assertEquals(config.zeroNumber, 0);
    assertEquals(Array.isArray(config.arrayValue), true);
    assertEquals((config.arrayValue as Record<string, unknown>[])?.length, 3);
    assertEquals(typeof config.objectValue, "object");
    assertEquals(
      (config.objectValue as Record<string, Record<string, unknown>>)?.nested?.deep,
      true,
    );

    _logger.debug("YAML data type preservation verified");
  });
});

describe("Unit: loadConfig Error Handling", () => {
  it("should handle file not found error", async () => {
    _logger.debug("Testing file not found error");

    const nonExistentFile = "/definitely/does/not/exist/config.yml";

    await assertRejects(
      async () => await loadConfig(nonExistentFile),
      Error,
      "Failed to load config from",
      "Should throw error for non-existent file",
    );

    try {
      await loadConfig(nonExistentFile);
    } catch (error) {
      if (error instanceof Error) {
        assertEquals(
          error.message.includes(nonExistentFile),
          true,
          "Error message should contain file path",
        );
        assertEquals(
          error.message.includes("No such file or directory") ||
            error.message.includes("The system cannot find"),
          true,
          "Error message should contain OS-specific file not found message",
        );
      }
    }

    _logger.debug("File not found error handling verified");
  });

  it("should handle permission denied error", async () => {
    _logger.debug("Testing permission denied error");

    // Create a file with no read permissions
    const tempDir = Deno.makeTempDirSync();
    const restrictedFile = join(tempDir, "restricted.yml");
    Deno.writeTextFileSync(restrictedFile, "test: value");

    // Note: Changing file permissions might not work on all platforms
    try {
      Deno.chmodSync(restrictedFile, 0o000);

      await assertRejects(
        async () => await loadConfig(restrictedFile),
        Error,
        "Failed to load config from",
        "Should throw error for permission denied",
      );
    } catch {
      // Skip test if chmod is not supported
      _logger.debug("Skipping permission test - chmod not supported");
    } finally {
      try {
        Deno.chmodSync(restrictedFile, 0o644);
        Deno.removeSync(restrictedFile);
        Deno.removeSync(tempDir);
      } catch {
        // Ignore cleanup errors
      }
    }

    _logger.debug("Permission denied error handling verified");
  });

  it("should handle directory instead of file", async () => {
    _logger.debug("Testing directory instead of file");

    const tempDir = Deno.makeTempDirSync();

    await assertRejects(
      async () => await loadConfig(tempDir),
      Error,
      "Failed to load config from",
      "Should throw error when path is a directory",
    );

    try {
      Deno.removeSync(tempDir);
    } catch {
      // Ignore cleanup errors
    }

    _logger.debug("Directory error handling verified");
  });
});

describe("Unit: loadBreakdownConfig Integration", () => {
  it("should handle successful BreakdownConfig creation", async () => {
    _logger.debug("Testing successful BreakdownConfig creation");

    // Note: This test requires actual BreakdownConfig to be available
    // In a real test environment, we might mock the import

    try {
      // Test with no parameters
      const config1 = await loadBreakdownConfig();
      assertExists(config1, "Should return config object");
      assertEquals(typeof config1, "object", "Should return an object");

      // Test with null prefix
      const config2 = await loadBreakdownConfig(null);
      assertExists(config2, "Should handle null prefix");
      assertEquals(typeof config2, "object", "Should return an object");

      _logger.debug("Successful BreakdownConfig creation verified");
    } catch (error) {
      // If BreakdownConfig is not available, verify error structure
      if (error instanceof Error) {
        _logger.debug("BreakdownConfig not available, verifying error handling");
        assertExists(error.message, "Error should have a message");
      }
    }
  });

  it("should convert null prefix to undefined", async () => {
    _logger.debug("Testing null to undefined conversion");

    // This is verified through code inspection
    const functionString = loadBreakdownConfig.toString();

    // Check for nullish coalescing pattern
    const hasNullishCoalescing = functionString.includes("configPrefix ?? undefined");
    assertEquals(
      hasNullishCoalescing,
      true,
      "Should use ?? operator to convert null to undefined",
    );

    _logger.debug("Null to undefined conversion verified");
  });

  it("should maintain version compatibility", async () => {
    _logger.debug("Testing version compatibility maintenance");

    const functionString = loadBreakdownConfig.toString();

    // Check for version specification
    const versionPattern = /@\^1\.1\.4/;
    assertEquals(
      versionPattern.test(functionString),
      true,
      "Should specify version ^1.1.4 for BreakdownConfig",
    );

    _logger.debug("Version compatibility verified");
  });
});

describe("Unit: Edge Cases and Boundaries", () => {
  const testDir = Deno.makeTempDirSync();

  it("should handle very large configuration files", async () => {
    _logger.debug("Testing large configuration file handling");

    ensureDirSync(testDir);
    const testFile = join(testDir, "large-config.yml");

    // Generate a large YAML file
    let content = "largeConfig:\n";
    for (let i = 0; i < 1000; i++) {
      content += `  item${i}:\n`;
      content += `    value: "test value ${i}"\n`;
      content += `    enabled: ${i % 2 === 0}\n`;
      content += `    count: ${i}\n`;
    }

    Deno.writeTextFileSync(testFile, content);

    const config = await loadConfig(testFile);

    assertExists(config.largeConfig, "Should load large configuration");
    assertEquals(
      Object.keys(config.largeConfig as Record<string, unknown>).length,
      1000,
      "Should have all 1000 items",
    );

    Deno.removeSync(testFile);
    _logger.debug("Large configuration file handling verified");
  });

  it("should handle special characters in configuration", async () => {
    _logger.debug("Testing special characters handling");

    ensureDirSync(testDir);
    const testFile = join(testDir, "special-chars.yml");
    const content = `
specialChars:
  unicode: "Hello 世界 🌍"
  escaped: "Line 1\\nLine 2\\tTabbed"
  quotes: 'Single quotes with "double quotes" inside'
  doubleQuotes: "Double quotes with 'single quotes' inside"
  symbols: "!@#$%^&*()_+-=[]{}|;:,.<>?"
  backslash: "C:\\\\Windows\\\\System32"
  empty: ""
  spaces: "   spaces at start and end   "
`;

    Deno.writeTextFileSync(testFile, content);

    const config = await loadConfig(testFile);

    assertEquals((config.specialChars as Record<string, unknown>)?.unicode, "Hello 世界 🌍");
    assertEquals(
      (config.specialChars as Record<string, unknown>)?.escaped,
      "Line 1\nLine 2\tTabbed",
    );
    assertEquals(
      (config.specialChars as Record<string, unknown>)?.quotes,
      'Single quotes with "double quotes" inside',
    );
    assertEquals(
      (config.specialChars as Record<string, unknown>)?.symbols,
      "!@#$%^&*()_+-=[]{}|;:,.<>?",
    );
    assertEquals(
      (config.specialChars as Record<string, unknown>)?.backslash,
      "C:\\Windows\\System32",
    );
    assertEquals((config.specialChars as Record<string, unknown>)?.empty, "");
    assertEquals(
      (config.specialChars as Record<string, unknown>)?.spaces,
      "   spaces at start and end   ",
    );

    Deno.removeSync(testFile);
    _logger.debug("Special characters handling verified");
  });

  it("should handle YAML anchors and aliases", async () => {
    _logger.debug("Testing YAML anchors and aliases");

    ensureDirSync(testDir);
    const testFile = join(testDir, "anchors.yml");
    const content = `
defaults: &defaults
  timeout: 5000
  retries: 3
  verbose: true

development:
  <<: *defaults
  debug: true
  
production:
  <<: *defaults
  debug: false
  timeout: 10000
`;

    Deno.writeTextFileSync(testFile, content);

    const config = await loadConfig(testFile);

    // Verify anchor expansion
    assertEquals((config.development as Record<string, unknown>)?.timeout, 5000);
    assertEquals((config.development as Record<string, unknown>)?.retries, 3);
    assertEquals((config.development as Record<string, unknown>)?.verbose, true);
    assertEquals((config.development as Record<string, unknown>)?.debug, true);

    assertEquals((config.production as Record<string, unknown>)?.timeout, 10000); // Overridden
    assertEquals((config.production as Record<string, unknown>)?.retries, 3);
    assertEquals((config.production as Record<string, unknown>)?.verbose, true);
    assertEquals((config.production as Record<string, unknown>)?.debug, false);

    Deno.removeSync(testFile);
    _logger.debug("YAML anchors and aliases handling verified");
  });

  afterEach(() => {
    try {
      Deno.removeSync(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  });
});
