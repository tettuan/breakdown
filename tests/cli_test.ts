/**
 * CLIコマンドのテスト
 * 
 * 目的:
 * - CLIコマンドの基本的な動作の検証
 * - --input オプションを含むコマンドライン引数の解析
 * - エラーケースの検証
 * 
 * 関連する仕様:
 * - docs/breakdown/options.ja.md: CLIオプションの仕様
 * 
 * 実装の考慮点:
 * 1. コマンドライン引数の解析
 *    - 必須オプションのチェック
 *    - エイリアスの解決
 *    - 無効な値のエラー処理
 * 
 * 2. ファイル操作
 *    - 入力ファイルの存在チェック
 *    - 出力ディレクトリの作成
 *    - ファイルパスの正規化
 * 
 * 3. エラーハンドリング
 *    - 適切なエラーメッセージ
 *    - エラー時の終了コード
 * 
 * 関連コミット:
 * - feat: add --input option (24671fe)
 * - test: add CLI option tests
 */

import { assertEquals, assert, assertStringIncludes, join, ensureDir, exists } from "../deps.ts";
import { setupTestEnv, cleanupTestFiles, initTestConfig, setupTestDirs, removeWorkDir } from "./test_utils.ts";

// コマンド実行関数をラップしてデバッグ情報を追加
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

// Note: Tests will be updated when @tettuan/breakdownparams is implemented 