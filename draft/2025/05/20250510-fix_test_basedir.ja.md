「仕様理解」を行ったあと、「test_workspaceを一時ディレクトリ配下にする」に着手する。

# ミッション：テストの一時フォルダ下指定
テストがプロジェクト直下のディレクトリを作成している。
カレントディレクトリがプロジェクトディレクトリのままでテストしていることに起因。

## テスト終了状態
- プロジェクト直下に、 `test_workspace/` のディレクトリが残らないこと

# 仕様理解
まず、用語集 `docs/breakdown/glossary.ja.md` で関係性を把握して。
必要に応じ、`docs/index.md`と `docs/breakdown/index.ja.md` から参照される仕様書を読む。 Schema仕様の理解は不要。
特に `docs/breakdown/workspace.ja.md`, `docs/breakdown/app_config.ja.md`, `docs/breakdown/path.ja.md` は、利用に必要な情報を説明している。

## ユースケース： 
必要なタイミングで、プロジェクトのREADME を読み、ユースケースを理解する。

# test_workspaceを一時ディレクトリ配下にする
考えられる原因は、
1. 設定の working_dir に `./test_workspace` を指定して作成している
1-1. 指定し、かつCWDを変えない場合に、プロジェクトフォルダ直下に作成される
1-2. この問題は、設定ファイルが間違えている
2. test_workspace に一時フォルダを指定しない
2-1. テスト実行するCWDはプロジェクト直下である
2-2. テストコードでCWDを変える場合は、設定ファイルは一時フォルダ指定不要。実行時のCWDが起点になるため
2-3. ただし設定の読み込みタイミング次第では、一時フォルダ指定が遅れてしまうことがあり得る
3. 設定ファイル作成時点で、 `＜一時フォルダ＞/<testが意図したworkspace>` を作成する
3-1. これがテストの挙動としては好ましい。CWDを動かさず、指定した working_dir で実行できる


# 実装の自動修正
1. `deno task ci` を実行する
2. エラーに対し、 CursorRules, `docs/breakdown/testing.md` を理解する
3. テストにデバッグログを追加する。エラー箇所のテストコード前後にBreakdownLoggerの出力を追加する。
4. 再び `deno task ci` を実行する
5. 不明点や曖昧さがあれば、ミッションと `docs/` を起点に仕様書を探し、読んで、解決策を導く。
6.「テスト終了状態」を確認し、不要なディレクトリがあればエラーと判定する。テスト終了状態に記載のディレクトリは削除する。
6. エラー修正のために1へ戻る


## 修正対象リスト
"Dir Created" のテストファイルが、修正対象である。

| filename | test_workspace |
| --- | --- |
| tests/0_foundation/3_commands/commands_test.ts | Dir Created |
| tests/0_foundation/workspace/error_handler_test.ts | No Dir |
| tests/0_foundation/workspace/path_resolver_test.ts | No Dir |
| tests/0_foundation/workspace/structure_test.ts | No Dir |
| tests/0_foundation/workspace/workspace_test.ts | No Dir |
| tests/0_foundation/5_directory_structure/directory_structure_test.ts | No Dir |
| tests/0_foundation/2_config/config_test.ts | No Dir |
| tests/0_foundation/4_logger/logger_test.ts | No Dir |
| tests/0_foundation/4_logger/logger_level_test.ts | No Dir |
| tests/0_foundation/0_env/setup_test.ts | No Dir |
| tests/0_foundation/0_env/init_test.ts | No Dir |
| tests/3_scenarios/0_basic/commands_test.ts | No Dir |
| tests/3_scenarios/1_edge_cases/edge_scenarios_test.ts | No Dir |
| tests/params_test.ts | No Dir |
| tests/1_core/4_cli/io_test.ts | No Dir |
| tests/1_core/4_cli/no_params_test.ts | No Dir |
| tests/1_core/4_cli/args_test.ts | No Dir |
| tests/1_core/4_cli/commands_test.ts | No Dir |
| tests/1_core/4_cli/args_validator_test.ts | No Dir |
| tests/1_core/1_io/stdin_test.ts | No Dir |
| tests/1_core/3_prompt/selection_test.ts | No Dir |
| tests/1_core/3_prompt/edge_cases/prompt_base_dir_edge_test.ts | No Dir |
| tests/1_core/3_prompt/prompt_processor_test.ts | No Dir |
| tests/1_core/3_prompt/prompt_setup_test.ts | No Dir |
| tests/1_core/2_config/working_dir_test.ts | No Dir |
| tests/1_core/factory/input_text_set_test.ts | No Dir |
| tests/1_core/factory/stdin_handling_test.ts | No Dir |
| tests/1_core/factory/factory_integrate_test.ts | No Dir |
| tests/1_core/0_path/path_resolver_test.ts | No Dir |
| tests/1_core/0_path/factory/output_file_path_resolver_test.ts | No Dir |
| tests/1_core/0_path/factory/input_file_path_resolver_test.ts | No Dir |
| tests/1_core/0_path/factory/prompt_template_path_resolver_test.ts | No Dir |
| tests/1_core/0_path/factory/schema_file_path_resolver_test.ts | No Dir |
| tests/helpers/setup.ts | No Dir |
| tests/helpers/assertions.ts | No Dir |
| tests/helpers/test_utils.ts | No Dir |
| tests/2_integration/0_flow/flow_test.ts | No Dir |
| tests/2_integration/0_flow/stdin_flow_test.ts | No Dir |
| tests/2_integration/1_examples/examples_flow_test.ts | No Dir |
