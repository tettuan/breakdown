「仕様理解」を行ったあと、「プロンプト処理の更新」に着手する。

# ミッション：実装の確認と修正
@tettuan/breakdownprompt の最新バージョンを反映する。
パラメータの受け渡しや、変換結果の受け取りを実現する。

# 仕様理解

`docs/index.md`と `docs/breakdown/index.ja.md` から参照されるすべての仕様書を読み込んで。 Schema仕様の理解は不要。
特に `docs/breakdown/path.md`, `docs/breakdown/app_config.md`, `docs/breakdown/options.md` は、初期化に必要な情報を説明している。

## breakdownprompt


## ユースケース： プロンプトの選定ロジック
プロジェクトのREADME を読み、ユースケースを理解する。

# 実装改修
1. tests/ 配下の仕様書のパラメータ説明や、ファイル名生成の仕様を洗い出す
2. 不足しているテストコードを加える
3. テスト対象のコードに変更を加える
4. 「メインコード実装改修の実行」へ進む

## メインコード実装改修の実行
1. `scripts/local_ci.sh` を実行する
2. エラーに対し、 CursorRules, `docs/breakdown/testing.md` を理解する
3. テストにデバッグログを追加する。エラー箇所のテストコード前後にBreakdownLoggerの出力を追加する。
4. 再び `scripts/local_ci.sh` を実行する
5. 不明点や曖昧さがあれば、`docs/` を起点に仕様書を探し、読んで、解決策を導く。
6. 最初の1に戻る
