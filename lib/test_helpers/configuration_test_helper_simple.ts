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
   * Load test configuration for a given profile
   *
   * @param profileName - Configuration profile name
   * @returns Configuration result with userConfig
   */
  static async loadTestConfiguration(profileName: string) {
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
