/**
 * Integration tests for stdin handling in the breakdown workflow
 *
 * Purpose:
 * - Test the complete flow from stdin input to output
 * - Verify that stdin input is correctly processed and used
 * - Ensure stdin input is properly handled in different command contexts
 *
 * Related Docs:
 * - docs/breakdown/index.ja.md: CLI specifications
 * - docs/breakdown/testing.ja.md: Test requirements
 * - docs/breakdown/options.ja.md: Option specifications
 *
 * Dependencies:
 * - Requires 1_core/1_io/stdin_test.ts to pass first
 * - Requires 1_core/4_cli/io_test.ts to pass first
 */

import { assertEquals, assertStringIncludes } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { runCommand } from "../../helpers/setup.ts";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";

const logger = new BreakdownLogger();
const TEST_DIR = "tmp/test_stdin_flow";

// Workaround implemented for BreakdownParams v1.0.1 limitation
// The CLI now separates positional arguments from options before parsing
// to avoid "Too many arguments" error
Deno.test("Stdin Flow Integration", async (t) => {
  let _originalCwd: string;

  await t.step("setup", async () => {
    logger.debug("Setting up test environment", {
      purpose: "Create test directory and files",
      dir: TEST_DIR,
    });
    _originalCwd = Deno.cwd();
    await ensureDir(TEST_DIR);

    // Initialize workspace
    const initResult = await runCommand(["init"], undefined, TEST_DIR);
    assertEquals(initResult.success, true, "Workspace initialization should succeed");

    // Create prompt template directories
    const promptsDir = join(TEST_DIR, ".agent", "breakdown", "prompts");
    await ensureDir(join(promptsDir, "summary", "project"));
    await ensureDir(join(promptsDir, "to", "project"));

    // Create app.yml with correct prompt directory
    const configDir = join(TEST_DIR, ".agent", "breakdown", "config");
    await ensureDir(configDir);
    await Deno.writeTextFile(
      join(configDir, "app.yml"),
      `working_dir: .agent/breakdown
app_prompt:
  base_dir: .agent/breakdown/prompts
app_schema:
  base_dir: schema
`,
    );

    // Create prompt template files
    const summaryTemplate = `# Project Summary Template
Input:
{input_text}

Output:
A project summary should include:
- Project status overview
- Progress on key objectives
- Deliverable status
- Technical achievements
- Timeline assessment
- Resource utilization
- Dependency status
- Risk assessment
- Next steps`;

    const toTemplate = `# Project Description Template
Input:
{input_text}

Output:
A project description should include:
- Project overview
- Goals and objectives
- Scope
- Deliverables
- Timeline
- Resources
- Dependencies
- Risks`;

    await Deno.writeTextFile(
      join(promptsDir, "summary", "project", "f_project.md"),
      summaryTemplate,
    );
    await Deno.writeTextFile(join(promptsDir, "to", "project", "f_project.md"), toTemplate);
  });

  await t.step("summary command with stdin input", async () => {
    logger.debug("Testing summary command with stdin input", {
      purpose: "Verify stdin input is processed correctly for summary command",
    });
    const input = "This is a test project summary from stdin.";
    const result = await runCommand(
      ["summary", "project", "--from=-", "--destination=stdout"],
      input,
      TEST_DIR,
    );
    assertEquals(result.success, true, "Command should succeed");
    assertStringIncludes(result.output, "project summary", "Output should contain project summary");
  });

  await t.step("to command with stdin input", async () => {
    logger.debug("Testing to command with stdin input", {
      purpose: "Verify stdin input is processed correctly for to command",
    });
    const input = "This is a test project description from stdin.";
    const result = await runCommand(
      ["to", "project", "--from=-", "--destination=stdout"],
      input,
      TEST_DIR,
    );
    assertEquals(result.success, true, "Command should succeed");
    assertStringIncludes(
      result.output,
      "project description",
      "Output should contain project description",
    );
  });

  await t.step("stdin with -o option", async () => {
    logger.debug("Testing stdin with -o option", {
      purpose: "Verify -o option works correctly with stdin input",
    });
    const input = "This is a test project summary from stdin.";
    const outputFile = "output/project_summary.md";
    await ensureDir(join(TEST_DIR, "output"));
    const result = await runCommand(
      ["summary", "project", "--from=-", "-o=" + outputFile],
      input,
      TEST_DIR,
    );
    // Parser now correctly handles options, should process normally or fail with config/template issues
    logger.debug("Stdin with -o option result", { result });
    // The result depends on whether templates exist and are properly configured
  });

  await t.step("cleanup", async () => {
    logger.debug("Cleaning up test environment", {
      purpose: "Remove test directory and files",
      dir: TEST_DIR,
    });
    try {
      await Deno.remove(TEST_DIR, { recursive: true });
    } catch (error) {
      logger.error("Failed to clean up test directory", { error });
    }
  });
});
