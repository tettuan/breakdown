# Breakdown 初期化(init)処理 仕様書

## 目的
Breakdownプロジェクトの初期化コマンド(`init`)は、AI開発支援のための作業ディレクトリ・設定ファイル・必要なサブディレクトリを自動生成し、以降のコマンド実行の前提環境を整えることを目的とする。

# 初期化の流れ

1. プロジェクトのルートディレクトリに `default-app.yml` を作成する
1-1. default-app.yml の初期の配置場所は、 `.agent/climpt/config/default-app.yml` である
1-2. `breakdown init` を呼び出した場所が起点である（プロジェクトのルートを想定）
1-3. `.agent/climpt/config/` 階層が存在しない場合は再起的に作成する
2. `default-app.yml` へ、初期値を記載する
3. `BreakdownConfig` を用いて設定を読み込む（`default-app.yml` を 読み込んだことになる）
4. 


## デフォルト作業ディレクトリ
- デフォルトの作業ディレクトリは `.agent/climpt/` とする。
- `.agent/climpt/config/default-app.yml` の `working_dir` 設定値に記載され、その設定値が使われて定まる。

## パス解決の統一方針
### SINGLE SOURCE OF TRUTH原則
- `working_dir`: 唯一の基準ディレクトリ（プロジェクト空間の定義）
- `base_dir`: 常に相対パス（相対的な役割分担の定義）
- 実際のパス: `resolve(working_dir, base_dir)`

### 設定の意図
- `working_dir`: プロジェクト全体の作業空間を定義
- `base_dir`: working_dir相対での機能別ディレクトリを定義
- プロジェクト移動時は working_dir のみ変更すれば全体が追従

## 初期化時に作成されるディレクトリ構成
- `.agent/climpt/`
  - `projects/`
  - `issues/`
  - `tasks/`
  - `temp/`
  - `config/`
  - `prompts/` (または `app_prompt.base_dir` で指定)
    - `to/project/f_project.md` など、**lib配下の雛形ファイルをコピー**
    # (EN) Prompt template source: lib/prompts/to/issue/, lib/prompts/to/task/, etc.
  - `schema/` (または `app_schema.base_dir` で指定)
    - `to/project/base.schema.md` など、**lib配下の雛形ファイルをコピー**
    # (EN) Schema file source: lib/schemas/

## 設定ファイル
- コマンドがインストールされたフォルダを起点とする
- `.agent/climpt/config/default-app.yml` を自動生成（既存の場合は上書きしない）
- 雛形例:
  ```yaml
  working_dir: .agent/climpt # use for output and tmporary
  app_prompt:
    base_dir: prompts # use for prompts. when init, command copy prompt files from app default (lib配下) to this dir.
    # Prompt template source: lib/prompts/to/issue/, lib/prompts/to/task/, etc.
  app_schema:
    base_dir: schemas # use for JSON schema. when init, command copy schema files from app default (lib配下) to this dir.
    # Schema file source: lib/schemas/
  ```
- `app_prompt.base_dir` や `app_schema.base_dir` をカスタマイズした場合、指定ディレクトリも作成

## 既存環境への対応
- 既存ディレクトリ・ファイルは上書きしない
- 既存 `default-app.yml` も上書きしない

## エラー処理
- ディレクトリ作成不可（ファイルが存在等）の場合はエラーを返す
- 権限エラー等も適切に例外化

## テスト観点
- 新規環境での全ディレクトリ・ファイル生成
- 既存環境での上書き防止
- カスタムbase_dir指定時のディレクトリ生成
- エラー時の例外発生

## 参考
- `docs/breakdown/app_config.ja.md` も参照
- テストは `tests/0_foundation/0_env/init_test.ts` で網羅 