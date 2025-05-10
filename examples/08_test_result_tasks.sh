#!/bin/bash

# このスクリプトは、テスト結果からタスクを生成します。
#
# 実行方法：
# ./examples/06_test_result_tasks.sh
#
# 注意：
# - プロジェクトのルートディレクトリから実行することを想定しています
# - 既存のファイルがある場合は上書きされます

pushd "$(dirname "$0")" > /dev/null

# エラーハンドリング関数
handle_error() {
    echo -e "\033[1;31mエラー: タスク生成中にエラーが発生しました\033[0m"
    echo "ユースケース: テスト結果からのタスク生成"
    echo "実行コマンド: $FAILED_COMMAND"
    echo "エラー内容: $1"
    exit 1
}

# エラーハンドリングの設定
trap 'handle_error "${BASH_COMMAND}"' ERR

echo "=== テスト結果からのタスク生成 ==="

# カレントディレクトリを作業ディレクトリとして使用
WORK_DIR="$(pwd)"

# Create necessary directories
mkdir -p "${WORK_DIR}/tmp/examples/test_results"

# Create sample test results
cat > "${WORK_DIR}/tmp/examples/test_results/test_results.txt" << 'EOL'
Running tests...
1) Project initialization test
   × Failed: Config directory not created
   Expected: Directory ".agent/breakdown/config" to exist
   Actual: Directory not found

2) Task breakdown test
   × Failed: Invalid output format
   Expected: JSON output to match schema
   Actual: Missing required fields: priority, assignee

3) AI integration test
   ✓ Passed
   
4) YAML configuration test
   × Failed: Parse error in user config
   Expected: Valid YAML syntax
   Actual: Line 5: Invalid indentation

Summary:
Total tests: 4
Passed: 1
Failed: 3
EOL

# タスクへの変換
FAILED_COMMAND="./.deno/bin/breakdown to task -f ${WORK_DIR}/tmp/examples/test_results/test_results.txt -o ${WORK_DIR}/tmp/examples/test_results/tasks.json"
$FAILED_COMMAND || handle_error "タスクへの変換に失敗しました"

echo "✓ 全ての処理が完了しました"
echo "作業ディレクトリ: ${WORK_DIR}"
echo "- テスト結果: ${WORK_DIR}/tmp/examples/test_results/test_results.txt"
echo "- 生成されたタスク: ${WORK_DIR}/tmp/examples/test_results/tasks.json"
popd > /dev/null
exit 0 