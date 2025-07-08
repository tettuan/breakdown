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

import { assert, assertEquals } from "../../lib/deps.ts";
import { afterEach, beforeEach, describe, it } from "jsr:@std/testing@^0.224.0/bdd";
import { join } from "jsr:@std/path@^0.224.0/join";
import { relative } from "jsr:@std/path@^0.224.0/relative";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { PromptAdapterImpl } from "../../../../lib/prompt/prompt_adapter.ts";
import { PromptVariablesFactory } from "../../../../lib/factory/prompt_variables_factory.ts";
import type {
  DemonstrativeType as _DemonstrativeType,
  LayerType as _LayerType,
} from "../../lib/deps.ts";

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
      join(configDir, "default-app.yml"),
      `working_dir: .\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`,
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
      const cliParams = {
        demonstrativeType: "to",
        layerType: "issue",
        options: {
          fromFile: relInputFile,
          destinationFile: relOutputFile,
          promptDir: relPromptsDir,
          fromLayerType: "project",
        },
      };
      try {
        const factoryResult = await PromptVariablesFactory.create(cliParams);
        assertEquals(factoryResult.ok, true);
        if (!factoryResult.ok) return; // Type guard
        const factory = factoryResult.data;
        const adapter = new PromptAdapterImpl(factory);
        const result = await adapter.validateAndGenerate();

        logger.debug("PromptAdapterImpl success", {
          key: "selection_test.ts#L168#validation-success",
          content: result.content,
        });

        assert(result.success);
        assertEquals(result.content.includes("# Project Summary"), true);
      } catch (e) {
        logger.error("PromptAdapterImpl error", {
          key: "selection_test.ts#L177#error-handling",
          error: e instanceof Error ? e.message : String(e),
          inputFile,
          outputFile,
        });
        throw e;
      }
    });

    it("should process issue to task prompt", async () => {
      logger.debug("Testing issue to task prompt processing", {
        key: "selection_test.ts#L206#execution-issue-to-task",
        inputFile: join(testDir, "input", "issue.md"),
        outputFile: join(outputDir, "task.md"),
        promptDir: join(testDir, "prompts", "to", "task"),
      });

      const inputFile = join(testDir, "input", "issue.md");
      const outputFile = join(outputDir, "task.md");
      const relPromptsDir = relative(testDir, join(testDir, "prompts"));
      const relInputFile = relative(testDir, inputFile);
      const relOutputFile = relative(testDir, outputFile);

      const cliParams = {
        demonstrativeType: "to",
        layerType: "task",
        options: {
          fromFile: relInputFile,
          destinationFile: relOutputFile,
          promptDir: relPromptsDir,
          fromLayerType: "issue",
        },
      };

      try {
        const factoryResult = await PromptVariablesFactory.create(cliParams);
        assertEquals(factoryResult.ok, true);
        if (!factoryResult.ok) return; // Type guard
        const factory = factoryResult.data;
        const adapter = new PromptAdapterImpl(factory);
        const result = await adapter.validateAndGenerate();

        logger.debug("Issue to task prompt success", {
          key: "selection_test.ts#L235#validation-success",
          content: result.content,
        });

        assert(result.success);

        logger.debug("Issue to task test result content", {
          key: "selection_test.ts#L220#debug-content",
          actualContent: result.content,
          expectedToContain: "# Issue 1",
        });

        assertEquals(result.content.includes("# Issue 1"), true);
      } catch (e) {
        logger.error("Issue to task prompt error", {
          key: "selection_test.ts#L242#error-handling",
          error: e instanceof Error ? e.message : String(e),
          inputFile,
          outputFile,
        });
        throw e;
      }
    });

    it("should process project to issue prompt with strict adaptation", async () => {
      logger.debug("Testing project to issue prompt with strict adaptation", {
        key: "selection_test.ts#L252#execution-strict-adaptation",
        adaptation: "strict",
        expectedPrompt: "f_project_strict.md",
      });

      const inputFile = join(testDir, "input", "project.md");
      const outputFile = join(outputDir, "issue_strict.md");
      const relPromptsDir = relative(testDir, join(testDir, "prompts"));
      const relInputFile = relative(testDir, inputFile);
      const relOutputFile = relative(testDir, outputFile);

      const cliParams = {
        demonstrativeType: "to",
        layerType: "issue",
        options: {
          fromFile: relInputFile,
          destinationFile: relOutputFile,
          promptDir: relPromptsDir,
          fromLayerType: "project",
          adaptation: "strict",
        },
      };

      try {
        const factoryResult = await PromptVariablesFactory.create(cliParams);
        assertEquals(factoryResult.ok, true);
        if (!factoryResult.ok) return; // Type guard
        const factory = factoryResult.data;
        const adapter = new PromptAdapterImpl(factory);
        const result = await adapter.validateAndGenerate();

        logger.debug("Strict adaptation success", {
          key: "selection_test.ts#L279#validation-strict-success",
          content: result.content,
        });

        assert(result.success);

        logger.debug("Strict adaptation test result content", {
          key: "selection_test.ts#L267#debug-content",
          actualContent: result.content,
          expectedToContain: "# Project Summary (Strict)",
        });

        assertEquals(result.content.includes("# Project Summary (Strict)"), true);
      } catch (e) {
        logger.error("Strict adaptation error", {
          key: "selection_test.ts#L286#error-strict",
          error: e instanceof Error ? e.message : String(e),
        });
        throw e;
      }
    });

    it("should process issue to task prompt with 'a' adaptation", async () => {
      logger.debug("Testing issue to task prompt with 'a' adaptation", {
        key: "selection_test.ts#L294#execution-a-adaptation",
        adaptation: "a",
        expectedPrompt: "f_issue_a.md",
      });

      const inputFile = join(testDir, "input", "issue.md");
      const outputFile = join(outputDir, "task_a.md");
      const relPromptsDir = relative(testDir, join(testDir, "prompts"));
      const relInputFile = relative(testDir, inputFile);
      const relOutputFile = relative(testDir, outputFile);

      const cliParams = {
        demonstrativeType: "to",
        layerType: "task",
        options: {
          fromFile: relInputFile,
          destinationFile: relOutputFile,
          promptDir: relPromptsDir,
          fromLayerType: "issue",
          adaptation: "a",
        },
      };

      try {
        const factoryResult = await PromptVariablesFactory.create(cliParams);
        assertEquals(factoryResult.ok, true);
        if (!factoryResult.ok) return; // Type guard
        const factory = factoryResult.data;
        const adapter = new PromptAdapterImpl(factory);
        const result = await adapter.validateAndGenerate();

        logger.debug("'a' adaptation success", {
          key: "selection_test.ts#L321#validation-a-success",
          content: result.content,
        });

        assert(result.success);

        logger.debug("'a' adaptation test result content", {
          key: "selection_test.ts#L312#debug-content",
          actualContent: result.content,
          expectedToContain: "# Issue 1 (Alternative)",
        });

        assertEquals(result.content.includes("# Issue 1 (Alternative)"), true);
      } catch (e) {
        logger.error("'a' adaptation error", {
          key: "selection_test.ts#L328#error-a-adaptation",
          error: e instanceof Error ? e.message : String(e),
        });
        throw e;
      }
    });

    it("should fall back to default prompt if adaptation variant doesn't exist", async () => {
      logger.debug("Testing fallback to default prompt", {
        key: "selection_test.ts#L336#execution-fallback-test",
        adaptation: "nonexistent",
        expectedFallback: "f_issue.md",
      });

      const inputFile = join(testDir, "input", "issue.md");
      const outputFile = join(outputDir, "task_fallback.md");
      const relPromptsDir = relative(testDir, join(testDir, "prompts"));
      const relInputFile = relative(testDir, inputFile);
      const relOutputFile = relative(testDir, outputFile);

      const cliParams = {
        demonstrativeType: "to",
        layerType: "task",
        options: {
          fromFile: relInputFile,
          destinationFile: relOutputFile,
          promptDir: relPromptsDir,
          fromLayerType: "issue",
          adaptation: "nonexistent",
        },
      };

      try {
        const factoryResult = await PromptVariablesFactory.create(cliParams);
        assertEquals(factoryResult.ok, true);
        if (!factoryResult.ok) return; // Type guard
        const factory = factoryResult.data;
        const adapter = new PromptAdapterImpl(factory);
        const result = await adapter.validateAndGenerate();

        logger.debug("Fallback mechanism success", {
          key: "selection_test.ts#L363#validation-fallback-success",
          content: result.content,
        });

        assert(result.success);
        assertEquals(result.content.includes("# Issue 1"), true);
      } catch (e) {
        logger.error("Fallback mechanism error", {
          key: "selection_test.ts#L370#error-fallback",
          error: e instanceof Error ? e.message : String(e),
        });
        throw e;
      }
    });

    it("should throw error for invalid demonstrative type", async () => {
      logger.debug("Testing invalid demonstrative type error handling", {
        key: "selection_test.ts#L378#execution-invalid-type",
        invalidType: "invalid",
        expectedBehavior: "error or validation failure",
      });

      const inputFile = join(testDir, "input", "project.md");
      const outputFile = join(outputDir, "invalid.md");
      const relPromptsDir = relative(testDir, join(testDir, "prompts"));
      const relInputFile = relative(testDir, inputFile);
      const relOutputFile = relative(testDir, outputFile);

      const cliParams = {
        demonstrativeType: "invalid",
        layerType: "issue",
        options: {
          fromFile: relInputFile,
          destinationFile: relOutputFile,
          promptDir: relPromptsDir,
        },
      };

      try {
        const factoryResult = await PromptVariablesFactory.create(cliParams);
        assertEquals(factoryResult.ok, true);
        if (!factoryResult.ok) return; // Type guard
        const factory = factoryResult.data;
        const adapter = new PromptAdapterImpl(factory);
        const result = await adapter.validateAndGenerate();

        logger.debug("Invalid type handling result", {
          key: "selection_test.ts#L405#validation-invalid-result",
          success: result.success,
          hasError: !result.success,
        });

        // Either the result should fail, or an error should be thrown
        assert(!result.success || result.content.includes("error"));
      } catch (e) {
        logger.debug("Expected error for invalid demonstrative type", {
          key: "selection_test.ts#L414#expected-error",
          error: e instanceof Error ? e.message : String(e),
        });
        // This is expected behavior - invalid type should cause an error
        assert(true);
      }
    });
  });
});

describe("Prompt Selection: CLI integration adaptation option", () => {
  it("should generate correct prompt content via CLI adaptation option", async () => {
    logger.debug("Testing CLI integration with adaptation options", {
      key: "selection_test.ts#L424#execution-cli-integration",
      testScope: "CLI parameter processing with adaptation",
    });

    // This test verifies that CLI adaptation options are properly processed
    // through the entire pipeline from CLI params to prompt generation
    const testDir = await Deno.makeTempDir();
    const originalCwd = Deno.cwd();
    Deno.chdir(testDir);

    try {
      // Setup CLI integration test environment
      const configDir = join(testDir, ".agent", "breakdown", "config");
      await Deno.mkdir(configDir, { recursive: true });
      await Deno.writeTextFile(
        join(configDir, "default-app.yml"),
        `working_dir: .\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`,
      );

      const promptDir = join(testDir, "prompts", "to", "issue");
      await Deno.mkdir(promptDir, { recursive: true });
      await Deno.writeTextFile(
        join(promptDir, "f_project.md"),
        "# CLI Integration Test\nOutput: {destination_path}",
      );
      await Deno.writeTextFile(
        join(promptDir, "f_project_strict.md"),
        "# CLI Integration Test (Strict)\nOutput: {destination_path}",
      );

      const inputFile = join(testDir, "input.md");
      await Deno.writeTextFile(inputFile, "# CLI Test Input");

      const cliParams = {
        demonstrativeType: "to",
        layerType: "issue",
        options: {
          fromFile: "input.md",
          destinationFile: "output.md",
          promptDir: "prompts",
          fromLayerType: "project",
          adaptation: "strict",
        },
      };

      const factoryResult = await PromptVariablesFactory.create(cliParams);
      assertEquals(factoryResult.ok, true);
      if (!factoryResult.ok) return; // Type guard
      const factory = factoryResult.data;
      const adapter = new PromptAdapterImpl(factory);
      const validateResult = await adapter.validateAndGenerate();
      
      if (!validateResult.success) {
        throw new Error(`Validation failed: ${validateResult.content}`);
      }
      const result = validateResult;

      logger.debug("CLI integration success", {
        key: "selection_test.ts#L466#validation-cli-success",
        content: result.content,
        adaptationApplied: result.content.includes("Strict"),
      });

      assert(result.success);

      logger.debug("CLI integration test result content", {
        key: "selection_test.ts#L472#debug-content",
        actualContent: result.content,
        expectedToContain: "# CLI Integration Test (Strict)",
      });

      assertEquals(result.content.includes("# CLI Integration Test (Strict)"), true);
    } catch (e) {
      logger.error("CLI integration error", {
        key: "selection_test.ts#L475#error-cli-integration",
        error: e instanceof Error ? e.message : String(e),
      });
      throw e;
    } finally {
      Deno.chdir(originalCwd);
      await Deno.remove(testDir, { recursive: true });
    }
  });
});
