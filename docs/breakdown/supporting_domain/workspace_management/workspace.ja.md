# Workspace仕様書

## 概要

Workspaceは、Breakdownツールのコアとなる機能として、workspace管理を提供するモジュールです。ディレクトリ構造の管理、設定ファイルの取り扱い、パス解決などの機能を実装しています。

## 主要な機能

### 1. ディレクトリ構造の管理
- プロジェクトの基本ディレクトリ構造を管理
- 必要なディレクトリの自動作成
- ディレクトリの存在確認、作成、削除機能

### 2. 設定管理
- 設定ファイル（default-app.yml）の管理
- 設定の検証機能
- 設定値の取得機能

### 3. パス解決
- プロンプト、スキーマ、出力ファイルのパス解決
- パスの正規化と検証

## ディレクトリ構造

デフォルトのディレクトリ構造は以下の通りです：

```
.agent/breakdown/
├── projects/    # プロジェクト関連ファイル
├── issues/      # 課題関連ファイル
├── tasks/       # タスク関連ファイル
├── temp/        # 一時ファイル
├── config/      # 設定ファイル
├── prompts/     # プロンプトテンプレート
└── schemas/     # スキーマファイル
```

## 設定ファイル（default-app.yml）

設定ファイルは以下の構造を持ちます：

```yaml
# Plan1統一設定形式
working_dir: ".agent/breakdown"    # SINGLE SOURCE OF TRUTH
app_prompt:
  base_dir: "prompts"              # working_dir相対パス
app_schema:
  base_dir: "schemas"              # working_dir相対パス
```

## 主要なインターフェース

### Workspace
- `initialize()`: ワークスペースの初期化
- `resolvePath(path)`: パスの解決
- `createDirectory(path)`: ディレクトリの作成
- `removeDirectory(path)`: ディレクトリの削除
- `exists(path?)`: パスの存在確認

### WorkspaceStructure
- `getPromptBaseDir()`: プロンプトのベースディレクトリ取得
- `getSchemaBaseDir()`: スキーマのベースディレクトリ取得
- `getWorkingDir()`: 作業ディレクトリの取得
- `initialize()`: 初期化
- `ensureDirectories()`: 必要なディレクトリの作成

### WorkspaceConfigManager
- `getConfig()`: 設定の取得
- `validateConfig()`: 設定の検証

## エラー処理

以下のカスタムエラークラスが定義されています：

- `WorkspaceError`: ワークスペース関連の基本エラー
- `WorkspaceInitError`: 初期化エラー
- `WorkspaceConfigError`: 設定エラー
- `WorkspacePathError`: パス解決エラー
- `WorkspaceDirectoryError`: ディレクトリ操作エラー

## 使用例

```typescript
import { Workspace } from "@tettuan/breakdown/lib/workspace/workspace.ts";

const workspace = new Workspace({
  workingDir: ".",
  promptBaseDir: "prompts",
  schemaBaseDir: "schemas"
});

await workspace.initialize();
```

## 注意事項

1. 設定ファイルへのアクセスは必ず`BreakdownConfig`を使用すること
2. 直接的なYAMLやJSONファイルの読み込みは禁止
3. パス解決は`WorkspacePathResolver`を使用すること
4. ディレクトリ操作は`WorkspaceStructure`インターフェースを通じて行うこと

## コンポーネント間の関係

### CLIとの関係
- CLIは`breakdown.ts`をエントリーポイントとして、コマンドライン引数を解析し、適切なコマンドを実行
- `init`コマンドは`initWorkspace`関数を呼び出し、Workspaceの初期化を実行
- CLIの設定オプション（`ConfigOptions`）は、Workspaceの設定に影響を与える

### BreakdownParamsとの関係
- `BreakdownParams`はCLIパラメータの解析と検証を担当
- パラメータの解析結果は`PromptVariablesFactory`を通じてWorkspaceの設定に反映
- パス解決やテンプレート選択に使用される変数（`directiveType`、`layerType`など）を提供
- **v1.0.1新機能**: カスタム変数（--uv-*）の解析と管理
- **v1.0.1新機能**: 拡張パラメータ（--extended, --custom-validation, --error-format）のサポート

### initプロセスとの関係
1. `breakdown init`コマンドが実行される
2. `initWorkspace`関数が呼び出される
3. Workspaceインスタンスが作成され、初期化される
4. 必要なディレクトリ構造と設定ファイル（`default-app.yml`）が作成される
5. テンプレートファイルが適切なディレクトリにコピーされる

### App Factoryとの関係
- `PromptVariablesFactory`はWorkspaceの設定とCLIパラメータを統合
- 以下の変数を管理：
  - `inputFilePath`: 入力ファイルのパス
  - `outputFilePath`: 出力ファイルのパス
  - `promptFilePath`: プロンプトテンプレートのパス
  - `schemaFilePath`: スキーマファイルのパス
  - **v1.0.1新機能**: `customVariables`: ユーザー定義変数のマップ（--uv-*）
- Workspaceのパス解決機能を使用して、これらのパスを適切に解決
- **v1.0.1新機能**: カスタム変数はテンプレート内で `{uv.変数名}` として参照可能

### 設定の流れ
1. CLIパラメータの解析（`BreakdownParams`）
   - **v1.0.1新機能**: .breakdownrc.jsonからのデフォルト値読み込み
   - **v1.0.1新機能**: 環境別設定の適用
2. 設定ファイル（`default-app.yml`）の読み込み（`BreakdownConfig`）
3. Workspaceの初期化と設定の適用
4. `PromptVariablesFactory`による変数の生成
   - **v1.0.1新機能**: カスタム変数の統合
5. 各コンポーネントでの設定の利用

### BreakdownParams v1.0.1 対応

#### 設定ファイルサポート

v1.0.1では、`.breakdownrc.json`による設定管理が可能になりました。Workspaceは以下の設定を活用します：

```json
{
  "defaultOptions": {
    "adaptation": "strict",
    "errorFormat": "detailed"
  },
  "environments": {
    "production": {
      "customValidation": {
        "strictMode": true
      }
    }
  }
}
```

#### カスタム変数の管理

Workspaceは、ユーザー定義のカスタム変数（--uv-*）を管理し、テンプレート処理に渡します：

```typescript
// カスタム変数の例
const customVariables = {
  projectName: "MyProject",    // --uv-projectName=MyProject
  author: "太郎",              // --uv-author=太郎
  version: "1.0.0"            // --uv-version=1.0.0
};
```

### 注意事項
1. 設定ファイルへのアクセスは必ず`BreakdownConfig`を使用
2. パス解決は`WorkspacePathResolver`を通じて行う
3. ディレクトリ操作は`WorkspaceStructure`インターフェースを使用
4. テンプレートファイルの管理はWorkspaceが担当
5. **v1.0.1新機能**: カスタム変数は`PromptVariablesFactory`経由で管理
6. **v1.0.1新機能**: 環境別設定は`BREAKDOWN_ENV`環境変数で切り替え 