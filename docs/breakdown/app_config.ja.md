# breakdownconfig モジュールの読み込み

https://jsr.io/@tettuan/breakdownconfig を使用します。README
https://github.com/tettuan/breakdownconfig を読み把握すること。

> **設定値のパス解決・利用例の実装については [app_factory.ja.md](./app_factory.ja.md) も参照してください。**

```ts
import { BreakdownConfig } from "jsr:@tettuan/breakdownconfig@^1.0.6";

// Create a new configuration instance
const config = new BreakdownConfig();

// Load both application and user configurations
await config.loadConfig();

// Get the merged configuration
const settings = config.getConfig();
```

# 設定ファイルの構造

設定は以下の階層で管理されます：

1. アプリケーション設定（`.agent/breakdown/config/app.yml`）
2. ユーザー設定（アプリケーション設定の階層化に存在）

## アプリケーション設定項目

- `working_dir`: 作業ディレクトリのパス（デフォルト: `.agent/breakdown`）
  - **注意: `working_dir` は `app_prompt.base_dir` や `app_schema.base_dir` のプレフィックス（親ディレクトリ）ではありません。**
  - **`working_dir` は出力・入力ファイルの解決（-o, -i オプション等）にのみ使われ、プロンプトやスキーマのディレクトリ解決には使いません。**
- `app_prompt`: プロンプト関連の設定
  - `base_dir`: プロンプトファイルのベースディレクトリ（デフォルト: `lib/breakdown/prompts`）
- `app_schema`: スキーマ関連の設定
  - `base_dir`: スキーマファイルのベースディレクトリ（デフォルト: `lib/breakdown/schema`）

## ユーザー設定項目

なし
