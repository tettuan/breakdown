import { assertEquals, exists, join } from "../deps.ts";
import { Config } from "$lib/config/config.ts";
import { Workspace } from "$lib/core/workspace.ts";

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

Deno.test("breakdown init creates correct directory structure", async () => {
  // テスト前にディレクトリの状態を確認
  const dirExistsBefore = await exists(".agent/breakdown");
  
  // テスト前にディレクトリを削除
  if (dirExistsBefore) {
    try {
      await Deno.remove(".agent/breakdown", { recursive: true });
    } catch (e) {
      console.error("Error removing directory", e);
    }
  }
  
  // コマンドを実行
  const { output, error } = await runCommand("deno", ["run", "-A", "cli.ts", "init"]);
  
  // ディレクトリの存在を確認
  const dirExistsAfter = await exists(".agent/breakdown");
  
  // テスト結果を検証
  assertEquals(dirExistsAfter, true, "Directory .agent/breakdown should exist");
}); 