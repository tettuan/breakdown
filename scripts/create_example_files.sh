#!/bin/bash

# このスクリプトは、examplesの実行に必要なサンプルファイルを作成します。
#
# 実行方法：
# ./scripts/create_example_files.sh
#
# 注意：
# - プロジェクトのルートディレクトリから実行することを想定しています
# - 既存のファイルがある場合は上書きされます

# エラーハンドリング関数
handle_error() {
    echo -e "\033[1;31mエラー: サンプルファイル作成中にエラーが発生しました\033[0m"
    echo "ユースケース: サンプルファイルの作成"
    echo "実行コマンド: $FAILED_COMMAND"
    echo "エラー内容: $1"
    exit 1
}

# エラーハンドリングの設定
trap 'handle_error "${BASH_COMMAND}"' ERR

echo "=== サンプルファイルの作成 ==="

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# プロジェクトルートディレクトリに移動
cd "${PROJECT_ROOT}" || handle_error "プロジェクトルートディレクトリへの移動に失敗しました"

# 作業ディレクトリの作成
WORK_DIR="tmp/work_$(date +%Y%m%d_%H%M%S)"
mkdir -p "${WORK_DIR}/project-dir" || handle_error "project-dirの作成に失敗しました"
mkdir -p "${WORK_DIR}/issue-dir" || handle_error "issue-dirの作成に失敗しました"
mkdir -p "${WORK_DIR}/tasks-dir" || handle_error "tasks-dirの作成に失敗しました"

# project_summary.jsonの作成
cat > "${WORK_DIR}/project-dir/project_summary.json" << EOL
{
  "title": "サンプルプロジェクト",
  "description": "これはサンプルプロジェクトの概要です",
  "goals": [
    "機能Aの実装",
    "機能Bの改善",
    "バグの修正"
  ]
}
EOL

# issue.jsonの作成
cat > "${WORK_DIR}/issue-dir/issue.json" << EOL
{
  "title": "機能Aの実装",
  "description": "新機能Aの実装に関する課題",
  "tasks": [
    "設計の作成",
    "実装",
    "テスト"
  ]
}
EOL

# test_results.txtの作成
cat > "${WORK_DIR}/test_results.txt" << EOL
[FAIL] テストケース1: 期待値と実際の値が一致しません
期待値: 10
実際の値: 5

[PASS] テストケース2: 正常に動作しています

[FAIL] テストケース3: NullPointerException
スタックトレース:
  at com.example.Test.method(Test.java:10)
  at com.example.Main.main(Main.java:5)
EOL

# error.logの作成
cat > "${WORK_DIR}/error.log" << EOL
[ERROR] 2024-04-23 10:00:00 - アプリケーションの起動に失敗しました
原因: 設定ファイルが見つかりません
場所: src/config/loader.ts:15

[ERROR] 2024-04-23 10:00:01 - データベース接続エラー
原因: 接続タイムアウト
場所: src/db/connection.ts:25
EOL

echo "✓ サンプルファイルを作成しました: ${WORK_DIR}"
echo "✓ スクリプトは正常に完了しました"

# 作業ディレクトリのパスを出力
echo "${WORK_DIR}"
exit 0 