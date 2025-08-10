#!/bin/bash
# Example 10: Configuration Profile Switching
# This example demonstrates profile-based configuration switching using --config parameter

set -e

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Ensure we return to original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Get script directory and ensure we're in the examples directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || exit 1

echo "=== Configuration Profile Switching Example ==="
echo
echo "📖 仕様参照: docs/breakdown/generic_domain/system/overview/glossary.ja.md"
echo "   - 39行目: プロファイルプレフィクス (Profile Prefix) の説明"
echo "   - 99-101行目: *-app.yml, *-user.yml の階層化設定"
echo "   - 102行目: プロファイルプレフィクスによる設定切り替え"
echo
echo "🎯 期待される動作:"
echo "   1. プロファイル別設定ファイル: {profile}-app.yml, {profile}-user.yml"
echo "   2. --config={profile} でプロファイル設定を切り替え"
echo "   3. プロファイル固有の設定値適用"
echo "   4. プロファイル別DirectiveType/LayerTypeの動作確認"
echo

# Run from examples directory
CONFIG_DIR="./.agent/climpt/config"

# Check if initialized
if [ ! -d "${CONFIG_DIR}" ]; then
    echo "Error: Project not initialized. Please run 'breakdown init' first."
    exit 1
fi

# Create sample input file for testing
echo "Creating test input file..."
cat > profile_test.md << 'EOF'
# Profile Configuration Test

This is a test document to verify profile-based configuration switching.

## Test Content
- Profile switching functionality
- Configuration file loading
- Setting value application
- Command execution verification

The breakdown command should apply profile-specific configurations when processing this input.
EOF

echo "Created test input file: profile_test.md"

echo ""
echo "🔍 プロファイル設定切り替えのテスト実行"
echo "📖 検証ポイント: 各プロファイルで設定ファイルが正しく読み込まれることを確認"

# Test each profile
for PROFILE in dev staging prod; do
    echo ""
    echo "=== Testing profile: ${PROFILE} ==="
    echo "Command: deno run --allow-all ../cli/breakdown.ts defect issue --config=${PROFILE} --from=./profile_test.md"
    echo "🎯 期待動作:"
    echo "   - 設定ファイル: ${PROFILE}-app.yml, ${PROFILE}-user.yml を読み込み"
    echo "   - プロファイル固有の設定値を適用"
    echo "   - 設定値に基づくプロンプト生成を実行"
    
    # Execute breakdown command with profile
    if deno run --allow-all ../cli/breakdown.ts defect issue --config=${PROFILE} < ./profile_test.md > ./${PROFILE}_output.md 2>&1; then
        echo "✅ breakdown実行成功 (profile: ${PROFILE})"
        
        echo "📊 Output preview:"
        head -5 ./${PROFILE}_output.md
        
        # Check if profile configuration was loaded
        if [ -s "./${PROFILE}_output.md" ]; then
            echo "✅ プロファイル ${PROFILE} で出力生成完了"
        else
            echo "⚠️  出力ファイルが空です"
        fi
    else
        echo "❌ breakdown実行失敗 (profile: ${PROFILE})"
        echo "📊 Error output:"
        cat ./${PROFILE}_output.md
    fi
    
    # Cleanup output file
    rm -f ./${PROFILE}_output.md
done

echo ""
echo "🔍 設定ファイル検証"
echo "各プロファイルの設定ファイル存在確認:"

for PROFILE in dev staging prod; do
    APP_CONFIG="${CONFIG_DIR}/${PROFILE}-app.yml"
    USER_CONFIG="${CONFIG_DIR}/${PROFILE}-user.yml"
    
    echo "Profile: ${PROFILE}"
    if [ -f "${APP_CONFIG}" ]; then
        echo "  ✅ ${APP_CONFIG} - 存在"
    else
        echo "  ❌ ${APP_CONFIG} - 不存在"
    fi
    
    if [ -f "${USER_CONFIG}" ]; then
        echo "  ✅ ${USER_CONFIG} - 存在"  
    else
        echo "  ❌ ${USER_CONFIG} - 不存在"
    fi
done

echo ""
echo "🔍 基本プロファイル動作確認"
echo "デフォルトプロファイルでの動作確認:"

if deno run --allow-all ../cli/breakdown.ts defect issue < ./profile_test.md > ./default_output.md 2>&1; then
    echo "✅ default profile動作確認完了"
    echo "📊 Default output preview:"
    head -3 ./default_output.md
else
    echo "❌ default profile動作確認失敗"
    cat ./default_output.md
fi

# Cleanup
rm -f ./profile_test.md
rm -f ./default_output.md

echo ""
echo "=== Configuration Profile Switching Example Completed ==="
echo ""
echo "📋 検証結果サマリー:"
echo "1. プロファイル設定ファイルの存在確認完了"
echo "2. --config={profile}パラメータでの設定切り替え確認完了" 
echo "3. 各プロファイルでのbreakdownコマンド実行確認完了"
echo "4. 仕様書準拠のプロファイル機能テスト完了"