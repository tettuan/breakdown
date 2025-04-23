#!/bin/bash

# このスクリプトは、examples/配下の全ての実行ファイルを順次実行し、
# エラーが発生した時点で実行を停止します。
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
    exit 1
}

# テスト用の一時ディレクトリを準備
prepare_test_dir() {
    print_header "テスト環境の準備"
    rm -rf "${TEST_DIR}"
    mkdir -p "${TEST_DIR}"
    cd "${TEST_DIR}"
    print_success "テストディレクトリを作成: ${TEST_DIR}"
}

# サンプルファイルの作成
create_example_files() {
    print_header "サンプルファイルの作成"
    "${PROJECT_ROOT}/scripts/create_example_files.sh" > /dev/null || print_error "サンプルファイルの作成に失敗しました"
    print_success "サンプルファイルを作成しました"
}

# 設定ファイルのコピー
copy_config() {
    print_header "設定ファイルのコピー"
    mkdir -p "${TEST_DIR}/breakdown/config"
    cp "${PROJECT_ROOT}/breakdown/config/app.yml" "${TEST_DIR}/breakdown/config/" || print_error "設定ファイルのコピーに失敗しました"
    print_success "設定ファイルをコピーしました"
}

# 実行権限の付与
set_executable() {
    print_header "実行権限の付与"
    chmod +x "${EXAMPLES_DIR}"/*.sh || print_error "実行権限の付与に失敗しました"
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
    
    # サンプルファイルと設定ファイルをコピー
    cp -r "${TEST_DIR}/project-dir" .
    cp -r "${TEST_DIR}/issue-dir" .
    cp -r "${TEST_DIR}/tasks-dir" .
    cp -r "${TEST_DIR}/test_results.txt" .
    cp -r "${TEST_DIR}/error.log" .
    cp -r "${TEST_DIR}/breakdown" .
    
    # スクリプトを実行
    if "${script}"; then
        print_success "${script_name} の実行に成功しました"
    else
        print_error "${script_name} の実行に失敗しました"
    fi
}

# メイン処理
main() {
    prepare_test_dir
    create_example_files
    copy_config
    set_executable
    
    # サンプルファイルを作業ディレクトリにコピー
    cp -r "${PROJECT_ROOT}/tmp/work_"*/* "${TEST_DIR}/" || print_error "サンプルファイルのコピーに失敗しました"
    
    # 全てのサンプルスクリプトを順番に実行
    for script in "${EXAMPLES_DIR}"/*.sh; do
        run_example "${script}"
        echo # 空行を挿入
    done
    
    print_success "全てのサンプルスクリプトが正常に実行されました"
}

# スクリプトの実行
main 