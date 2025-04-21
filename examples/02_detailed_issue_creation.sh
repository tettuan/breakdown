#!/bin/bash

# このスクリプトは、プロジェクトから詳細なイシューを作成し、それらをタスクに分解するプロセスを示します。
#
# ユースケース：
# - プロジェクトの要件が複雑で、イシューレベルでの詳細な検討が必要な場合
# - 複数のステークホルダーがイシューの内容を確認・編集する必要がある場合
# - イシューの優先順位や依存関係を手動で調整したい場合
#
# 前提条件：
# - scripts/install_breakdown.sh を実行してbreakdownコマンドがインストールされていること
# - プロジェクトの概要が既に存在していること
#
# 期待される出力：
# - プロジェクト概要のMarkdown
# - 複数のイシューMarkdown（手動編集可能な形式）
# - イシューのJSON形式の仕様
# - 実装タスクの一覧（JSON）

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
BREAKDOWN_CMD="${HOME}/.deno/bin/breakdown"

# 作業ディレクトリの初期化
# 必要なディレクトリ構造を作成
"${BREAKDOWN_CMD}" init

# プロジェクト概要のMarkdownを作成
# サンプルのプロジェクト概要を作成
echo "
# データ分析基盤構築プロジェクト
## 目的
社内の各種データを統合し、分析可能な形で提供する基盤の構築

## 要件
- データ収集パイプラインの構築
- データウェアハウスの設計と実装
- 分析用APIの提供
- セキュリティ要件の実装

## 制約条件
- クラウドネイティブアーキテクチャの採用
- GDPR準拠のデータ取り扱い
" | "${BREAKDOWN_CMD}" summary project -o project_summary.md

# プロジェクトからイシューのMarkdownを生成
# 各機能要件をイシューレベルに分解し、編集可能なMarkdown形式で出力
"${BREAKDOWN_CMD}" summary issue --from-project project_summary.md -o issue_markdown_dir/

echo "
# ここで、生成されたイシューのMarkdownファイルを手動で編集します
# - 優先順位の調整
# - 依存関係の明確化
# - 詳細な要件の追加
# - セキュリティ要件の詳細化
# などを行います
"

# 編集後のイシューをJSONに変換
# 編集済みの各イシューをAIが解釈可能なJSON形式に変換
"${BREAKDOWN_CMD}" to issue issue_markdown_dir/issue_1.md -o issue-dir/
"${BREAKDOWN_CMD}" to issue issue_markdown_dir/issue_2.md -o issue-dir/

# 各イシューからタスクを生成
# 詳細化されたイシューを元に、具体的な実装タスクを生成
"${BREAKDOWN_CMD}" to task issue-dir/issue_1.json -o tasks-dir/
"${BREAKDOWN_CMD}" to task issue-dir/issue_2.json -o tasks-dir/ 