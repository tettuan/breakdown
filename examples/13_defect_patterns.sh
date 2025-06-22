#!/bin/bash
# Example 17: Defect Patterns - エラーログや改善要求から欠陥分析
# defect issue と defect task のデモンストレーション

set -e

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Ensure we return to original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Get script directory and ensure we're in the examples directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || exit 1

echo "=== Defect Analysis Examples ==="
echo "バグレポートやエラーログから欠陥分析を実行します"
echo

# Always use deno run for consistent path resolution
BREAKDOWN="deno run --allow-read --allow-write --allow-env --allow-net ../cli/breakdown.ts"

# Create output directory
OUTPUT_DIR="./output/defect_analysis"
mkdir -p "$OUTPUT_DIR"

# Example 1: Defect Issue from bug report
echo "=== Example 1: Defect Issue Analysis ==="
cat > "$OUTPUT_DIR/bug_report.md" << 'EOF'
# バグレポート

## 発生状況
- 環境: Production
- 発生日時: 2024-01-15 14:30
- 影響範囲: 全ユーザーの約30%

## 症状
1. ログイン後にセッションが頻繁に切れる
2. API呼び出しで401エラーが断続的に発生
3. リフレッシュトークンの更新が失敗することがある

## エラーログ
```
[ERROR] 2024-01-15 14:30:15 - TokenRefreshError: Failed to refresh token
  at AuthService.refreshToken (auth.service.ts:145)
  at SessionManager.validateSession (session.manager.ts:78)
  
[ERROR] 2024-01-15 14:31:02 - UnauthorizedError: Invalid session
  at middleware.auth (auth.middleware.ts:23)
```

## 再現手順
1. ユーザーとしてログイン
2. 30分間放置
3. 任意のAPIエンドポイントにアクセス
4. 約50%の確率で401エラー

## 試した対処法
- サーバー再起動 → 一時的に改善するが再発
- Redis接続確認 → 正常
EOF

echo "実行: breakdown defect issue < bug_report.md"
$BREAKDOWN defect issue --config=default --from="$OUTPUT_DIR/bug_report.md" --input=task -o="$OUTPUT_DIR/defect_issue_analysis.md"

echo
echo "=== Example 2: Defect Task Analysis ==="
cat > "$OUTPUT_DIR/improvement_request.md" << 'EOF'
# パフォーマンス改善要求

## 現状の問題
- ダッシュボード表示に5秒以上かかる
- データベースクエリが最適化されていない
- N+1問題が複数箇所で発生

## 改善提案
1. クエリの最適化
   - インデックスの追加
   - JOINの見直し
   - キャッシュ戦略の実装

2. フロントエンド最適化
   - 遅延ローディング
   - バーチャルスクロール
   - データのページネーション

3. インフラ改善
   - CDNの活用
   - データベースのスケールアップ
   - キャッシュサーバーの追加

## 期待される効果
- 表示時間を1秒以内に短縮
- サーバー負荷の50%削減
- ユーザー体験の大幅改善
EOF

echo "実行: breakdown defect task < improvement_request.md"
$BREAKDOWN defect task --config=default --from="$OUTPUT_DIR/improvement_request.md" --input=task -o="$OUTPUT_DIR/defect_task_analysis.md"

echo
echo "=== 生成されたファイル ==="
echo "1. Defect Issue Analysis: $OUTPUT_DIR/defect_issue_analysis.md"
echo "2. Defect Task Analysis: $OUTPUT_DIR/defect_task_analysis.md"

# Display results
if [ -f "$OUTPUT_DIR/defect_issue_analysis.md" ]; then
    echo
    echo "=== Defect Issue分析結果（抜粋）==="
    head -15 "$OUTPUT_DIR/defect_issue_analysis.md"
fi

if [ -f "$OUTPUT_DIR/defect_task_analysis.md" ]; then
    echo
    echo "=== Defect Task分析結果（抜粋）==="
    head -15 "$OUTPUT_DIR/defect_task_analysis.md"
fi

echo
echo "=== Defect Patterns Example Completed ==="