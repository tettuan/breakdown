import { assertEquals, exists, join } from "../deps.ts";
import { Config } from "$lib/config/config.ts";
import { Workspace } from "$lib/core/workspace.ts";

Deno.test("breakdown init creates correct directory structure", async () => {
  const testDir = await Deno.makeTempDir();
  try {
    const config = Config.getInstance();
    const workspace = new Workspace(config);
    
    await config.initialize({
      workingDir: testDir,
    });

    await workspace.initialize(testDir);

    // 期待されるディレクトリ構造の検証
    const expectedDirs = [
      ".agent/breakdown",
      ".agent/breakdown/issues",
      ".agent/breakdown/tasks",
      ".agent/breakdown/projects"
    ];

    for (const dir of expectedDirs) {
      const fullPath = join(testDir, dir);
      const dirExists = await exists(fullPath);
      assertEquals(dirExists, true, `Directory ${dir} should exist`);
    }

    // 設定ファイルの検証
    const configPath = join(testDir, ".agent/breakdown/config.json");
    const configExists = await exists(configPath);
    assertEquals(configExists, true, "Config file should exist");

    // 設定内容の検証を型に合わせて修正
    const configContent = JSON.parse(await Deno.readTextFile(configPath));
    assertEquals(typeof configContent.working_directory, "string", "working_directory should be a string");
    assertEquals(configContent.working_directory, testDir, "working_directory should match testDir");
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
}); 