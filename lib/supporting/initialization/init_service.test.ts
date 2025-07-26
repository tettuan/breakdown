/**
 * Test for InitService functionality
 * Verifies that initialization_defaults.ts is properly used
 */

import { assertEquals, assertExists } from "@std/assert";
import { join } from "@std/path";
import { exists } from "@std/fs";
import { InitService } from "./init_service.ts";
import { INITIALIZATION_DEFAULTS } from "../../config/initialization_defaults.ts";

Deno.test("InitService - 1_behavior: INITIALIZATION_DEFAULTS usage verification", async () => {
  const tempDir = await Deno.makeTempDir();
  const initService = new InitService();

  try {
    const result = await initService.initialize({
      workspaceDirectory: tempDir,
      configProfile: "test",
      force: true,
    });

    // Debug output if initialization failed
    if (!result.success) {
      console.error("❌ Initialization failed:", result.message);
      console.error("❌ Created directories:", result.createdDirectories);
      console.error("❌ Created files:", result.createdFiles);
    }

    // Verify initialization succeeded
    assertEquals(result.success, true, `Initialization should succeed. Error: ${result.message}`);
    assertEquals(result.configProfile, "test");
    assertEquals(result.workspaceDirectory, tempDir);

    // Verify that directories are created based on INITIALIZATION_DEFAULTS
    const expectedDirectories = [
      "config",
      "output",
      "input",
      "tmp",
      "prompts",
      "schema",
    ];

    for (const dir of expectedDirectories) {
      const dirPath = join(tempDir, dir);
      const dirExists = await exists(dirPath);
      assertEquals(dirExists, true, `Directory ${dir} should exist`);
    }

    // Verify that directive and layer type directories are created
    const directiveTypes = INITIALIZATION_DEFAULTS.sampleValues.directiveTypes;
    const layerTypes = INITIALIZATION_DEFAULTS.sampleValues.layerTypes;

    for (const directive of directiveTypes) {
      const promptDirPath = join(tempDir, "prompts", directive);
      const schemaDirPath = join(tempDir, "schema", directive);

      assertEquals(
        await exists(promptDirPath),
        true,
        `Prompt directory for ${directive} should exist`,
      );
      assertEquals(
        await exists(schemaDirPath),
        true,
        `Schema directory for ${directive} should exist`,
      );

      for (const layer of layerTypes) {
        const promptLayerPath = join(tempDir, "prompts", directive, layer);
        const schemaLayerPath = join(tempDir, "schema", directive, layer);

        assertEquals(
          await exists(promptLayerPath),
          true,
          `Prompt layer directory ${directive}/${layer} should exist`,
        );
        assertEquals(
          await exists(schemaLayerPath),
          true,
          `Schema layer directory ${directive}/${layer} should exist`,
        );
      }
    }

    // Verify config files are created
    const appConfigPath = join(tempDir, "config", "test-app.yml");
    const userConfigPath = join(tempDir, "config", "test-user.yml");

    assertEquals(await exists(appConfigPath), true, "App config file should exist");
    assertEquals(await exists(userConfigPath), true, "User config file should exist");

    // Verify user config contains values from INITIALIZATION_DEFAULTS
    const userConfigContent = await Deno.readTextFile(userConfigPath);

    for (const directive of directiveTypes) {
      assertEquals(
        userConfigContent.includes(directive),
        true,
        `User config should contain directive type: ${directive}`,
      );
    }

    for (const layer of layerTypes) {
      assertEquals(
        userConfigContent.includes(layer),
        true,
        `User config should contain layer type: ${layer}`,
      );
    }

    console.log("✅ INITIALIZATION_DEFAULTS is correctly used by InitService");
    console.log(`✅ Created ${result.createdDirectories.length} directories`);
    console.log(`✅ Created ${result.createdFiles.length} files`);
  } finally {
    // Cleanup
    try {
      await Deno.remove(tempDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
  }
});

Deno.test("InitService - 2_structure: Verify INITIALIZATION_DEFAULTS structure", () => {
  // Verify the structure of INITIALIZATION_DEFAULTS
  assertExists(INITIALIZATION_DEFAULTS.minimalPatterns, "minimalPatterns should exist");
  assertExists(
    INITIALIZATION_DEFAULTS.minimalPatterns.directiveType,
    "directiveType pattern should exist",
  );
  assertExists(INITIALIZATION_DEFAULTS.minimalPatterns.layerType, "layerType pattern should exist");

  assertExists(INITIALIZATION_DEFAULTS.sampleValues, "sampleValues should exist");
  assertExists(
    INITIALIZATION_DEFAULTS.sampleValues.directiveTypes,
    "directiveTypes array should exist",
  );
  assertExists(INITIALIZATION_DEFAULTS.sampleValues.layerTypes, "layerTypes array should exist");

  // Verify sample values are arrays with content
  assertEquals(
    Array.isArray(INITIALIZATION_DEFAULTS.sampleValues.directiveTypes),
    true,
    "directiveTypes should be array",
  );
  assertEquals(
    Array.isArray(INITIALIZATION_DEFAULTS.sampleValues.layerTypes),
    true,
    "layerTypes should be array",
  );
  assertEquals(
    INITIALIZATION_DEFAULTS.sampleValues.directiveTypes.length > 0,
    true,
    "directiveTypes should not be empty",
  );
  assertEquals(
    INITIALIZATION_DEFAULTS.sampleValues.layerTypes.length > 0,
    true,
    "layerTypes should not be empty",
  );

  console.log("✅ INITIALIZATION_DEFAULTS structure is valid");
  console.log(
    `✅ Contains ${INITIALIZATION_DEFAULTS.sampleValues.directiveTypes.length} directive types`,
  );
  console.log(`✅ Contains ${INITIALIZATION_DEFAULTS.sampleValues.layerTypes.length} layer types`);
});
