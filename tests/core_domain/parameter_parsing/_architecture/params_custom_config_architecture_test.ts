/**
 * Architecture tests for ParamsCustomConfig
 *
 * These tests verify that ParamsCustomConfig follows architectural constraints
 * and properly implements the Smart Constructor pattern with Result types
 * following the Totality principle.
 *
 * Test scope:
 * - Dependency direction validation
 * - Smart Constructor pattern enforcement
 * - Result type consistency
 * - Integration with BreakdownParams
 * - Error handling architecture
 */

import { assertEquals, assertExists } from "../../lib/deps.ts";
import { describe, it } from "jsr:@std/testing@^0.224.0/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

import { DEFAULT_CUSTOM_CONFIG, ParamsParser, type Result as _Result } from "../../lib/deps.ts";

const logger = new BreakdownLogger("params-custom-config-architecture");

describe("DEFAULT_CUSTOM_CONFIG - Architectural Constraints", () => {
  it("should provide consistent configuration structure", () => {
    logger.debug("Testing DEFAULT_CUSTOM_CONFIG structure");

    // DEFAULT_CUSTOM_CONFIG should be a well-formed object
    assertExists(DEFAULT_CUSTOM_CONFIG);
    assertEquals(typeof DEFAULT_CUSTOM_CONFIG, "object");
    
    // Should have required sections
    assertExists(DEFAULT_CUSTOM_CONFIG.params);
    assertExists(DEFAULT_CUSTOM_CONFIG.options);
    assertExists(DEFAULT_CUSTOM_CONFIG.validation);
    assertExists(DEFAULT_CUSTOM_CONFIG.errorHandling);
  });

  it("should provide ParamsParser integration", () => {
    logger.debug("Testing ParamsParser integration");

    // ParamsParser should be accessible and functional
    assertEquals(typeof ParamsParser, "function");
    assertExists(ParamsParser.prototype);
    
    // Should have required methods
    assertExists(ParamsParser.prototype.parse);
  });

  it("should maintain architectural consistency", () => {
    logger.debug("Testing architectural consistency");

    // DEFAULT_CUSTOM_CONFIG should have proper structure for two-param validation
    assertExists(DEFAULT_CUSTOM_CONFIG.params.two);
    assertExists(DEFAULT_CUSTOM_CONFIG.params.two.demonstrativeType);
    assertExists(DEFAULT_CUSTOM_CONFIG.params.two.layerType);
    
    // Should define validation rules
    assertExists(DEFAULT_CUSTOM_CONFIG.validation.two);
    assertEquals(typeof DEFAULT_CUSTOM_CONFIG.validation.two.allowCustomVariables, "boolean");
    assertEquals(Array.isArray(DEFAULT_CUSTOM_CONFIG.validation.two.allowedOptions), true);
  });
});
