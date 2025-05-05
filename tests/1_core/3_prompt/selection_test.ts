/**
 * Core tests for prompt selection functionality
 *
 * Purpose:
 * - Verify prompt selection based on demonstrative type
 * - Test layer type prompt selection
 * - Validate prompt loading and validation
 * - Test adaptation option for prompt variants
 *
 * Success Definition:
 * - Correct prompts are selected for each type
 * - Prompts are properly loaded and validated
 * - Error handling for invalid prompts
 * - Adaptation option correctly modifies prompt selection
 */

import { assert, assertEquals } from "@std/assert";
import { afterEach, beforeEach, describe, it } from "jsr:@std/testing@^0.224.0/bdd";
import { join } from "jsr:@std/path@^0.224.0/join";
import { relative } from "jsr:@std/path@^0.224.0/relative";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { PromptAdapterImpl } from "../../../lib/prompt/prompt_adapter.ts";
import { PromptVariablesFactory } from "../../../lib/factory/PromptVariablesFactory.ts";
import type { DemonstrativeType, LayerType } from "$lib/types/mod.ts";

const logger = new BreakdownLogger();

interface SetupResult {
  inputContent: string;
  testPromptsDir: string;
  promptPath: string;
}

describe("Prompt Selection: PromptAdapterImpl", () => {
  let testDir: string;
  let outputDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    testDir = await Deno.makeTempDir();
    outputDir = join(testDir, "output");
    await Deno.mkdir(outputDir, { recursive: true });
    logger.debug("Created test directories", { testDir, outputDir });
    originalCwd = Deno.cwd();
    Deno.chdir(testDir);

    // Create .agent/breakdown/config/app.yml for BreakdownConfig
    const configDir = join(testDir, ".agent", "breakdown", "config");
    await Deno.mkdir(configDir, { recursive: true });
    await Deno.writeTextFile(
      join(configDir, "app.yml"),
      `working_dir: .\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schemas\n`,
    );

    // Create schema directory and file
    const schemaDir = join(testDir, "prompts", "schema");
    await Deno.mkdir(schemaDir, { recursive: true });
    const schema = {
      type: "object",
      properties: {
        input_text_file: { type: "string" },
        input_text: { type: "string" },
        destination_path: { type: "string" },
      },
    };
    await Deno.writeTextFile(
      join(schemaDir, "implementation.json"),
      JSON.stringify(schema, null, 2),
    );
    logger.debug("Created schema file", { schemaDir });

    // Create test prompt files
    const projectPromptDir = join(testDir, "prompts", "to", "issue");
    await Deno.mkdir(projectPromptDir, { recursive: true });
    logger.debug("Created project prompt directory", { projectPromptDir });

    await Deno.writeTextFile(
      join(projectPromptDir, "f_project.md"),
      "# Project Summary\nOutput directory: {destination_path}",
    );
    await Deno.writeTextFile(
      join(projectPromptDir, "f_project_strict.md"),
      "# Project Summary (Strict)\nOutput directory: {destination_path}",
    );
    await Deno.writeTextFile(
      join(projectPromptDir, "f_issue.md"),
      "# Issue Prompt (from project)\nOutput directory: {destination_path}",
    );
    await Deno.writeTextFile(
      join(projectPromptDir, "f_issue_strict.md"),
      "# Issue Prompt (Strict, from project)\nOutput directory: {destination_path}",
    );
    logger.debug("Created project prompt files");

    const issuePromptDir = join(testDir, "prompts", "to", "task");
    await Deno.mkdir(issuePromptDir, { recursive: true });
    logger.debug("Created issue prompt directory", { issuePromptDir });

    await Deno.writeTextFile(
      join(issuePromptDir, "f_issue.md"),
      "# Issue 1\nOutput directory: {destination_path}",
    );
    await Deno.writeTextFile(
      join(issuePromptDir, "f_issue_a.md"),
      "# Issue 1 (Alternative)\nOutput directory: {destination_path}",
    );
    await Deno.writeTextFile(
      join(issuePromptDir, "f_task.md"),
      "# Task Prompt\nOutput directory: {destination_path}",
    );
    await Deno.writeTextFile(
      join(issuePromptDir, "f_task_a.md"),
      "# Task Prompt (Alternative)\nOutput directory: {destination_path}",
    );
    await Deno.writeTextFile(
      join(issuePromptDir, "f_task_nonexistent.md"),
      "# Task Prompt (Nonexistent adaptation)\nOutput directory: {destination_path}",
    );
    logger.debug("Created issue prompt files");

    // Create test input files
    const inputDir = join(testDir, "input");
    await Deno.mkdir(inputDir, { recursive: true });
    await Deno.writeTextFile(
      join(inputDir, "project.md"),
      "# Test Project\n- Feature 1\n- Feature 2",
    );
    await Deno.writeTextFile(
      join(inputDir, "issue.md"),
      "# Test Issue\nDescription: Test issue description",
    );
    logger.debug("Created test input files");
  });

  afterEach(async () => {
    logger.debug("Cleaning up test directory", { testDir });
    await Deno.remove(testDir, { recursive: true });
    Deno.chdir(originalCwd);
  });

  describe("PromptAdapterImpl: core prompt processing", () => {
    it("should process project to issue prompt", async () => {
      logger.debug("Testing project to issue prompt processing", {
        inputFile: join(testDir, "input", "project.md"),
        outputFile: join(outputDir, "issue.md"),
        promptDir: join(testDir, "prompts", "to", "issue"),
      });
      const inputFile = join(testDir, "input", "project.md");
      const outputFile = join(outputDir, "issue.md");
      const relPromptsDir = relative(testDir, join(testDir, "prompts"));
      const relInputFile = relative(testDir, inputFile);
      const relOutputFile = relative(testDir, outputFile);
      let result;
      // --- Debug: Compare test-created and implementation-resolved paths ---
      const logger2 = new BreakdownLogger();
      const absPromptDir = join(testDir, "prompts", "to", "issue");
      logger2.debug("[DEBUG] Test-created absolute paths", {
        inputFile,
        outputFile,
        promptDir: absPromptDir,
      });
      const cliParams = {
        demonstrativeType: "to" as DemonstrativeType,
        layerType: "issue" as LayerType,
        options: {
          fromFile: relInputFile,
          destinationFile: relOutputFile,
          promptDir: relPromptsDir,
        },
      };
      const factory = await PromptVariablesFactory.create(cliParams);
      const params = factory.getAllParams();
      logger2.debug("[DEBUG] Implementation-resolved paths", params);
      // Compare path segments
      function splitPath(p: string): string[] {
        return p.split(/[\\/]/).filter(Boolean);
      }
      logger2.debug("[DEBUG] Path segments comparison", {
        test_inputFile: splitPath(inputFile),
        impl_inputFile: splitPath(params.inputFilePath),
        test_outputFile: splitPath(outputFile),
        impl_outputFile: splitPath(params.outputFilePath),
        test_promptFile: splitPath(absPromptDir),
        impl_promptFile: splitPath(params.promptFilePath),
      });
      // --- End Debug ---
      try {
        const adapter = new PromptAdapterImpl(factory);
        result = await adapter.validateAndGenerate();
        logger.debug("PromptAdapterImpl success", { content: result.content });
      } catch (e) {
        logger.error("PromptAdapterImpl error", {
          error: e instanceof Error ? e.message : String(e),
          inputFile,
          outputFile,
        });
        throw e;
      }
      logger2.debug("[DEBUG] validateAndGenerate result", result);
      logger2.debug("[DEBUG] typeof result.success", typeof result.success);
      logger2.debug("[DEBUG] value of result.success", result.success);
      assert(result.success);
      assertEquals(result.content.includes("# Issue Prompt (from project)"), true);
    });

    it("should process issue to task prompt", async () => {
      // ... existing code ...
    });

    it("should process project to issue prompt with strict adaptation", async () => {
      // ... existing code ...
    });

    it("should process issue to task prompt with 'a' adaptation", async () => {
      // ... existing code ...
    });

    it("should fall back to default prompt if adaptation variant doesn't exist", async () => {
      // ... existing code ...
    });

    it("should throw error for invalid demonstrative type", async () => {
      // ... existing code ...
    });
  });
});

describe("Prompt Selection: CLI integration adaptation option", () => {
  it("should generate correct prompt content via CLI adaptation option", async () => {
    // ... existing code ...
  });
});
