#!/bin/bash

# このスクリプトは、examples/配下の全ての実行ファイルを順次実行し、
# エラーが発生しないことを確認します。
#
# 実行方法：
# ./scripts/run_examples.sh
#
# デバッグモードで実行する場合：
# DEBUG=true ./scripts/run_examples.sh

# エラー発生時に実行を停止
set -e

# デバッグモードの設定
if [ "${DEBUG}" = "true" ]; then
    set -x
fi

# スクリプトのディレクトリを取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# プロジェクトのルートディレクトリを取得
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
# examplesディレクトリのパス
EXAMPLES_DIR="${PROJECT_ROOT}/examples"
# テスト用の一時ディレクトリ
TEST_DIR="${PROJECT_ROOT}/tmp/example_test"

# 色付きの出力用の関数
print_header() {
    echo -e "\033[1;34m=== $1 ===\033[0m"
}

print_success() {
    echo -e "\033[1;32m✓ $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m✗ $1\033[0m"
}

# テスト用の一時ディレクトリを準備
prepare_test_dir() {
    print_header "テスト環境の準備"
    rm -rf "${TEST_DIR}"
    mkdir -p "${TEST_DIR}"
    cd "${TEST_DIR}"
    print_success "テストディレクトリを作成: ${TEST_DIR}"
}

# 実行権限の付与
set_executable() {
    print_header "実行権限の付与"
    chmod +x "${EXAMPLES_DIR}"/*.sh
    print_success "実行権限を付与しました"
}

# 各サンプルスクリプトの実行
run_example() {
    local script="$1"
    local script_name=$(basename "${script}")
    
    print_header "実行: ${script_name}"
    
    # 新しいディレクトリで実行
    TEST_SUBDIR="${TEST_DIR}/${script_name%.*}"
    mkdir -p "${TEST_SUBDIR}"
    cd "${TEST_SUBDIR}"
    
    # スクリプトを実行
    if "${script}"; then
        print_success "${script_name} の実行に成功しました"
        return 0
    else
        print_error "${script_name} の実行に失敗しました"
        return 1
    fi
}

# メイン処理
main() {
    local exit_status=0
    
    prepare_test_dir
    set_executable
    
    # 全てのサンプルスクリプトを順番に実行
    for script in "${EXAMPLES_DIR}"/*.sh; do
        if ! run_example "${script}"; then
            exit_status=1
        fi
        echo # 空行を挿入
    done
    
    # 結果の表示
    echo
    if [ ${exit_status} -eq 0 ]; then
        print_success "全てのサンプルスクリプトが正常に実行されました"
    else
        print_error "一部のサンプルスクリプトの実行に失敗しました"
    fi
    
    return ${exit_status}
}

# スクリプトの実行
main 