#!/bin/bash
# examples/12_check_version.sh

# このスクリプトは、breakdown CLI の --version オプションの動作を確認します。

# 注意:
# - このスクリプトを実行する前に、breakdown コマンドがインストールされているか、
#   リポジトリのルートディレクトリにソースコードが存在することを確認してください。
# - 事前に breakdown コマンドのローカルインストールやコンパイルが実施されていることを
#   前提とするコマンドも含まれています。

SCRIPT_DIR=$(dirname "$0")
PROJECT_ROOT=$(cd "${SCRIPT_DIR}/.." && pwd)

echo "--- 1. グローバル/PATH上の breakdown コマンドのバージョン確認 ---"
echo "(事前に deno install -A -f --global --name breakdown jsr:@tettuan/breakdown/cli でインストールされている想定)"
if command -v breakdown &> /dev/null
then
    breakdown --version
else
    echo "breakdown コマンドが見つかりません。グローバルインストールされていないか、PATHが通っていません。"
fi

echo "\n--- 2. ローカルプロジェクト配下にインストールされた breakdown コマンドのバージョン確認 ---"
echo "(事前に deno install -A -f --global --root .deno --name breakdown jsr:@tettuan/breakdown/cli でインストールされている想定)"
LOCAL_BREAKDOWN_CMD="${PROJECT_ROOT}/.deno/bin/breakdown"
if [ -f "${LOCAL_BREAKDOWN_CMD}" ]; then
    echo "実行コマンド: ${LOCAL_BREAKDOWN_CMD} --version"
    "${LOCAL_BREAKDOWN_CMD}" --version
else
    echo "ローカルインストールされた breakdown コマンド (${LOCAL_BREAKDOWN_CMD}) が見つかりません。"
fi

echo "\n--- 3. ローカルソース (cli/breakdown.ts) を直接実行してバージョン確認 ---"
CLI_MAIN_TS="${PROJECT_ROOT}/cli/breakdown.ts"
if [ -f "${CLI_MAIN_TS}" ]; then
    echo "実行コマンド: deno run -A ${CLI_MAIN_TS} --version"
    deno run -A "${CLI_MAIN_TS}" --version
else
    echo "CLIエントリーポイント (${CLI_MAIN_TS}) が見つかりません。"
fi

echo "\n--- 4. JSR経由で直接実行してバージョン確認 ---"
echo "実行コマンド: deno run -A jsr:@tettuan/breakdown/cli --version"
deno run -A jsr:@tettuan/breakdown/cli --version

echo "\n--- 5. (参考) コンパイルされたバイナリのバージョン確認 (もしあれば) ---"
COMPILED_BREAKDOWN="${PROJECT_ROOT}/.deno/bin/breakdown"
if [ -f "${COMPILED_BREAKDOWN}" ]; then
    echo "実行コマンド: ${COMPILED_BREAKDOWN} --version"
    "${COMPILED_BREAKDOWN}" --version
else
    echo "コンパイルされたバイナリ (${COMPILED_BREAKDOWN}) は見つかりません。"
    echo "(もしテストする場合は、examples/02_compile.sh を実行してください)"
fi

echo "\n--- 確認完了 ---" 