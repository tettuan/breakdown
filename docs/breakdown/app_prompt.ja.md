# アプリケーションプロンプト
実行時に、アプリケーションが利用するプロンプトを特定し、利用する。
渡された引数やオプションから、どのプロンプトを用いるか判別する。

## プロンプト処理の実装
https://jsr.io/@tettuan/breakdownprompt を使用します。

```ts
import { PromptManager } from "jsr:@tettuan/breakdownprompt@^0.1.3";

// プロンプトマネージャーの初期化
const promptManager = new PromptManager({
  base_dir: "./breakdown/prompts/"
});

// プロンプトの読み込みと変数置換
const prompt = await promptManager.loadPrompt({
  demonstrativeType: "to",
  layerType: "issue",
  fromLayerType: "project",
  variables: {
    input_markdown_file: "./.agent/breakdown/project/project_summary.md",
    input_markdown: "# Project Summary\nThis is a test project.",
    destination_path: "./.agent/breakdown/issues/"
  }
});
```

## プロンプトファイルの保存場所
app_configの設定ファイルに記載する。
```json
{
  "app_prompt": {
    "base_dir": "./breakdown/prompts/"
  }
}
```

## プロンプトファイルの命名規則
- `./path.ja.md` を参照
- 実行時にプロンプトを特定する手順も`./path.ja.md` を参照

# BreakdownPrompt の引数
- `./path.ja.md` を経て作成された情報を受け取り、引き渡す。


