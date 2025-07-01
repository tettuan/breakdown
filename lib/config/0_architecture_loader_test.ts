/**
 * Architecture tests for Configuration Loader
 * 
 * Tests architectural constraints and dependencies:
 * - External dependency isolation
 * - Error handling patterns
 * - Interface contracts
 * - Module boundaries
 * 
 * @module config/loader_architecture_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import * as mod from "./loader.ts";

const logger = new BreakdownLogger("loader-architecture");

describe("Architecture: Configuration Loader Module Structure", () => {
  it("should export required public interfaces", () => {
    logger.debug("Testing module exports");
    
    // Required exports
    assertExists(mod.loadConfig, "loadConfig function must be exported");
    assertExists(mod.loadBreakdownConfig, "loadBreakdownConfig function must be exported");
    assertEquals(typeof mod.loadConfig, "function", "loadConfig must be a function");
    assertEquals(typeof mod.loadBreakdownConfig, "function", "loadBreakdownConfig must be a function");
    
    // Interface export check
    // Note: TypeScript interfaces are compile-time only, CustomConfig existence verified through usage
    logger.debug("Module structure verification completed");
  });

  it("should maintain proper dependency boundaries", () => {
    logger.debug("Testing dependency boundaries");
    
    // loadConfig should only depend on std/yaml
    // This is verified by checking function signature and behavior
    const loadConfigString = mod.loadConfig.toString();
    assertEquals(
      loadConfigString.includes("Deno.readTextFile"),
      true,
      "loadConfig should use Deno.readTextFile for file access"
    );
    assertEquals(
      loadConfigString.includes("parse"),
      true,
      "loadConfig should use YAML parse function"
    );
    
    // loadBreakdownConfig should dynamically import BreakdownConfig
    const loadBreakdownConfigString = mod.loadBreakdownConfig.toString();
    assertEquals(
      loadBreakdownConfigString.includes("import("),
      true,
      "loadBreakdownConfig should use dynamic import"
    );
    assertEquals(
      loadBreakdownConfigString.includes("@tettuan/breakdownconfig"),
      true,
      "loadBreakdownConfig should import from @tettuan/breakdownconfig"
    );
    
    logger.debug("Dependency boundaries verification completed");
  });

  it("should follow consistent error handling patterns", () => {
    logger.debug("Testing error handling patterns");
    
    // Both functions should be async
    assertEquals(
      mod.loadConfig.constructor.name,
      "AsyncFunction",
      "loadConfig should be an async function"
    );
    assertEquals(
      mod.loadBreakdownConfig.constructor.name,
      "AsyncFunction",
      "loadBreakdownConfig should be an async function"
    );
    
    // Error handling pattern verification through function structure
    const loadConfigString = mod.loadConfig.toString();
    assertEquals(
      loadConfigString.includes("try"),
      true,
      "loadConfig should use try-catch for error handling"
    );
    assertEquals(
      loadConfigString.includes("catch"),
      true,
      "loadConfig should have catch block"
    );
    assertEquals(
      loadConfigString.includes("throw new Error"),
      true,
      "loadConfig should throw Error instances"
    );
    
    const loadBreakdownConfigString = mod.loadBreakdownConfig.toString();
    assertEquals(
      loadBreakdownConfigString.includes("throw new Error"),
      true,
      "loadBreakdownConfig should throw Error instances on failure"
    );
    
    logger.debug("Error handling patterns verification completed");
  });

  it("should maintain clean separation of concerns", () => {
    logger.debug("Testing separation of concerns");
    
    // loadConfig: File I/O + YAML parsing
    // loadBreakdownConfig: External library integration
    
    // Functions should have single responsibilities
    const loadConfigParams = mod.loadConfig.length;
    assertEquals(
      loadConfigParams,
      1,
      "loadConfig should take exactly one parameter (filePath)"
    );
    
    const loadBreakdownConfigParams = mod.loadBreakdownConfig.length;
    assertEquals(
      loadBreakdownConfigParams,
      2,
      "loadBreakdownConfig should take two parameters (configPrefix, workingDir)"
    );
    
    logger.debug("Separation of concerns verification completed");
  });

  it("should provide type-safe configuration interfaces", () => {
    logger.debug("Testing type-safe interfaces");
    
    // CustomConfig interface should support expected structure
    const testConfig: mod.CustomConfig = {
      customConfig: {
        findBugs: {
          enabled: true,
          sensitivity: "high",
          patterns: ["*.ts"],
          includeExtensions: [".ts", ".js"],
          excludeDirectories: ["node_modules"],
          maxResults: 100,
          detailedReports: true,
        },
        find: {
          twoParams: ["param1", "param2"],
        },
      },
      breakdownParams: {
        version: "1.0.0",
        customConfig: {
          validation: { key: "value" },
          params: { key: "value" },
          options: { key: "value" },
        },
        customParams: { key: "value" },
      },
      additionalKey: "additionalValue",
    };
    
    // Verify interface allows expected properties
    assertExists(testConfig.customConfig, "CustomConfig should allow customConfig");
    assertExists(testConfig.breakdownParams, "CustomConfig should allow breakdownParams");
    assertExists(testConfig.additionalKey, "CustomConfig should allow additional properties");
    
    logger.debug("Type-safe interfaces verification completed");
  });
});

describe("Architecture: Configuration Loader Integration Points", () => {
  it("should provide proper abstraction over external dependencies", () => {
    logger.debug("Testing external dependency abstraction");
    
    // loadConfig abstracts Deno file system and YAML parsing
    // loadBreakdownConfig abstracts BreakdownConfig library
    
    // Verify functions return Promises (async abstraction)
    // Test function signatures without executing them
    assertEquals(
      mod.loadConfig.constructor.name,
      "AsyncFunction", 
      "loadConfig should be an async function that returns a Promise"
    );
    assertEquals(
      mod.loadBreakdownConfig.constructor.name,
      "AsyncFunction",
      "loadBreakdownConfig should be an async function that returns a Promise"
    );
    
    logger.debug("External dependency abstraction verification completed");
  });

  it("should maintain version compatibility with BreakdownConfig", () => {
    logger.debug("Testing version compatibility");
    
    // Check that version is specified in import
    const loadBreakdownConfigString = mod.loadBreakdownConfig.toString();
    const versionMatch = loadBreakdownConfigString.match(/@\^(\d+\.\d+\.\d+)/);
    
    assertExists(versionMatch, "BreakdownConfig import should specify version");
    if (versionMatch) {
      const version = versionMatch[1];
      assertEquals(
        version,
        "1.1.4",
        "Should use BreakdownConfig version 1.1.4 as specified in versions.ts"
      );
    }
    
    logger.debug("Version compatibility verification completed");
  });
});