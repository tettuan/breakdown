#!/bin/bash

# このスクリプトは、エラーログから修正提案を生成する例を示します。
#
# ユースケース：
# - エラーログから修正タスクを自動生成する
# - エラーの原因分析と修正方針を提案する
# - 修正タスクの優先順位付けを行う
#
# 前提条件：
# - scripts/install_breakdown.sh を実行してbreakdownコマンドがインストールされていること
# - エラーログが存在すること
#
# 期待される出力：
# - エラー分析レポート
# - 修正タスクの一覧（JSON）
# - 優先順位付けされた実装計画

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
    echo "ユースケース: エラーログからの修正提案生成"
    echo "実行コマンド: $FAILED_COMMAND"
    echo "エラー内容: $1"
    exit 1
}

# エラーハンドリングの設定
trap 'handle_error "${BASH_COMMAND}"' ERR

echo "=== エラーログからの修正提案生成 ==="

# エラーログの例を作成
ERROR_LOG_FILE="${WORK_DIR}/error.log"
echo "
error[E001]: Failed to authenticate user
  --> src/auth.ts:42:10
   |
42 |   const user = await db.findUser(username);
   |          ^^^^ - User not found in database
   |
   = note: Authentication failed for user 'testuser'
   = help: Ensure user exists in database before authentication

error[E002]: Invalid session token
  --> src/session.ts:156:15
   |
156 |   const session = validateToken(token);
   |               ^^^^^^^ - Token validation failed
   |
   = note: Session token has expired
   = help: Implement token refresh mechanism

error[E003]: Database connection failed
  --> src/database.ts:89:5
   |
89 |     await pool.connect();
   |     ^^^^ - Connection timeout
   |
   = note: Could not establish database connection
   = help: Check database configuration and network connectivity
" > "${ERROR_LOG_FILE}"

# エラーログから修正提案を生成
mkdir -p "${WORK_DIR}/project-dir"
"${BREAKDOWN_CMD}" defect project -f "${ERROR_LOG_FILE}" -o "${WORK_DIR}/project-dir/project_defect.json"

# プロジェクトからイシューを生成
mkdir -p "${WORK_DIR}/issue-dir"
"${BREAKDOWN_CMD}" defect issue -f "${WORK_DIR}/project-dir/project_defect.json" -o "${WORK_DIR}/issue-dir/issue.json"

# イシューからタスクを生成
mkdir -p "${WORK_DIR}/tasks-dir"
"${BREAKDOWN_CMD}" defect task -f "${WORK_DIR}/issue-dir/issue.json" -o "${WORK_DIR}/tasks-dir/tasks.json"

echo "✓ 全ての処理が完了しました"
echo "作業ディレクトリ: ${WORK_DIR}"
echo "- エラーログ: ${WORK_DIR}/error.log"
echo "- プロジェクト分析: ${WORK_DIR}/project-dir/project_defect.json"
echo "- 課題: ${WORK_DIR}/issue-dir/issue.json"
echo "- タスク: ${WORK_DIR}/tasks-dir/tasks.json" 