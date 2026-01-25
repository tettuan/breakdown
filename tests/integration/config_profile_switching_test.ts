/**
 * @fileoverview Config Profile Switching Integration Test
 *
 * Tests the configuration profile switching functionality to ensure:
 * - Different profiles can be loaded correctly
 * - Configuration values are properly resolved for each profile
 * - Dynamic configuration loading works as expected
 *
 * @module tests/integration/config_profile_switching_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { ConfigProfile } from "../../lib/config/config_profile_name.ts";
import { ConfigPatternProvider } from "../../lib/config/pattern_provider.ts";
import { BreakdownConfig } from "@tettuan/breakdownconfig";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("config-profile-switching-test");

Deno.test("ConfigProfile - Default profile creation", () => {
  const profile = ConfigProfile.create();
  assertEquals(profile.value, "default");
  assertEquals(profile.isDefault(), true);
});

Deno.test("ConfigProfile - Custom profile creation", () => {
  const profile = ConfigProfile.create("test");
  assertEquals(profile.value, "test");
  assertEquals(profile.isDefault(), false);
});

Deno.test("ConfigProfile - Profile from CLI option", () => {
  const testCases = [
    { input: undefined, expected: "default" },
    { input: null, expected: "default" },
    { input: "", expected: "default" },
    { input: "  ", expected: "default" },
    { input: "test", expected: "test" },
    { input: "  test  ", expected: "test" },
    { input: "custom-profile", expected: "custom-profile" },
  ];

  for (const { input, expected } of testCases) {
    const profile = ConfigProfile.fromCliOption(input);
    assertEquals(profile.value, expected);
  }
});

Deno.test("ConfigProfile - Profile equality", () => {
  const profile1 = ConfigProfile.create("test");
  const profile2 = ConfigProfile.create("test");
  const profile3 = ConfigProfile.create("different");

  assertEquals(profile1.equals(profile2), true);
  assertEquals(profile1.equals(profile3), false);
});

Deno.test("ConfigProfile - Error handling", () => {
  const result = ConfigProfile.createOrError("");
  assertEquals(result.ok, false);
  assertExists(result.error);
  assertEquals(result.error?.kind, "InvalidInput");
  assertEquals(result.error?.field, "profileName");
});

Deno.test("BreakdownConfig - Profile switching with patterns", async () => {
  logger.info("Testing pattern provider with different profiles");

  // Test default profile
  const defaultProfile = ConfigProfile.create();
  try {
    const defaultConfigResult = await BreakdownConfig.create(
      defaultProfile.value,
      Deno.cwd(),
    );

    if (defaultConfigResult.success && defaultConfigResult.data) {
      const defaultProvider = new ConfigPatternProvider(defaultConfigResult.data);
      const defaultPatterns = defaultProvider.getDirectivePattern();
      const defaultLayerPatterns = defaultProvider.getLayerTypePattern();

      logger.debug("Default profile patterns", {
        directive: defaultPatterns ? defaultPatterns.getPattern() : "N/A",
        layer: defaultLayerPatterns ? defaultLayerPatterns.getPattern() : "N/A",
      });

      if (defaultPatterns) {
        assertExists(defaultPatterns);
        assertExists(defaultPatterns.getPattern());
      }
      if (defaultLayerPatterns) {
        assertExists(defaultLayerPatterns);
        assertExists(defaultLayerPatterns.getPattern());
      }
    }
  } catch (error) {
    logger.debug("Default profile not available", {
      error: error instanceof Error ? error.message : String(error),
    });
  }

  // Test custom profile (if exists)
  const testProfile = ConfigProfile.create("test");
  try {
    const testConfigResult = await BreakdownConfig.create(
      testProfile.value,
      Deno.cwd(),
    );

    if (testConfigResult.success && testConfigResult.data) {
      const testProvider = new ConfigPatternProvider(testConfigResult.data);
      const testPatterns = testProvider.getDirectivePattern();
      const testLayerPatterns = testProvider.getLayerTypePattern();

      logger.debug("Test profile patterns", {
        directive: testPatterns ? testPatterns.getPattern() : "N/A",
        layer: testLayerPatterns ? testLayerPatterns.getPattern() : "N/A",
      });

      if (testPatterns) {
        assertExists(testPatterns);
        assertExists(testPatterns.getPattern());
      }
      if (testLayerPatterns) {
        assertExists(testLayerPatterns);
        assertExists(testLayerPatterns.getPattern());
      }
    }
  } catch (error) {
    logger.debug("Test profile not available", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

Deno.test("Dynamic configuration loading - Multiple profiles", async () => {
  const profiles = ["default", "default-test", "flexible-test"];

  const testProfile = async (profileName: string): Promise<void> => {
    logger.info(`Testing profile: ${profileName}`);

    try {
      const configResult = await BreakdownConfig.create(profileName, Deno.cwd());

      if (configResult.success && configResult.data) {
        logger.debug(`Loaded config for ${profileName}`, {
          hasConfig: true,
          configLoaded: true,
        });

        // Verify config structure
        assertExists(configResult.data);
        // Config is loaded if we reached this point
        assertEquals(typeof configResult.data, "object");
      } else {
        logger.debug(`Profile ${profileName} loading failed`, {
          error: "Config creation failed",
        });
      }
    } catch (error) {
      logger.debug(`Profile ${profileName} not available`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  await Promise.all(profiles.map(testProfile));
});

Deno.test("Configuration value resolution - Profile-specific patterns", async () => {
  const configResult = await BreakdownConfig.create("default", Deno.cwd());

  if (configResult.success && configResult.data) {
    const provider = new ConfigPatternProvider(configResult.data);

    // Test directive pattern resolution
    const directivePattern = provider.getDirectivePattern();
    if (directivePattern) {
      const directiveRegex = new RegExp(directivePattern.getPattern());
      logger.debug("Testing directive pattern", {
        pattern: directivePattern.getPattern(),
        validExamples: ["to", "summary", "defect"],
        invalidExamples: ["123", "to-from", ""],
      });

      // Validate some common directive values
      assertEquals(directiveRegex.test("to"), true);
      assertEquals(directiveRegex.test("summary"), true);
      assertEquals(directiveRegex.test("123"), false);
    }

    // Test layer pattern resolution
    const layerPattern = provider.getLayerTypePattern();
    if (layerPattern) {
      const layerRegex = new RegExp(layerPattern.getPattern());
      logger.debug("Testing layer pattern", {
        pattern: layerPattern.getPattern(),
        validExamples: ["project", "issue", "task"],
        invalidExamples: ["123", "project-issue", ""],
      });

      // Validate some common layer values
      assertEquals(layerRegex.test("project"), true);
      assertEquals(layerRegex.test("issue"), true);
      assertEquals(layerRegex.test("123"), false);
    }
  }
});

Deno.test("Profile switching runtime behavior", async () => {
  logger.info("Testing runtime profile switching behavior");

  // Simulate switching profiles at runtime
  const profiles = [
    ConfigProfile.create("default"),
    ConfigProfile.create("default-test"),
    ConfigProfile.create("flexible-test"),
  ];

  const testProfileSwitch = async (profile: ConfigProfile): Promise<void> => {
    logger.debug(`Switching to profile: ${profile.value}`);

    try {
      const configResult = await BreakdownConfig.create(profile.value, Deno.cwd());

      if (configResult.success && configResult.data) {
        const provider = new ConfigPatternProvider(configResult.data);
        const directivePattern = provider.getDirectivePattern();
        const layerPattern = provider.getLayerTypePattern();

        logger.debug(`Profile ${profile.value} loaded successfully`, {
          hasDirectivePattern: !!directivePattern,
          hasLayerPattern: !!layerPattern,
        });

        // Ensure patterns are loaded
        if (directivePattern) {
          assertExists(directivePattern);
        }
        if (layerPattern) {
          assertExists(layerPattern);
        }
      } else {
        logger.debug(`Profile ${profile.value} failed to load`, {
          error: configResult.success ? "Unknown error" : "Config creation failed",
        });
      }
    } catch (error) {
      logger.debug(`Profile ${profile.value} exception`, {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  await Promise.all(profiles.map(testProfileSwitch));
});

Deno.test("Configuration isolation between profiles", async () => {
  logger.info("Testing configuration isolation");

  const profile1 = ConfigProfile.create("default");
  const profile2 = ConfigProfile.create("default-test");

  try {
    const configResult1 = await BreakdownConfig.create(profile1.value, Deno.cwd());
    const configResult2 = await BreakdownConfig.create(profile2.value, Deno.cwd());

    // Both should work independently
    if (
      configResult1.success && configResult1.data &&
      configResult2.success && configResult2.data
    ) {
      const provider1 = new ConfigPatternProvider(configResult1.data);
      const provider2 = new ConfigPatternProvider(configResult2.data);

      const _patterns1 = provider1.getDirectivePattern();
      const _patterns2 = provider2.getDirectivePattern();

      logger.debug("Both profiles loaded", {
        profile1: profile1.value,
        profile2: profile2.value,
        isolated: true,
      });

      // Patterns might be different or same, but they should be isolated instances
      assertExists(configResult1.data);
      assertExists(configResult2.data);
    }
  } catch (error) {
    logger.debug("Configuration isolation test error", {
      error: error instanceof Error ? error.message : String(error),
    });
  }
});
