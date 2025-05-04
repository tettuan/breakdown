/**
 * baseDir関連の異常系・エッジケーステスト
 *
 * 仕様根拠:
 * - docs/breakdown/path.ja.md, testing.ja.md
 * - baseDirは必ず設定値を参照し、Deno.cwd()基準での解決はNG
 *
 * テスト内容:
 * - baseDir未指定・空文字・相対パス・絶対パスの挙動
 * - 設定値を明示的に渡した場合の正常動作
 * - BreakdownLoggerでデバッグ出力
 */

import { assertEquals, assertExists } from "jsr:@std/assert@^0.224.0";
import { join, relative } from "jsr:@std/path@^0.224.0";
import { ensureDir } from "jsr:@std/fs@^0.224.0";
import { processWithPrompt } from "$lib/prompt/processor.ts";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger@^0.1.10";

function createLoggerAdapter(logger: BreakdownLogger) {
  return {
    debug: (...args: unknown[]) => logger.debug(String(args[0]), args[1]),
    error: (...args: unknown[]) => logger.error(String(args[0]), args[1]),
  };
}

Deno.test("baseDir未指定（空文字）の場合はエラーとなる", async () => {
  // テスト用一時ディレクトリ
  const testDirRaw = await Deno.makeTempDir();
  const testDir = await Deno.realPath(testDirRaw);
  const logger = createLoggerAdapter(new BreakdownLogger());
  const originalCwd = Deno.cwd();
  Deno.chdir(testDir);
  try {
    // テンプレートファイルを正しい場所に作成
    const promptDir = join(testDir, "prompts", "to", "project");
    await ensureDir(promptDir);
    const promptFile = join(promptDir, "f_project.md");
    await Deno.writeTextFile(
      promptFile,
      "# {input_markdown_file}\nContent: {input_markdown}\nOutput to: {destination_path}",
    );
    // 入力ファイル
    const inputFile = join(testDir, "input.md");
    await Deno.writeTextFile(inputFile, "# Example\n- Feature");
    // promptBaseDir未指定（空文字）で呼び出し
    logger.debug("[TEST] promptBaseDir未指定でprocessWithPrompt", { cwd: Deno.cwd(), promptFile });
    const result = await processWithPrompt(
      "", // promptBaseDir未指定
      "to",
      "project",
      inputFile,
      "output.md",
      "project",
      logger,
    );
    // Assert: error is about missing base_dir
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

Deno.test("promptBaseDirに相対パス・絶対パスを指定した場合の挙動", async () => {
  const testDirRaw = await Deno.makeTempDir();
  const testDir = await Deno.realPath(testDirRaw);
  const logger = createLoggerAdapter(new BreakdownLogger());
  const originalCwd = Deno.cwd();
  Deno.chdir(testDir);
  try {
    // テンプレートファイル
    const promptDir = join(testDir, "custom_prompts", "to", "project");
    await ensureDir(promptDir);
    const promptFile = join(promptDir, "f_project.md");
    await Deno.writeTextFile(
      promptFile,
      "# {input_markdown_file}\nContent: {input_markdown}\nOutput to: {destination_path}",
    );
    const inputFile = join(testDir, "input.md");
    await Deno.writeTextFile(inputFile, "# Example\n- Feature");
    // promptBaseDir相対パス
    const relPromptBaseDir = relative(testDir, join(testDir, "custom_prompts"));
    logger.debug("[TEST] promptBaseDir相対パス", { relPromptBaseDir });
    const resultRel = await processWithPrompt(
      relPromptBaseDir,
      "to",
      "project",
      inputFile,
      "output.md",
      "project",
      logger,
    );
    logger.debug("[TEST] 結果（相対パス）", { resultRel });
    assertEquals(resultRel.success, true);
    assertExists(resultRel.content);
    // promptBaseDir絶対パス
    logger.debug("[TEST] promptBaseDir絶対パス", { promptDir: join(testDir, "custom_prompts") });
    const resultAbs = await processWithPrompt(
      join(testDir, "custom_prompts"),
      "to",
      "project",
      inputFile,
      "output.md",
      "project",
      logger,
    );
    logger.debug("[TEST] 結果（絶対パス）", { resultAbs });
    assertEquals(resultAbs.success, true);
    assertExists(resultAbs.content);
  } finally {
    Deno.chdir(originalCwd);
  }
});

Deno.test("設定値を明示的にpromptBaseDirとして渡した場合は正しいテンプレートが見つかる", async () => {
  const testDirRaw = await Deno.makeTempDir();
  const testDir = await Deno.realPath(testDirRaw);
  const logger = createLoggerAdapter(new BreakdownLogger());
  const originalCwd = Deno.cwd();
  Deno.chdir(testDir);
  try {
    // 設定値を模したディレクトリ
    const promptBaseDir = join(testDir, ".agent", "breakdown", "prompts");
    const promptDir = join(promptBaseDir, "to", "project");
    await ensureDir(promptDir);
    const promptFile = join(promptDir, "f_project.md");
    await Deno.writeTextFile(
      promptFile,
      "# {input_markdown_file}\nContent: {input_markdown}\nOutput to: {destination_path}",
    );
    const inputFile = join(testDir, "input.md");
    await Deno.writeTextFile(inputFile, "# Example\n- Feature");
    logger.debug("[TEST] 設定値promptBaseDirでprocessWithPrompt", { promptBaseDir });
    const result = await processWithPrompt(
      promptBaseDir,
      "to",
      "project",
      inputFile,
      "output.md",
      "project",
      logger,
    );
    logger.debug("[TEST] 結果（設定値promptBaseDir）", { result });
    assertEquals(result.success, true);
    assertExists(result.content);
  } finally {
    Deno.chdir(originalCwd);
  }
});
