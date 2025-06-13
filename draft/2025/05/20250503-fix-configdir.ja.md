「仕様理解」を行ったあと、「変換後出力の修正」に着手する。

# ミッション：実装の確認と修正
BreakdownPrompt を用いた変換処理のあと、出力する方法を統一する。

## 課題：
出力先の -o や destination は、テンプレート内に埋め込む変数の値でしかない。
このアプリケーションが出力先への保存役割を担うことはない。

## 期待：
標準出力に、BreakdownPrompt を通して得られた結果を出力する。
その際に、BreakdownPromptの実行結果を判定し、成功していたら出力し、失敗した場合はエラーとする。

# 仕様理解

`docs/index.md`と `docs/breakdown/index.ja.md` から参照されるすべての仕様書を読み込んで。 Schema仕様の理解は不要。
特に `docs/usage.ja.md`, `docs/breakdown/options.md` は、利用に必要な情報を説明している。

## ユースケース： プロンプトの選定ロジック
プロジェクトのREADME を読み、ユースケースを理解する。

# 変換後出力の修正
1. tests/ 配下の BreakdownPrompt 利用箇所を洗い出す
2. テストの、BreakdownPrompt の結果を受け取っている箇所を、変換結果を受け取る期待に修正する
2-1. 最新の用いることが可能な変数は https://github.com/tettuan/breakdownprompt/blob/main/docs/variables.ja.md に記載された予約変数である。
3. 実装の、BreakdownPrompt結果を受け取る箇所は、変換結果を返却するように修正する
4. 実装の、ファイルへの書き込みを全て削除する
5. 「実装の自動修正」へ進む

# 実装の自動修正
1. `scripts/local_ci.sh` を実行する
2. エラーに対し、 CursorRules, `docs/breakdown/testing.md` を理解する
3. テストにデバッグログを追加する。エラー箇所のテストコード前後にBreakdownLoggerの出力を追加する。
4. 再び `scripts/local_ci.sh` を実行する
5. 不明点や曖昧さがあれば、ミッションと `docs/` を起点に仕様書を探し、読んで、解決策を導く。
6. エラー修正のために1へ戻る
