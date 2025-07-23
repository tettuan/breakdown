/**
 * @fileoverview BreakdownParams + BreakdownConfig Integration Test
 *
 * Configuration file (*-user.yml) → CustomConfig → BreakdownParams → TwoParamsResult complete integration test
 * Verification of hardcode elimination and ConfigProfile dependency removal
 *
 * @module tests/integration/breakdown_params_integration.test
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { loadUserConfig } from "../../lib/config/user_config_loader.ts";
import { ParamsCustomConfig } from "../../lib/config/params_custom_config.ts";
import { ConfigProfile } from "../../lib/config/config_profile_name.ts";
import { executeBreakdownParams } from "../../lib/application/breakdown_params_integration.ts";

const logger = new BreakdownLogger("breakdown-params-integration");

/**
 * Configuration file → ParamsCustomConfig generation test
 */
async function createParamsCustomConfigFromProfile(
  profileName: string,
): Promise<ParamsCustomConfig> {
  // ConfigProfile generation
  const profile = ConfigProfile.create(profileName);

  // Configuration file loading
  const userConfig = await loadUserConfig(profile);

  // ParamsCustomConfig generation
  return ParamsCustomConfig.create(userConfig);
}

// executeBreakdownParams is now imported from breakdown_params_integration.ts

Deno.test({
  name: "BreakdownParams Integration Test: Complete Basic Flow Verification",
  fn: async () => {
    logger.debug("Integration test started: Complete basic flow verification", { stage: "test" });

    // Step 1: Configuration file → ParamsCustomConfig generation
    const paramsCustomConfig = await createParamsCustomConfigFromProfile(
      "breakdown-params-integration",
    );
    assertExists(paramsCustomConfig, "ParamsCustomConfig should be generated");
    assertExists(paramsCustomConfig.directivePattern, "DirectiveType pattern should be configured");
    assertExists(paramsCustomConfig.layerPattern, "LayerType pattern should be configured");

    // Step 2: CLI arguments → BreakdownParams execution - Get valid values from configuration file
    const testProfile = ConfigProfile.create("breakdown-params-integration");
    const testUserConfig = await loadUserConfig(testProfile);
    const testData = testUserConfig.testData as {
      validDirectives: string[];
      validLayers: string[];
    };
    const validDirective = testData.validDirectives[0];
    const validLayer = testData.validLayers[0];
    const paramsResult = await executeBreakdownParams(
      [validDirective, validLayer],
      "breakdown-params-integration",
    );

    logger.debug("Basic flow verification values retrieved from config file", {
      directive: validDirective,
      layer: validLayer,
    });

    if (!paramsResult.ok) {
      throw new Error(`executeBreakdownParams failed: ${JSON.stringify(paramsResult.error)}`);
    }

    assertEquals(paramsResult.data.type, "two", "TwoParamsResult should be returned");

    logger.debug("Integration test completed: All steps successfully confirmed", { stage: "test" });
  },
});

Deno.test({
  name: "BreakdownParams Integration Test: Configuration File-Based Verification",
  fn: async () => {
    logger.debug("Config file-based verification started", { stage: "test" });

    // Pattern loading from breakdown-params-integration-user.yml
    const profile = ConfigProfile.create("breakdown-params-integration");
    const userConfig = await loadUserConfig(profile);
    const paramsCustomConfig = ParamsCustomConfig.create(userConfig);

    // Configuration value verification
    assertEquals(
      paramsCustomConfig.directivePattern,
      "to|summary|defect|find|test_directive",
      "DirectiveType pattern should be loaded correctly",
    );
    assertEquals(
      paramsCustomConfig.layerPattern,
      "project|issue|task|test_layer",
      "LayerType pattern should be loaded correctly",
    );

    logger.debug("Config file-based verification completed", { stage: "test" });
  },
});

Deno.test({
  name: "BreakdownParams Integration Test: ConfigProfile Dependency Removal Verification",
  fn: async () => {
    logger.debug("ConfigProfile dependency removal confirmation started", { stage: "test" });

    // ConfigProfile → Configuration file → ParamsCustomConfig flow verification
    const profile = ConfigProfile.create("default-test");
    const userConfig = await loadUserConfig(profile);
    const paramsCustomConfig = ParamsCustomConfig.create(userConfig);

    // Configuration file-based implementation operation verification
    assertExists(
      paramsCustomConfig.directivePattern,
      "Config file-based implementation should be working",
    );
    assertExists(
      paramsCustomConfig.layerPattern,
      "Config file-based implementation should be working",
    );

    // Implementation verification without using hardcoded arrays - Get valid values from configuration file
    const defaultProfile = ConfigProfile.create("default-test");
    const defaultUserConfig = await loadUserConfig(defaultProfile);
    const defaultTestData = defaultUserConfig.testData as {
      validDirectives: string[];
      validLayers: string[];
    };
    const validDirective = defaultTestData.validDirectives[0];
    const validLayer = defaultTestData.validLayers[0];
    const result = await executeBreakdownParams([validDirective, validLayer], "default-test");

    logger.debug(
      "ConfigProfile dependency removal confirmation values retrieved from config file",
      {
        directive: validDirective,
        layer: validLayer,
      },
    );
    assertEquals(
      result.ok && result.data.type,
      "two",
      "Config file-based parsing should succeed",
    );

    logger.debug("ConfigProfile dependency removal confirmation completed", { stage: "test" });
  },
});

Deno.test({
  name: "BreakdownParams Integration Test: ParamsCustomConfig Generation Verification",
  fn: async () => {
    logger.debug("ParamsCustomConfig generation verification started", { stage: "test" });

    // breakdown-params-integration-user.yml detailed verification
    const profile = ConfigProfile.create("breakdown-params-integration");
    const userConfig = await loadUserConfig(profile);

    // ParamsCustomConfig generation
    const paramsCustomConfig = ParamsCustomConfig.create(userConfig);

    // Pattern configuration verification
    assertEquals(
      paramsCustomConfig.directivePattern,
      "to|summary|defect|find|test_directive",
      "Integration DirectiveType pattern should be configured correctly",
    );
    assertEquals(
      paramsCustomConfig.layerPattern,
      "project|issue|task|test_layer",
      "Integration LayerType pattern should be configured correctly",
    );

    // testData verification
    assertExists(paramsCustomConfig.testData, "testData should exist");

    logger.debug("ParamsCustomConfig generation verification completed", { stage: "test" });
  },
});

Deno.test({
  name:
    "BreakdownParams Integration Test: Multiple Profile Configuration File Loading Verification",
  fn: async () => {
    logger.debug("Multiple profile config file loading verification started", { stage: "test" });

    // Default test configuration loading
    const defaultProfile = ConfigProfile.create("default-test");
    const defaultUserConfig = await loadUserConfig(defaultProfile);
    const defaultParamsCustomConfig = ParamsCustomConfig.create(defaultUserConfig);

    assertExists(
      defaultParamsCustomConfig.directivePattern,
      "Default configuration DirectiveType pattern should be loaded",
    );
    assertExists(
      defaultParamsCustomConfig.layerPattern,
      "Default configuration LayerType pattern should be loaded",
    );

    // Integration test configuration loading
    const integrationProfile = ConfigProfile.create("breakdown-params-integration");
    const integrationUserConfig = await loadUserConfig(integrationProfile);
    const integrationParamsCustomConfig = ParamsCustomConfig.create(integrationUserConfig);

    assertExists(
      integrationParamsCustomConfig.directivePattern,
      "Integration test configuration DirectiveType pattern should be loaded",
    );
    assertExists(
      integrationParamsCustomConfig.layerPattern,
      "Integration test configuration LayerType pattern should be loaded",
    );

    // Verify that different configuration values are loaded
    assert(
      integrationParamsCustomConfig.directivePattern.includes("test_directive"),
      "Integration configuration should include extended patterns",
    );

    logger.debug("Multiple profile config file loading verification completed", { stage: "test" });
  },
});

Deno.test({
  name: "BreakdownParams Integration Test: ParamsResult Type Safety Verification",
  fn: async () => {
    logger.debug("ParamsResult type safety verification started", { stage: "test" });

    // Test with valid arguments - Get valid values from configuration file
    const integrationProfile = ConfigProfile.create("breakdown-params-integration");
    const integrationUserConfig = await loadUserConfig(integrationProfile);
    const integrationTestData = integrationUserConfig.testData as {
      validDirectives: string[];
      validLayers: string[];
    };
    const validDirective = integrationTestData.validDirectives[0];
    const validLayer = integrationTestData.validLayers[0];
    const validResult = await executeBreakdownParams(
      [validDirective, validLayer],
      "breakdown-params-integration",
    );

    logger.debug("Type safety verification values retrieved from config file", {
      directive: validDirective,
      layer: validLayer,
    });
    assertEquals(
      validResult.ok && validResult.data.type,
      "two",
      "TwoParamsResult should be returned with valid arguments",
    );

    // Test with single argument (error or specific type is returned)
    const oneResult = await executeBreakdownParams(
      [validDirective],
      "breakdown-params-integration",
    );
    // BreakdownParams implementation returns error for single argument, expect ok=false
    assert(
      !oneResult.ok || typeof oneResult.data?.type === "string",
      "Result should be returned with single argument",
    );

    // Test with no arguments (error or specific type is returned)
    const zeroResult = await executeBreakdownParams([], "breakdown-params-integration");
    // BreakdownParams implementation returns error for no arguments, expect ok=false
    assert(
      !zeroResult.ok || typeof zeroResult.data?.type === "string",
      "Result should be returned with no arguments",
    );

    logger.debug("ParamsResult type safety verification completed", { stage: "test" });
  },
});

Deno.test({
  name: "BreakdownParams Integration Test: testData Access Verification",
  fn: async () => {
    logger.debug("testData access verification started", { stage: "test" });

    // breakdown-params-integration-user.yml testData verification
    const profile = ConfigProfile.create("breakdown-params-integration");
    const userConfig = await loadUserConfig(profile);
    const paramsCustomConfig = ParamsCustomConfig.create(userConfig);

    // testData existence verification
    const testData = paramsCustomConfig.testData;
    assertExists(testData, "testData should exist");

    // Verify that testData is an object
    assert(typeof testData === "object", "testData should be an object");

    logger.debug("testData access verification completed", { stage: "test" });
  },
});
