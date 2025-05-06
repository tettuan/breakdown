「仕様理解」を行ったあと、「新機能の実装」に着手する。

# ミッション：新機能STDIN入力の実装
`draft/20250506-stdin_reading/main_stdin_reading.ja.md` を実現します。

# 仕様理解

`docs/index.md`と `docs/breakdown/index.ja.md` から参照されるすべての仕様書を読み込んで。 Schema仕様の理解は不要。
特に `docs/breakdown/path.ja.md`, `docs/breakdown/app_config.ja.md`, `docs/breakdown/options.ja.md`, `docs/breakdown/app_factory.ja.md` は、利用に必要な情報を説明している。

## ユースケース： パラメータの渡し方
プロジェクトのREADME を読み、ユースケースを理解する。
パラメータは、https://github.com/tettuan/breakdownparams/blob/main/docs/options.md を参照する。


# 新機能の実装
1. `draft/20250506-stdin_reading/main_stdin_reading.ja.md` を読み、新機能を理解します。
2. `draft/20250506-stdin_reading/[0-9]+_*.md` を順番に読み、実装します。
3. 完了したら、ファイル内に「完了」を記載します。冒頭が良いです。
4. 最後にテストを実施します。
4-1. テストが失敗したら「問題の修正」へ進みます。
4-2. テストが成功したら、2へ戻り、次の実装を進めます。

## 問題の修正
1. `scripts/local_ci.sh` を実行する
2. エラーに対し、 CursorRules, `docs/breakdown/testing.md` を理解する
3. テストにデバッグログを追加する。エラー箇所のテストコード前後にBreakdownLoggerの出力を追加する。
4. 再び `scripts/local_ci.sh` を実行する
5. 不明点や曖昧さがあれば、ミッションと `docs/` を起点に仕様書を探し、読んで、解決策を導く。
6. エラー修正のために1へ戻る
7. `scripts/local_ci.sh` が pass したら 「新機能の実装」へ戻る。
