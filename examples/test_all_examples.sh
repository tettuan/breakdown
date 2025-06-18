#!/bin/bash
# Examples統合後動作確認スクリプト
# 開発者4作成 - 全examplesの動作検証

set -e

# スクリプトが存在するディレクトリを取得
SCRIPT_DIR="$(dirname "$0")"

echo "=== Examples動作確認開始 ==="
echo "日時: $(date)"
echo "ディレクトリ: $(pwd)"
echo "スクリプトディレクトリ: $SCRIPT_DIR"
echo ""

# 成功・失敗カウンタ
SUCCESS_COUNT=0
FAILED_COUNT=0
SKIPPED_COUNT=0

# 結果格納用
declare -a RESULTS

# テスト実行関数
run_example() {
    local script=$1
    local expected_status=$2
    local description=$3
    
    echo "----------------------------------------"
    echo "実行: $script"
    echo "説明: $description"
    echo -n "状態: "
    
    if [ "$expected_status" = "skip" ]; then
        echo "スキップ（既知の問題）"
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        RESULTS+=("SKIP: $script - $description")
        return
    fi
    
    # 実行（スクリプトディレクトリからの相対パスで実行）
    local full_script_path="${SCRIPT_DIR}/${script#./}"
    if PATH="/opt/homebrew/opt/coreutils/libexec/gnubin:$PATH" timeout 30 "$full_script_path" > /tmp/example_output.txt 2>&1; then
        if [ "$expected_status" = "success" ]; then
            echo "✅ 成功"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            RESULTS+=("OK: $script")
        else
            echo "❌ 予期しない成功"
            FAILED_COUNT=$((FAILED_COUNT + 1))
            RESULTS+=("UNEXPECTED SUCCESS: $script")
        fi
    else
        if [ "$expected_status" = "fail" ]; then
            echo "⚠️ 予期された失敗"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            RESULTS+=("EXPECTED FAIL: $script")
        else
            echo "❌ 失敗"
            FAILED_COUNT=$((FAILED_COUNT + 1))
            RESULTS+=("FAIL: $script")
            echo "エラー出力:"
            tail -10 /tmp/example_output.txt | sed 's/^/  /'
        fi
    fi
}

echo "=== 基本セットアップ例 ==="
run_example "./01_install.sh" "success" "インストール案内"
run_example "./02_compile.sh" "success" "バイナリコンパイル"
run_example "./03_check_version.sh" "success" "バージョン確認"
run_example "./04_init.sh" "success" "初期化（バイナリ）"
run_example "./05_init_deno_run.sh" "success" "初期化（deno run）"

echo ""
echo "=== 設定作成例 ==="
run_example "./06_create_user_config.sh" "success" "ユーザー設定（バイナリ）"
run_example "./07_create_user_config_deno_run.sh" "success" "ユーザー設定（deno run）"

echo ""
echo "=== 使用例 ==="
run_example "./08_stdin_example.sh" "success" "STDIN入力例"
run_example "./09_basic_usage.sh" "success" "基本使用例"

echo ""
echo "=== 設定例 ==="
run_example "./10_config_basic.sh" "success" "基本設定"
run_example "./11_config_production.sh" "success" "本番設定"
run_example "./12_config_team.sh" "success" "チーム設定"
run_example "./13_config_environments.sh" "success" "環境別設定"
run_example "./14_config_production_example.sh" "success" "本番例"
run_example "./15_config_production_custom.sh" "success" "カスタム設定"

echo ""
echo "=== クリーンアップ ==="
run_example "./99_clean.sh" "success" "設定クリーンアップ"

echo ""
echo "========================================="
echo "=== 統合テスト結果サマリー ==="
echo "========================================="
echo "総数: 16例"
echo "成功: $SUCCESS_COUNT"
echo "失敗: $FAILED_COUNT"
echo "スキップ: $SKIPPED_COUNT"
echo ""
echo "詳細結果:"
for result in "${RESULTS[@]}"; do
    echo "  $result"
done

echo ""
echo "=== 成功基準評価 ==="
echo "1. 基本動作（01-09）: "
if [ $SUCCESS_COUNT -ge 9 ]; then
    echo "   ✅ 合格 - 基本的な動作は全て正常"
else
    echo "   ❌ 不合格 - 基本動作に問題あり"
fi

echo "2. 設定例（10-15）: "
if [ $SUCCESS_COUNT -ge 15 ]; then
    echo "   ✅ 合格 - 設定例も全て正常"
else
    echo "   ❌ 不合格 - 設定例に問題あり"
fi

echo ""
echo "=== 最終判定 ==="
if [ $FAILED_COUNT -eq 0 ]; then
    echo "🏆 統合成功！全てのexamplesが正常動作"
    exit 0
else
    echo "❌ 統合に問題あり - 修正が必要"
    exit 1
fi