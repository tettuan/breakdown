import { CommandOptions } from "$lib/cli/args.ts";
import { join } from "../../deps.ts";

export interface Prompt {
  path: string;
  content: string;
}

export class PromptLoader {
  async load(args: CommandOptions): Promise<Prompt> {
    // プロンプトのベースディレクトリを取得
    const baseDir = "./breakdown/prompts";

    // プロンプトのディレクトリを構築
    const demonstrative = args.demonstrative || "default";
    const layer = args.layer || "default";
    const promptDir = join(baseDir, demonstrative, layer);

    // 入力レイヤータイプを決定
    let fromLayerType = "default";
    if (args.fromProject) {
      fromLayerType = "project";
    } else if (args.fromIssue) {
      fromLayerType = "issue";
    } else if (args.fromFile) {
      // ファイルパスからの推論
      fromLayerType = this.inferLayerTypeFromPath(args.fromFile) || "default";
    }

    // プロンプトファイルのパスを構築
    const promptPath = join(promptDir, `f_${fromLayerType}.md`);

    // プロンプトファイルを読み込み
    const content = await this.readPromptFile(promptPath);

    return {
      path: promptPath,
      content,
    };
  }

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

  private async readPromptFile(path: string): Promise<string> {
    try {
      return await Deno.readTextFile(path);
    } catch {
      // デフォルトのプロンプトを返す
      return "default prompt content";
    }
  }
}
