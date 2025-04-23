#!/bin/bash

# このスクリプトは、テスト結果からタスクを生成する例を示します。
#
# ユースケース：
# - テスト結果から必要なタスクを自動生成する
# - テスト失敗の修正タスクを作成する
# - テストカバレッジ改善のタスクを作成する
#
# 前提条件：
# - scripts/install_breakdown.sh を実行してbreakdownコマンドがインストールされていること
# - テストが実行可能な状態であること
#
# 期待される出力：
# - テスト結果のサマリー
# - 修正タスクの一覧（JSON）
# - カバレッジ改善タスクの一覧（JSON）

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BREAKDOWN_CMD="${PROJECT_ROOT}/.deno/bin/breakdown"

# 作業ディレクトリの作成
WORK_DIR="${PROJECT_ROOT}/tmp/work_$(date +%Y%m%d_%H%M%S)"
mkdir -p "${WORK_DIR}"
trap 'rm -rf "${WORK_DIR}"' EXIT

# エラーハンドリング関数
handle_error() {
    echo -e "\033[1;31mエラー: 処理中にエラーが発生しました\033[0m"
    echo "ユースケース: テスト結果からのタスク生成"
    echo "実行コマンド: $FAILED_COMMAND"
    echo "エラー内容: $1"
    exit 1
}

# エラーハンドリングの設定
trap 'handle_error "${BASH_COMMAND}"' ERR

echo "=== テスト結果からのタスク生成 ==="

# テスト結果の例を作成
TEST_RESULT_FILE="${WORK_DIR}/test_results.txt"
echo "
Running tests...
FAIL: test_user_authentication
  Expected: User authenticated
  Actual: Authentication failed
  at test/auth/user_test.ts:42

FAIL: test_password_validation
  Expected: Password meets requirements
  Actual: Password too short
  at test/auth/password_test.ts:23

Coverage Summary:
  auth/user.ts: 65%
  auth/password.ts: 78%
  database/user.ts: 45%
" > "${TEST_RESULT_FILE}"

# テスト結果からタスクを生成
mkdir -p "${WORK_DIR}/tasks-dir"
"${BREAKDOWN_CMD}" defect task -f "${TEST_RESULT_FILE}" -o "${WORK_DIR}/tasks-dir/tasks.json"

echo "✓ 全ての処理が完了しました"
echo "作業ディレクトリ: ${WORK_DIR}"
echo "- テスト結果: ${WORK_DIR}/test_results.txt"
echo "- 生成されたタスク: ${WORK_DIR}/tasks-dir/tasks.json"
exit 0 