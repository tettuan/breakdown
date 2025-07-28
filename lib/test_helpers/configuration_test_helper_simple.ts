/**
 * @fileoverview Simple Configuration Test Helper
 *
 * Provides basic configuration loading functionality for tests
 * without the complexity of the original ConfigurationTestHelper.
 *
 * @module lib/test_helpers/configuration_test_helper_simple
 */

import { ConfigProfile } from "../config/config_profile_name.ts";
import { loadUserConfig } from "../config/user_config_loader.ts";
import { ensureDir } from "@std/fs";
import { join } from "@std/path";
import { DEFAULT_CONFIG_DIR } from "../config/constants.ts";
import { parse } from "@std/yaml";

/**
 * Test data interface for type safety
 */
interface TestData {
  validDirectives: string[];
  validLayers: string[];
  invalidDirectives: string[];
  invalidLayers: string[];
}

/**
 * User config interface with testData
 */
interface UserConfigWithTestData {
  testData: TestData;
  [key: string]: unknown;
}

/**
 * Simple Configuration Test Helper
 *
 * Replaces the original ConfigurationTestHelper with basic functionality
 * to support existing test files without major refactoring.
 */
export class ConfigurationTestHelper {
  /**
   * Ensure .agent directory structure exists for tests
   * This setup is required for BreakdownConfig to work properly in test environments
   */
  private static async ensureAgentDirectorySetup(): Promise<void> {
    const cwd = Deno.cwd?.() || ".";
    const agentConfigDir = join(cwd, DEFAULT_CONFIG_DIR);

    // Create workspace config directory if it doesn't exist
    await ensureDir(agentConfigDir);

    // Copy config files from test fixtures to workspace config directory
    const fixturesConfigDir = join(cwd, "tests", "fixtures", "configs");
    try {
      // Get list of config files from test fixtures
      const entries = Deno.readDir(fixturesConfigDir);
      for await (const entry of entries) {
        if (entry.isFile && entry.name.endsWith(".yml")) {
          const sourceFile = join(fixturesConfigDir, entry.name);
          const targetFile = join(agentConfigDir, entry.name);

          // Always copy the file to ensure it exists and is up to date
          try {
            const sourceContent = await Deno.readTextFile(sourceFile);
            await Deno.writeTextFile(targetFile, sourceContent);
          } catch (error) {
            // Log error but continue with other files
            console.warn(`Failed to copy config file ${entry.name}:`, error);
          }
        }
      }
    } catch (error) {
      // Log setup error but don't fail - some tests may have pre-existing configs
      console.warn("Failed to setup agent directory:", error);
    }
  }

  /**
   * Load test configuration for a given profile
   *
   * @param profileName - Configuration profile name
   * @returns Configuration result with userConfig and appConfig
   */
  static async loadTestConfiguration(profileName: string) {
    // Ensure .agent directory is set up for BreakdownConfig
    await ConfigurationTestHelper.ensureAgentDirectorySetup();

    const profile = ConfigProfile.create(profileName);
    const rawUserConfig = await loadUserConfig(profile);

    // Type assertion with testData interface
    const userConfig = rawUserConfig as UserConfigWithTestData;

    // Load app config to get working_dir and other app-level settings
    let appConfig: Record<string, unknown> = {};
    try {
      const cwd = Deno.cwd?.() || ".";
      const appConfigPath = join(cwd, DEFAULT_CONFIG_DIR, `${profileName}-app.yml`);
      const appConfigContent = await Deno.readTextFile(appConfigPath);
      appConfig = parse(appConfigContent) as Record<string, unknown>;
    } catch {
      // If app config doesn't exist, use empty object
      appConfig = {};
    }

    // Merge configs, with userConfig taking precedence
    const mergedConfig = {
      ...appConfig,
      ...userConfig,
      // Ensure critical app config fields are preserved
      working_dir: appConfig.working_dir || userConfig.working_dir || ".",
      app_prompt: appConfig.app_prompt || userConfig.app_prompt,
      app_schema: appConfig.app_schema || userConfig.app_schema,
    };

    return {
      userConfig: mergedConfig as UserConfigWithTestData,
      profile,
      appConfig,
      rawUserConfig: userConfig,
    };
  }
}
