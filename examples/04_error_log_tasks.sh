#!/bin/bash

# このスクリプトは、エラーログからタスクを生成します。
#
# 実行方法：
# ./examples/04_error_log_tasks.sh
#
# 注意：
# - プロジェクトのルートディレクトリから実行することを想定しています
# - 既存のファイルがある場合は上書きされます

# エラーハンドリング関数
handle_error() {
    echo -e "\033[1;31mエラー: タスク生成中にエラーが発生しました\033[0m"
    echo "ユースケース: エラーログからのタスク生成"
    echo "実行コマンド: $FAILED_COMMAND"
    echo "エラー内容: $1"
    exit 1
}

# エラーハンドリングの設定
trap 'handle_error "${BASH_COMMAND}"' ERR

echo "=== エラーログからのタスク生成 ==="

# カレントディレクトリを作業ディレクトリとして使用
WORK_DIR="$(pwd)"

# タスクへの変換
FAILED_COMMAND="breakdown to task -f ${WORK_DIR}/error.log -o ${WORK_DIR}/tasks-dir/tasks.json"
$FAILED_COMMAND || handle_error "タスクへの変換に失敗しました"

echo "✓ 全ての処理が完了しました"
echo "作業ディレクトリ: ${WORK_DIR}"
echo "- エラーログ: ${WORK_DIR}/error.log"
echo "- 生成されたタスク: ${WORK_DIR}/tasks-dir/tasks.json"
exit 0 