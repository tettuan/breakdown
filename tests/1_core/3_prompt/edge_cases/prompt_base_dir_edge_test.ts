/**
 * Edge and error case tests for prompt baseDir resolution
 *
 * Specification:
 * - See docs/breakdown/path.ja.md, testing.ja.md
 * - baseDir must always refer to config value, never resolved from Deno.cwd()
 *
 * Test coverage:
 * - baseDir not specified, empty string, relative path, absolute path
 * - Explicit config value as promptBaseDir
 * - Debug output with BreakdownLogger
 */

import { assertEquals, assertExists } from "jsr:@std/assert@^0.224.0";
import { join, relative } from "jsr:@std/path@^0.224.0";
import { ensureDir } from "jsr:@std/fs@^0.224.0";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@^0.1.10";
import { describe, it } from "jsr:@std/testing@0.224.0/bdd";
import { PromptAdapterImpl } from "$lib/prompt/prompt_adapter.ts";
import { PromptVariablesFactory } from "$lib/factory/PromptVariablesFactory.ts";

function createLoggerAdapter(logger: BreakdownLogger) {
  return {
    debug: (...args: unknown[]) => logger.debug(String(args[0]), args[1]),
    error: (...args: unknown[]) => logger.error(String(args[0]), args[1]),
  };
}

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
        join(configDir, "app.yml"),
        `working_dir: .\napp_prompt:\n  base_dir: custom_prompts\napp_schema:\n  base_dir: schemas\n`
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
      const relPromptBaseDir = relative(testDir, join(testDir, "custom_prompts"));
      // 実装が参照するパスを取得
      const cliParamsRel = {
        demonstrativeType: "to",
        layerType: "project",
        options: {
          fromFile: inputFile,
          destinationFile: "output.md",
          promptDir: relPromptBaseDir,
        },
      };
      const factoryRel = await PromptVariablesFactory.create(cliParamsRel, relPromptBaseDir);
      const implPromptFile = factoryRel.getAllParams().promptFilePath;
      // ディレクトリ部分を比較
      const testPromptDir = join(testDir, "custom_prompts", "to", "project");
      const implPromptDir = implPromptFile ? implPromptFile.substring(0, implPromptFile.lastIndexOf("/")) : "";
      logger.debug("[TEST] Directory match check", { testPromptDir, implPromptDir });
      assertEquals(implPromptDir, testPromptDir);
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
          join(configDir, "app.yml"),
          `working_dir: .\napp_prompt:\n  base_dir: custom_prompts\napp_schema:\n  base_dir: schemas\n`
        );
        const promptDir = join(testDir, "prompts", "to", "project");
        await ensureDir(promptDir);
        const promptFile = join(promptDir, "f_project.md");
        await Deno.writeTextFile(
          promptFile,
          "# {input_text_file}\nContent: {input_text}\nOutput to: {destination_path}",
        );
        const inputFile = join(testDir, "input.md");
        await Deno.writeTextFile(inputFile, "# Example\n- Feature");
        logger.debug("[TEST] PromptAdapterImpl with empty promptBaseDir", { cwd: Deno.cwd(), promptFile });
        const cliParams = {
          demonstrativeType: "to",
          layerType: "project",
          options: {
            fromFile: inputFile,
            destinationFile: "output.md",
            promptDir: "", // baseDir not specified
          },
        };
        const factory = await PromptVariablesFactory.create(cliParams, "");
        const adapter = new PromptAdapterImpl(factory, logger);
        const result = await adapter.validateAndGenerate();
        if (result.success) {
          throw new Error("Expected failure due to missing base_dir, but got success");
        }
        if (!result.content.includes("Prompt base_dir must be set")) {
          throw new Error(`Expected error about missing base_dir, got: ${result.content}`);
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
            join(configDir, "app.yml"),
            `working_dir: .\napp_prompt:\n  base_dir: custom_prompts\napp_schema:\n  base_dir: schemas\n`
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
          const relPromptBaseDir = relative(testDir, join(testDir, "custom_prompts"));
          logger.debug("[TEST] promptBaseDir (relative path)", { relPromptBaseDir });
          const cliParamsRel = {
            demonstrativeType: "to",
            layerType: "project",
            options: {
              fromFile: inputFile,
              destinationFile: "output.md",
              promptDir: relPromptBaseDir,
            },
          };
          const factoryRel = await PromptVariablesFactory.create(cliParamsRel, relPromptBaseDir);
          const adapterRel = new PromptAdapterImpl(factoryRel, logger);
          const resultRel = await adapterRel.validateAndGenerate();
          logger.debug("[TEST] result (relative path)", { resultRel });
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
            join(configDir, "app.yml"),
            `working_dir: .\napp_prompt:\n  base_dir: custom_prompts\napp_schema:\n  base_dir: schemas\n`
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
          logger.debug("[TEST] promptBaseDir (absolute path)", { promptDir: join(testDir, "custom_prompts") });
          const cliParamsAbs = {
            demonstrativeType: "to",
            layerType: "project",
            options: {
              fromFile: inputFile,
              destinationFile: "output.md",
              promptDir: join(testDir, "custom_prompts"),
            },
          };
          const factoryAbs = await PromptVariablesFactory.create(cliParamsAbs, join(testDir, "custom_prompts"));
          const adapterAbs = new PromptAdapterImpl(factoryAbs, logger);
          const resultAbs = await adapterAbs.validateAndGenerate();
          logger.debug("[TEST] result (absolute path)", { resultAbs });
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
          join(configDir, "app.yml"),
          `working_dir: .\napp_prompt:\n  base_dir: custom_prompts\napp_schema:\n  base_dir: schemas\n`
        );
        const promptBaseDir = join(testDir, "custom_prompts");
        const promptDir = join(promptBaseDir, "to", "project");
        await ensureDir(promptDir);
        const promptFile = join(promptDir, "f_project.md");
        await Deno.writeTextFile(
          promptFile,
          "# {input_text_file}\nContent: {input_text}\nOutput to: {destination_path}",
        );
        const inputFile = join(testDir, "input.md");
        await Deno.writeTextFile(inputFile, "# Example\n- Feature");
        logger.debug("[TEST] PromptAdapterImpl with config promptBaseDir", { promptBaseDir });
        const cliParamsConfig = {
          demonstrativeType: "to",
          layerType: "project",
          options: {
            fromFile: inputFile,
            destinationFile: "output.md",
            promptDir: promptBaseDir,
          },
        };
        const factoryConfig = await PromptVariablesFactory.create(cliParamsConfig, promptBaseDir);
        const adapterConfig = new PromptAdapterImpl(factoryConfig, logger);
        const resultConfig = await adapterConfig.validateAndGenerate();
        logger.debug("[TEST] result (config promptBaseDir)", { resultConfig });
        assertEquals(resultConfig.success, true);
        assertExists(resultConfig.content);
      } finally {
        Deno.chdir(originalCwd);
      }
    });
  });
});
