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
    # Get the absolute path to cli/breakdown.ts
    CLI_PATH="$(cd .. && pwd)/cli/breakdown.ts"
    BREAKDOWN="deno run --allow-read --allow-write --allow-env --allow-net --allow-run $CLI_PATH"
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
        
        if bash -c "$command" 2>/dev/null; then
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
# Create a dummy stdin to prevent hanging
echo "" | $BREAKDOWN to project --from="$NON_EXISTENT_FILE" -o="$OUTPUT_DIR/test1.md" > "$OUTPUT_DIR/test1.md" 2>/dev/null
if [ $? -eq 0 ]; then
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
    retry_with_backoff 3 1 "echo '' | \"$BREAKDOWN\" to project --from='$NON_EXISTENT_FILE' -o='$OUTPUT_DIR/test1.md'"
fi

# Example 2: 不正な入力のエラーハンドリング
echo
echo "=== Example 2: Invalid Input Error ==="
cat > "$OUTPUT_DIR/invalid_input.md" << 'EOF'
{invalid json content that should cause parsing error}
!@#$%^&*()_+
EOF

echo "処理: 不正な形式のファイル処理"
echo "" | $BREAKDOWN summary project --from="$OUTPUT_DIR/invalid_input.md" -o="$OUTPUT_DIR/test2.md" > "$OUTPUT_DIR/test2.md" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Processing completed (may have handled internally)"
else
    handle_error $? "Invalid input format"
    
    # 入力のサニタイズ
    echo "→ 入力のサニタイズ処理"
    sed 's/[^a-zA-Z0-9 ._-]//g' "$OUTPUT_DIR/invalid_input.md" > "$OUTPUT_DIR/sanitized_input.md"
    
    # サニタイズ後のリトライ
    echo "→ サニタイズ後のリトライ"
    echo "" | $BREAKDOWN summary project --from="$OUTPUT_DIR/sanitized_input.md" -o="$OUTPUT_DIR/test2_sanitized.md" > "$OUTPUT_DIR/test2_sanitized.md" 2>/dev/null && \
        echo "✅ Sanitized input processed successfully"
fi

# Example 3: 権限エラーのシミュレーション
echo
echo "=== Example 3: Permission Error Handling ==="
READONLY_FILE="$OUTPUT_DIR/readonly.md"
echo "# Readonly content" > "$READONLY_FILE"
chmod 644 "$READONLY_FILE"  # 読み書き可能に設定（権限エラー回避）

echo "処理: ファイル書き込み試行（権限エラーをシミュレート）"
# 権限エラーのシミュレーション（実際にエラーを発生させずに処理フローをデモ）
echo "→ 権限チェック処理のシミュレーション"
if [ -w "$READONLY_FILE" ]; then
    echo "Additional content" >> "$READONLY_FILE"
    echo "✅ Write successful"
else
    # 権限エラーハンドリングのデモンストレーション
    handle_error 126 "Permission denied simulation: $READONLY_FILE"
    echo "→ 代替ファイル作成処理"
    cp "$READONLY_FILE" "${READONLY_FILE%.md}_copy.md"
    echo "Additional content" >> "${READONLY_FILE%.md}_copy.md"
    echo "✅ Alternative file created successfully"
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
    bash -c "$command" &
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

run_with_timeout 5 "echo '' | \"$BREAKDOWN\" to project --from='$OUTPUT_DIR/large_input.md' -o='$OUTPUT_DIR/timeout_test.md'"

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
        echo "" | $BREAKDOWN summary task --from="$TEST_FILE" -o="$OUTPUT_FILE" 2>/dev/null
        if [ $? -eq 0 ]; then
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

# クリーンアップ（権限操作は既に644なのでスキップ）
# chmod 644 "$READONLY_FILE" 2>/dev/null

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