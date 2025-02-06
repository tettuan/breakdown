import { assert, assertEquals, assertRejects } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { toJSON, toMarkdown } from "./lib/mod.ts";
import { Config } from "./breakdown/config/config.ts";
import { Workspace } from "./breakdown/core/workspace.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";
import { exists } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { WorkspaceStructure } from "./breakdown/config/types.ts";

// モックデータ
const mockInput = "test_input.md";
const mockOutput = "test_output";

Deno.test("toJSON - project conversion", async () => {
  const result = await toJSON("project", mockInput, mockOutput);
  assertEquals(result.success, true);
});

Deno.test("toJSON - issue conversion", async () => {
  const result = await toJSON("issue", mockInput, mockOutput);
  assertEquals(result.success, true);
});

Deno.test("toJSON - task conversion", async () => {
  const result = await toJSON("task", mockInput, mockOutput);
  assertEquals(result.success, true);
});


Deno.test("toMarkdown - project conversion", async () => {
  const result = await toMarkdown("project", mockInput, mockOutput);
  assertEquals(result.success, true);
});

Deno.test("toMarkdown - issue conversion", async () => {
  const result = await toMarkdown("issue", mockInput, mockOutput);
  assertEquals(result.success, true);
});

Deno.test("toMarkdown - task conversion", async () => {
  const result = await toMarkdown("task", mockInput, mockOutput);
  assertEquals(result.success, true);
});

Deno.test("toJSON - should reject invalid type at compile time", () => {
  // 型エラーが発生することを確認するためのテスト
  const typeCheckError = () => {
    // @ts-expect-error - "invalid" は "project" | "issue" | "task" に代入できないはず
    return toJSON("invalid", "test content", "test_output");
  };
  
  // 型チェックエラーが発生することを期待
  // 実行時にはこのテストは常に成功します
  assert(true, "Type check should fail at compile time");
});

// 有効な型の場合のテストも追加しておくと良いでしょう
Deno.test("toJSON - should accept valid type", async () => {
  const result = await toJSON("project", "test content", "test_output");
  assertEquals(result.success, true);
});

Deno.test("should create initial directory structure", async () => {
  const testDir = await Deno.makeTempDir();
  try {
    const config = Config.getInstance();
    const workspace = new Workspace(config);
    
    await config.initialize({
      workingDir: testDir,
    });

    await workspace.initialize(testDir);

    // 設定ファイルの検証
    const configPath = join(testDir, ".agent/breakdown/config.json");
    const configExists = await exists(configPath);
    assertEquals(configExists, true, "Config file should exist");

    const configContent = JSON.parse(await Deno.readTextFile(configPath));
    
    // 新しい設定構造の検証
    console.log('Expected:', testDir);
    console.log('Actual:', configContent.working_directory);
    assertEquals(configContent.working_directory, testDir);
    assertEquals(typeof configContent.workspace_structure, "object");
    assertEquals(typeof configContent.workspace_structure.root, "string");
    assertEquals(typeof configContent.workspace_structure.directories, "object");
    
    // ディレクトリ構造の検証
    const structure = configContent.workspace_structure as WorkspaceStructure;
    for (const [_, dirPath] of Object.entries(structure.directories)) {
      const fullPath = join(testDir, structure.root, dirPath);
      const dirExists = await exists(fullPath);
      assertEquals(dirExists, true, `Directory ${dirPath} should exist`);
    }
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

function setupTestDirectory(structure: WorkspaceStructure) {
  const testDir = Deno.makeTempDirSync();
  const dirPath = typeof structure.root === 'string' ? structure.root : '';
  const fullPath = join(testDir, dirPath);
  
  // Create directories based on workspace structure
  for (const [_, path] of Object.entries(structure.directories)) {
    const directoryPath = join(fullPath, path);
    Deno.mkdirSync(directoryPath, { recursive: true });
  }
  
  return testDir;
} 