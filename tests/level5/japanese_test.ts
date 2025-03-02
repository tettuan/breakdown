import { assertEquals, assertStringIncludes } from "https://deno.land/std/testing/asserts.ts";
import { ensureDir, exists } from "https://deno.land/std/fs/mod.ts";
import * as path from "https://deno.land/std/path/mod.ts";
import { 
  setupTestAssets, 
  removeTestDirs, 
  TEST_WORKING_DIR,
  runCommand as importedRunCommand,
  TEST_DIR,
  cleanupTestFiles
} from "../test_utils.ts";
import { 
  checkpoint, 
  startSection, 
  endSection, 
  logObject,
  logFunction 
} from "../../utils/debug-logger.ts";

// モック関数: 実際の実装では適切なインポートに置き換える
async function runCommand(cmd: string, args: string[] = []): Promise<{ output: string, error: string }> {
  const command = new Deno.Command(cmd, {
    args,
    stdout: "piped",
    stderr: "piped",
  });
  
  const { stdout, stderr } = await command.output();
  
  const output = new TextDecoder().decode(stdout);
  const error = new TextDecoder().decode(stderr);
  
  return { output, error };
}

// テスト実行前にセットアップを行う
Deno.test({
  name: "日本語対応テストのセットアップ",
  fn: async () => {
    await setupTestAssets();
    await removeTestDirs();
    
    // テスト用ディレクトリを作成
    await ensureDir(TEST_WORKING_DIR);
    await ensureDir(path.join(TEST_WORKING_DIR, "projects"));
    await ensureDir(path.join(TEST_WORKING_DIR, "issues"));
    await ensureDir(path.join(TEST_WORKING_DIR, "tasks"));
    
    // 日本語ファイル名のテスト用ファイルを作成
    await Deno.writeTextFile(
      path.join(TEST_WORKING_DIR, "projects", "プロジェクト概要.md"),
      "# テストプロジェクト\nこれはテストプロジェクトの説明です。"
    );
    
    // 日本語コンテンツのテスト用ファイルを作成
    await Deno.writeTextFile(
      path.join(TEST_WORKING_DIR, "projects", "japanese_content.md"),
      "# 日本語コンテンツテスト\n\n## 概要\nこれは日本語のコンテンツを含むテストファイルです。\n\n## 目標\n- 日本語の処理が正しく行われることを確認する\n- 文字化けが発生しないことを確認する"
    );
  }
});

Deno.test("日本語ファイル名の処理テスト", async () => {
  startSection("日本語ファイル名の処理テスト");
  
  // 日本語ファイル名の読み込み
  const filePath = path.join(TEST_WORKING_DIR, "projects", "プロジェクト概要.md");
  checkpoint("ファイルパス", filePath);
  
  const fileContent = await Deno.readTextFile(filePath);
  checkpoint("ファイル内容", fileContent);
  
  // ファイル内容の確認
  assertStringIncludes(fileContent, "テストプロジェクト");
  assertStringIncludes(fileContent, "これはテストプロジェクトの説明です");
  
  // コマンド実行
  const commandArray = ["deno", "run", "-A", "cli.ts", "to", "issue", "--from", filePath, "--destination", 
    path.join(TEST_WORKING_DIR, "issues", "課題_自動生成.md")];
  checkpoint("コマンド配列", commandArray);
  
  const commandString = commandArray.join(" ");
  checkpoint("コマンド文字列", commandString);
  
  // importedRunCommand関数の型を確認
  checkpoint("importedRunCommand関数の型", typeof importedRunCommand);
  checkpoint("importedRunCommand関数", importedRunCommand.toString().substring(0, 100) + "...");
  
  try {
    // 配列バージョンを試す
    checkpoint("配列バージョンを試行", commandArray);
    const arrayResult = await importedRunCommand(commandArray);
    logObject(arrayResult, "配列バージョン結果");
    checkpoint("配列バージョン成功", true);
  } catch (arrayError) {
    checkpoint("配列バージョンエラー", arrayError);
    
    try {
      // 文字列バージョンを試す
      checkpoint("文字列バージョンを試行", commandString);
      const stringResult = await importedRunCommand(commandString);
      logObject(stringResult, "文字列バージョン結果");
      checkpoint("文字列バージョン成功", true);
      
      // 戻り値の構造に合わせてアクセス
      checkpoint("stdout存在確認", "stdout" in stringResult);
      checkpoint("output存在確認", "output" in stringResult);
      
      if ("stdout" in stringResult) {
        assertEquals(stringResult.stdout !== "", true, "Command should execute successfully");
      } else if ("output" in stringResult) {
        assertEquals(stringResult.output !== "", true, "Command should execute successfully");
      }
    } catch (stringError) {
      checkpoint("文字列バージョンエラー", stringError);
      throw stringError;
    }
  }
  
  // 出力ファイルが作成されたことを確認
  const outputPath = path.join(TEST_WORKING_DIR, "issues", "課題_自動生成.md");
  checkpoint("出力ファイルパス", outputPath);
  
  const outputExists = await exists(outputPath);
  checkpoint("出力ファイル存在", outputExists);
  
  assertEquals(outputExists, true);
  
  endSection("日本語ファイル名の処理テスト");
});

Deno.test("日本語コンテンツの処理テスト", async () => {
  startSection("日本語コンテンツの処理テスト");
  
  // 日本語コンテンツの読み込み
  const filePath = path.join(TEST_WORKING_DIR, "projects", "japanese_content.md");
  const fileContent = await Deno.readTextFile(filePath);
  
  // ファイル内容の確認
  assertStringIncludes(fileContent, "日本語コンテンツテスト");
  assertStringIncludes(fileContent, "これは日本語のコンテンツを含むテストファイルです");
  
  // コマンド実行
  const commandArray = ["deno", "run", "-A", "cli.ts", "to", "issue", "--from", filePath, "--destination", 
    path.join(TEST_WORKING_DIR, "issues", "issue_from_japanese.md")];
  checkpoint("コマンド配列", commandArray);
  
  const commandString = commandArray.join(" ");
  checkpoint("コマンド文字列", commandString);
  
  let result2;
  try {
    // 配列バージョンを試す
    checkpoint("配列バージョンを試行", commandArray);
    result2 = await importedRunCommand(commandArray);
    logObject(result2, "配列バージョン結果");
  } catch (arrayError) {
    checkpoint("配列バージョンエラー", arrayError);
    
    // 文字列バージョンを試す
    checkpoint("文字列バージョンを試行", commandString);
    result2 = await importedRunCommand(commandString);
    logObject(result2, "文字列バージョン結果");
  }
  
  // 戻り値の構造に合わせてアクセス
  checkpoint("result2の型", typeof result2);
  checkpoint("result2のプロパティ", Object.keys(result2));
  
  if ("stdout" in result2) {
    assertEquals(result2.stdout !== "", true, "Command should execute successfully");
  } else if ("output" in result2) {
    assertEquals(result2.output !== "", true, "Command should execute successfully");
  }
  
  // 出力ファイルが作成されたことを確認
  const outputExists = await exists(path.join(TEST_WORKING_DIR, "issues", "issue_from_japanese.md"));
  assertEquals(outputExists, true);
  
  // 出力ファイルの内容を確認
  const outputContent = await Deno.readTextFile(path.join(TEST_WORKING_DIR, "issues", "issue_from_japanese.md"));
  
  // 日本語が正しく処理されていることを確認
  assertStringIncludes(outputContent, "日本語");
  // 文字化けが発生していないことを確認（特定の文字化けパターンがないことを確認）
  assertEquals(outputContent.includes(""), false);
  
  endSection("日本語コンテンツの処理テスト");
});

Deno.test({
  name: "Japanese Support - File names and content",
  async fn() {
    startSection("Japanese Support - File names and content");
    
    try {
      // Setup test directories
      await ensureDir(`${TEST_DIR}/projects`);
      
      // Create test file with Japanese content
      const japaneseInputFile = path.join(TEST_DIR, "projects", "日本語プロジェクト.md");
      const japaneseContent = `# 日本語プロジェクト概要
## プロジェクトの目的
このプロジェクトは日本語のサポートをテストするためのものです。

## 主な機能
- 日本語ファイル名の処理
- 日本語コンテンツの処理
- 文字化けの防止

## 技術スタック
- TypeScript
- Deno
`;
      await Deno.writeTextFile(japaneseInputFile, japaneseContent);
      
      // Test command with Japanese file name
      const commandArray1 = ["deno", "run", "-A", "cli.ts", "to", "issue", "--from", japaneseInputFile, "--destination", 
        path.join(TEST_DIR, "issues", "日本語課題.md")];
      checkpoint("コマンド配列1", commandArray1);
      
      const commandString1 = commandArray1.join(" ");
      checkpoint("コマンド文字列1", commandString1);
      
      let result;
      try {
        // 配列バージョンを試す
        checkpoint("配列バージョンを試行", commandArray1);
        result = await importedRunCommand(commandArray1);
        logObject(result, "配列バージョン結果");
      } catch (arrayError) {
        checkpoint("配列バージョンエラー", arrayError);
        
        // 文字列バージョンを試す
        checkpoint("文字列バージョンを試行", commandString1);
        result = await importedRunCommand(commandString1);
        logObject(result, "文字列バージョン結果");
      }
      
      // Verify command execution
      if ("stdout" in result) {
        assertEquals(result.stdout !== "", true, "Command should execute successfully");
      } else if ("output" in result) {
        assertEquals(result.output !== "", true, "Command should execute successfully");
      }
      
      // Verify output file exists
      const outputExists = await exists(`${TEST_DIR}/issues/日本語課題.md`);
      assertEquals(outputExists, true, "Output file with Japanese name should exist");
      
      // Verify content
      const outputContent = await Deno.readTextFile(`${TEST_DIR}/issues/日本語課題.md`);
      assertStringIncludes(outputContent, "日本語プロジェクト", "Output should contain Japanese content");
      
      // Test auto-naming with Japanese input
      const commandArray2 = ["deno", "run", "-A", "cli.ts", "to", "task", "-f", `${TEST_DIR}/issues/日本語課題.md`, "-o"];
      checkpoint("コマンド配列2", commandArray2);
      
      const commandString2 = commandArray2.join(" ");
      checkpoint("コマンド文字列2", commandString2);
      
      let autoNameResult;
      try {
        // 配列バージョンを試す
        checkpoint("配列バージョンを試行", commandArray2);
        autoNameResult = await importedRunCommand(commandArray2);
        logObject(autoNameResult, "配列バージョン結果");
      } catch (arrayError) {
        checkpoint("配列バージョンエラー", arrayError);
        
        // 文字列バージョンを試す
        checkpoint("文字列バージョンを試行", commandString2);
        autoNameResult = await importedRunCommand(commandString2);
        logObject(autoNameResult, "文字列バージョン結果");
      }
      
      if ("stdout" in autoNameResult) {
        assertEquals(autoNameResult.stdout !== "", true, "Auto-naming with Japanese input should succeed");
      } else if ("output" in autoNameResult) {
        assertEquals(autoNameResult.output !== "", true, "Auto-naming with Japanese input should succeed");
      }
      
      // Verify that at least one file was created in the tasks directory
      const taskDir = await Deno.readDir(`${TEST_DIR}/tasks`);
      let taskFileFound = false;
      for await (const entry of taskDir) {
        if (entry.isFile && entry.name.endsWith(".md")) {
          taskFileFound = true;
          checkpoint("見つかったタスクファイル", entry.name);
          break;
        }
      }
      
      assertEquals(taskFileFound, true, "Task file should be created from Japanese input");
      
    } finally {
      // Clean up test files but preserve directory structure
      await cleanupTestFiles();
      endSection("Japanese Support - File names and content");
    }
  },
});

// デバッグ用のテストケースを修正
Deno.test("Debug Japanese command execution", async () => {
  startSection("Debug Japanese command execution");
  
  try {
    // importedRunCommand関数の情報をログに記録
    checkpoint("importedRunCommand関数の型", typeof importedRunCommand);
    checkpoint("importedRunCommand関数の文字列表現", importedRunCommand.toString().substring(0, 100) + "...");
    logObject(importedRunCommand, "importedRunCommand function");
    
    // test_utils.tsファイルの内容を確認
    try {
      const testUtilsContent = await Deno.readTextFile("../test_utils.ts");
      checkpoint("test_utils.tsの内容", testUtilsContent.substring(0, 500) + "...");
      
      // runCommand関数の定義を探す
      const runCommandMatch = testUtilsContent.match(/export async function runCommand\([^)]*\)/);
      if (runCommandMatch) {
        checkpoint("runCommand関数の定義", runCommandMatch[0]);
      }
    } catch (error) {
      checkpoint("test_utils.tsの読み込みエラー", error);
    }
    
    // テスト用のコマンド文字列
    const testCommandString = `deno run -A cli.ts to issue --from ${TEST_DIR}/projects/japanese_content.md --destination ${TEST_DIR}/issues/debug_output.md`;
    checkpoint("Test command string", testCommandString);
    
    // コマンド文字列を配列に分割
    const testCommandArray = testCommandString.split(" ");
    checkpoint("Test command as array", testCommandArray);
    
    // 両方の方法を試す
    try {
      // 配列バージョンを試す
      checkpoint("配列バージョンを試行", testCommandArray);
      const arrayResult = await importedRunCommand(testCommandArray);
      logObject(arrayResult, "Array version result");
      checkpoint("配列バージョン成功", true);
      
      // 結果のプロパティを確認
      checkpoint("arrayResult.stdout存在", "stdout" in arrayResult);
      checkpoint("arrayResult.output存在", "output" in arrayResult);
    } catch (arrayError) {
      checkpoint("配列バージョンエラー", arrayError);
      
      try {
        // 文字列バージョンを試す
        checkpoint("文字列バージョンを試行", testCommandString);
        const stringResult = await importedRunCommand(testCommandString);
        logObject(stringResult, "String version result");
        checkpoint("文字列バージョン成功", true);
        
        // 結果のプロパティを確認
        checkpoint("stringResult.stdout存在", "stdout" in stringResult);
        checkpoint("stringResult.output存在", "output" in stringResult);
      } catch (stringError) {
        checkpoint("文字列バージョンエラー", stringError);
      }
    }
    
    // 実際のテストケースで使用されているコマンドをデバッグ
    const actualCommandArray = ["deno", "run", "-A", "cli.ts", "to", "issue", "--from", 
      path.join(TEST_DIR, "projects", "japanese_content.md"), "--destination", 
      path.join(TEST_DIR, "issues", "debug_output.md")];
    
    checkpoint("Actual command array", actualCommandArray);
    const actualCommandString = actualCommandArray.join(" ");
    checkpoint("Actual command string", actualCommandString);
    
  } catch (error) {
    checkpoint("Debug test error", error);
  } finally {
    endSection("Debug Japanese command execution");
  }
}); 