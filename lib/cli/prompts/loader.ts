import { CommandOptions } from "$lib/cli/args.ts";
import { BreakdownConfig } from "@tettuan/breakdownconfig";
import { join } from "@std/path";

/**
 * Represents a prompt template loaded by the Breakdown CLI.
 */
export interface Prompt {
  /** The file path to the prompt template. */
  path: string;
  /** The content of the prompt template. */
  content: string;
}

/**
 * PromptLoader loads prompt templates for the Breakdown CLI.
 *
 * All configuration access (e.g., prompt base dir) must use BreakdownConfig from @tettuan/breakdownconfig.
 * Do not read YAML or JSON config files directly in this module.
 */
export class PromptLoader {
  /**
   * Gets the prompt base directory from config using BreakdownConfig.
   * All config access must use BreakdownConfig, not direct file reads.
   * @returns {Promise<string>} The prompt base directory
   * @throws {Error} If base_dir is not set in config
   */
  private async getPromptBaseDir(): Promise<string> {
    const config = new BreakdownConfig();
    await config.loadConfig();
    const settings = await config.getConfig();
    // user.yml > app.yml 優先
    if (
      settings && typeof settings === "object" && settings.user && typeof settings.user === "object"
    ) {
      if (
        settings.user.app_prompt && typeof settings.user.app_prompt === "object" &&
        (settings.user.app_prompt as Record<string, unknown>).base_dir
      ) {
        if (settings.app_prompt && typeof settings.app_prompt === "object") {
          (settings.app_prompt as Record<string, unknown>).base_dir =
            (settings.user.app_prompt as Record<string, unknown>).base_dir;
        }
      }
    }
    if (settings.app_prompt?.base_dir && settings.app_prompt.base_dir.trim() !== "") {
      let resolvedBaseDir = settings.app_prompt.base_dir;
      if (!resolvedBaseDir.startsWith("/")) {
        resolvedBaseDir = join(Deno.cwd(), resolvedBaseDir);
      }
      return resolvedBaseDir;
    }
    throw new Error(
      "Prompt base_dir must be set in config (app_prompt.base_dir). No fallback allowed.",
    );
  }

  /**
   * プロンプトテンプレートをロードする
   * @param args コマンドオプション
   */
  async load(args: CommandOptions): Promise<Prompt> {
    const promptBaseDir = await this.getPromptBaseDir();
    const demonstrative = args.demonstrative;
    const layer = args.layer;

    if (demonstrative && layer) {
      // Both parameters are provided, validate they are not empty
      if (!demonstrative.trim()) {
        throw new Error("demonstrative type cannot be empty");
      }
      if (!layer.trim()) {
        throw new Error("layer type cannot be empty");
      }
    }

    const promptDir = args.promptDir || `${demonstrative}/${layer}`;

    // Determine input type from file path
    if (!args.fromFile) {
      throw new Error("No input file specified");
    }
    const inputType = args.input || this.inferLayerTypeFromPath(args.fromFile);
    if (!inputType) {
      throw new Error("Could not determine input type from file path");
    }

    // プロンプトファイルのパスを構築
    const promptPath = join(promptBaseDir, promptDir, `f_${inputType}.md`);

    // プロンプトファイルを読み込み
    const content = await this.readPromptFile(promptPath);

    return {
      path: promptPath,
      content,
    };
  }

  /**
   * Resolves the canonical layer type alias from a given input string.
   * @param input The input string to resolve.
   * @returns The canonical layer type alias or 'default'.
   */
  private resolveLayerTypeAlias(input: string): string {
    const ALIASES = {
      project: ["project", "pj", "prj"],
      issue: ["issue", "story"],
      task: ["task", "todo", "chore", "style", "fix", "error", "bug"],
    };

    const lowercaseInput = input.toLowerCase();
    for (const [type, aliases] of Object.entries(ALIASES)) {
      if (aliases.includes(lowercaseInput)) {
        return type;
      }
    }
    return "default";
  }

  /**
   * Infers the layer type from a given file path.
   * @param path The file path to analyze.
   * @returns The inferred layer type or undefined if not matched.
   */
  private inferLayerTypeFromPath(path: string): string | undefined {
    const PATTERNS = {
      project: /project|pj|prj/i,
      issue: /issue|story/i,
      task: /task|todo|chore|style|fix|error|bug/i,
    };

    for (const [type, pattern] of Object.entries(PATTERNS)) {
      if (pattern.test(path)) {
        return type;
      }
    }
    return undefined;
  }

  /**
   * Reads the content of a prompt file at the given path.
   * @param path The file path to read.
   * @returns The file content as a string, or a default if not found.
   */
  private async readPromptFile(path: string): Promise<string> {
    try {
      return await Deno.readTextFile(path);
    } catch {
      // デフォルトのプロンプトを返す
      return "default prompt content";
    }
  }
}

export type { CommandOptions } from "$lib/cli/args.ts";
