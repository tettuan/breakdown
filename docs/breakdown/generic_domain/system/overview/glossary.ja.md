# ドメイン用語集

## ユビキタス言語

Breakdownドメインにおけるビジネス用語とその実装における対応関係を定義する。開発者・ユーザー・ドキュメント間で共通理解を形成するための用語定義。

### 利用者向けビジネス概念

> Breakdownツールを使用する際に利用者が理解すべき核となるビジネス概念

| 日本語名 | 英語名 | 実装名 | 説明 |
|----------|--------|--------|------|
| **処理分類** | | | |
| 処理方向型 | Directive Type | DirectiveType | 処理の方向性を表す型定義（to, summary, defect, init, find）。*-user.ymlでユーザー定義可能 |
| 階層型 | Layer Type | LayerType | 対象階層を表す型定義（project, issue, task, bugs, temp）。*-user.ymlでユーザー定義可能 |
| 適応タイプ | Adaptation Type | adaptation | プロンプト特化のための修飾子 |
| **ファイル管理** | | | |
| 入力ファイル | Input File | fromFile | 処理対象となる入力データファイル |
| 出力先 | Output Destination | destinationFile | 生成結果の出力先パス |
| プロンプト基底 | Prompt Base Directory | app_prompt.base_dir | プロンプトテンプレート格納場所 |
| スキーマ基底 | Schema Base Directory | app_schema.base_dir | JSONスキーマファイル格納場所 |
| **設定管理** | | | |
| アプリ設定 | Application Config | *-app.yml | アプリケーション基本設定ファイル |
| ユーザー設定 | User Config | *-user.yml | ユーザー固有の設定ファイル |
| ユーザー変数 | User Variables | userVariables | --uv-*で指定するユーザー定義変数 |
| **ワークスペース** | | | |
| 実行基準ディレクトリ | Current Working Directory | CWD | Breakdownコマンド実行時のカレントディレクトリ |
| 作業ディレクトリ | Working Directory | working_dir | 入出力ファイル解決用ディレクトリ（CWDとは別） |
| ワークスペース設定型 | Workspace Config | WorkspaceConfig | ワークスペース設定の型定義 |

### 技術実装詳細

> システム内部の技術実装に関連する用語（開発者・システム管理者向け）

| 日本語名 | 英語名 | 実装名 | 説明 |
|----------|--------|--------|------|
| **システムコンポーネント** | | | |
| 設定管理器 | Config Manager | BreakdownConfig | 設定読込・統合管理システム |
| プロファイルプレフィクス | Profile Prefix | - | 環境別設定切り替え用プレフィクス（staging-, production-等） |
| パラメータ解析器 | Parameter Parser | BreakdownParams | CLI引数解析・バリデーションシステム |
| プロンプト処理器 | Prompt Processor | BreakdownPrompt | プロンプト生成・変数置換システム |
| ログ管理器 | Logger | BreakdownLogger | ログ出力・デバッグ情報管理システム |
| **パス解決システム** | | | |
| プロンプト変数ファクトリー | Prompt Variables Factory | PromptVariablesFactory | パラメータ統合・プロンプト構築エンジン |
| プロンプトテンプレートパス解決器 | Prompt Template Path Resolver | PromptTemplatePathResolver | プロンプトファイルパス計算・検証 |
| 入力ファイルパス解決器 | Input File Path Resolver | InputFilePathResolver | 入力ファイルパス計算・検証 |
| 出力ファイルパス解決器 | Output File Path Resolver | OutputFilePathResolver | 出力ファイルパス計算・検証 |
| スキーマファイルパス解決器 | Schema File Path Resolver | SchemaFilePathResolver | スキーマファイルパス計算・検証 |
| 設定接頭詞検出器 | Config Prefix Detector | ConfigPrefixDetector | --config/-c オプション検知・値取得 |
| **型定義システム** | | | |
| プロンプトCLI引数型 | Prompt CLI Parameters | PromptCliParams | プロンプト生成用コマンドライン入力の型定義 |
| プロンプト変数ファクトリーオプション型 | Prompt Variables Factory Options | PromptVariablesFactoryOptions | ファクトリー初期化オプションの型定義 |
| ワークスペースオプション型 | Workspace Options | WorkspaceOptions | ワークスペース初期化オプションの型定義 |
| **パラメータ解析結果型** | | | |
| 無引数結果型 | Zero Parameters Result | ZeroParamsResult | パラメータなしコマンドの解析結果型 |
| 単一引数結果型 | One Parameter Result | OneParamResult | 単一パラメータコマンドの解析結果型 |
| 二重引数結果型 | Two Parameters Result | TwoParamsResult | 二重パラメータコマンドの解析結果型 |
| **二重パラメータ処理方向バリデーションルール型** | Two Parameters Directive Pattern | TwoParamsDirectivePattern | `DirectiveType`の2つパラメータ組み合わせ時のバリデーションルール。標準値（to, summary, defect）に加え、設定ファイルで正規表現パターンとしてカスタム定義可能。`params.two.DirectiveType.pattern`で指定。 |
| **二重パラメータ階層バリデーションルール型** | Two Parameters Layer Type Pattern | TwoParamsLayerTypePattern | `layerType`の2つパラメータ組み合わせ時のバリデーションルール。標準値（project, issue, task）に加え、設定ファイルで正規表現パターンとしてカスタム定義可能。`params.two.layerType.pattern`で指定。 |
| **戦略パターン** | | | |
| パス解決戦略 | Path Resolution Strategy | PathResolutionStrategy | パス解決アルゴリズムの戦略パターン |
| 入力ファイル解決戦略 | Input File Resolution Strategy | InputFileResolutionStrategy | 入力ファイル特定のための解決戦略 |
| 出力ファイル解決戦略 | Output File Resolution Strategy | OutputFileResolutionStrategy | 出力ファイル特定のための解決戦略 |
| **バリデーション・エラー処理** | | | |
| テンプレートバリデーター | Template Validator | TemplateValidator | テンプレート検証のためのバリデーター |
| テンプレートエラーハンドラー | Template Error Handler | TemplateErrorHandler | テンプレート処理エラーのハンドラー |
| **標準入力処理** | | | |
| 標準入力ラッパー | STDIN Integration Wrapper | StdinIntegrationWrapper | 標準入力統合処理のラッパー |
| 拡張標準入力 | Enhanced STDIN | EnhancedStdin | 拡張された標準入力処理クラス |
| **設定詳細** | | | |
| 設定接頭詞 | Config Prefix | --config/-c | 設定ファイルの識別子 |

## 詳細用語説明

### 1. 利用者向けビジネス概念

#### 1.1 処理分類・階層管理

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| DirectiveType | options.ja.md, path.ja.md | 処理の方向性を指定するパラメータ。`to`（変換）、`summary`（要約）、`defect`（欠陥検出）、`init`（初期化）などの値を取り、どの方向に処理を向かわせるかを決定する。取りうる値は*-user.ymlでユーザーが自由に定義可能。パターンベースバリデーションにより型安全性を保証。 | LayerType, コマンド, 処理方向型, *-user.yml |
| layerType | options.ja.md, path.ja.md | 処理対象の階層を指定するパラメータ。`project`、`issue`、`task` のいずれかを指定し、処理対象の粒度を決定する。階層値には次の処理への方向性（ベクトル情報）も含まれる。取りうる値は*-user.ymlでユーザーが自由に定義可能。 | DirectiveType, コマンド, 階層型, *-user.yml |
| adaptationType | options.ja.md, path.ja.md | プロンプトの種類を指定するパラメータ（-a, --adaptation）。`strict`、`a` などの値を取り、プロンプトファイル名のsuffixとして使用される。 | -a, --adaptation, プロンプト種別 |

#### 1.2 ファイル・ディレクトリ管理

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| CWD | path.ja.md, app_config.ja.md | Current Working Directory。Breakdownコマンドを実行した時点でのカレントディレクトリ。プロンプトやスキーマのbase_dirはCWD起点で解決される。`Deno.cwd()`で取得される。 | working_dir, app_prompt.base_dir, app_schema.base_dir |
| working_dir | app_config.ja.md, init.ja.md | アプリケーションの作業ディレクトリ（SINGLE SOURCE OF TRUTH）。デフォルトは `.agent/climpt/` に設定される。入力ファイル（-i）や出力ファイル（-o）のパス解決、およびプロンプトやスキーマのディレクトリ解決に使用される基準ディレクトリ。すべてのbase_dirはworking_dir相対パスとして設定される。設定は `.agent/climpt/config/default-app.yml` で管理される。 | base_dir, app_prompt.base_dir, app_schema.base_dir |
| base_dir | app_prompt.ja.md, app_schema.ja.md | プロンプトやスキーマの基本ディレクトリ（working_dir相対パス）。プロンプトの場合は `prompts/` がデフォルト。スキーマの場合は `schemas/` がデフォルト。実際のパスは `resolve(working_dir, base_dir)` で計算される。これらのディレクトリは `lib` 配下の雛形ファイルからコピーされる。 | working_dir, prompts/, schemas/ |
| prompts/ | init.ja.md, app_prompt.ja.md | プロンプトファイルを格納するディレクトリ。デフォルトでは `prompts/` が使用されるが、`app_prompt.base_dir` で変更可能。プロンプトファイルの配置場所として柔軟な運用が可能。 | base_dir, app_prompt.base_dir |
| schemas/ | app_schema.ja.md | スキーマファイルを格納するディレクトリ。デフォルトでは `schemas/` が使用されるが、`app_schema.base_dir` で変更可能。スキーマファイルの配置場所として柔軟な運用が可能。 | base_dir, app_schema.base_dir |

#### 1.3 設定ファイル管理

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| *-app.yml | init.ja.md, app_config.ja.md | アプリケーションの設定ファイル。`.agent/climpt/config/default-app.yml` に配置される。Plan1統一設定形式では、working_dir（SINGLE SOURCE OF TRUTH）とbase_dir（working_dir相対パス）の関係を管理する。既存のファイルは上書きされない。設定は階層的に管理され、アプリケーション設定とユーザー設定の2層構造を持つ。 | working_dir, config/, base_dir |
| *-user.yml | app_config.ja.md | ユーザー固有の設定ファイル。アプリケーション設定の階層化に存在し、アプリケーション設定を上書きする。DirectiveType（処理方向型）とLayerType（階層型）の取りうる値をユーザーが自由に定義可能。 | *-app.yml, config/, DirectiveType, LayerType |
| config/ | init.ja.md, app_config.ja.md | 設定ファイルを格納するディレクトリ。`.agent/climpt/config/` に配置され、Plan1統一設定形式に基づくアプリケーションの各種設定を管理する。working_dir（SINGLE SOURCE OF TRUTH）を基準とした相対パス設定により、プロジェクト移動時の柔軟性を提供する。 | *-app.yml, working_dir, base_dir |
| プロファイルプレフィクス | app_config.ja.md | 用途別設定の切り替えに使用されるプレフィクス（例：`breakdown-`, `search-`）。BreakdownConfigによってプロファイルプレフィクスが付与された設定ファイル（例：`breakdown-app.yml`, `search-user.yml`）を自動的に読み込み、DirectiveTypeとLayerTypeの組み合わせを用途に応じて切り替えることができる。例えばデフォルトの`breakdown`プロファイルでは`to,summary,defect`のDirectiveTypeを使用し、`search`プロファイルでは`web,rag,db`のDirectiveTypeを使用するといった、異なる処理体系を適用可能。 | BreakdownConfig, DirectiveType, LayerType, breakdown-, search- |

#### 1.4 入出力処理

STDIN以外は、実際の内容を読み書きしない。PATHを値とし、変数の置換処理に使用することが目的。

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| fromFile | options.ja.md, path.ja.md | 入力ファイルを指定するパラメータ（-f, --from）。ファイルパスを指定し、PATHを変数の値として使用する。 | -f, --from, 入力ソース |
| destinationFile | options.ja.md, path.ja.md | 出力先を指定するパラメータ（-o, --destination）。ファイルパスまたはディレクトリパスを指定し、出力先情報のPATHを変数の値として使用する。 | -o, --destination, 出力先 |
| stdin | app_factory.ja.md, cli.ja.md | 標準入力からのデータ読み込み。入力ソースの一つとして機能し、ファイル入力と排他的に使用される。入力データの検出と読み込みの処理が実装されている。 | 入力ソース, -i, promptmanager |
| base_prompt_dir | app_factory.ja.md | promptFilePathから派生する変数。プロンプトテンプレートが配置されているディレクトリパスを提供する。テンプレート内で`{base_prompt_dir}`として参照可能。末尾スラッシュは含まれない。 | promptFilePath, dirname, テンプレート変数 |

#### 1.5 コマンドラインオプション

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| -f, --from | options.ja.md | 入力ファイルを指定するオプション。ファイルパスを指定し、その内容を`input_text_file`として使用する。標準入力と独立して動作し、両方同時に使用可能。 | stdin, input_text_file |
| -o, --destination | options.ja.md | 出力先を指定するオプション。ファイルパスまたはディレクトリパスを指定し、その値を`destination_path`として使用する。ディレクトリの場合は自動的にファイル名が生成される。 | destination_path, 出力先 |
| -e, --edition | options.ja.md | 入力レイヤーの種類を指定するオプション。指定された値で`fromLayerType`を設定する。指定がない場合は"default"を使用する。 | fromLayerType, layerType |
| -a, --adaptation | options.ja.md | プロンプトの種類を指定するオプション。指定された値で`adaptationType`を設定し、プロンプトファイル名のsuffixとして使用される。 | adaptationType, プロンプト種別 |
| --help | options.ja.md | ヘルプメッセージを表示するオプション。コマンドの使用方法やオプションの説明を表示する。 | ZeroParamsResult, ヘルプ |
| --version | options.ja.md | バージョン情報を表示するオプション。アプリケーションのバージョン番号を表示する。 | ZeroParamsResult, バージョン |

### 2. 技術実装詳細

#### 2.1 システムアーキテクチャ

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| BreakdownConfig | app_config.ja.md | 設定管理を担当するモジュール。アプリケーション設定とユーザー設定の読み込みと管理を行う。プロファイルプレフィクス（breakdown-, search-等）を用いて、用途に応じたDirectiveTypeとLayerTypeの組み合わせを切り替えることができる。 | *-app.yml, *-user.yml, プロファイルプレフィクス |
| BreakdownParams | options.ja.md | パラメータ処理を担当するモジュール。コマンドライン引数の解析とバリデーションを行う。ZeroParamsResult、OneParamResult、TwoParamsResultを生成（旧NoParams、Single、Doubleから変更）。 | ZeroParamsResult, OneParamResult, TwoParamsResult |
| BreakdownPrompt | app_prompt.ja.md | プロンプト生成を担当するモジュール。変数置換やスキーマ情報の埋め込みを行い、プロンプトを生成する。 | promptmanager, プロンプト生成 |
| BreakdownLogger | logging.ja.md | ロギング機能を担当するモジュール。デバッグ情報の出力やエラー処理を行う。 | LOG_LEVEL, DEBUG |
| promptmanager | app_prompt.ja.md | プロンプトの生成と管理を担当するモジュール。変数置換やスキーマ情報の埋め込みを行い、最終的なプロンプトを生成する。 | BreakdownPrompt, プロンプト生成 |

#### 2.2 型システム・インターフェース

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| PromptCliParams | app_factory.ja.md | プロンプト生成に必要なCLIパラメータを定義するインターフェース。directiveType、layerType、optionsなどのプロパティを持つ。 | directiveType, layerType, options |
| PromptVariablesFactoryOptions | app_factory.ja.md | プロンプト変数ファクトリーの初期化オプションを定義するインターフェース。configとcliParamsを必要とする。 | config, cliParams |

#### 2.3 エラー処理・バリデーション

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| PromptFileErrorType | app_factory.ja.md | プロンプトファイル生成時のエラー種別を定義する列挙型。InputFileNotFound、PromptDirNotFound、PromptFileNotFoundなどのエラー状態を表現する。 | エラー処理, バリデーション |
| CommandResult | cli.ja.md | コマンド実行結果を表す型。successフラグとエラー情報を含む。 | エラー処理, コマンド実行 |
| ValidationError | app_factory.ja.md | バリデーションエラーを表す型。エラーメッセージとエラー種別を含む。 | バリデーション, エラー処理 |

#### 2.4 テストとデバッグ

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| tests/ | testing.md, testing.ja.md | テストファイルを格納するディレクトリ。`0_foundation/` 配下に基盤機能のテストが配置される。日本語版では `0_env/`、`1_config/`、`2_commands/` のサブディレクトリ構造を持つ。英語版では `config_test.ts`、`logger_test.ts` などのファイルが直接配置される。 | 0_foundation/, config_test.ts, logger_test.ts |
| LOG_LEVEL | logging.ja.md, testing.ja.md | テストコードでのログ出力の詳細度を制御する環境変数。`debug`、`info`、`warn`、`error` の4段階で制御可能。デフォルトは `info`。BreakdownLoggerで使用され、テストの一部として恒久的なデバッグ出力を提供する。 | DEBUG, logging |
| fixtures/ | testing.md, testing.ja.md | テストデータを格納するディレクトリ。テスト実行時に使用される固定データやサンプルファイルが配置される。 | tests/, helpers/ |
| helpers/ | testing.md, testing.ja.md | テストヘルパーを格納するディレクトリ。テスト実行を補助するユーティリティ関数や共通処理が配置される。 | tests/, fixtures/ |

#### 2.5 システム内部処理

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| lib/ | init.ja.md | システムの標準ファイルを格納するディレクトリ。プロンプトやスキーマの雛形ファイルが配置され、初期化時にコピーされる。 | prompts/, schemas/ |
