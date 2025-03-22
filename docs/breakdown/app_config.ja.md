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

1. デフォルト設定
2. アプリケーション設定（`breakdown/config.json`）
3. ユーザー設定（環境変数 `BREAKDOWN_CONFIG` で指定）

## 設定項目
- `working_dir`: 作業ディレクトリのパス（デフォルト: `.agent/breakdown`）
- `app_prompt`: プロンプト関連の設定
  - `base_dir`: プロンプトファイルのベースディレクトリ
- `app_schema`: スキーマ関連の設定
  - `base_dir`: スキーマファイルのベースディレクトリ
