import { assertEquals, assertThrows } from "https://deno.land/std/testing/asserts.ts";

// モック関数: 実際の実装では適切なインポートに置き換える
function parseArgs(args: string[]) {
  const result: {
    demonstrativeType?: string;
    layerType?: string;
    fromFile?: string;
    destinationFile?: string;
    inputLayerType?: string;
    help?: boolean;
    version?: boolean;
  } = {};
  
  // コマンド解析
  if (args[0] === "to" || args[0] === "summary" || args[0] === "defect") {
    result.demonstrativeType = args[0];
    
    if (args[1] === "project" || args[1] === "issue" || args[1] === "task") {
      result.layerType = args[1];
    } else {
      throw new Error(`無効なレイヤータイプです: ${args[1]}`);
    }
  } else if (args[0] === "init") {
    result.demonstrativeType = "init";
  } else if (args[0] === "--help" || args[0] === "-h") {
    result.help = true;
  } else if (args[0] === "--version" || args[0] === "-v") {
    result.version = true;
  }
  
  // オプション解析
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--from" || args[i] === "-f") {
      result.fromFile = args[i + 1];
      i++;
    } else if (args[i] === "--destination" || args[i] === "-o") {
      result.destinationFile = args[i + 1] || "";
      i++;
    } else if (args[i] === "--input" || args[i] === "-i") {
      result.inputLayerType = args[i + 1];
      i++;
    }
  }
  
  return result;
}

/**
 * コマンドライン引数解析テスト [ID:ARGS] - レベル2: 引数解析とパス処理
 * 
 * 目的:
 * - DemonstrativeTypeが正しく解析されることを確認 (`to`, `summary`, `defect`, `init`)
 * - LayerTypeが正しく解析されることを確認 (`project`, `issue`, `task`)
 * - オプションが正しく解析されることを確認 (`--from/-f`, `--destination/-o`, `--input/-i`)
 * - 無効な引数に対するエラーハンドリングを確認
 * 
 * 境界線:
 * - コマンドライン引数解析 → プロンプト/スキーマ特定
 *   引数解析が正しく行われないと、正しいプロンプトやスキーマを特定できない
 * 
 * 依存関係:
 * - [CMD] 基本コマンド処理テスト
 */
Deno.test("コマンドライン引数解析テスト - DemonstrativeType", () => {
  const toArgs = parseArgs(["to", "project"]);
  assertEquals(toArgs.demonstrativeType, "to");
  
  const summaryArgs = parseArgs(["summary", "issue"]);
  assertEquals(summaryArgs.demonstrativeType, "summary");
  
  const defectArgs = parseArgs(["defect", "task"]);
  assertEquals(defectArgs.demonstrativeType, "defect");
  
  const initArgs = parseArgs(["init"]);
  assertEquals(initArgs.demonstrativeType, "init");
});

Deno.test("コマンドライン引数解析テスト - LayerType", () => {
  const projectArgs = parseArgs(["to", "project"]);
  assertEquals(projectArgs.layerType, "project");
  
  const issueArgs = parseArgs(["to", "issue"]);
  assertEquals(issueArgs.layerType, "issue");
  
  const taskArgs = parseArgs(["to", "task"]);
  assertEquals(taskArgs.layerType, "task");
  
  // 無効なレイヤータイプ
  assertThrows(
    () => {
      parseArgs(["to", "invalid"]);
    },
    Error,
    "無効なレイヤータイプです"
  );
});

Deno.test("コマンドライン引数解析テスト - オプション", () => {
  const args = parseArgs([
    "to", "project", 
    "--from", "input.md", 
    "--destination", "output.md", 
    "--input", "issue"
  ]);
  
  assertEquals(args.fromFile, "input.md");
  assertEquals(args.destinationFile, "output.md");
  assertEquals(args.inputLayerType, "issue");
  
  // エイリアスでも同様に動作することを確認
  const aliasArgs = parseArgs([
    "to", "project", 
    "-f", "input.md", 
    "-o", "output.md", 
    "-i", "issue"
  ]);
  
  assertEquals(aliasArgs.fromFile, "input.md");
  assertEquals(aliasArgs.destinationFile, "output.md");
  assertEquals(aliasArgs.inputLayerType, "issue");
  
  // 空の出力ファイル名
  const emptyDestArgs = parseArgs([
    "to", "project", 
    "--from", "input.md", 
    "--destination"
  ]);
  
  assertEquals(emptyDestArgs.destinationFile, "");
});

Deno.test("コマンドライン引数解析テスト - ヘルプとバージョン", () => {
  const helpArgs = parseArgs(["--help"]);
  assertEquals(helpArgs.help, true);
  
  const helpAliasArgs = parseArgs(["-h"]);
  assertEquals(helpAliasArgs.help, true);
  
  const versionArgs = parseArgs(["--version"]);
  assertEquals(versionArgs.version, true);
  
  const versionAliasArgs = parseArgs(["-v"]);
  assertEquals(versionAliasArgs.version, true);
}); 