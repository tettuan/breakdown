import { ensureDir, join } from "../../deps.ts";
import { Config } from "../config/config.ts";
import { WorkspaceStructure } from "../config/types.ts";

export class Workspace {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  public async initialize(baseDir: string): Promise<void> {
    // まず Config を更新
    await this.config.initialize({
      workingDir: baseDir
    });

    const structure = this.config.workspaceStructure;
    const rootDir = join(baseDir, structure.root);

    // Create root directory
    await ensureDir(rootDir);
    
    // Create subdirectories
    for (const [_, dirPath] of Object.entries(structure.directories)) {
      const fullPath = join(rootDir, dirPath);
      await ensureDir(fullPath);
    }

    // Create workspace config
    const workspaceConfig = {
      working_directory: this.config.workingDirectory,  // Config から取得
      output_directory: rootDir,
      workspace_structure: structure
    };

    const configPath = join(rootDir, "config.json");
    await Deno.writeTextFile(configPath, JSON.stringify(workspaceConfig, null, 2));
  }

  public getPath(type: keyof WorkspaceStructure['directories']): string {
    const structure = this.config.workspaceStructure;
    return join(
      this.config.workingDirectory,
      structure.root,
      structure.directories[type]
    );
  }
} 