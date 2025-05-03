# アプリケーションプロンプト

実行時に、アプリケーションが利用するプロンプトを特定し、利用する。
渡された引数やオプションから、どのプロンプトを用いるか判別する。

## プロンプト処理の実装

https://jsr.io/@tettuan/breakdownprompt を使用します。 README
https://github.com/tettuan/breakdownprompt を読み把握すること。

```ts
import { PromptManager } from "jsr:@tettuan/breakdownprompt@^0.1.8";

// プロンプトマネージャーの初期化
const promptManager = new PromptManager({
  baseDir: "./.agent/breakdown/prompts/", // baseDir is the correct property name
  debug: false, // optional: デバッグモードの設定
});

// プロンプトの読み込みと変数置換
const prompt = await promptManager.loadPrompt({
  demonstrativeType: "to",
  layerType: "issue",
  fromLayerType: "project",
  variables: {
    input_markdown_file: "./.agent/breakdown/project/project_summary.md",
    input_markdown: "# Project Summary\nThis is a test project.",
    destination_path: "./.agent/breakdown/issues/",
  },
});

// プロンプトの取得
const promptText = prompt.toString();
```

## プロンプトファイルの設定

app_configの設定ファイルに記載します。

```json
{
  "app_prompt": {
    "baseDir": "./.agent/breakdown/prompts/",
    "debug": false
  }
}
```

## プロンプトファイルの命名規則と構造

- `./path.ja.md` を参照してください
- 実行時にプロンプトを特定する手順も`./path.ja.md` を参照してください

## デバッグ方法

プロンプトのデバッグが必要な場合は以下の方法を使用できます：

1. 環境変数での設定:

```bash
LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read
```

2. コード内での設定:

```ts
const promptManager = new PromptManager({
  baseDir: "./.agent/breakdown/prompts/",
  debug: true,
});
```

## BreakdownPrompt の引数

- `./path.ja.md` を経て作成された情報を受け取り、引き渡します
- 各引数の型定義は以下の通りです：
- path チェックが行われるため、オプションを渡す前に絶対PATHのうち現在ディレクトリを削除し相対化します。なお、`../` は使えません。

```ts
interface PromptManagerOptions {
  baseDir: string;
  debug?: boolean;
}

interface LoadPromptOptions {
  demonstrativeType: string;
  layerType: string;
  fromLayerType: string;
  variables: Record<string, string>;
}
```
