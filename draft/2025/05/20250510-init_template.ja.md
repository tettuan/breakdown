「仕様理解」を行ったあと、「テンプレートコピー処理の修正」に着手する。

# ミッション：実装の確認と修正
テンプレートファイルの init 時にコピー・生成する方法を確立する。
ソースコードがないときにコピー失敗する問題を解決する。

# 仕様理解
まず、用語集 `docs/breakdown/glossary.ja.md` で関係性を把握して。
必要に応じ、`docs/index.md`と `docs/breakdown/index.ja.md` から参照される仕様書を読む。 Schema仕様の理解は不要。
特に `docs/breakdown/workspace.ja.md`, `docs/breakdown/app_config.ja.md`, `docs/breakdown/path.ja.md` は、利用に必要な情報を説明している。

## ユースケース： 
必要なタイミングで、プロジェクトのREADME を読み、ユースケースを理解する。

# テンプレートコピー処理の修正
詳細は `docs/breakdown/init_template.ja.md` に記載。
このリファクタを完遂するために「実装の自動修正」を行う。

# 実装の自動修正
1. `deno task ci` を実行する
2. エラーに対し、 CursorRules, `docs/breakdown/testing.md` を理解する
3. テストにデバッグログを追加する。エラー箇所のテストコード前後にBreakdownLoggerの出力を追加する。
4. 再び `deno task ci` を実行する
5. 不明点や曖昧さがあれば、ミッションと `docs/` を起点に仕様書を探し、読んで、解決策を導く。
6. エラー修正のために1へ戻る

