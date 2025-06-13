「仕様理解」を行ったあと、「プロンプト処理の更新」に着手する。

# ミッション：実装の確認と修正
@tettuan/breakdownprompt の最新バージョンを反映する。
パラメータの受け渡しや、変換結果の受け取りを実現する。

# 仕様理解

`docs/index.md`と `docs/breakdown/index.ja.md` から参照されるすべての仕様書を読み込んで。 Schema仕様の理解は不要。
特に `docs/breakdown/path.md`, `docs/breakdown/app_config.md`, `docs/breakdown/options.md` は、初期化に必要な情報を説明している。

## breakdownprompt
`docs/breakdown/app_prompt.ja.md` を参照すること。

## ユースケース： プロンプトの選定ロジック
プロジェクトのREADME を読み、ユースケースを理解する。

# 実装改修
1. tests/ 配下の BreakdownPrompt 利用箇所を洗い出す
2. 最新の BreakdownPrompt 仕様に合わせて tests/* 配下を更新する
3. 実装を更新する
4. `scripts/local_ci.sh` を実行する
5. エラーに対し、 CursorRules, `docs/breakdown/testing.md` を理解する
6. テストにデバッグログを追加する。エラー箇所のテストコード前後にBreakdownLoggerの出力を追加する。
7. 再び `scripts/local_ci.sh` を実行する
8. 不明点や曖昧さがあれば、`docs/` を起点に仕様書を探し、読んで、解決策を導く。
9. エラー修正のために4へ戻る
