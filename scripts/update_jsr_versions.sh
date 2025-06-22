#!/bin/bash
# scripts/update_jsr_versions.sh
# JSRパッケージのバージョンを一元的に更新するスクリプト

set -e

SCRIPT_DIR=$(dirname "$0")
PROJECT_ROOT=$(cd "${SCRIPT_DIR}/.." && pwd)

# バージョン設定ファイル
VERSIONS_FILE="${PROJECT_ROOT}/lib/versions.ts"

# 現在のバージョンを取得
get_current_version() {
    local package_name=$1
    grep "${package_name}:" "${VERSIONS_FILE}" | sed 's/.*"\([^"]*\)".*/\1/'
}

# ファイル内のバージョンを更新
update_version_in_file() {
    local file_path=$1
    local package_name=$2
    local old_version=$3
    local new_version=$4
    
    if [ -f "${file_path}" ]; then
        echo "Updating ${package_name} from ${old_version} to ${new_version} in ${file_path}"
        sed -i.bak "s|@tettuan/${package_name}@${old_version}|@tettuan/${package_name}@${new_version}|g" "${file_path}"
        rm -f "${file_path}.bak"
    fi
}

# 使用例:
# ./scripts/update_jsr_versions.sh breakdownconfig ^1.1.5
# ./scripts/update_jsr_versions.sh breakdownparams ^1.0.4

if [ $# -eq 2 ]; then
    PACKAGE_NAME=$1
    NEW_VERSION=$2
    
    echo "Updating @tettuan/${PACKAGE_NAME} to version ${NEW_VERSION}"
    
    # versions.tsファイルを更新
    OLD_VERSION=$(get_current_version "${PACKAGE_NAME}")
    sed -i.bak "s/BREAKDOWN_${PACKAGE_NAME^^}: \"${OLD_VERSION}\"/BREAKDOWN_${PACKAGE_NAME^^}: \"${NEW_VERSION}\"/g" "${VERSIONS_FILE}"
    rm -f "${VERSIONS_FILE}.bak"
    
    # 全てのファイルで該当するインポートを更新
    echo "Searching for files containing @tettuan/${PACKAGE_NAME}..."
    
    find "${PROJECT_ROOT}" -type f \( -name "*.ts" -o -name "*.md" \) \
        -not -path "*/node_modules/*" \
        -not -path "*/.git/*" \
        -not -path "*/tmp/*" \
        -exec grep -l "@tettuan/${PACKAGE_NAME}@" {} \; | while read -r file; do
        update_version_in_file "$file" "$PACKAGE_NAME" "$OLD_VERSION" "$NEW_VERSION"
    done
    
    echo "Update completed. Please verify the changes before committing."
    
else
    echo "Usage: $0 <package_name> <new_version>"
    echo "Example: $0 breakdownconfig ^1.1.5"
    echo ""
    echo "Available packages:"
    grep -E "BREAKDOWN_.*:" "${VERSIONS_FILE}" | sed 's/.*BREAKDOWN_\([^:]*\):.*/\1/' | tr '[:upper:]' '[:lower:]'
fi
