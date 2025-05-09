# ドメイン用語集

## 1. ディレクトリ構造とパス関連

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| working_dir | app_config.ja.md, init.ja.md | アプリケーションの作業ディレクトリ。デフォルトは `.agent/breakdown/` に設定される。入力ファイル（-i）や出力ファイル（-o）のパス解決に使用される。プロンプトやスキーマのディレクトリ解決には使用されない。設定は `.agent/breakdown/config/app.yml` で管理される。 | base_dir, app_prompt.base_dir, app_schema.base_dir |
| base_dir | app_prompt.ja.md, app_schema.ja.md | プロンプトやスキーマの基本ディレクトリ。プロンプトの場合は `prompts/` がデフォルト。スキーマの場合は `schemas/` がデフォルト。これらのディレクトリは `lib` 配下の雛形ファイルからコピーされる。 | working_dir, prompts/, schemas/ |
| prompts/ | init.ja.md, app_prompt.ja.md | プロンプトファイルを格納するディレクトリ。デフォルトでは `prompts/` が使用されるが、`app_prompt.base_dir` で変更可能。プロンプトファイルの配置場所として柔軟な運用が可能。 | base_dir, app_prompt.base_dir |
| schemas/ | app_schema.ja.md | スキーマファイルを格納するディレクトリ。デフォルトでは `schemas/` が使用されるが、`app_schema.base_dir` で変更可能。スキーマファイルの配置場所として柔軟な運用が可能。 | base_dir, app_schema.base_dir |
| lib/ | init.ja.md | システムの標準ファイルを格納するディレクトリ。プロンプトやスキーマの雛形ファイルが配置され、初期化時にコピーされる。 | prompts/, schemas/ |

## 2. 設定と初期化

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| app.yml | init.ja.md, app_config.ja.md | アプリケーションの設定ファイル。`.agent/breakdown/config/app.yml` に配置される。作業ディレクトリやその他の基本設定を管理する。既存のファイルは上書きされない。設定は階層的に管理され、アプリケーション設定とユーザー設定の2層構造を持つ。 | working_dir, config/ |
| config/ | init.ja.md, app_config.ja.md | 設定ファイルを格納するディレクトリ。`.agent/breakdown/config/` に配置され、アプリケーションの各種設定を管理する。 | app.yml, working_dir |
| user.yml | app_config.ja.md | ユーザー固有の設定ファイル。アプリケーション設定の階層化に存在し、アプリケーション設定を上書きする。 | app.yml, config/ |

## 3. テストとデバッグ

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| tests/ | testing.md, testing.ja.md | テストファイルを格納するディレクトリ。`0_foundation/` 配下に基盤機能のテストが配置される。日本語版では `0_env/`、`1_config/`、`2_commands/` のサブディレクトリ構造を持つ。英語版では `config_test.ts`、`logger_test.ts` などのファイルが直接配置される。 | 0_foundation/, config_test.ts, logger_test.ts |
| DEBUG | debug.ja.md, testing.ja.md | 一時的なデバッグ出力を制御する環境変数。テスト以外のコードでも使用可能で、開発時の問題調査用に使用される。一時的なデバッグコードとして扱われ、最終的には削除されるべきコードである。 | LOG_LEVEL, debug mode |
| LOG_LEVEL | logging.ja.md, testing.ja.md | テストコードでのログ出力の詳細度を制御する環境変数。`debug`、`info`、`warn`、`error` の4段階で制御可能。デフォルトは `info`。BreakdownLoggerで使用され、テストの一部として恒久的なデバッグ出力を提供する。 | DEBUG, logging |
| fixtures/ | testing.md, testing.ja.md | テストデータを格納するディレクトリ。テスト実行時に使用される固定データやサンプルファイルが配置される。 | tests/, helpers/ |
| helpers/ | testing.md, testing.ja.md | テストヘルパーを格納するディレクトリ。テスト実行を補助するユーティリティ関数や共通処理が配置される。 | tests/, fixtures/ |

## 4. 入力処理

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| 入力ソース | app_factory.ja.md, cli.ja.md | アプリケーションへの入力データの供給源。ファイル（-i）または標準入力のいずれかが必須。両方とも指定がない場合はエラーとなる。入力データはプロンプトマネージャーを通じて処理される。 | -i, stdin, promptmanager |
| stdin | app_factory.ja.md, cli.ja.md | 標準入力からのデータ読み込み。入力ソースの一つとして機能し、ファイル入力と排他的に使用される。入力データの検出と読み込みの処理が実装されている。 | 入力ソース, -i, promptmanager |
| fromFile | options.ja.md, path.ja.md | 入力ファイルを指定するパラメータ（-f, --from）。ファイルパスを指定し、その内容を入力データとして使用する。標準入力と排他的に使用される。 | -f, --from, 入力ソース |
| destinationFile | options.ja.md, path.ja.md | 出力先を指定するパラメータ（-o, --destination）。ファイルパスまたはディレクトリパスを指定し、生成されたプロンプトの出力先を決定する。 | -o, --destination, 出力先 |

## 5. プロンプト処理

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| promptmanager | app_prompt.ja.md | プロンプトの生成と管理を担当するモジュール。変数置換やスキーマ情報の埋め込みを行い、最終的なプロンプトを生成する。 | BreakdownPrompt, プロンプト生成 |
| demonstrativeType | options.ja.md, path.ja.md | 変換や要約の種類を指定するパラメータ。`to`、`summary`、`defect`、`init` などの値を取り、処理の種類を決定する。 | layerType, コマンド |
| layerType | options.ja.md, path.ja.md | 処理対象の階層を指定するパラメータ。`project`、`issue`、`task` のいずれかを指定し、処理対象の粒度を決定する。 | demonstrativeType, コマンド |
| adaptationType | options.ja.md, path.ja.md | プロンプトの種類を指定するパラメータ（-a, --adaptation）。`strict`、`a` などの値を取り、プロンプトファイル名のsuffixとして使用される。 | -a, --adaptation, プロンプト種別 |

## 6. モジュール構成

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| BreakdownConfig | app_config.ja.md | 設定管理を担当するモジュール。アプリケーション設定とユーザー設定の読み込みと管理を行う。 | app.yml, user.yml |
| BreakdownParams | options.ja.md | パラメータ処理を担当するモジュール。コマンドライン引数の解析とバリデーションを行う。 | NoParamsResult, SingleParamResult, DoubleParamsResult |
| BreakdownPrompt | app_prompt.ja.md | プロンプト生成を担当するモジュール。変数置換やスキーマ情報の埋め込みを行い、プロンプトを生成する。 | promptmanager, プロンプト生成 |
| BreakdownLogger | logging.ja.md | ロギング機能を担当するモジュール。デバッグ情報の出力やエラー処理を行う。 | LOG_LEVEL, DEBUG |

## 7. 型とインターフェース

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| PromptCliParams | app_factory.ja.md | プロンプト生成に必要なCLIパラメータを定義するインターフェース。demonstrativeType、layerType、optionsなどのプロパティを持つ。 | demonstrativeType, layerType, options |
| PromptVariablesFactoryOptions | app_factory.ja.md | プロンプト変数ファクトリーの初期化オプションを定義するインターフェース。configとcliParamsを必要とする。 | config, cliParams |
| DoubleParamsResult | options.ja.md | 2つのパラメータを持つコマンドの結果を表す型。demonstrativeTypeとlayerTypeを必須とする。 | demonstrativeType, layerType |
| SingleParamResult | options.ja.md | 1つのパラメータを持つコマンドの結果を表す型。initコマンドなどで使用される。 | init, command |
| NoParamsResult | options.ja.md | パラメータを持たないコマンドの結果を表す型。ヘルプやバージョン確認などで使用される。 | help, version |

## 8. エラー処理

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| PromptFileErrorType | app_factory.ja.md | プロンプトファイル生成時のエラー種別を定義する列挙型。InputFileNotFound、PromptDirNotFound、PromptFileNotFoundなどのエラー状態を表現する。 | エラー処理, バリデーション |
| CommandResult | cli.ja.md | コマンド実行結果を表す型。successフラグとエラー情報を含む。 | エラー処理, コマンド実行 |
| ValidationError | app_factory.ja.md | バリデーションエラーを表す型。エラーメッセージとエラー種別を含む。 | バリデーション, エラー処理 |

## 9. コマンドラインオプション

| 用語 | 使用箇所 | 説明 | 関連ワード |
|------|----------|------|------------|
| -f, --from | [options.ja.md](./docs/breakdown/options.ja.md) | 入力ファイルを指定するオプション。ファイルパスを指定し、その内容を`input_text_file`として使用する。標準入力と独立して動作し、両方同時に使用可能。 | stdin, input_text_file |
| -o, --destination | [options.ja.md](./docs/breakdown/options.ja.md) | 出力先を指定するオプション。ファイルパスまたはディレクトリパスを指定し、その値を`destination_path`として使用する。ディレクトリの場合は自動的にファイル名が生成される。 | destination_path, 出力先 |
| -i, --input | [options.ja.md](./docs/breakdown/options.ja.md) | 入力レイヤーの種類を指定するオプション。指定された値で`fromLayerType`を上書きする。指定がない場合はfromFileから推定される。 | fromLayerType, layerType |
| -a, --adaptation | [options.ja.md](./docs/breakdown/options.ja.md) | プロンプトの種類を指定するオプション。指定された値で`adaptationType`を設定し、プロンプトファイル名のsuffixとして使用される。 | adaptationType, プロンプト種別 |
| --help | [options.ja.md](./docs/breakdown/options.ja.md) | ヘルプメッセージを表示するオプション。コマンドの使用方法やオプションの説明を表示する。 | NoParamsResult, ヘルプ |
| --version | [options.ja.md](./docs/breakdown/options.ja.md) | バージョン情報を表示するオプション。アプリケーションのバージョン番号を表示する。 | NoParamsResult, バージョン |
| stdin | [app_factory.ja.md](./docs/breakdown/app_factory.ja.md) | 標準入力からのデータ読み込み。パイプ（\|）やリダイレクト（<）を使用して入力データを渡し、その内容を`input_text`として使用する。ファイル入力（-f）と独立して動作し、両方同時に使用可能。 | input_text, 入力ソース |
