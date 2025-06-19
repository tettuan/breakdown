#!/bin/bash
# Example 21: Error Handling
# エラーハンドリングとリカバリーの実践例

set +e  # エラーでも継続実行を許可

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Ensure we return to original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Get script directory and ensure we're in the examples directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || exit 1

echo "=== Error Handling Example ==="
echo "様々なエラーシナリオと対処方法のデモンストレーション"
echo

# Ensure breakdown is available
if command -v breakdown &> /dev/null; then
    BREAKDOWN="breakdown"
else
    BREAKDOWN="deno run --allow-read --allow-write --allow-env --allow-net ../cli/breakdown.ts"
fi

# Create directories
OUTPUT_DIR="./output/error_handling"
ERROR_LOG="$OUTPUT_DIR/error.log"
mkdir -p "$OUTPUT_DIR"

# エラーログ初期化
echo "=== Error Handling Log ===" > "$ERROR_LOG"
echo "Started at: $(date)" >> "$ERROR_LOG"
echo >> "$ERROR_LOG"

# エラーハンドリング関数
handle_error() {
    local error_code=$1
    local error_context=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo "❌ Error occurred: $error_context (code: $error_code)" | tee -a "$ERROR_LOG"
    echo "   Timestamp: $timestamp" | tee -a "$ERROR_LOG"
    
    case $error_code in
        1)
            echo "   Type: General error" | tee -a "$ERROR_LOG"
            ;;
        2)
            echo "   Type: File not found" | tee -a "$ERROR_LOG"
            ;;
        126)
            echo "   Type: Permission denied" | tee -a "$ERROR_LOG"
            ;;
        127)
            echo "   Type: Command not found" | tee -a "$ERROR_LOG"
            ;;
        *)
            echo "   Type: Unknown error" | tee -a "$ERROR_LOG"
            ;;
    esac
    echo >> "$ERROR_LOG"
}

# リトライ機能付き実行関数
retry_with_backoff() {
    local max_attempts=$1
    local delay=$2
    local command="${@:3}"
    local attempt=1
    
    echo "Executing with retry: $command"
    
    while [ $attempt -le $max_attempts ]; do
        echo -n "  Attempt $attempt/$max_attempts... "
        
        if eval "$command" 2>/dev/null; then
            echo "✅ Success"
            return 0
        else
            echo "❌ Failed"
            
            if [ $attempt -lt $max_attempts ]; then
                echo "  Waiting ${delay}s before retry..."
                sleep $delay
                delay=$((delay * 2))  # Exponential backoff
            fi
        fi
        
        attempt=$((attempt + 1))
    done
    
    echo "  All attempts failed" | tee -a "$ERROR_LOG"
    return 1
}

# Example 1: ファイルが存在しない場合のエラーハンドリング
echo "=== Example 1: File Not Found Error ==="
NON_EXISTENT_FILE="$OUTPUT_DIR/does_not_exist.md"

echo "処理: 存在しないファイルの読み込み"
if $BREAKDOWN to project --from="$NON_EXISTENT_FILE" -o="$OUTPUT_DIR/test1.md" 2>/dev/null; then
    echo "✅ Unexpected success"
else
    handle_error $? "File not found: $NON_EXISTENT_FILE"
    
    # フォールバック処理
    echo "→ フォールバック: デフォルトテンプレートを作成"
    cat > "$NON_EXISTENT_FILE" << 'EOF'
# Default Project Template
This is a fallback template created due to missing input file.
EOF
    
    # リトライ
    echo "→ リトライ実行"
    retry_with_backoff 3 1 "$BREAKDOWN to project --from='$NON_EXISTENT_FILE' -o='$OUTPUT_DIR/test1.md'"
fi

# Example 2: 不正な入力のエラーハンドリング
echo
echo "=== Example 2: Invalid Input Error ==="
cat > "$OUTPUT_DIR/invalid_input.md" << 'EOF'
{invalid json content that should cause parsing error}
!@#$%^&*()_+
EOF

echo "処理: 不正な形式のファイル処理"
if $BREAKDOWN summary project --from="$OUTPUT_DIR/invalid_input.md" -o="$OUTPUT_DIR/test2.md" 2>/dev/null; then
    echo "✅ Processing completed (may have handled internally)"
else
    handle_error $? "Invalid input format"
    
    # 入力のサニタイズ
    echo "→ 入力のサニタイズ処理"
    sed 's/[^a-zA-Z0-9 ._-]//g' "$OUTPUT_DIR/invalid_input.md" > "$OUTPUT_DIR/sanitized_input.md"
    
    # サニタイズ後のリトライ
    echo "→ サニタイズ後のリトライ"
    $BREAKDOWN summary project --from="$OUTPUT_DIR/sanitized_input.md" -o="$OUTPUT_DIR/test2_sanitized.md" 2>/dev/null && \
        echo "✅ Sanitized input processed successfully"
fi

# Example 3: 権限エラーのシミュレーション
echo
echo "=== Example 3: Permission Error Handling ==="
READONLY_FILE="$OUTPUT_DIR/readonly.md"
echo "# Readonly content" > "$READONLY_FILE"
chmod 444 "$READONLY_FILE"  # 読み取り専用に設定

echo "処理: 読み取り専用ファイルへの書き込み試行"
if echo "Additional content" >> "$READONLY_FILE" 2>/dev/null; then
    echo "✅ Write successful"
else
    handle_error $? "Permission denied: $READONLY_FILE"
    
    # 権限の修正試行
    echo "→ 権限修正を試行"
    if chmod 644 "$READONLY_FILE" 2>/dev/null; then
        echo "✅ Permission fixed"
        echo "Additional content" >> "$READONLY_FILE"
    else
        echo "❌ Cannot fix permissions - creating alternative file"
        cp "$READONLY_FILE" "${READONLY_FILE%.md}_copy.md"
    fi
fi

# Example 4: タイムアウト処理のシミュレーション
echo
echo "=== Example 4: Timeout Handling ==="
echo "処理: タイムアウト付きコマンド実行"

# タイムアウト関数
run_with_timeout() {
    local timeout=$1
    local command="${@:2}"
    
    echo "Executing with ${timeout}s timeout: $command"
    
    # バックグラウンドでコマンド実行
    eval "$command" &
    local pid=$!
    
    # タイムアウト監視
    local count=0
    while kill -0 $pid 2>/dev/null; do
        if [ $count -ge $timeout ]; then
            echo "⏱️  Timeout reached - killing process" | tee -a "$ERROR_LOG"
            kill -9 $pid 2>/dev/null
            return 1
        fi
        sleep 1
        count=$((count + 1))
    done
    
    wait $pid
    return $?
}

# 長時間かかる処理のシミュレーション
cat > "$OUTPUT_DIR/large_input.md" << 'EOF'
# Large Document
This simulates a large document that takes time to process.
EOF

run_with_timeout 5 "$BREAKDOWN to project --from='$OUTPUT_DIR/large_input.md' -o='$OUTPUT_DIR/timeout_test.md'"

# Example 5: エラー集約とレポート
echo
echo "=== Example 5: Error Aggregation ==="
echo "複数ファイルの処理でエラーを集約"

ERROR_SUMMARY="$OUTPUT_DIR/error_summary.md"
SUCCESS_COUNT=0
ERROR_COUNT=0

# 複数ファイルを処理
for i in 1 2 3 4 5; do
    TEST_FILE="$OUTPUT_DIR/test_input_$i.md"
    OUTPUT_FILE="$OUTPUT_DIR/test_output_$i.md"
    
    # ランダムにエラーを発生させる
    if [ $((i % 2)) -eq 0 ]; then
        # エラーケース
        echo -n "Processing file $i... "
        echo "❌ Failed (simulated error)"
        ERROR_COUNT=$((ERROR_COUNT + 1))
        echo "- test_input_$i.md: Processing failed" >> "$ERROR_SUMMARY"
    else
        # 成功ケース
        echo "# Test content $i" > "$TEST_FILE"
        echo -n "Processing file $i... "
        if $BREAKDOWN summary task --from="$TEST_FILE" -o="$OUTPUT_FILE" 2>/dev/null; then
            echo "✅ Success"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        else
            echo "❌ Failed"
            ERROR_COUNT=$((ERROR_COUNT + 1))
            echo "- test_input_$i.md: Breakdown processing failed" >> "$ERROR_SUMMARY"
        fi
    fi
done

# エラーサマリー生成
echo
echo "=== Error Summary Report ==="
cat > "$OUTPUT_DIR/final_report.md" << EOF
# Error Handling Report

Generated: $(date)

## Processing Summary
- Total files: 5
- Successful: $SUCCESS_COUNT
- Failed: $ERROR_COUNT
- Success rate: $((SUCCESS_COUNT * 100 / 5))%

## Error Details
$(cat "$ERROR_SUMMARY" 2>/dev/null || echo "No errors recorded")

## Error Log
\`\`\`
$(tail -20 "$ERROR_LOG")
\`\`\`

## Recommendations
1. Implement retry logic for transient failures
2. Add input validation before processing
3. Use timeout mechanisms for long-running operations
4. Maintain detailed error logs for debugging
5. Provide meaningful error messages to users
EOF

cat "$OUTPUT_DIR/final_report.md"

# クリーンアップ
chmod 644 "$READONLY_FILE" 2>/dev/null

echo
echo "=== Error Handling Best Practices ==="
echo "1. 適切なエラーコードの使用"
echo "2. エラーコンテキストの記録"
echo "3. 自動リトライとバックオフ"
echo "4. フォールバック処理の実装"
echo "5. エラーの集約とレポート"

echo
echo "=== Error Handling Example Completed ==="
echo "Error log saved to: $ERROR_LOG"