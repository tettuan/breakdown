完了
# 03-input-text-set: variables.input_textへの値セット

## 概要
- 読み込んだSTDINの内容を、PromptManagerへ渡すための`variables.input_text`へセットする機能を実装する。
- テストファースト（TDD）で開発する。

## 作業内容
- 取得したSTDINの値を`variables.input_text`へ正しくセットする関数/クラスを作成する。
- テストコードで、値が正しくセットされること、空の場合の挙動も検証する。

## 仕様分解元
- tmp/stdin_reading.ja.md の「処理フロー」および「一連の流れ」より分解。
- 「variables.input_textへセット」処理に該当。 