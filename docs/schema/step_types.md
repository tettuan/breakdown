# ステップタイプスキーマ

各タスクのステップで使用可能なタイプ：

|タイプ名| 定義| 例|
|---|---|---|
|Execute Command| 指定されたコマンドを実行| `bundle exec rails test` |
|Check Logs| ログをチェックして問題がないか確認| `tail -200 log/development.log` |
|Write Application Code| アプリケーションの動作を変更するコードを記述| class Edinet ..., def initialize ...|
|Write Test Code| アプリケーションコードに対応するテストコードを記述||
|Write TDD Test Code| 仕様に基づいてTDDでテストを記述||
|Git Commit| 現在の変更をコミット| `git commit` |
|Git Commit All| ステージングされていない変更も含めて全てコミット| `git add . ; git commit` |
|Git Push| 変更をリモートにプッシュ| `git push` |

## ステップ結果

各ステップの実行結果を記録するように、result 定義を行う
- 実行した結果得られたメッセージ
- 実行結果を評価して、 success/error を判定する

例：
- step_result
  - code (optional) :
  - message:
  - judgment 