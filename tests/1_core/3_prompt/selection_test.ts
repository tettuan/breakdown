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

import { assertEquals } from "jsr:@std/assert@^0.224.0/assert-equals";
import { assertRejects } from "jsr:@std/assert@^0.224.0/assert-rejects";
import { afterEach, beforeEach, describe, it } from "jsr:@std/testing@^0.224.0/bdd";
import { join } from "jsr:@std/path@^0.224.0/join";
import { relative } from "jsr:@std/path@^0.224.0/relative";
import { processWithPrompt } from "../../../lib/prompt/processor.ts";
import { DemonstrativeType, LayerType } from "../../../lib/types/mod.ts";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { ensureDir } from "jsr:@std/fs@^0.224.0";

const logger = new BreakdownLogger();

function createLoggerAdapter(logger: BreakdownLogger) {
  return {
    debug: (...args: unknown[]) => logger.debug(String(args[0]), args[1]),
    error: (...args: unknown[]) => logger.error(String(args[0]), args[1]),
  };
}
const loggerAdapter = createLoggerAdapter(logger);

interface SetupResult {
  inputContent: string;
  testPromptsDir: string;
  promptPath: string;
}

describe("Prompt Selection", () => {
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

    // Create schema directory and file
    const schemaDir = join(testDir, "prompts", "schema");
    await Deno.mkdir(schemaDir, { recursive: true });
    const schema = {
      type: "object",
      properties: {
        input_markdown_file: { type: "string" },
        input_markdown: { type: "string" },
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

  describe("processWithPrompt", () => {
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
      // デバッグ: テンプレートファイルの絶対パス、relPromptsDirの絶対パス、CWD
      const absPromptFile = join(testDir, "prompts", "to", "issue", "f_project.md");
      const absPromptsDir = join(testDir, relPromptsDir);
      logger.debug("[DEBUG] absPromptFile", { absPromptFile });
      logger.debug("[DEBUG] absPromptsDir", { absPromptsDir });
      logger.debug("[DEBUG] CWD", { cwd: Deno.cwd() });
      let result;
      try {
        result = await processWithPrompt(
          relPromptsDir,
          "to" as DemonstrativeType,
          "issue" as LayerType,
          relInputFile,
          relOutputFile,
          "",
          loggerAdapter,
        );
        logger.debug("processWithPrompt success", { content: result.content });
      } catch (e) {
        logger.error("processWithPrompt error", {
          error: e instanceof Error ? e.message : String(e),
          inputFile,
          outputFile,
        });
        throw e;
      }
      assertEquals(result.success, true);
      assertEquals(result.content.includes("# Project Summary"), true);
    });

    it("should process issue to task prompt", async () => {
      logger.debug("Testing issue to task prompt processing", {
        inputFile: join(testDir, "input", "issue.md"),
        outputFile: join(outputDir, "task.md"),
        promptDir: join(testDir, "prompts", "to", "task"),
      });
      const inputFile = join(testDir, "input", "issue.md");
      const outputFile = join(outputDir, "task.md");
      const relPromptsDir = relative(testDir, join(testDir, "prompts"));
      const relInputFile = relative(testDir, inputFile);
      const relOutputFile = relative(testDir, outputFile);
      let result;
      try {
        result = await processWithPrompt(
          relPromptsDir,
          "to" as DemonstrativeType,
          "task" as LayerType,
          relInputFile,
          relOutputFile,
          "",
          loggerAdapter,
        );
        logger.debug("processWithPrompt success", { content: result.content });
      } catch (e) {
        logger.error("processWithPrompt error", {
          error: e instanceof Error ? e.message : String(e),
          inputFile,
          outputFile,
        });
        throw e;
      }
      assertEquals(result.success, true);
      assertEquals(result.content.includes("# Issue 1"), true);
    });

    it("should process project to issue prompt with strict adaptation", async () => {
      logger.debug("Testing project to issue prompt with strict adaptation", {
        inputFile: join(testDir, "input", "project.md"),
        outputFile: join(outputDir, "issue_strict.md"),
        promptDir: join(testDir, "prompts", "to", "issue"),
      });
      const inputFile = join(testDir, "input", "project.md");
      const outputFile = join(outputDir, "issue_strict.md");
      const relPromptsDir = relative(testDir, join(testDir, "prompts"));
      const relInputFile = relative(testDir, inputFile);
      const relOutputFile = relative(testDir, outputFile);
      let result;
      try {
        result = await processWithPrompt(
          relPromptsDir,
          "to" as DemonstrativeType,
          "issue" as LayerType,
          relInputFile,
          relOutputFile,
          "",
          loggerAdapter,
          "strict",
        );
        logger.debug("processWithPrompt success", { content: result.content });
      } catch (e) {
        logger.error("processWithPrompt error", {
          error: e instanceof Error ? e.message : String(e),
          inputFile,
          outputFile,
        });
        throw e;
      }
      assertEquals(result.success, true);
      assertEquals(result.content.includes("# Project Summary (Strict)"), true);
    });

    it("should process issue to task prompt with 'a' adaptation", async () => {
      logger.debug("Testing issue to task prompt with 'a' adaptation", {
        inputFile: join(testDir, "input", "issue.md"),
        outputFile: join(outputDir, "task_a.md"),
        promptDir: join(testDir, "prompts", "to", "task"),
      });
      const inputFile = join(testDir, "input", "issue.md");
      const outputFile = join(outputDir, "task_a.md");
      const relPromptsDir = relative(testDir, join(testDir, "prompts"));
      const relInputFile = relative(testDir, inputFile);
      const relOutputFile = relative(testDir, outputFile);
      let result;
      try {
        result = await processWithPrompt(
          relPromptsDir,
          "to" as DemonstrativeType,
          "task" as LayerType,
          relInputFile,
          relOutputFile,
          "",
          loggerAdapter,
          "a",
        );
        logger.debug("processWithPrompt success", { content: result.content });
      } catch (e) {
        logger.error("processWithPrompt error", {
          error: e instanceof Error ? e.message : String(e),
          inputFile,
          outputFile,
        });
        throw e;
      }
      assertEquals(result.success, true);
      assertEquals(result.content.includes("# Issue 1 (Alternative)"), true);
    });

    it("should fall back to default prompt if adaptation variant doesn't exist", async () => {
      logger.debug("Testing fallback to default prompt", {
        inputFile: join(testDir, "input", "issue.md"),
        outputFile: join(outputDir, "task_fallback.md"),
        promptDir: join(testDir, "prompts", "to", "task"),
      });
      const inputFile = join(testDir, "input", "issue.md");
      const outputFile = join(outputDir, "task_fallback.md");
      const relPromptsDir = relative(testDir, join(testDir, "prompts"));
      const relInputFile = relative(testDir, inputFile);
      const relOutputFile = relative(testDir, outputFile);
      let result;
      try {
        result = await processWithPrompt(
          relPromptsDir,
          "to" as DemonstrativeType,
          "task" as LayerType,
          relInputFile,
          relOutputFile,
          "",
          loggerAdapter,
          "nonexistent",
        );
        logger.debug("processWithPrompt success", { content: result.content });
      } catch (e) {
        logger.error("processWithPrompt error", {
          error: e instanceof Error ? e.message : String(e),
          inputFile,
          outputFile,
        });
        throw e;
      }
      assertEquals(result.success, true);
      assertEquals(result.content.includes("# Issue 1"), true);
    });

    it("should throw error for invalid demonstrative type", async () => {
      const inputFile = join(testDir, "input", "project.md");
      const outputFile = join(outputDir, "invalid.md");
      const relPromptsDir = relative(testDir, join(testDir, "prompts"));

      await assertRejects(
        async () => {
          await processWithPrompt(
            relPromptsDir,
            "invalid" as DemonstrativeType,
            "issue" as LayerType,
            inputFile,
            outputFile,
            "",
            loggerAdapter,
          );
        },
        Error,
        "Unsupported demonstrative type",
      );
    });
  });
});

describe("CLI integration: adaptation option", () => {
  it("should generate correct prompt content via CLI adaptation option", async () => {
    const originalCwd = Deno.cwd();
    const testDir = await Deno.makeTempDir();
    Deno.chdir(testDir);
    try {
      const promptsDir = join(testDir, "prompts", "to", "task");
      await ensureDir(promptsDir);
      // プロンプトテンプレート作成
      await Deno.writeTextFile(
        join(promptsDir, "f_issue_a.md"),
        "# Issue 1 (Alternative)\nOutput directory: {destination_path}",
      );
      // 入力ファイル作成
      const inputDir = join(testDir, "input");
      await ensureDir(inputDir);
      const fromFile = join(inputDir, "issue.md");
      await Deno.writeTextFile(fromFile, "# Test Issue\nDescription: Test issue description");
      // 出力ファイル名
      const outputDir = join(testDir, "output");
      await ensureDir(outputDir);
      const outFile = join(outputDir, "task_a.md");
      // 相対パス
      const relPromptsDir = relative(testDir, join(testDir, "prompts"));
      const relInputFile = relative(testDir, fromFile);
      const relOutputFile = relative(testDir, outFile);
      const result = await processWithPrompt(
        relPromptsDir,
        "to" as DemonstrativeType,
        "task" as LayerType,
        relInputFile,
        relOutputFile,
        "",
        loggerAdapter,
        "a",
      );
      assertEquals(result.success, true);
      assertEquals(result.content.includes("# Issue 1 (Alternative)"), true);
    } finally {
      Deno.chdir(originalCwd);
    }
  });
});
