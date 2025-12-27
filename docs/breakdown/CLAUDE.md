# 読む順

## 基本理解（必須）
1. **index.ja.md** - 全体概要とドメイン設計思想
2. **generic_domain/system/overview/glossary.ja.md** - 用語集と概念整理
3. **generic_domain/system/overview/processing-flow.ja.md** - 処理フローの理解

## ドメイン別詳細（選択的）

### 核心ドメイン（Core Domain）
- **domain_core/domain_boundaries_flow.ja.md** - ドメイン境界と連携
- **domain_core/prompt_variables.ja.md** - プロンプト変数生成
- **domain_core/prompt_template_path.ja.md** - テンプレートパス決定
- **domain_core/option_types.ja.md** - パラメータ解析
- **domain_core/two_params_types.ja.md** - 2パラメータ処理

### インターフェース層（Interface Layer）
- **interface/cli_commands.ja.md** - CLIコマンド仕様
- **interface/configuration.ja.md** - 設定管理
- **interface/path_resolution.ja.md** - パス解決

### 支援ドメイン（Supporting Domain）
- **supporting_domain/workspace_management/workspace.ja.md** - ワークスペース管理
- **supporting_domain/template_management/app_prompt.ja.md** - テンプレート管理
- **supporting_domain/template_management/app_schema.ja.md** - スキーマ管理

### 汎用ドメイン（Generic Domain）
- **generic_domain/factory/app_factory.ja.md** - ファクトリパターン

## テスト関連

**../tests/testing.ja.md** - テスト仕様（別ディレクトリ）


# Breakdown以外の仕様は別ディレクトリに配置

- **Deno関連の仕様** → `docs/deno/`
- **テスト・デバッグ関連** → `docs/tests/`
- **その他の技術仕様** → 各専用ディレクトリ

## 注意事項

- 各ドメインの理解には、まず基本理解セクションを読むことを推奨
- 実装詳細が必要な場合は、対応するドメインの詳細仕様を参照
- ドメイン間の連携が必要な場合は、domain_boundaries_flow.ja.md を確認
