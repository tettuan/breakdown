# 設定管理インターフェース

## 概要

Breakdown CLIの設定管理は、**ドメイン駆動設計**の**設定管理ドメイン**として実装されています。このドキュメントでは、設定ファイルの準備と管理方法を説明します。

## 設定ファイルの階層構造

### 基本構成

```
.agent/breakdown/config/
├── default-app.yml          # アプリケーション設定
├── default-user.yml         # ユーザー設定
├── search-app.yml   # 検索プロファイル用アプリケーション設定
├── search-user.yml  # 検索プロファイル用ユーザー設定
└── custom-app.yml   # カスタムプロファイル用設定
```

### 設定の読み込み優先順位

1. **コマンドライン引数** - 最優先
2. **ユーザー設定** - プロファイル別
3. **アプリケーション設定** - プロファイル別
4. **デフォルト値** - システムデフォルト

## アプリケーション設定（default-app.yml）

### 基本設定項目

```yaml
# アプリケーション設定の基本構造
working_dir: ".agent/breakdown"

app_prompt:
  base_dir: "lib/breakdown/prompts"

app_schema:
  base_dir: "lib/breakdown/schema"

# 注意：working_dirは出力・入力ファイルの解決にのみ使用
# プロンプトやスキーマのディレクトリ解決には使用しません
```

### 設定項目の詳細

| 設定項目 | 説明 | デフォルト値 | 用途 |
|----------|------|--------------|------|
| `working_dir` | 作業ディレクトリ | `.agent/breakdown` | 出力・入力ファイルの解決（-o, -i オプション） |
| `app_prompt.base_dir` | プロンプトベースディレクトリ | `lib/breakdown/prompts` | プロンプトテンプレートファイルの配置 |
| `app_schema.base_dir` | スキーマベースディレクトリ | `lib/breakdown/schema` | JSONスキーマファイルの配置 |

## ユーザー設定（*-user.yml）

### DirectiveTypeとLayerTypeの定義

```yaml
# デフォルトプロファイル（breakdown）
breakdown:
  two:
    directive:
      patterns:
        - "to"
        - "summary"
        - "defect"
    layer:
      patterns:
        - "project"
        - "issue"
        - "task"

# カスタムプロファイル（search）
search:
  two:
    directive:
      patterns:
        - "web"
        - "rag"
        - "db"
    layer:
      patterns:
        - "query"
        - "index"
        - "data"
```

### 設定のカスタマイズ

```yaml
# 独自のDirectiveTypeとLayerTypeを定義
custom:
  two:
    directive:
      patterns:
        - "analyze"
        - "transform"
        - "validate"
    layer:
      patterns:
        - "document"
        - "section"
        - "paragraph"
```

## プロファイル切り替え

### 基本的な使用方法

```bash
# デフォルトプロファイル（breakdown）
breakdown to task

# 検索プロファイル（search）
breakdown -c search web query

# カスタムプロファイル（custom）
breakdown -c custom analyze document
```

### プロファイル別設定ファイル

```yaml
# search-app.yml
working_dir: ".agent/search"
app_prompt:
  base_dir: "lib/search/prompts"

# search-user.yml
search:
  two:
    directive:
      patterns:
        - "web"
        - "rag"
        - "db"
    layer:
      patterns:
        - "query"
        - "index"
        - "data"
```

## 設定の実装詳細

### BreakdownConfigの使用

```typescript
// 設定の読み込み
import { BreakdownConfig } from "jsr:@tettuan/breakdownconfig@^1.1.4";

// 設定インスタンスの作成
const config = new BreakdownConfig();

// 設定の読み込み（プロファイル指定）
await config.loadConfig("search");

// 設定の取得
const settings = config.getConfig();
```

### 設定値の取得

```typescript
// 作業ディレクトリの取得
const workingDir = settings.working_dir;

// プロンプトベースディレクトリの取得
const promptBaseDir = settings.app_prompt.base_dir;

// スキーマベースディレクトリの取得
const schemaBaseDir = settings.app_schema.base_dir;
```

## 設定管理のベストプラクティス

### 1. 環境別設定の分離

```yaml
# 開発環境用設定
development:
  working_dir: ".agent/dev"
  app_prompt:
    base_dir: "dev/prompts"

# 本番環境用設定
production:
  working_dir: ".agent/prod"
  app_prompt:
    base_dir: "prod/prompts"
```

### 2. チーム共有設定

```yaml
# team-app.yml（チーム共有）
working_dir: ".agent/team"
app_prompt:
  base_dir: "shared/prompts"
app_schema:
  base_dir: "shared/schema"
```

### 3. 個人設定のカスタマイズ

```yaml
# *-user.yml（個人設定）
breakdown:
  two:
    directive:
      patterns:
        - "to"
        - "summary"
        - "defect"
        - "review"      # 個人用追加
    layer:
      patterns:
        - "project"
        - "issue"
        - "task"
        - "subtask"     # 個人用追加
```

## 設定の検証

### 設定の妥当性確認

```bash
# 設定の確認
breakdown --config search web query --debug

# 設定ファイルの検証
breakdown --validate-config
```

### 設定エラーの診断

```bash
# 詳細なエラー情報を取得
breakdown to task --debug

# 設定パスの確認
breakdown --show-config-path
```

## 設定管理の技術詳細

### パターンベースバリデーション

```typescript
// DirectiveTypeの検証
type DirectiveValidation = {
  pattern: string;
  profile: ConfigProfile;
  isValid: boolean;
  errorMessage?: string;
};

// LayerTypeの検証
type LayerValidation = {
  pattern: string;
  profile: ConfigProfile;
  isValid: boolean;
  errorMessage?: string;
};
```

### 設定の型安全性

```typescript
// 設定の型定義
interface BreakdownConfigSettings {
  working_dir: string;
  app_prompt: {
    base_dir: string;
  };
  app_schema: {
    base_dir: string;
  };
}

// プロファイル別設定の型定義
interface ProfileSettings {
  two: {
    directive: {
      patterns: string[];
    };
    layer: {
      patterns: string[];
    };
  };
}
```

## 関連ドキュメント

- **[設定管理ドメイン](../domain_core/option_types.ja.md)** - 設定管理の詳細なドメイン設計
- **[パラメータ型](../domain_core/two_params_types.ja.md)** - DirectiveTypeとLayerTypeの詳細
- **[プロンプトパス決定](../domain_core/prompt_template_path.ja.md)** - パス解決の詳細
- **[CLIコマンド](./cli_commands.ja.md)** - コマンドライン使用方法

---

**設計方針**: ドメイン駆動設計による設定管理の実現  
**更新日**: 2025年1月
