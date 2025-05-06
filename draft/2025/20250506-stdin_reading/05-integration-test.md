完了
# 05-integration-test: STDIN入力からPromptManagerまでの統合テスト

## 概要
- STDIN入力からPromptManagerでの利用まで、一連の流れを統合テストで検証する。
- テストファースト（TDD）で開発する。

## 作業内容
- CLI起動から、STDIN検出・読み込み・input_textセット・Factory統合・PromptManager利用までの一連の流れをテストする。
- 各パターン（STDINあり/なし、空文字列、他の引数優先など）を網羅する。

## 仕様分解元
- tmp/stdin_reading.ja.md の「処理フロー」および「ゴール」より分解。
- 全体の一貫性・正しさを保証する統合テスト。 