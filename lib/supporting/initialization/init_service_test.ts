import { assertEquals, assertExists } from "@std/assert";
import { exists } from "@std/fs";
import { join } from "@std/path";
import { InitService, type InitServiceOptions } from "./init_service.ts";
import { BreakdownConfig } from "@tettuan/breakdownconfig";

Deno.test("InitService - 基本的な初期化", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const options: InitServiceOptions = {
      workspaceDirectory: tempDir,
      configProfileName: "test"
    };

    const service = new InitService();
    const result = await service.initialize(options);

    // 基本的な検証
    assertEquals(result.success, true);
    assertEquals(result.configProfileName, "test");
    assertEquals(result.workspaceDirectory, tempDir);
    
    // ディレクトリ構造の検証
    const expectedDirs = [
      "prompts",
      "prompts/to/project",
      "schemas", 
      "config",
      "output"
    ];
    
    for (const dir of expectedDirs) {
      const dirPath = join(tempDir, dir);
      const dirExists = await exists(dirPath);
      assertEquals(dirExists, true, `Directory ${dir} should exist`);
    }

    // 設定ファイルの検証
    const appConfigPath = join(tempDir, "config/test-app.yml");
    const userConfigPath = join(tempDir, "config/test-user.yml");
    
    assertEquals(await exists(appConfigPath), true);
    assertEquals(await exists(userConfigPath), true);
    
    // サンプルファイルの検証
    const samplePromptPath = join(tempDir, "prompts/to/project/example.md");
    assertEquals(await exists(samplePromptPath), true);
    
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("InitService - デフォルトプロファイル名", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const options: InitServiceOptions = {
      workspaceDirectory: tempDir
    };

    const service = new InitService();
    const result = await service.initialize(options);

    assertEquals(result.success, true);
    assertEquals(result.configProfileName, "default");
    
    // default設定ファイルの存在確認
    const appConfigPath = join(tempDir, "config/default-app.yml");
    const userConfigPath = join(tempDir, "config/default-user.yml");
    
    assertEquals(await exists(appConfigPath), true);
    assertEquals(await exists(userConfigPath), true);
    
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("InitService - 既存ファイルの保護", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    // 初回初期化
    const service = new InitService();
    await service.initialize({
      workspaceDirectory: tempDir
    });
    
    // 既存ファイルの内容を変更
    const configPath = join(tempDir, "config/default-app.yml");
    await Deno.writeTextFile(configPath, "# Modified content\ntest: value");
    
    // 再初期化（force無し）
    const result2 = await service.initialize({
      workspaceDirectory: tempDir
    });
    
    // ファイルが上書きされていないことを確認
    const content = await Deno.readTextFile(configPath);
    assertEquals(content.includes("# Modified content"), true);
    
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("InitService - バックアップ機能", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const service = new InitService();
    
    // 初回初期化
    await service.initialize({
      workspaceDirectory: tempDir
    });
    
    // 既存ファイルの内容を変更
    const configPath = join(tempDir, "config/default-app.yml");
    const originalContent = "# Original content\ntest: original";
    await Deno.writeTextFile(configPath, originalContent);
    
    // バックアップ有りで再初期化
    const result = await service.initialize({
      workspaceDirectory: tempDir,
      backup: true,
      force: true
    });
    
    assertEquals(result.success, true);
    assertExists(result.backedUpFiles);
    assertEquals(result.backedUpFiles.length > 0, true);
    
    // バックアップファイルの存在確認
    const backupPath = `${configPath}.backup`;
    assertEquals(await exists(backupPath), true);
    
    // バックアップ内容の確認
    const backupContent = await Deno.readTextFile(backupPath);
    assertEquals(backupContent, originalContent);
    
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("InitService - 不正なプロファイル名", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const service = new InitService();
    const result = await service.initialize({
      workspaceDirectory: tempDir,
      configProfileName: "invalid/name"  // スラッシュは無効
    });
    
    assertEquals(result.success, false);
    assertEquals(result.message.includes("Invalid config profile name"), true);
    
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("InitService - 成功メッセージの内容確認", async () => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    const service = new InitService();
    const result = await service.initialize({
      workspaceDirectory: tempDir
    });
    
    assertEquals(result.success, true);
    
    // メッセージに必要な情報が含まれているか
    assertEquals(result.message.includes("✅"), true);
    assertEquals(result.message.includes("Workspace initialization completed"), true);
    assertEquals(result.message.includes(tempDir), true);
    assertEquals(result.message.includes("default"), true);
    assertEquals(result.message.includes("Next steps"), true);
    
  } finally {
    await Deno.remove(tempDir, { recursive: true });
  }
});