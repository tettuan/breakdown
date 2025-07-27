/**
 * @fileoverview Example usage of unified configuration interface
 *
 * This file demonstrates how to use the unified configuration interface
 * with various scenarios and integration patterns.
 *
 * @module config/unified_config_example
 */

import { CONFIG_PRESETS, UnifiedConfigInterface } from "./unified_config_interface.ts";
import { createFactoryWithUnifiedConfig, UnifiedFactoryBuilder } from "./factory_integration.ts";
import type { PromptCliParams } from "../factory/prompt_variables_factory.ts";

/**
 * Example 1: Basic usage with default configuration
 */
async function example1_basicUsage() {
  console.log("=== Example 1: Basic Usage ===");

  const configResult = await UnifiedConfigInterface.create();

  if (!configResult.ok) {
    console.error("Failed to create config:", configResult.error);
    return;
  }

  const config = configResult.data;

  // Access configuration values
  console.log("Profile:", config.getConfig().profile.name);
  console.log("Working Directory:", config.getConfig().paths.workingDirectory);
  console.log("Directive Types:", config.getConfig().patterns.directiveTypes);
  console.log("Layer Types:", config.getConfig().patterns.layerTypes);

  // Use get method for specific values
  const logLevel = config.get<string>("environment.logLevel");
  console.log("Log Level:", logLevel);

  // Check if configuration has specific paths
  console.log("Has debug mode?", config.has("app.features.debugMode"));
}

/**
 * Example 2: Create with specific profile and environment
 */
async function example2_profileAndEnvironment() {
  console.log("\n=== Example 2: Profile and Environment ===");

  const configResult = await UnifiedConfigInterface.create({
    profile: "production",
    ...CONFIG_PRESETS.production,
  });

  if (!configResult.ok) {
    console.error("Failed to create config:", configResult.error);
    return;
  }

  const config = configResult.data;
  console.log("Environment:", config.getConfig().profile.environment);
  console.log("Log Level:", config.getConfig().environment.logLevel);
  console.log("Color Output:", config.getConfig().environment.colorOutput);
}

/**
 * Example 3: Integration with PromptVariablesFactory
 */
async function example3_factoryIntegration() {
  console.log("\n=== Example 3: Factory Integration ===");

  const cliParams: PromptCliParams = {
    directiveType: "to",
    layerType: "project",
    options: {
      fromFile: "input.md",
      destinationFile: "output.md",
      customVariables: {
        title: "My Project",
        author: "Test User",
      },
    },
  };

  // Method 1: Direct factory creation
  const factoryResult = await createFactoryWithUnifiedConfig(cliParams, {
    profile: "default",
  });

  if (!factoryResult.ok) {
    console.error("Failed to create factory:", factoryResult.error);
    return;
  }

  console.log("Factory created successfully");
  const factory = factoryResult.data;
  console.log("Resolved paths:", factory.getAllParams());
}

/**
 * Example 4: Using UnifiedFactoryBuilder
 */
async function example4_factoryBuilder() {
  console.log("\n=== Example 4: Factory Builder ===");

  // Create unified configuration
  const configResult = await UnifiedConfigInterface.create();
  if (!configResult.ok) {
    console.error("Failed to create config:", configResult.error);
    return;
  }

  // Create factory builder
  const builder = new UnifiedFactoryBuilder(configResult.data);

  // Build factory with CLI params
  const cliParams: PromptCliParams = {
    directiveType: "summary",
    layerType: "issue",
    options: {
      adaptation: "detailed",
      fromFile: "task_notes.md", // Use fromFile instead of fromLayerType
    },
  };

  const factoryResult = await builder.buildPromptVariablesFactory(cliParams);
  if (!factoryResult.ok) {
    console.error("Failed to build factory:", factoryResult.error);
    return;
  }

  console.log("Factory built successfully");

  // Access pattern provider
  const patternProvider = builder.getPatternProvider();
  const patternsResult = await patternProvider.getAllPatterns();
  if (patternsResult.ok) {
    console.log("Available patterns:", patternsResult.data);
  } else {
    console.error("Failed to get patterns:", patternsResult.error);
  }
}

/**
 * Example 5: Profile switching
 */
async function example5_profileSwitching() {
  console.log("\n=== Example 5: Profile Switching ===");

  // Start with default profile
  const configResult = await UnifiedConfigInterface.create();
  if (!configResult.ok) {
    console.error("Failed to create config:", configResult.error);
    return;
  }

  const config = configResult.data;

  // List available profiles
  const profiles = await config.getAvailableProfiles();
  console.log("Available profiles:", profiles);

  // Switch to different profile (if available)
  if (profiles.includes("development")) {
    const switchResult = await config.switchProfile("development");
    if (switchResult.ok) {
      console.log("Switched to development profile");
      const devConfig = switchResult.data;
      console.log("Dev log level:", devConfig.get("environment.logLevel"));
    }
  }
}

/**
 * Example 6: Configuration validation
 */
async function example6_validation() {
  console.log("\n=== Example 6: Configuration Validation ===");

  const configResult = await UnifiedConfigInterface.create();
  if (!configResult.ok) {
    console.error("Failed to create config:", configResult.error);
    return;
  }

  const config = configResult.data;

  // Validate configuration
  const validationResult = config.validate();
  if (validationResult.ok) {
    console.log("Configuration is valid");
  } else {
    console.error("Configuration validation failed:", validationResult.error);
  }

  // Export configuration for debugging
  const exported = config.export();
  console.log("Exported config (first 200 chars):", exported.substring(0, 200) + "...");
}

/**
 * Example 7: Custom path overrides
 */
async function example7_pathOverrides() {
  console.log("\n=== Example 7: Path Overrides ===");

  const configResult = await UnifiedConfigInterface.create({
    pathOverrides: {
      promptBaseDir: "/custom/prompts",
      schemaBaseDir: "/custom/schemas",
      outputBaseDir: "/custom/output",
    },
  });

  if (!configResult.ok) {
    console.error("Failed to create config:", configResult.error);
    return;
  }

  const config = configResult.data;
  const paths = config.getConfig().paths;

  console.log("Custom paths:");
  console.log("  Prompt base:", paths.promptBaseDir);
  console.log("  Schema base:", paths.schemaBaseDir);
  console.log("  Output base:", paths.outputBaseDir);
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  try {
    await example1_basicUsage();
    await example2_profileAndEnvironment();
    await example3_factoryIntegration();
    await example4_factoryBuilder();
    await example5_profileSwitching();
    await example6_validation();
    await example7_pathOverrides();
  } catch (error) {
    console.error("Error running examples:", error);
  }
}

// Main entry point for testing
if (import.meta.main) {
  await runAllExamples();
}
