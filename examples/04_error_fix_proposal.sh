#!/bin/bash

# このスクリプトは、実行時エラーログから修正提案を自動生成するプロセスを示します。
#
# ユースケース：
# - 本番環境で発生したエラーの分析と修正計画の立案
# - システムログからの問題特定と修正タスクの自動生成
# - インシデント対応時の修正計画立案支援
#
# 前提条件：
# - scripts/install_breakdown.sh を実行してbreakdownコマンドがインストールされていること
# - エラーログファイルが存在すること
# - エラーの内容が構造化可能な形式であること
#
# 期待される出力：
# - エラー分析結果のMarkdown
# - 修正提案のJSON形式の仕様
# - 具体的な修正タスクの一覧（JSON）

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BREAKDOWN_CMD="${HOME}/.deno/bin/breakdown"

# 作業ディレクトリの初期化
# 必要なディレクトリ構造を作成
"${BREAKDOWN_CMD}" init

# サンプルのエラーログを作成
echo "
[ERROR] 2024-03-15T10:30:15 Failed to connect to database
Stack trace:
  at Database.connect (/src/db/connection.ts:45)
  at Server.start (/src/server.ts:23)
  at main (/src/index.ts:10)
Cause: Connection timeout after 30000ms

[ERROR] 2024-03-15T10:30:16 Authentication service unavailable
Stack trace:
  at AuthService.validate (/src/auth/service.ts:78)
  at RequestHandler.authenticate (/src/middleware/auth.ts:34)
Cause: External service unreachable
" > error.log

# エラーログの最新部分からプロジェクトレベルの不具合情報を生成
# エラーログを解析し、構造化された不具合情報を作成
echo "エラーログを分析し、不具合情報を生成します..."
tail -100 "error.log" | "${BREAKDOWN_CMD}" defect project -o project_defect.md

# プロジェクトの不具合からイシューレベルの不具合情報を生成
# システム全体の問題を個別のイシューに分解
echo "プロジェクトレベルの不具合からイシューを生成します..."
"${BREAKDOWN_CMD}" defect issue --from-project project_defect.md -o issue_defect_dir/

# 不具合のイシューをJSONに変換
# AIが解釈可能な形式に変換し、修正計画の立案に使用
echo "イシューをJSON形式に変換します..."
"${BREAKDOWN_CMD}" to issue issue_defect_dir/issue_defect.md -o issue-dir/

# イシューから具体的な修正タスクを生成
# 各問題に対する修正タスクを自動生成
echo "修正タスクを生成します..."
"${BREAKDOWN_CMD}" to task issue-dir/issue.json -o tasks-dir/

echo "
生成された修正提案には以下の情報が含まれます：
- エラーの発生状況と影響範囲
- 根本原因の分析結果
- 優先度と緊急度の評価
- 具体的な修正手順
- 再発防止のための推奨事項
"

# クリーンアップ
rm error.log 