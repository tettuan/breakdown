import { assertEquals, assertExists } from "https://deno.land/std/testing/asserts.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { ensureDir, emptyDir } from "https://deno.land/std/fs/mod.ts";

const TEST_DIR = "./test_workspace";

// テスト用の一時的なconfig.jsonを作成
const TEST_CONFIG = {
  working_directory: {
    root: ".agent/breakdown",
    Interims: {
      projects: "projects",
      issues: "issues",
      tasks: "tasks"
    }
  }
};

// テストの前後で実行する関数
async function setup() {
  await ensureDir(TEST_DIR);
  await ensureDir(join(TEST_DIR, "breakdown"));
  await Deno.writeTextFile(
    join(TEST_DIR, "breakdown", "config.json"),
    JSON.stringify(TEST_CONFIG, null, 2)
  );
}

async function teardown() {
  try {
    await emptyDir(TEST_DIR);
    await Deno.remove(TEST_DIR, { recursive: true });
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}

Deno.test({
  name: "breakdown init creates correct directory structure",
  async fn() {
    await setup();

    try {
      // breakdown initを実行
      const process = new Deno.Command(Deno.execPath(), {
        args: [
          "run",
          "--allow-read",
          "--allow-write",
          "cli/breakdown.ts",
          "init",
          TEST_DIR,
        ],
      });
      const { success } = await process.output();
      assertEquals(success, true);

      // ディレクトリ構造の検証
      const workingDir = join(TEST_DIR, TEST_CONFIG.working_directory.root);
      
      // working_directoryが作成されていることを確認
      const workingDirInfo = await Deno.stat(workingDir);
      assertExists(workingDirInfo);
      assertEquals(workingDirInfo.isDirectory, true);

      // Interimsディレクトリが作成されていることを確認
      const projectsDir = join(workingDir, TEST_CONFIG.working_directory.Interims.projects);
      const issuesDir = join(workingDir, TEST_CONFIG.working_directory.Interims.issues);
      const tasksDir = join(workingDir, TEST_CONFIG.working_directory.Interims.tasks);

      const projectsDirInfo = await Deno.stat(projectsDir);
      const issuesDirInfo = await Deno.stat(issuesDir);
      const tasksDirInfo = await Deno.stat(tasksDir);

      assertExists(projectsDirInfo);
      assertExists(issuesDirInfo);
      assertExists(tasksDirInfo);

      // config.jsonがコピーされていることを確認
      const configPath = join(workingDir, "config.json");
      const configInfo = await Deno.stat(configPath);
      assertExists(configInfo);

      // コピーされたconfig.jsonの内容を確認
      const copiedConfig = JSON.parse(
        await Deno.readTextFile(configPath)
      );
      assertEquals(copiedConfig, TEST_CONFIG);

    } finally {
      await teardown();
    }
  },
}); 