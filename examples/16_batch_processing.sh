#\!/bin/bash
# Example 20: Batch Processing
# 複数ファイルの一括処理とレポート生成

set -e

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Ensure we return to original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Get script directory and ensure we're in the examples directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || exit 1

echo "=== Batch Processing Example ==="
echo "複数ファイルを効率的に一括処理"
echo

# Ensure breakdown is available
if command -v breakdown &> /dev/null; then
    BREAKDOWN="breakdown"
else
    BREAKDOWN="deno run --allow-read --allow-write --allow-env --allow-net ../cli/breakdown.ts"
fi

# Create directories
OUTPUT_DIR="./output/batch"
BATCH_INPUT_DIR="$OUTPUT_DIR/inputs"
BATCH_OUTPUT_DIR="$OUTPUT_DIR/outputs"
mkdir -p "$BATCH_INPUT_DIR" "$BATCH_OUTPUT_DIR"

# Create sample input files
echo "=== サンプルファイルの準備 ==="

# プロジェクト提案書
cat > "$BATCH_INPUT_DIR/proposal_web.md" << 'EOFI'
# Webアプリケーション開発提案
新規顧客向けのWebアプリケーション開発。
React + Node.jsで構築し、3ヶ月で完成予定。
EOFI

cat > "$BATCH_INPUT_DIR/proposal_mobile.md" << 'EOFI'
# モバイルアプリ開発提案
iOS/Android対応のネイティブアプリ開発。
React Nativeを使用し、4ヶ月で両OS対応。
EOFI

cat > "$BATCH_INPUT_DIR/proposal_api.md" << 'EOFI'
# API基盤構築提案
マイクロサービスアーキテクチャでのAPI基盤構築。
GraphQL + gRPCのハイブリッド構成。
EOFI

# バグレポート
cat > "$BATCH_INPUT_DIR/bug_auth.md" << 'EOFI'
# 認証システムのバグ
ログイン後30分でセッションが切れる問題。
リフレッシュトークンが正しく更新されない。
EOFI

cat > "$BATCH_INPUT_DIR/bug_performance.md" << 'EOFI'
# パフォーマンス問題
ダッシュボードの初期表示に10秒以上かかる。
データベースクエリの最適化が必要。
EOFI

echo "✅ サンプルファイル作成完了"

# Batch processing function
process_batch() {
    local pattern=$1
    local command=$2
    local layer=$3
    local prefix=$4
    
    echo
    echo "=== バッチ処理: $prefix ==="
    
    # カウンター初期化
    local count=0
    local success=0
    local failed=0
    
    # ファイルリスト作成
    find "$BATCH_INPUT_DIR" -name "$pattern" -type f > "$OUTPUT_DIR/batch_list.txt"
    
    # 処理開始時刻
    local start_time=$(date +%s)
    
    # 各ファイルを処理
    while IFS= read -r input_file; do
        count=$((count + 1))
        local basename=$(basename "$input_file" .md)
        local output_file="$BATCH_OUTPUT_DIR/${prefix}_${basename}.md"
        
        echo -n "[$count] Processing $(basename "$input_file")... "
        
        if $BREAKDOWN $command $layer --from="$input_file" -o="$output_file" 2>/dev/null; then
            echo "✅ Success"
            success=$((success + 1))
        else
            echo "❌ Failed"
            failed=$((failed + 1))
        fi
    done < "$OUTPUT_DIR/batch_list.txt"
    
    # 処理終了時刻と経過時間
    local end_time=$(date +%s)
    local elapsed=$((end_time - start_time))
    
    # サマリー表示
    echo
    echo "バッチ処理完了:"
    echo "  - 処理ファイル数: $count"
    echo "  - 成功: $success"
    echo "  - 失敗: $failed"
    echo "  - 処理時間: ${elapsed}秒"
}

# Example 1: 提案書を一括でプロジェクト化
process_batch "proposal_*.md" "to" "project" "project"

# Example 2: バグレポートを一括でイシュー化
process_batch "bug_*.md" "to" "issue" "issue"

# Example 3: 全ファイルのサマリー生成
echo
echo "=== 全ファイルのサマリー生成 ==="
for file in "$BATCH_INPUT_DIR"/*.md; do
    basename=$(basename "$file" .md)
    $BREAKDOWN summary task --from="$file" -o="$BATCH_OUTPUT_DIR/summary_${basename}.md" 2>/dev/null
done
echo "✅ サマリー生成完了"

# Generate batch report
echo
echo "=== バッチ処理レポート生成 ==="
cat > "$OUTPUT_DIR/batch_report.md" << EOFR
# バッチ処理レポート

生成日時: $(date '+%Y-%m-%d %H:%M:%S')

## 処理概要

### 入力ファイル
$(ls -la "$BATCH_INPUT_DIR"/*.md | wc -l) 個のMarkdownファイルを処理

### 出力ファイル
$(ls -la "$BATCH_OUTPUT_DIR"/*.md 2>/dev/null | wc -l) 個のファイルを生成

## 処理結果

### プロジェクト変換
- proposal_*.md → project_proposal_*.md

### イシュー変換
- bug_*.md → issue_bug_*.md

### サマリー生成
- 全ファイル → summary_*.md

## ファイルサイズ統計
$(du -sh "$BATCH_INPUT_DIR" "$BATCH_OUTPUT_DIR" 2>/dev/null)

EOFR

echo "✅ バッチ処理レポート生成完了: $OUTPUT_DIR/batch_report.md"

# Display results
echo
echo "=== 生成されたファイル ==="
echo "入力ファイル:"
ls -la "$BATCH_INPUT_DIR"/*.md | awk '{print "  - " $9}'
echo
echo "出力ファイル:"
ls -la "$BATCH_OUTPUT_DIR"/*.md 2>/dev/null | awk '{print "  - " $9}'

echo
echo "=== バッチ処理のベストプラクティス ==="
echo "1. ファイル名規則で処理タイプを自動判定"
echo "2. 処理結果のログ記録"
echo "3. エラーハンドリングと再実行"
echo "4. 定期実行用のスクリプト化"
echo "5. 処理統計とレポート生成"

echo
echo "=== Batch Processing Example Completed ==="
