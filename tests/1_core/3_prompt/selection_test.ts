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
import { loadPrompt } from "../../../lib/prompt/loader.ts";
import { DemonstrativeType, LayerType } from "../../../lib/types/mod.ts";

describe("Prompt Selection", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await Deno.makeTempDir();

    // Create test prompt files
    const projectPromptDir = join(testDir, "to", "issues");
    await Deno.mkdir(projectPromptDir, { recursive: true });
    await Deno.writeTextFile(
      join(projectPromptDir, "f_projects.md"),
      "# Project Summary\nOutput directory: ./.agent/breakdown/issues/",
    );
    await Deno.writeTextFile(
      join(projectPromptDir, "f_projects_strict.md"),
      "# Project Summary (Strict)\nOutput directory: ./.agent/breakdown/issues/",
    );

    const issuePromptDir = join(testDir, "to", "tasks");
    await Deno.mkdir(issuePromptDir, { recursive: true });
    await Deno.writeTextFile(
      join(issuePromptDir, "f_issues.md"),
      "# Issue 1\nOutput directory: ./.agent/breakdown/tasks/",
    );
    await Deno.writeTextFile(
      join(issuePromptDir, "f_issues_a.md"),
      "# Issue 1 (Alternative)\nOutput directory: ./.agent/breakdown/tasks/",
    );
  });

  afterEach(async () => {
    await Deno.remove(testDir, { recursive: true });
  });

  describe("loadPrompt", () => {
    it("should load project to issue prompt", async () => {
      const result = await loadPrompt({
        demonstrativeType: "to",
        layerType: "issues" as LayerType,
        fromLayerType: "projects" as LayerType,
        variables: {},
      }, testDir);

      assertEquals(result.content.includes("# Project Summary"), true);
      assertEquals(result.content.includes("./.agent/breakdown/issues/"), true);
    });

    it("should load issue to task prompt", async () => {
      const result = await loadPrompt({
        demonstrativeType: "to",
        layerType: "tasks" as LayerType,
        fromLayerType: "issues" as LayerType,
        variables: {},
      }, testDir);

      assertEquals(result.content.includes("# Issue 1"), true);
      assertEquals(result.content.includes("./.agent/breakdown/tasks/"), true);
    });

    it("should load project to issue prompt with strict adaptation", async () => {
      const result = await loadPrompt({
        demonstrativeType: "to",
        layerType: "issues" as LayerType,
        fromLayerType: "projects" as LayerType,
        variables: {},
        adaptation: "strict",
      }, testDir);

      assertEquals(result.content.includes("# Project Summary (Strict)"), true);
      assertEquals(result.content.includes("./.agent/breakdown/issues/"), true);
    });

    it("should load issue to task prompt with 'a' adaptation", async () => {
      const result = await loadPrompt({
        demonstrativeType: "to",
        layerType: "tasks" as LayerType,
        fromLayerType: "issues" as LayerType,
        variables: {},
        adaptation: "a",
      }, testDir);

      assertEquals(result.content.includes("# Issue 1 (Alternative)"), true);
      assertEquals(result.content.includes("./.agent/breakdown/tasks/"), true);
    });

    it("should fall back to default prompt if adaptation variant doesn't exist", async () => {
      const result = await loadPrompt({
        demonstrativeType: "to",
        layerType: "tasks" as LayerType,
        fromLayerType: "issues" as LayerType,
        variables: {},
        adaptation: "nonexistent",
      }, testDir);

      assertEquals(result.content.includes("# Issue 1"), true);
      assertEquals(result.content.includes("./.agent/breakdown/tasks/"), true);
    });

    it("should throw error for invalid prompt", async () => {
      await assertRejects(
        () =>
          loadPrompt({
            demonstrativeType: "no-params" as DemonstrativeType,
            layerType: "issues" as LayerType,
            fromLayerType: "projects" as LayerType,
            variables: {},
          }, testDir),
        Error,
        "Prompt loading failed",
      );
    });
  });
});

describe("CLI integration: adaptation option", () => {
  it("should generate output file using the correct adaptation prompt via CLI", async () => {
    const { runCommand } = await import("../../helpers/setup.ts");
    const { assertFileExists } = await import("../../helpers/assertions.ts");
    const { join } = await import("jsr:@std/path/join");
    const testDir = await Deno.makeTempDir();
    const promptsDir = join(testDir, "prompts", "summary", "task");
    await Deno.mkdir(promptsDir, { recursive: true });
    const fromFile = join(testDir, "input.md");
    const outFile = join(testDir, "output.md");
    // Create prompt variants
    await Deno.writeTextFile(join(promptsDir, "f_task_strict.md"), "# Strictバリアント");
    await Deno.writeTextFile(join(promptsDir, "f_task.md"), "# デフォルト");
    // Create input file
    await Deno.writeTextFile(fromFile, "dummy");
    // Create required config file for CLI
    const configDir = join(testDir, ".agent", "breakdown", "config");
    await Deno.mkdir(configDir, { recursive: true });
    await Deno.writeTextFile(
      join(configDir, "app.yml"),
      `working_dir: ${testDir}/.agent/breakdown
app_prompt:
  base_dir: prompts
app_schema:
  base_dir: schema
`,
    );
    // Copy deno.json into testDir
    await Deno.copyFile("deno.json", join(testDir, "deno.json"));
    const { BreakdownLogger } = await import("@tettuan/breakdownlogger");
    const logger = new BreakdownLogger();
    logger.debug("CLI test: testDir", { testDir });
    logger.debug("CLI test: fromFile", { fromFile });
    logger.debug("CLI test: outFile", { outFile });
    logger.debug("CLI test: promptsDir", { promptsDir });
    // Run CLI with adaptation
    const result = await runCommand(
      [
        "summary",
        "task",
        "--from",
        fromFile,
        "--adaptation",
        "strict",
        "-o",
        outFile,
        "--prompt-dir",
        join(testDir, "prompts"),
      ],
      undefined,
      testDir,
    );
    logger.debug("CLI test: runCommand result", { result });
    logger.debug("CLI test: checking file existence", { outFile });
    await assertFileExists(outFile);
    const content = await Deno.readTextFile(outFile);
    logger.debug("CLI test: output file content", { content });
    if (!content.includes("Strictバリアント")) {
      throw new Error(
        `Output file does not contain expected adaptation content.\nActual: ${content}`,
      );
    }
  });
});
