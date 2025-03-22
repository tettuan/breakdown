# breakdownconfig モジュールの読み込み
https://jsr.io/@tettuan/breakdownconfig を使用します。

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

1. アプリケーション設定（`breakdown/config/app.yml`）
2. ユーザー設定（アプリケーション設定の階層化に存在）

## アプリケーション設定項目
- `working_dir`: 作業ディレクトリのパス（デフォルト: `.agent/breakdown`）
- `app_prompt`: プロンプト関連の設定
  - `base_dir`: プロンプトファイルのベースディレクトリ（デフォルト: `lib/breakdown/prompts`）
- `app_schema`: スキーマ関連の設定
  - `base_dir`: スキーマファイルのベースディレクトリ（デフォルト: `lib/breakdown/schema`）


## ユーザー設定項目
なし


