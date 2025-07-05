/**
 * @fileoverview Tests for unified configuration interface
 */

import { assertEquals, assertExists, assert } from "../deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { UnifiedConfigInterface, CONFIG_PRESETS } from "../../lib/config/unified_config_interface.ts";
import { FactoryConfigAdapter, ConfigurationMigrator } from "../../lib/config/factory_integration.ts";

Deno.test("UnifiedConfigInterface - create with default profile", async () => {
  const logger = new BreakdownLogger("unified-config-test");
  const result = await UnifiedConfigInterface.create();
  
  logger.debug("Create result", "テスト結果の確認", { 
    ok: result.ok, 
    error: result.ok ? null : result.error 
  });
  
  assert(result.ok, `Should create successfully, but got: ${JSON.stringify(result)}`);
  if (result.ok) {
    const config = result.data.getConfig();
    
    assertEquals(config.profile.name, "default");
    assertEquals(config.profile.source, "default");
    assertExists(config.paths.workingDirectory);
    assertExists(config.patterns.directiveTypes);
    assertExists(config.patterns.layerTypes);
  }
});

Deno.test("UnifiedConfigInterface - create with development preset", async () => {
  const result = await UnifiedConfigInterface.create({
    ...CONFIG_PRESETS.development,
  });
  
  assert(result.ok, "Should create with development preset");
  if (result.ok) {
    const config = result.data.getConfig();
    
    assertEquals(config.environment.logLevel, "debug");
    assertEquals(config.environment.colorOutput, true);
  }
});

Deno.test("UnifiedConfigInterface - get configuration values by path", async () => {
  const result = await UnifiedConfigInterface.create();
  
  assert(result.ok);
  if (result.ok) {
    const configInterface = result.data;
    
    // Test get method
    const logLevel = configInterface.get<string>("environment.logLevel");
    assertExists(logLevel);
    assert(["debug", "info", "warn", "error"].includes(logLevel));
    
    // Test has method
    assert(configInterface.has("environment.logLevel"));
    assert(configInterface.has("paths.workingDirectory"));
    assert(!configInterface.has("nonexistent.path"));
    
    // Test nested access
    const features = configInterface.get("app.features");
    assertExists(features);
    assert(typeof features === "object");
  }
});

Deno.test("UnifiedConfigInterface - validate configuration", async () => {
  const result = await UnifiedConfigInterface.create();
  
  assert(result.ok);
  if (result.ok) {
    const validateResult = result.data.validate();
    assert(validateResult.ok, "Default configuration should be valid");
  }
});

Deno.test("FactoryConfigAdapter - convert unified to factory config", async () => {
  const unifiedResult = await UnifiedConfigInterface.create();
  assert(unifiedResult.ok);
  
  if (unifiedResult.ok) {
    const unified = unifiedResult.data.getConfig();
    const factoryConfig = FactoryConfigAdapter.toFactoryConfig(unified);
    
    // Check conversion
    assertEquals((factoryConfig.app_prompt as any)?.base_dir, unified.paths.promptBaseDir);
    assertEquals((factoryConfig.app_schema as any)?.base_dir, unified.paths.schemaBaseDir);
    assertEquals(factoryConfig.features, unified.app.features);
    assertEquals(factoryConfig.environment, unified.environment);
  }
});

Deno.test("ConfigurationMigrator - migrate old format", () => {
  const oldConfig = {
    app_prompt: { base_dir: "old/prompts" },
    app_schema: { base_dir: "old/schemas" },
    extended_thinking: true,
    debug_mode: false,
    log_level: "debug",
    color_output: true,
  };
  
  const migrated = ConfigurationMigrator.migrateConfig(oldConfig);
  
  // Check migration
  assertEquals((migrated.paths as any)?.promptBaseDir, "old/prompts");
  assertEquals((migrated.paths as any)?.schemaBaseDir, "old/schemas");
  assertEquals((migrated.features as any)?.extendedThinking, true);
  assertEquals((migrated.features as any)?.debugMode, false);
  assertEquals((migrated.environment as any)?.logLevel, "debug");
  assertEquals((migrated.environment as any)?.colorOutput, true);
});

Deno.test("ConfigurationMigrator - validate migration", () => {
  // Valid migration
  const validConfig = {
    paths: { workingDirectory: "/test" },
    patterns: { directiveTypes: ["to"], layerTypes: ["project"] },
  };
  const validErrors = ConfigurationMigrator.validateMigration(validConfig);
  assertEquals(validErrors.length, 0);
  
  // Invalid migration
  const invalidConfig = { someKey: "value" };
  const invalidErrors = ConfigurationMigrator.validateMigration(invalidConfig);
  assert(invalidErrors.length > 0);
  assert(invalidErrors.some(e => e.includes("paths")));
});

Deno.test("UnifiedConfigInterface - export configuration", async () => {
  const result = await UnifiedConfigInterface.create();
  
  assert(result.ok);
  if (result.ok) {
    const exported = result.data.export();
    assert(typeof exported === "string");
    
    const parsed = JSON.parse(exported);
    assertExists(parsed.profile);
    assertExists(parsed.paths);
    assertExists(parsed.patterns);
    assertExists(parsed.app);
    assertExists(parsed.environment);
  }
});

Deno.test("UnifiedConfigInterface - environment detection", async () => {
  // Test with different environments
  const envs = ["development", "production", "test"];
  
  for (const env of envs) {
    // Set environment variable
    const originalEnv = Deno.env.get("DENO_ENV");
    Deno.env.set("DENO_ENV", env);
    
    try {
      const result = await UnifiedConfigInterface.create();
      assert(result.ok);
      
      if (result.ok) {
        const config = result.data.getConfig();
        assertEquals(config.profile.environment, env === "test" ? "test" : env);
      }
    } finally {
      // Restore original environment
      if (originalEnv) {
        Deno.env.set("DENO_ENV", originalEnv);
      } else {
        Deno.env.delete("DENO_ENV");
      }
    }
  }
});