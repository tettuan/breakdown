#!/bin/bash
# テスト環境診断スクリプト - 開発者4
# テスト失敗の環境要因を特定

echo "=== テスト環境診断開始 ==="
echo "日時: $(date)"
echo "ホスト: $(hostname)"
echo "ユーザー: $(whoami)"
echo ""

echo "1. 作業ディレクトリ情報"
echo "------------------------"
echo "現在のディレクトリ: $(pwd)"
echo "プロジェクトルート: $PWD"
echo "Deno.cwd(): $(deno eval 'console.log(Deno.cwd())')"
echo ""

echo "2. 一時ディレクトリ状況"
echo "------------------------"
echo "TMPDIR: ${TMPDIR:-未設定}"
echo "/tmp実体: $(readlink -f /tmp)"
echo "/tmp権限: $(ls -ld /tmp)"
echo "書き込みテスト:"
if echo "test" > /tmp/test_write_$$; then
    echo "  ✅ /tmpへの書き込み: 成功"
    rm -f /tmp/test_write_$$
else
    echo "  ❌ /tmpへの書き込み: 失敗"
fi
echo ""

echo "3. ディレクトリ権限確認"
echo "------------------------"
echo "プロジェクト権限:"
ls -la | head -5
echo ""
echo "tmp/ディレクトリ:"
if [ -d "tmp" ]; then
    ls -la tmp/ | head -5
else
    echo "  ディレクトリなし"
fi
echo ""

echo "4. Deno権限確認"
echo "------------------------"
echo "Deno実行権限テスト:"
# Read権限
if deno eval 'await Deno.readTextFile("deno.json")' 2>/dev/null; then
    echo "  ✅ --allow-read: 成功"
else
    echo "  ❌ --allow-read: 失敗"
fi

# Write権限
if deno eval 'await Deno.writeTextFile("/tmp/deno_test_$$", "test")' --allow-write 2>/dev/null; then
    echo "  ✅ --allow-write: 成功"
    rm -f /tmp/deno_test_$$
else
    echo "  ❌ --allow-write: 失敗"
fi

# Run権限
if deno eval 'await new Deno.Command("echo", {args: ["test"]}).output()' --allow-run 2>/dev/null; then
    echo "  ✅ --allow-run: 成功"
else
    echo "  ❌ --allow-run: 失敗"
fi
echo ""

echo "5. CI環境との差異"
echo "------------------------"
echo "環境変数の差異:"
echo "  CI: ${CI:-未設定}"
echo "  GITHUB_ACTIONS: ${GITHUB_ACTIONS:-未設定}"
echo "  HOME: $HOME"
echo "  PATH (first 3): $(echo $PATH | tr ':' '\n' | head -3)"
echo ""

echo "6. テスト用ディレクトリ作成テスト"
echo "------------------------"
TEST_DIR="tmp/test_env_check_$$"
echo "テストディレクトリ: $TEST_DIR"
if mkdir -p "$TEST_DIR"; then
    echo "  ✅ ディレクトリ作成: 成功"
    
    # サブディレクトリ作成
    if mkdir -p "$TEST_DIR/.agent/breakdown/prompts"; then
        echo "  ✅ サブディレクトリ作成: 成功"
    else
        echo "  ❌ サブディレクトリ作成: 失敗"
    fi
    
    # ファイル書き込み
    if echo "test" > "$TEST_DIR/test.txt"; then
        echo "  ✅ ファイル書き込み: 成功"
    else
        echo "  ❌ ファイル書き込み: 失敗"
    fi
    
    # クリーンアップ
    rm -rf "$TEST_DIR"
else
    echo "  ❌ ディレクトリ作成: 失敗"
fi
echo ""

echo "7. CLI実行環境確認"
echo "------------------------"
echo "Denoバージョン: $(deno --version | head -1)"
echo "breakdown実行テスト:"
if deno run --allow-read --allow-write --allow-env --allow-run cli/breakdown.ts --version 2>&1; then
    echo "  ✅ CLI実行: 成功"
else
    echo "  ❌ CLI実行: 失敗"
fi
echo ""

echo "8. プロセス情報"
echo "------------------------"
echo "現在のumask: $(umask)"
echo "プロセスID: $$"
echo "親プロセスID: $PPID"
echo "シェル: $SHELL"
echo ""

echo "=== 診断結果サマリー ==="
echo "------------------------"
echo "潜在的な問題:"

# 権限問題チェック
if [ "$(umask)" != "022" ]; then
    echo "  ⚠️ umaskが標準値(022)と異なります: $(umask)"
fi

# 一時ディレクトリチェック
if [ ! -w "/tmp" ]; then
    echo "  ⚠️ /tmpへの書き込み権限がありません"
fi

# 作業ディレクトリチェック
if [ ! -w "." ]; then
    echo "  ⚠️ 現在のディレクトリへの書き込み権限がありません"
fi

echo ""
echo "推奨事項:"
echo "  1. 全テストに--allow-runを追加"
echo "  2. 一時ディレクトリは明示的にtmp/を使用"
echo "  3. ディレクトリ作成前に親ディレクトリの存在確認"