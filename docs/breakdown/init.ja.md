# Breakdown 初期化(init)処理 仕様書

## 目的
Breakdownプロジェクトの初期化コマンド(`init`)は、AI開発支援のための作業ディレクトリ・設定ファイル・必要なサブディレクトリを自動生成し、以降のコマンド実行の前提環境を整えることを目的とする。

# 初期化の流れ

1. プロジェクトのルートディレクトリに `app.yml` を作成する
1-1. app.yml の初期の配置場所は、 `.agent/breakdown/config/app.yml` である
1-2. `breakdown init` を呼び出した場所が起点である（プロジェクトのルートを想定）
1-3. `.agent/breakdown/config/` 階層が存在しない場合は再起的に作成する
2. `app.yml` へ、初期値を記載する
3. `BreakdownConfig` を用いて設定を読み込む（`app.yml` を 読み込んだことになる）
4. 


## デフォルト作業ディレクトリ
- デフォルトの作業ディレクトリは `.agent/breakdown/` とする。
- `.agent/breakdown/config/app.yml` の `working_dir` 設定値に記載され、その設定値が使われて定まる。

## 初期化時に作成されるディレクトリ構成
- `.agent/breakdown/`
  - `projects/`
  - `issues/`
  - `tasks/`
  - `temp/`
  - `config/`
  - `prompts/` (または `app_prompt.base_dir` で指定)
  - `schema/` (または `app_schema.base_dir` で指定)

## 設定ファイル
- コマンドがインストールされたフォルダを起点とする
- `.agent/breakdown/config/app.yml` を自動生成（既存の場合は上書きしない）
- 雛形例:
  ```yaml
  working_dir: .agent/breakdown # use for output and tmporary
  app_prompt:
    base_dir: .agent/breakdown/prompts # use for prompts. when init, command copy prompt files from app default to this dir.
  app_schema:
    base_dir: .agent/breakdown/schema # use for JSON schema. when init, command copy schema files from app default to this dir.
  ```
- `app_prompt.base_dir` や `app_schema.base_dir` をカスタマイズした場合、指定ディレクトリも作成

## 既存環境への対応
- 既存ディレクトリ・ファイルは上書きしない
- 既存 `app.yml` も上書きしない

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