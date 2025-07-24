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
    const agentConfigDir = join(cwd, ".agent", "breakdown", "config");
    
    // Create .agent/breakdown/config directory if it doesn't exist
    await ensureDir(agentConfigDir);
    
    // Copy config files from project config/ to .agent/breakdown/config/
    const projectConfigDir = join(cwd, "config");
    try {
      // Get list of config files
      const entries = Deno.readDir(projectConfigDir);
      for await (const entry of entries) {
        if (entry.isFile && entry.name.endsWith('.yml')) {
          const sourceFile = join(projectConfigDir, entry.name);
          const targetFile = join(agentConfigDir, entry.name);
          
          // Check if target file already exists and is up to date
          try {
            const [sourceContent, targetStat] = await Promise.all([
              Deno.readTextFile(sourceFile),
              Deno.stat(targetFile).catch(() => null)
            ]);
            
            // Copy if target doesn't exist or source is newer
            if (!targetStat) {
              await Deno.writeTextFile(targetFile, sourceContent);
            }
          } catch {
            // If we can't read source file, skip it
            continue;
          }
        }
      }
    } catch {
      // If we can't read project config directory, skip setup
      // This allows tests to run with fallback behavior
    }
  }

  /**
   * Load test configuration for a given profile
   *
   * @param profileName - Configuration profile name
   * @returns Configuration result with userConfig
   */
  static async loadTestConfiguration(profileName: string) {
    // Ensure .agent directory is set up for BreakdownConfig
    await ConfigurationTestHelper.ensureAgentDirectorySetup();
    
    const profile = ConfigProfile.create(profileName);
    const rawUserConfig = await loadUserConfig(profile);

    // Type assertion with testData interface
    const userConfig = rawUserConfig as UserConfigWithTestData;

    return {
      userConfig,
      profile,
    };
  }
}
