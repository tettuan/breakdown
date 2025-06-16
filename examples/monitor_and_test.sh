#!/bin/bash
# init修正監視&即座テスト実行スクリプト - 開発者4
# 修正を検知したら即座にテストを実行

echo "=== INIT修正監視開始 ==="
echo "監視対象:"
echo "  - lib/commands/mod.ts"
echo "  - lib/cli/commands.ts"
echo "  - cli/breakdown.ts (init関連)"
echo ""
echo "修正を検知したら自動的にテストを実行します..."
echo "Ctrl+Cで終了"
echo ""

# 初回のファイル状態を記録
LAST_MOD_TIME=$(stat -f %m lib/cli/commands.ts 2>/dev/null || echo "0")

while true; do
    # 現在の修正時刻を取得
    CURRENT_MOD_TIME=$(stat -f %m lib/cli/commands.ts 2>/dev/null || echo "0")
    
    # 修正を検知
    if [ "$CURRENT_MOD_TIME" != "$LAST_MOD_TIME" ]; then
        echo ""
        echo "🚨 修正検知！即座にテスト実行"
        echo "時刻: $(date +%H:%M:%S)"
        echo ""
        
        # 即座にinitテスト実行
        echo "1. 型チェック実行"
        if deno check cli/breakdown.ts; then
            echo "✅ 型チェック成功"
        else
            echo "❌ 型チェック失敗"
        fi
        
        echo ""
        echo "2. initコマンドテスト"
        if deno run --allow-read --allow-write --allow-env --allow-run cli/breakdown.ts init; then
            echo "✅ init成功"
            
            # ディレクトリ確認
            if [ -d ".agent/breakdown/prompts" ]; then
                echo "✅ promptsディレクトリ確認"
            else
                echo "❌ promptsディレクトリなし"
            fi
            
            if [ -d ".agent/breakdown/schema" ]; then
                echo "✅ schemaディレクトリ確認"
            else
                echo "❌ schemaディレクトリなし"
            fi
        else
            echo "❌ init失敗"
        fi
        
        # 更新時刻を記録
        LAST_MOD_TIME=$CURRENT_MOD_TIME
        
        echo ""
        echo "監視継続中..."
    fi
    
    # 1秒待機
    sleep 1
done