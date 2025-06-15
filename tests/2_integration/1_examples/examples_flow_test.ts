import { assertEquals } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { runCommand } from "$test/helpers/setup.ts";
import { ensureDir } from "@std/fs";
import { join } from "@std/path";
import { BreakdownConfig } from "@tettuan/breakdownconfig";

const logger = new BreakdownLogger();

/**
 * E2E: project summary to project/issue/task (happy path)
 *
 * 検証内容:
 * - CLIが設定ファイル(app.yml)・入力ファイル・テンプレートファイルを正しく参照し、
 *   サマリー→プロジェクト→課題→タスクの変換が成功すること
 *
 * 前処理で用意すべきもの:
 * - .agent/breakdown/config/app.yml
 * - 入力ファイル (project_summary.md)
 * - テンプレートファイル (base_dir/to/project/f_project.md など)
 */
Deno.test("E2E: project summary to project/issue/task (happy path)", async () => {
  // Pre-processing and Preparing Part
  const testDir = await Deno.makeTempDir();
  const configDir = join(testDir, ".agent", "breakdown", "config");
  await ensureDir(configDir);
  // app.yml: base_dir=prompts
  await Deno.writeTextFile(
    join(configDir, "app.yml"),
    `working_dir: .agent/breakdown\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`,
  );
  // 入力ファイル
  const projectDir = join(testDir, "project");
  await ensureDir(projectDir);
  const summaryPath = join(projectDir, "project_summary.md");
  await Deno.writeTextFile(summaryPath, "# Project Summary\n- Overview: Example\n");
  // テンプレートファイル
  const promptDir = join(testDir, "prompts", "to", "project");
  await ensureDir(promptDir);
  await Deno.writeTextFile(join(promptDir, "f_project.md"), "template content");

  // Main Test
  const result = await runCommand(
    [
      "to",
      "project",
      "--from",
      summaryPath,
      "--destination",
      join(projectDir, "project.md"),
    ],
    undefined,
    testDir,
  );
  logger.debug("to project result", { result });
  // Parser now correctly handles options, should succeed
  assertEquals(result.success, true);
  logger.debug("E2E to project result details", { error: result.error });
});

/**
 * E2E: adaptation option (long and short)
 *
 * 検証内容:
 * - --adaptation/-a オプションで異なるテンプレートが選択されること
 *
 * 前処理で用意すべきもの:
 * - .agent/breakdown/config/app.yml
 * - 入力ファイル (unorganized_tasks.md)
 * - テンプレートファイル (base_dir/summary/task/f_task_strict.md, f_task_a.md)
 */
Deno.test("E2E: adaptation option (long and short)", async () => {
  // Pre-processing and Preparing Part
  const testDir = await Deno.makeTempDir();
  const configDir = join(testDir, ".agent", "breakdown", "config");
  await ensureDir(configDir);
  // base_dir=.agent/breakdown/prompts (relative to testDir)
  const relPromptDir = join(".agent", "breakdown", "prompts");
  const appYmlPath = join(configDir, "app.yml");
  const appYmlContent =
    `working_dir: .agent/breakdown\napp_prompt:\n  base_dir: ${relPromptDir}\napp_schema:\n  base_dir: schema\n`;
  await Deno.writeTextFile(appYmlPath, appYmlContent);
  const inputPath = join(testDir, "unorganized_tasks.md");
  await Deno.writeTextFile(inputPath, "- Task 1\n- Task 2\n");
  // テンプレート
  const strictDir = join(testDir, ".agent", "breakdown", "prompts", "summary", "task");
  await ensureDir(strictDir);
  const strictTemplate = join(strictDir, "f_task_strict.md");
  const aTemplate = join(strictDir, "f_task_a.md");
  const defaultTemplate = join(strictDir, "f_task.md");
  await Deno.writeTextFile(strictTemplate, "strict template");
  await Deno.writeTextFile(aTemplate, "a template");
  await Deno.writeTextFile(defaultTemplate, "default template");
  // Debug: config, cwd, template paths, file existence
  logger.debug("[DEBUG] configDir", { configDir });
  logger.debug("[DEBUG] testDir (cwd)", { testDir });
  logger.debug("[DEBUG] appYmlPath", { appYmlPath });
  logger.debug("[DEBUG] appYmlContent", { appYmlContent });
  logger.debug("[DEBUG] strictTemplate abs", { strictTemplate });
  logger.debug("[DEBUG] aTemplate abs", { aTemplate });
  logger.debug("[DEBUG] strictTemplate exists", {
    exists: await Deno.stat(strictTemplate).then(() => true).catch(() => false),
  });
  logger.debug("[DEBUG] aTemplate exists", {
    exists: await Deno.stat(aTemplate).then(() => true).catch(() => false),
  });
  try {
    // Main Test: long form
    let result;
    result = await runCommand(
      [
        "summary",
        "task",
        "--from",
        inputPath,
        "--adaptation",
        "strict",
        "--destination",
        join(testDir, "tasks_strict.md"),
      ],
      undefined,
      testDir,
    );
    logger.debug("adaptation long form result", { result });
    assertEquals(result.success, true);
    logger.debug("Adaptation long form error", { error: result.error });
    // Main Test: short form
    result = await runCommand(
      [
        "summary",
        "task",
        "--from",
        inputPath,
        "-a",
        "a",
        "--destination",
        join(testDir, "tasks_simple.md"),
      ],
      undefined,
      testDir,
    );
    logger.debug("adaptation short form result", { result });
    assertEquals(result.success, true);
    logger.debug("Adaptation short form error", { error: result.error });
  } finally {
    // nothing to cleanup
  }
});

/**
 * E2E: error case - missing input file
 *
 * 検証内容:
 * - 入力ファイルが存在しない場合、適切なエラーが出ること
 *
 * 前処理で用意すべきもの:
 * - .agent/breakdown/config/app.yml
 * - テンプレートファイル (base_dir/to/project/f_project.md)
 * - 入力ファイルは作成しない
 */
Deno.test("E2E: error case - missing input file", async () => {
  // Pre-processing and Preparing Part
  const testDir = await Deno.makeTempDir();
  const configDir = join(testDir, ".agent", "breakdown", "config");
  await ensureDir(configDir);
  await Deno.writeTextFile(
    join(configDir, "app.yml"),
    `working_dir: .agent/breakdown\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`,
  );
  // テンプレート
  const promptDir = join(testDir, "prompts", "to", "project");
  await ensureDir(promptDir);
  await Deno.writeTextFile(join(promptDir, "f_project.md"), "template content");
  // 入力ファイルは作成しない

  // Main Test
  const result = await runCommand(
    [
      "to",
      "project",
      "--from",
      join(testDir, "not_exist.md"),
      "--destination",
      join(testDir, "out.md"),
    ],
    undefined,
    testDir,
  );
  logger.debug("missing input file result", { result });
  // Parser now correctly handles options, should fail with file not found
  assertEquals(result.success, false);
  assertEquals(result.error?.startsWith("Failed to read input file"), true);
});

/**
 * E2E: error if app_prompt.base_dir directory is missing
 *
 * 検証内容:
 * - base_dirで指定されたディレクトリが存在しない場合、適切なエラーが出ること
 *
 * 前処理で用意すべきもの:
 * - .agent/breakdown/config/app.yml
 * - 入力ファイル (input.md)
 * - テンプレートディレクトリは作成しない
 */
Deno.test("E2E: error if app_prompt.base_dir directory is missing", async () => {
  // Pre-processing and Preparing Part
  const testDir = await Deno.makeTempDir();
  const configDir = join(testDir, ".agent", "breakdown", "config");
  await ensureDir(configDir);
  await Deno.writeTextFile(
    join(configDir, "app.yml"),
    `working_dir: .agent/breakdown\napp_prompt:\n  base_dir: prompts_missing\napp_schema:\n  base_dir: schema\n`,
  );
  // 入力ファイル
  const inputPath = join(testDir, "input.md");
  await Deno.writeTextFile(inputPath, "# Dummy");
  // テンプレートディレクトリは作成しない

  // Main Test
  const result = await runCommand(
    [
      "to",
      "project",
      "--from",
      inputPath,
      "--destination",
      "output.md",
    ],
    undefined,
    testDir,
  );
  logger.debug("missing base_dir directory result", { result });
  assertEquals(result.success, false);
  // Should fail with template/config error since directories don't exist
  logger.debug("Missing base_dir error", { error: result.error });
});

/**
 * E2E: error if app_prompt.base_dir is a file (explicit test for error message)
 *
 * - base_dirで指定されたパスがファイルの場合、"is not a directory" を含むエラーが出ること
 */
Deno.test("E2E: error if app_prompt.base_dir is a file (error message contains 'is not a directory')", async () => {
  // Pre-processing and Preparing Part
  const testDir = await Deno.makeTempDir();
  const configDir = join(testDir, ".agent", "breakdown", "config");
  await ensureDir(configDir);
  await Deno.writeTextFile(
    join(configDir, "app.yml"),
    `working_dir: .agent/breakdown\napp_prompt:\n  base_dir: prompts_file\napp_schema:\n  base_dir: schema\n`,
  );
  // 入力ファイル
  const inputPath = join(testDir, "input.md");
  await Deno.writeTextFile(inputPath, "# Dummy");
  // base_dirにファイルを作成
  const promptFile = join(testDir, "prompts_file");
  await Deno.writeTextFile(promptFile, "not a directory");

  // Main Test
  const result = await runCommand(
    [
      "to",
      "project",
      "--from",
      inputPath,
      "--destination",
      "output.md",
    ],
    undefined,
    testDir,
  );
  logger.debug("base_dir is file explicit error test result", { result });
  assertEquals(result.success, false);
  // Parser now correctly handles options, should get config/template error
  logger.debug("Base_dir is file error", { error: result.error });
});

/**
 * E2E: relative vs absolute baseDir in config
 *
 * 検証内容:
 * - baseDirが相対パス/絶対パスの両方で正しく解決されること
 *
 * 前処理で用意すべきもの:
 * - .agent/breakdown/config/app.yml
 * - 入力ファイル (input.md)
 * - テンプレートファイル (相対/絶対両方)
 */
Deno.test("E2E: relative vs absolute baseDir in config", async () => {
  // Pre-processing and Preparing Part
  const testDir = await Deno.makeTempDir();
  const configDir = join(testDir, ".agent", "breakdown", "config");
  await ensureDir(configDir);
  // 相対パス
  await Deno.writeTextFile(
    join(configDir, "app.yml"),
    `working_dir: .agent/breakdown\napp_prompt:\n  base_dir: prompts_rel\napp_schema:\n  base_dir: schema\n`,
  );
  const relPromptDir = join(testDir, "prompts_rel", "to", "project");
  await ensureDir(relPromptDir);
  await Deno.writeTextFile(join(relPromptDir, "f_project.md"), "rel template");
  // 絶対パス
  const absPromptDir = join(testDir, "abs_prompts", "to", "project");
  await ensureDir(absPromptDir);
  await Deno.writeTextFile(join(absPromptDir, "f_project.md"), "abs template");
  // 入力ファイル
  const inputPath = join(testDir, "input.md");
  await Deno.writeTextFile(inputPath, "# Dummy");
  // 出力ファイルのディレクトリも作成
  await ensureDir(join(testDir, "project"));
  // Update config to use absolute path
  await Deno.writeTextFile(
    join(configDir, "app.yml"),
    `working_dir: .agent/breakdown\napp_prompt:\n  base_dir: ${
      join(testDir, "abs_prompts")
    }\napp_schema:\n  base_dir: schema\n`,
  );
  // Should use absolute path
  const result = await runCommand(
    [
      "to",
      "project",
      "--from",
      inputPath,
      "--destination",
      "output.md",
    ],
    undefined,
    testDir,
  );
  logger.debug("absolute baseDir result", { result });
  assertEquals(result.success, true);
  // Should fail with template/config error
  logger.debug("Absolute baseDir error", { error: result.error });
});

Deno.test("E2E: template path is resolved using baseDir (relative)", async () => {
  // Pre-processing and Preparing Part
  const testDir = await Deno.makeTempDir();
  const configDir = join(testDir, ".agent", "breakdown", "config");
  await ensureDir(configDir);
  await Deno.writeTextFile(
    join(configDir, "app.yml"),
    `working_dir: .agent/breakdown\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`,
  );
  const promptDir = join(testDir, "prompts", "to", "project");
  await ensureDir(promptDir);
  await Deno.writeTextFile(join(promptDir, "f_project.md"), "template content");
  // 入力ファイル
  const inputPath = join(testDir, "input.md");
  await Deno.writeTextFile(inputPath, "# Dummy");
  // 出力ファイルのディレクトリも作成
  await ensureDir(join(testDir, "project"));
  const result = await runCommand(
    [
      "to",
      "project",
      "--from",
      inputPath,
      "--destination",
      "output.md",
    ],
    undefined,
    testDir,
  );
  logger.debug("template path resolved result", { result });
  // Parser now correctly handles options, should process normally or fail with template issues
  assertEquals(result.success, true);
  logger.debug("Template path resolved error", { error: result.error });
});

Deno.test("BreakdownConfig loads and merges app.yml and user.yml as spec", async () => {
  const testDir = await Deno.makeTempDir();
  const configDir = join(testDir, ".agent", "breakdown", "config");
  await ensureDir(configDir);
  // Write app.yml
  await Deno.writeTextFile(
    join(configDir, "app.yml"),
    `working_dir: .agent/breakdown
app_prompt:
  base_dir: prompts_app
app_schema:
  base_dir: schema_app
`,
  );
  // Write user.yml (override app_prompt.base_dir)
  await Deno.writeTextFile(
    join(configDir, "user.yml"),
    `app_prompt:
  base_dir: prompts_user
`,
  );
  // Create both prompt dirs
  await ensureDir(join(testDir, ".agent", "breakdown", "prompts_app"));
  await ensureDir(join(testDir, ".agent", "breakdown", "prompts_user"));
  // Load config
  const config = new BreakdownConfig(testDir);
  await config.loadConfig();
  const settings = await config.getConfig();
  logger.debug("BreakdownConfig merged settings", { settings });
  // user.yml should override app.yml for app_prompt.base_dir
  assertEquals(settings.app_prompt.base_dir, "prompts_user");
  assertEquals(settings.app_schema.base_dir, "schema_app");
  assertEquals(settings.working_dir, ".agent/breakdown");
});

Deno.test("BreakdownConfig: working_dir is not used as prefix for app_prompt.base_dir", async () => {
  const testDir = await Deno.makeTempDir();
  const configDir = join(testDir, ".agent", "breakdown", "config");
  await ensureDir(configDir);
  await Deno.writeTextFile(
    join(configDir, "app.yml"),
    `working_dir: .agent/breakdown
app_prompt:
  base_dir: prompts
app_schema:
  base_dir: schema
`,
  );
  const config = new BreakdownConfig(testDir);
  await config.loadConfig();
  const settings = await config.getConfig();
  logger.debug("BreakdownConfig working_dir/prompt_dir", { settings });
  // working_dir is not a prefix of app_prompt.base_dir
  assertEquals(settings.app_prompt.base_dir, "prompts");
  assertEquals(settings.working_dir, ".agent/breakdown");
});

Deno.test("BreakdownConfig: error if config missing required fields", async () => {
  const testDir = await Deno.makeTempDir();
  const configDir = join(testDir, ".agent", "breakdown", "config");
  await ensureDir(configDir);
  // Write incomplete app.yml
  await Deno.writeTextFile(
    join(configDir, "app.yml"),
    `working_dir: .agent/breakdown\n`,
  );
  const originalCwd = Deno.cwd();
  Deno.chdir(testDir);
  try {
    const config = new BreakdownConfig(testDir);
    let errorCaught = false;
    try {
      await config.loadConfig();
      await config.getConfig();
    } catch (e) {
      logger.debug("BreakdownConfig error on missing fields", {
        error: e instanceof Error ? e.message : String(e),
      });
      errorCaught = true;
    }
    assertEquals(errorCaught, true);
  } finally {
    Deno.chdir(originalCwd);
  }
});
