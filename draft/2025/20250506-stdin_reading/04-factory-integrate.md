完了
# 04-factory-integrate: FactoryでPromptManager生成時のinput_text統合

## 概要
- FactoryパターンでPromptManagerインスタンスを生成する際、`variables.input_text`を正しく渡す機能を実装する。
- テストファースト（TDD）で開発する。

## 作業内容
- Factoryクラスで、`variables.input_text`を受け取り、PromptManagerへ渡す処理を実装する。
- テストコードで、input_textが正しく統合されることを検証する。

## 仕様分解元
- tmp/stdin_reading.ja.md の「処理フロー」および「一連の流れ」より分解。
- 「FactoryでPromptManager生成」処理に該当。 