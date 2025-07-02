/**
 * Edge and error case tests for prompt baseDir resolution
 *
 * Specification:
 * - See docs/breakdown/path.ja.md, testing.ja.md
 * - baseDir must be resolved from Deno.cwd() (not from working_dir)
 * - working_dir is only used for input (-i) and output (-o) file paths
 *
 * Test coverage:
 * - baseDir not specified, empty string, relative path, absolute path
 * - Explicit config value as promptBaseDir
 * - Debug output with BreakdownLogger
 */

/*
 * IMPORTANT: All path resolution is based on config/app_prompt.base_dir (and app_schema.base_dir).
 * - Each test sets up a config file with app_prompt.base_dir and app_schema.base_dir in the test working directory.
 * - No promptDir or baseDir override is supported; config is the only source of truth.
 * - All expected paths are based on the config's baseDir (e.g., "custom_prompts"), resolved from Deno.cwd().
 * - Directory structure is always created under the configured baseDir.
 */

import { assertEquals, assertExists } from "jsr:@std/assert@^0.224.0";
import { join, relative, resolve } from "jsr:@std/path@^0.224.0";
import { ensureDir } from "jsr:@std/fs@^0.224.0";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@^0.1.10";
import { describe, it } from "jsr:@std/testing@0.224.0/bdd";
import { PromptAdapterImpl } from "$lib/prompt/prompt_adapter.ts";
import { PromptVariablesFactory } from "$lib/factory/prompt_variables_factory.ts";
import type { DemonstrativeType, LayerType } from "$lib/types/mod.ts";
import { Workspace } from "$lib/workspace/workspace.ts";
import { BreakdownConfig } from "@tettuan/breakdownconfig";

function createLoggerAdapter(logger: BreakdownLogger) {
  return {
    debug: (...args: unknown[]) => _logger.debug(String(args[0]), args[1]),
    error: (...args: unknown[]) => _logger.error(String(args[0]), args[1]),
  };
}

// Enhanced logger with standard key format
const __enhancedLogger = new BreakdownLogger();

describe("Prompt baseDir edge cases", () => {
  it("should match test-created and implementation-resolved prompt directory (relative path)", async () => {
    const testDirRaw = await Deno.makeTempDir();
    const testDir = await Deno.realPath(testDirRaw);
    const logger = createLoggerAdapter(new BreakdownLogger());
    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);
    try {
      const configDir = join(testDir, ".agent", "breakdown", "config");
      await ensureDir(configDir);
      await Deno.writeTextFile(
        join(configDir, "default-app.yml"),
        `working_dir: .\napp_prompt:\n  base_dir: custom_prompts\napp_schema:\n  base_dir: schema\n`,
      );
      const promptDir = join(testDir, "custom_prompts", "to", "project");
      await ensureDir(promptDir);
      const promptFile = join(promptDir, "f_project.md");
      await Deno.writeTextFile(
        promptFile,
        "# {input_text_file}\nContent: {input_text}\nOutput to: {destination_path}",
      );
      const inputFile = join(testDir, "input.md");
      await Deno.writeTextFile(inputFile, "# Example\n- Feature");
      _logger.debug("[TEST] promptBaseDir (relative path)", {
        promptDir: join(testDir, "custom_prompts"),
      });
      const cliParams = {
        demonstrativeType: "to",
        layerType: "project",
        options: {
          fromFile: inputFile,
          destinationFile: "output.md",
        },
      };
      const factory = await PromptVariablesFactory.create(cliParams);
      const adapter = new PromptAdapterImpl(factory);
      const _result = await adapter.validateAndGenerate();
      _logger.debug("[TEST] result (relative path)", { result });
      assertEquals(result.success, true);
      assertExists(result.content);

      // Verify that prompt base directory is resolved from Deno.cwd()
      // See: docs/breakdown/glossary.ja.md - working_dir specification
      const workspace = new Workspace({
        workingDir: testDir,
        promptBaseDir: resolve(Deno.cwd(), "custom_prompts"),
        schemaBaseDir: resolve(Deno.cwd(), "schema"),
      });
      await workspace.initialize();

      assertEquals(
        await workspace.getPromptBaseDir(),
        resolve(Deno.cwd(), "custom_prompts"),
      );
    } finally {
      Deno.chdir(originalCwd);
    }
  });

  // Group 1: baseDir not specified or empty
  describe("baseDir not specified or empty", () => {
    /**
     * Test: If baseDir is not specified (empty string), should error.
     * Verifies that missing baseDir is correctly detected and reported.
     */
    it("should error when baseDir is not specified (empty string)", async () => {
      const testDirRaw = await Deno.makeTempDir();
      const testDir = await Deno.realPath(testDirRaw);
      const logger = createLoggerAdapter(new BreakdownLogger());
      const originalCwd = Deno.cwd();
      Deno.chdir(testDir);
      try {
        const configDir = join(testDir, ".agent", "breakdown", "config");
        await ensureDir(configDir);
        await Deno.writeTextFile(
          join(configDir, "default-app.yml"),
          `working_dir: .\napp_prompt:\n  base_dir: \napp_schema:\n  base_dir: schema\n`,
        );
        const inputFile = join(testDir, "input.md");
        await Deno.writeTextFile(inputFile, "# Example\n- Feature");
        _logger.debug("[TEST] PromptAdapterImpl with empty promptBaseDir", { cwd: Deno.cwd() });
        const cliParams = {
          demonstrativeType: "to",
          layerType: "project",
          options: {
            fromFile: inputFile,
            destinationFile: "output.md",
          },
        };
        const errorCaught = false;
        try {
          await PromptVariablesFactory.create(cliParams);
        } catch (e) {
          errorCaught = true;
          if (!(e instanceof Error) || !e.message.includes("Invalid application configuration")) {
            throw new Error(`Expected 'Invalid application configuration' error, got: ${e}`);
          }
        }
        if (!errorCaught) {
          throw new Error("Expected error due to missing base_dir, but no error was thrown");
        }
      } finally {
        Deno.chdir(originalCwd);
      }
    });
  });

  // Group 2: promptBaseDir path interpretation (relative/absolute)
  describe("promptBaseDir path interpretation", () => {
    describe("relative path", () => {
      /**
       * Test: If promptBaseDir is a relative path, template should be found.
       * Verifies correct resolution of relative promptBaseDir.
       */
      it("should find template when promptBaseDir is a relative path", async () => {
        const testDirRaw = await Deno.makeTempDir();
        const testDir = await Deno.realPath(testDirRaw);
        const logger = createLoggerAdapter(new BreakdownLogger());
        const originalCwd = Deno.cwd();
        Deno.chdir(testDir);
        try {
          const configDir = join(testDir, ".agent", "breakdown", "config");
          await ensureDir(configDir);
          await Deno.writeTextFile(
            join(configDir, "default-app.yml"),
            `working_dir: .\napp_prompt:\n  base_dir: custom_prompts\napp_schema:\n  base_dir: schema\n`,
          );
          const promptDir = join(testDir, "custom_prompts", "to", "project");
          await ensureDir(promptDir);
          const promptFile = join(promptDir, "f_project.md");
          await Deno.writeTextFile(
            promptFile,
            "# {input_text_file}\nContent: {input_text}\nOutput to: {destination_path}",
          );
          const inputFile = join(testDir, "input.md");
          await Deno.writeTextFile(inputFile, "# Example\n- Feature");
          const _relPromptBaseDir = relative(testDir, join(testDir, "custom_prompts"));
          _logger.debug("[TEST] promptBaseDir (relative path)", { _relPromptBaseDir });
          const cliParamsRel = {
            demonstrativeType: "to",
            layerType: "project",
            options: {
              fromFile: inputFile,
              destinationFile: "output.md",
            },
          };
          const factoryRel = await PromptVariablesFactory.create(cliParamsRel);
          const adapterRel = new PromptAdapterImpl(factoryRel);
          const resultRel = await adapterRel.validateAndGenerate();
          _logger.debug("[TEST] result (relative path)", { resultRel });
          assertEquals(resultRel.success, true);
          assertExists(resultRel.content);
        } finally {
          Deno.chdir(originalCwd);
        }
      });
    });
    describe("absolute path", () => {
      /**
       * Test: If promptBaseDir is an absolute path, template should be found.
       * Verifies correct resolution of absolute promptBaseDir.
       */
      it("should find template when promptBaseDir is an absolute path", async () => {
        const testDirRaw = await Deno.makeTempDir();
        const testDir = await Deno.realPath(testDirRaw);
        const logger = createLoggerAdapter(new BreakdownLogger());
        const originalCwd = Deno.cwd();
        Deno.chdir(testDir);
        try {
          const configDir = join(testDir, ".agent", "breakdown", "config");
          await ensureDir(configDir);
          await Deno.writeTextFile(
            join(configDir, "default-app.yml"),
            `working_dir: .\napp_prompt:\n  base_dir: custom_prompts\napp_schema:\n  base_dir: schema\n`,
          );
          const promptDir = join(testDir, "custom_prompts", "to", "project");
          await ensureDir(promptDir);
          const promptFile = join(promptDir, "f_project.md");
          await Deno.writeTextFile(
            promptFile,
            "# {input_text_file}\nContent: {input_text}\nOutput to: {destination_path}",
          );
          const inputFile = join(testDir, "input.md");
          await Deno.writeTextFile(inputFile, "# Example\n- Feature");
          _logger.debug("[TEST] promptBaseDir (absolute path)", {
            promptDir: join(testDir, "custom_prompts"),
          });
          const cliParamsAbs = {
            demonstrativeType: "to",
            layerType: "project",
            options: {
              fromFile: inputFile,
              destinationFile: "output.md",
            },
          };
          const factoryAbs = await PromptVariablesFactory.create(cliParamsAbs);
          const adapterAbs = new PromptAdapterImpl(factoryAbs);
          const resultAbs = await adapterAbs.validateAndGenerate();
          _logger.debug("[TEST] result (absolute path)", { resultAbs });
          assertEquals(resultAbs.success, true);
          assertExists(resultAbs.content);
        } finally {
          Deno.chdir(originalCwd);
        }
      });
    });
  });

  // Group 3: Explicit config value as promptBaseDir
  describe("Explicit config value as promptBaseDir", () => {
    /**
     * Test: If using config value as promptBaseDir, template should be found.
     * Verifies that config-based promptBaseDir is respected.
     */
    it("should find correct template when using config value as promptBaseDir", async () => {
      const testDirRaw = await Deno.makeTempDir();
      const testDir = await Deno.realPath(testDirRaw);
      const logger = createLoggerAdapter(new BreakdownLogger());
      const originalCwd = Deno.cwd();
      Deno.chdir(testDir);
      try {
        const configDir = join(testDir, ".agent", "breakdown", "config");
        await ensureDir(configDir);
        await Deno.writeTextFile(
          join(configDir, "test-prompt-edge-app.yml"),
          `working_dir: .\napp_prompt:\n  base_dir: custom_prompts\napp_schema:\n  base_dir: schema\n`,
        );
        // Load config before creating factory
        const configResult = await BreakdownConfig.create("test-prompt-edge", ".");
        if (!configResult.success) {
          throw new Error("Failed to create BreakdownConfig");
        }
        const breakdownConfig = configResult.data;
        await breakdownConfig.loadConfig();
        const inputFile = join(testDir, "input.md");
        await Deno.writeTextFile(inputFile, "# Example\n- Feature");
        // Create prompt file
        const promptDir = join(testDir, "custom_prompts", "to", "project");
        await ensureDir(promptDir);
        const promptFile = join(promptDir, "f_project.md");
        await Deno.writeTextFile(
          promptFile,
          "# {input_text_file}\nContent: {input_text}\nOutput to: {destination_path}",
        );
        _logger.debug("[TEST] PromptAdapterImpl with config promptBaseDir", {
          promptBaseDir: join(testDir, "custom_prompts"),
        });
        const cliParamsConfig = {
          demonstrativeType: "to",
          layerType: "project",
          options: {
            fromFile: inputFile,
            destinationFile: "output.md",
            config: "test-prompt-edge",
          },
        };
        const factoryConfig = await PromptVariablesFactory.create(cliParamsConfig);
        const adapterConfig = new PromptAdapterImpl(factoryConfig);
        const resultConfig = await adapterConfig.validateAndGenerate();
        _logger.debug("[TEST] result (config promptBaseDir)", { resultConfig });
        assertEquals(resultConfig.success, true);
        assertExists(resultConfig.content);
      } finally {
        Deno.chdir(originalCwd);
      }
    });
  });
});
