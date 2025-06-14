/**
 * @fileoverview Integration tests for BreakdownConfigOption and CLI integration
 * Tests the complete flow from CLI argument parsing to config loading and application
 */

import { assertEquals, assertExists, assertStringIncludes } from "@std/assert";
import { BreakdownConfigOption } from "../../../lib/config/breakdown_config_option.ts";

Deno.test("CLI Config Integration Tests", async (t) => {
  // Create a temporary test directory
  const testDir = await Deno.makeTempDir();
  const configDir = `${testDir}/.agent/breakdown/config`;

  // Ensure we're working from the correct directory
  const originalCwd = Deno.cwd();

  try {
    // Create the config directory structure
    await Deno.mkdir(configDir, { recursive: true });

    // Copy production config files from the project
    const projectConfigDir = "/Users/tettuan/github/breakdown/config";
    await Deno.copyFile(
      `${projectConfigDir}/production-app.yml`,
      `${configDir}/production-app.yml`,
    );
    await Deno.copyFile(
      `${projectConfigDir}/production-user.yml`,
      `${configDir}/production-user.yml`,
    );

    Deno.chdir(testDir);

    await t.step("should parse --config=production argument correctly", () => {
      const args = ["find", "bugs", "--config=production"];
      const configOption = new BreakdownConfigOption(args);

      assertEquals(configOption.hasConfigOption(), true);
      assertEquals(configOption.getConfigPrefix(), "production");
    });

    await t.step("should load production-user.yml with --config=production", async () => {
      const args = ["find", "bugs", "--config=production"];
      const configOption = new BreakdownConfigOption(args);

      await configOption.loadBreakdownConfig();
      const customConfig = await configOption.getCustomConfig();

      assertExists(customConfig);
      assertEquals(customConfig.enabled, true);
      assertExists(customConfig.findBugs);
      assertEquals(customConfig.findBugs.enabled, true);
      assertEquals(customConfig.findBugs.sensitivity, "medium");
    });

    await t.step("should support find bugs command with CustomConfig", async () => {
      const args = ["find", "bugs", "--config=production"];
      const configOption = new BreakdownConfigOption(args);

      await configOption.loadBreakdownConfig();

      assertEquals(await configOption.isFindBugsEnabled(), true);
      assertEquals(await configOption.isTwoParamSupported("bugs"), true);

      const findBugsConfig = await configOption.getFindBugsConfig();
      assertExists(findBugsConfig);
      assertEquals(findBugsConfig.patterns?.includes("TODO"), true);
      assertEquals(findBugsConfig.patterns?.includes("FIXME"), true);
      assertEquals(findBugsConfig.maxResults, 100);
    });

    await t.step("should load full configuration structure", async () => {
      const args = ["find", "bugs", "--config=production"];
      const configOption = new BreakdownConfigOption(args);

      await configOption.loadBreakdownConfig();
      const fullConfig = await configOption.getFullConfig();

      assertExists(fullConfig);
      assertExists(fullConfig.customConfig);
      assertExists(fullConfig.breakdownParams);

      // Verify customConfig section
      assertEquals(fullConfig.customConfig.enabled, true);
      assertExists(fullConfig.customConfig.findBugs);

      // Verify breakdownParams section
      assertExists(fullConfig.breakdownParams.customConfig);
      assertExists(fullConfig.breakdownParams.customConfig.params);
    });

    await t.step("should handle missing config file gracefully", async () => {
      const args = ["find", "bugs", "--config=nonexistent"];
      const configOption = new BreakdownConfigOption(args);

      let errorThrown = false;
      try {
        await configOption.loadBreakdownConfig();
      } catch (error) {
        errorThrown = true;
        assertStringIncludes((error as Error).message, "not found");
      }

      assertEquals(errorThrown, true);
    });

    await t.step("should work without config option", async () => {
      const args = ["find", "bugs"];
      const configOption = new BreakdownConfigOption(args);

      assertEquals(configOption.hasConfigOption(), false);
      assertEquals(configOption.getConfigPrefix(), undefined);

      // When no config option is provided, findBugs should be disabled by default
      // This may throw an error if no base config exists, which is expected behavior
      try {
        const result = await configOption.isFindBugsEnabled();
        assertEquals(result, false);
      } catch (error) {
        // Expected behavior when no config files exist
        assertStringIncludes((error as Error).message, "Failed to");
      }
    });

    await t.step("should parse -c short form", () => {
      const args = ["find", "bugs", "-c", "production"];
      const configOption = new BreakdownConfigOption(args);

      assertEquals(configOption.hasConfigOption(), true);
      assertEquals(configOption.getConfigPrefix(), "production");
    });

    await t.step("should parse -c=production format", () => {
      const args = ["find", "bugs", "-c=production"];
      const configOption = new BreakdownConfigOption(args);

      assertEquals(configOption.hasConfigOption(), true);
      assertEquals(configOption.getConfigPrefix(), "production");
    });

    await t.step("should validate CustomConfig findBugs settings", async () => {
      const args = ["find", "bugs", "--config=production"];
      const configOption = new BreakdownConfigOption(args);

      await configOption.loadBreakdownConfig();
      const findBugsConfig = await configOption.getFindBugsConfig();

      assertExists(findBugsConfig);

      // Verify all expected configuration values
      assertEquals(findBugsConfig.enabled, true);
      assertEquals(findBugsConfig.sensitivity, "medium");
      assertEquals(Array.isArray(findBugsConfig.patterns), true);
      assertEquals(Array.isArray(findBugsConfig.includeExtensions), true);
      assertEquals(Array.isArray(findBugsConfig.excludeDirectories), true);
      assertEquals(findBugsConfig.maxResults, 100);
      assertEquals(findBugsConfig.detailedReports, true);

      // Verify specific patterns
      const expectedPatterns = ["TODO", "FIXME", "HACK", "BUG", "XXX", "DEPRECATED"];
      expectedPatterns.forEach((pattern) => {
        assertEquals(findBugsConfig.patterns?.includes(pattern), true);
      });

      // Verify include extensions
      const expectedExtensions = [".ts", ".js", ".tsx", ".jsx", ".md"];
      expectedExtensions.forEach((ext) => {
        assertEquals(findBugsConfig.includeExtensions?.includes(ext), true);
      });
    });

    await t.step("should support two-param command validation", async () => {
      const args = ["find", "bugs", "--config=production"];
      const configOption = new BreakdownConfigOption(args);

      await configOption.loadBreakdownConfig();

      const supportedParams = await configOption.getSupportedTwoParams();
      assertExists(supportedParams);
      assertEquals(supportedParams.includes("bugs"), true);

      assertEquals(await configOption.isTwoParamSupported("bugs"), true);
      assertEquals(await configOption.isTwoParamSupported("nonexistent"), false);
    });
  } finally {
    // Cleanup: restore original working directory and remove temp dir
    Deno.chdir(originalCwd);
    try {
      await Deno.remove(testDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});
