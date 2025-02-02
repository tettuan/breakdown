#!/usr/bin/env -S deno run --allow-read --allow-write --allow-env

import { parse } from "https://deno.land/std/flags/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { copy, ensureDir } from "https://deno.land/std/fs/mod.ts";

interface Config {
  working_directory: {
    root: string;
    Interims: {
      projects: string;
      issues: string;
      tasks: string;
    };
  };
}

async function initBreakdown(targetDir: string) {
  // configファイルのパスを取得
  const configPath = join(targetDir, "breakdown", "config.json");

  try {
    // configファイルを読み込む
    const configText = await Deno.readTextFile(configPath);
    const config = JSON.parse(configText) as Config;

    // working_directory.rootのパスを取得
    const workingDir = join(targetDir, config.working_directory.root);

    // working_dirとその中のInterimsディレクトリを作成
    await ensureDir(workingDir);
    await ensureDir(join(workingDir, config.working_directory.Interims.projects));
    await ensureDir(join(workingDir, config.working_directory.Interims.issues));
    await ensureDir(join(workingDir, config.working_directory.Interims.tasks));

    // config.jsonをworking_directory.rootにコピー
    const destConfigPath = join(workingDir, "config.json");
    await copy(configPath, destConfigPath, { overwrite: true });

    console.log(`Breakdown initialized successfully in ${workingDir}`);

  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.error("Error: breakdown/config.json not found");
      Deno.exit(1);
    }
    console.error("Error:", error.message);
    Deno.exit(1);
  }
}

async function main() {
  const args = parse(Deno.args);
  const [command, dir] = args._;

  if (command !== "init" || !dir) {
    console.log("Usage: breakdown init <directory>");
    Deno.exit(1);
  }

  const targetDir = dir === "." ? Deno.cwd() : String(dir);
  await initBreakdown(targetDir);
}

if (import.meta.main) {
  main();
} 