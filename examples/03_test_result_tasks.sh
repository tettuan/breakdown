#!/bin/bash

# このスクリプトは、テスト結果から不具合を特定し、修正タスクを生成するプロセスを示します。
#
# ユースケース：
# - CI/CDパイプラインでテストが失敗した際の自動タスク生成
# - テスト駆動開発（TDD）でのタスク管理
# - 品質保証（QA）プロセスでの不具合管理
#
# 前提条件：
# - scripts/install_breakdown.sh を実行してbreakdownコマンドがインストールされていること
# - Denoのテスト環境が設定されていること
# - テスト対象のコードが存在すること
#
# 期待される出力：
# - テスト結果に基づく不具合のMarkdown
# - 不具合のJSON形式の仕様
# - 修正タスクの一覧（JSON）

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BREAKDOWN_CMD="${HOME}/.deno/bin/breakdown"

# 作業ディレクトリの初期化
# 必要なディレクトリ構造を作成
# テストを実行し、その出力から不具合情報を生成
# テスト結果をbreakdown defectコマンドにパイプして、不具合情報を構造化
echo "テストを実行し、結果を不具合情報として構造化します..."
deno test --allow-read --allow-write --allow-run | "${BREAKDOWN_CMD}" defect issue -o issue_defect.md

# 不具合情報をイシューとしてJSONに変換
# AIが解釈可能な形式に変換し、修正計画の立案に使用
echo "不具合情報をイシューに変換します..."
"${BREAKDOWN_CMD}" to issue issue_defect.md -o issue-dir/

# イシューから具体的な修正タスクを生成
# 各不具合に対する修正タスクを自動生成
echo "修正タスクを生成します..."
"${BREAKDOWN_CMD}" to task issue-dir/issue.json -o tasks-dir/

echo "
生成されたタスクには以下の情報が含まれます：
- テストケースの失敗内容
- 想定される原因
- 修正の優先順位
- 必要なリソースの見積もり
" 