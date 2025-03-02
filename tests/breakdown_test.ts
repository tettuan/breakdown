import { assertEquals, exists, join } from "../deps.ts";
import { Config } from "$lib/config/config.ts";
import { Workspace } from "$lib/core/workspace.ts";

// デバッグ用のロガー関数
function log(level: string, message: string, data?: unknown) {
  const LOG_LEVEL = Deno.env.get("LOG_LEVEL") || "info";
  
  const levels = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };
  
  if (levels[level as keyof typeof levels] >= levels[LOG_LEVEL as keyof typeof levels]) {
    console.log(`[${level.toUpperCase()}] ${message}`, data ? JSON.stringify(data, null, 2) : "");
  }
}

// コマンド実行関数をラップしてデバッグ情報を追加
async function runCommand(cmd: string, args: string[] = []): Promise<{ output: string, error: string }> {
  log("debug", `Executing command: ${cmd} ${args.join(" ")}`);
  
  const command = new Deno.Command(cmd, {
    args,
    stdout: "piped",
    stderr: "piped",
  });
  
  log("debug", "Command created, awaiting output");
  const { stdout, stderr } = await command.output();
  
  const output = new TextDecoder().decode(stdout);
  const error = new TextDecoder().decode(stderr);
  
  log("debug", "Command output received", { output, error });
  
  return { output, error };
}

Deno.test("breakdown init creates correct directory structure", async () => {
  log("info", "Starting test: breakdown init creates correct directory structure");
  
  // テスト前にディレクトリの状態を確認
  const dirExistsBefore = await exists(".agent/breakdown");
  log("debug", "Directory exists before test", { dirExistsBefore });
  
  // テスト前にディレクトリを削除
  if (dirExistsBefore) {
    log("debug", "Removing existing directory");
    try {
      await Deno.remove(".agent/breakdown", { recursive: true });
      log("debug", "Directory removed successfully");
    } catch (e) {
      log("error", "Error removing directory", e);
    }
  }
  
  // コマンドを実行
  log("debug", "Running 'breakdown init' command");
  const { output, error } = await runCommand("deno", ["run", "-A", "cli.ts", "init"]);
  log("debug", "Command execution completed", { output, error });
  
  // ディレクトリの存在を確認
  const dirExistsAfter = await exists(".agent/breakdown");
  log("debug", "Directory exists after test", { dirExistsAfter });
  
  // テスト結果を検証
  log("debug", "Asserting directory existence");
  assertEquals(dirExistsAfter, true, "Directory .agent/breakdown should exist");
  log("info", "Test completed successfully");
}); 