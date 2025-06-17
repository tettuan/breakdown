# BreakdownConfig 使用方法

## コンストラクタAPI

```typescript
constructor(configSetName?: string, baseDir?: string)
```

- **configSetName**: 環境または設定セット名（"production"、"staging"、"development"など）
- **baseDir**: 設定ファイルのベースディレクトリ（デフォルト: カレントディレクトリ）

## 設定ファイルの読み込みパス

### アプリケーション設定（必須）
- デフォルト: `./.agent/breakdown/config/app.yml`
- 環境別: `./.agent/breakdown/config/{configSetName}-app.yml`

### ユーザー設定（オプション）
- デフォルト: `{working_dir}/config/user.yml`
- 環境別: `{working_dir}/config/{configSetName}-user.yml`

## 破壊的変更（v1.2.0予定）

⚠️ **v1.2.0でコンストラクタのパラメータ順序が変更される予定**

```typescript
// v1.1.x まで（現在）
new BreakdownConfig("production", "/path/to/project") // 現在の順序

// v1.2.0+ （将来）
new BreakdownConfig("/path/to/project", "production") // 順序が逆になる予定
```

## 設定ファイルの構造

### 必須フィールド
- `working_dir`: 作業ディレクトリのパス
- `app_prompt.base_dir`: プロンプトのベースディレクトリ
- `app_schema.base_dir`: スキーマのベースディレクトリ

### 設定例

```yaml
# app.yml
working_dir: "./.agent/breakdown"
app_prompt:
  base_dir: "./.agent/breakdown/prompts/app"
app_schema:
  base_dir: "./.agent/breakdown/schema/app"

# user.yml（オプション）
app_prompt:
  base_dir: "./prompts/user"  # アプリケーション設定を上書き
```

## マージルール

1. ユーザー設定がアプリケーション設定を上書き
2. 上書きは存在するユーザー設定キーの最上位レベルで発生
3. 明示的に上書きされない限り、下位レベルの項目は保持される
4. 項目を削除するには明示的にnullを設定する

## エラーコード

- **ERR1001-1003**: 設定ファイルエラー（未検出、無効なYAML）
- **ERR2001-2002**: 必須フィールドエラー（欠落、型不正）
- **ERR3001-3003**: パス検証エラー（フォーマット不正、トラバーサル検出、絶対パス）