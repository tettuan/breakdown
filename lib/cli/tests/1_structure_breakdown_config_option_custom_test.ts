/**
 * Tests for BreakdownConfigOption CustomConfig functionality
 */

import { assertEquals, assertExists, assertRejects } from "@std/assert";
import {
  BreakdownConfigOption,
  CustomConfig,
  FullConfig,
} from "../../../lib/config/breakdown_config_option.ts";

Deno.test("BreakdownConfigOption - CustomConfig Functionality", async (t) => {
  await t.step("should allow setting and getting CustomConfig programmatically", () => {
    const option = new BreakdownConfigOption([]);

    const testConfig: CustomConfig = {
      enabled: true,
      findBugs: {
        enabled: true,
        sensitivity: "high",
        patterns: ["TODO", "FIXME"],
        includeExtensions: [".ts", ".js"],
        excludeDirectories: ["node_modules"],
        maxResults: 50,
        detailedReports: true,
      },
      find: {
        twoParams: ["bugs", "issues"],
      },
    };

    option.setCustomConfig(testConfig);

    // Test should pass since it's synchronously set
    assertEquals(option["customConfig"], testConfig);
  });

  await t.step("should provide correct type interfaces", () => {
    // Test that interfaces are properly exported and typed
    const customConfig: CustomConfig = {
      enabled: true,
      findBugs: {
        enabled: true,
        sensitivity: "medium",
      },
    };

    const fullConfig: FullConfig = {
      customConfig: customConfig,
      breakdownParams: {
        version: "1.0.0",
      },
    };

    assertExists(customConfig);
    assertExists(fullConfig);
    assertEquals(customConfig.enabled, true);
    assertEquals(fullConfig.customConfig?.enabled, true);
  });

  await t.step("should handle working directory parameter", () => {
    const workingDir = "/tmp/test";
    const option = new BreakdownConfigOption([], workingDir);

    // Check that working directory is stored
    assertEquals(option["workingDir"], workingDir);
  });

  await t.step("should handle undefined CustomConfig gracefully", async () => {
    const option = new BreakdownConfigOption([]);

    // Set empty config without specific sections
    const emptyConfig: CustomConfig = {};
    option.setCustomConfig(emptyConfig);

    // These should handle empty config gracefully
    const isEnabled = await option.isCustomConfigEnabled();
    const isFindBugsEnabled = await option.isFindBugsEnabled();
    const supportedParams = await option.getSupportedTwoParams();
    const isSupported = await option.isTwoParamSupported("bugs");

    assertEquals(isEnabled, false);
    assertEquals(isFindBugsEnabled, false);
    assertEquals(supportedParams, []);
    assertEquals(isSupported, false);
  });
});

Deno.test("BreakdownConfigOption - CustomConfig Methods", async (t) => {
  const testConfig: CustomConfig = {
    enabled: true,
    findBugs: {
      enabled: true,
      sensitivity: "medium",
      patterns: ["TODO", "FIXME", "HACK"],
      includeExtensions: [".ts", ".js", ".tsx"],
      excludeDirectories: ["node_modules", ".git"],
      maxResults: 100,
      detailedReports: true,
    },
    find: {
      twoParams: ["bugs", "issues", "todos"],
    },
  };

  await t.step("should check if CustomConfig is enabled", async () => {
    const option = new BreakdownConfigOption([]);
    option.setCustomConfig(testConfig);

    const isEnabled = await option.isCustomConfigEnabled();
    assertEquals(isEnabled, true);

    // Test with disabled config
    const disabledConfig = { ...testConfig, enabled: false };
    option.setCustomConfig(disabledConfig);

    const isDisabled = await option.isCustomConfigEnabled();
    assertEquals(isDisabled, false);
  });

  await t.step("should get findBugs configuration", async () => {
    const option = new BreakdownConfigOption([]);
    option.setCustomConfig(testConfig);

    const findBugsConfig = await option.getFindBugsConfig();
    assertExists(findBugsConfig);
    assertEquals(findBugsConfig.enabled, true);
    assertEquals(findBugsConfig.sensitivity, "medium");
    assertEquals(findBugsConfig.maxResults, 100);
    assertEquals(findBugsConfig.patterns?.includes("TODO"), true);
  });

  await t.step("should check if find-bugs is enabled", async () => {
    const option = new BreakdownConfigOption([]);
    option.setCustomConfig(testConfig);

    const isEnabled = await option.isFindBugsEnabled();
    assertEquals(isEnabled, true);

    // Test with disabled findBugs
    const disabledFindBugs = {
      ...testConfig,
      findBugs: { ...testConfig.findBugs!, enabled: false },
    };
    option.setCustomConfig(disabledFindBugs);

    const isDisabled = await option.isFindBugsEnabled();
    assertEquals(isDisabled, false);
  });

  await t.step("should get supported two-parameter commands", async () => {
    const option = new BreakdownConfigOption([]);
    option.setCustomConfig(testConfig);

    const supportedParams = await option.getSupportedTwoParams();
    assertEquals(Array.isArray(supportedParams), true);
    assertEquals(supportedParams.includes("bugs"), true);
    assertEquals(supportedParams.includes("issues"), true);
    assertEquals(supportedParams.includes("todos"), true);
  });

  await t.step("should check if specific two-parameter command is supported", async () => {
    const option = new BreakdownConfigOption([]);
    option.setCustomConfig(testConfig);

    const bugsSupported = await option.isTwoParamSupported("bugs");
    const issuesSupported = await option.isTwoParamSupported("issues");
    const unsupportedParam = await option.isTwoParamSupported("unsupported");

    assertEquals(bugsSupported, true);
    assertEquals(issuesSupported, true);
    assertEquals(unsupportedParam, false);
  });

  await t.step("should get find configuration", async () => {
    const option = new BreakdownConfigOption([]);
    option.setCustomConfig(testConfig);

    const findConfig = await option.getFindConfig();
    assertExists(findConfig);
    assertExists(findConfig.twoParams);
    assertEquals(Array.isArray(findConfig.twoParams), true);
    assertEquals(findConfig.twoParams.length, 3);
  });
});

Deno.test("BreakdownConfigOption - Error Handling", async (t) => {
  await t.step("should handle BreakdownConfig loading errors gracefully", async () => {
    const option = new BreakdownConfigOption(["--config=nonexistent"]);

    // This should handle the error when BreakdownConfig can't load
    await assertRejects(
      async () => {
        await option.loadBreakdownConfig();
      },
      Error,
      "Failed to load BreakdownConfig",
    );
  });

  await t.step("should handle missing CustomConfig sections", async () => {
    const option = new BreakdownConfigOption([]);

    // Set config without specific sections
    const minimalConfig: CustomConfig = {};
    option.setCustomConfig(minimalConfig);

    const findBugsConfig = await option.getFindBugsConfig();
    const findConfig = await option.getFindConfig();

    assertEquals(findBugsConfig, undefined);
    assertEquals(findConfig, undefined);

    // These should still work with undefined sections
    const isEnabled = await option.isCustomConfigEnabled();
    const isFindBugsEnabled = await option.isFindBugsEnabled();
    const supportedParams = await option.getSupportedTwoParams();

    assertEquals(isEnabled, false);
    assertEquals(isFindBugsEnabled, false);
    assertEquals(supportedParams, []);
  });
});
