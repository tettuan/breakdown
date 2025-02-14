import { exists } from "https://deno.land/std/fs/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { BreakdownConfig, ConfigOptions } from "./types.ts";

export class Config {
  private static instance: Config;
  private config: BreakdownConfig;

  private constructor() {
    // デフォルト設定
    this.config = {
      working_directory: Deno.cwd(),
      output_directory: "./breakdown",
      default_config_path: "breakdown/config.json",
    };
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public async initialize(options?: ConfigOptions): Promise<void> {
    // 設定ファイルの読み込み
    const configPath = options?.configPath || this.config.default_config_path;
    if (await exists(configPath)) {
      const fileContent = await Deno.readTextFile(configPath);
      const fileConfig = JSON.parse(fileContent);
      this.config = { ...this.config, ...fileConfig };
    }

    // CLIオプションでの上書き
    if (options?.workingDir) {
      this.config.working_directory = options.workingDir;
    }
    if (options?.outputDir) {
      this.config.output_directory = options.outputDir;
    }
  }

  public get workingDirectory(): string {
    return this.config.working_directory;
  }

  public get outputDirectory(): string {
    return this.config.output_directory;
  }

  // 他のゲッターメソッド...
} 