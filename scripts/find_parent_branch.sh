#!/bin/zsh

# このスクリプトは現在のブランチが派生された元のブランチを特定します
# 使用方法: ./find_parent_branch.sh

git show-branch | grep '*' | grep -v "$(git rev-parse --abbrev-ref HEAD)" | head -1 | awk -F'[]~^[]' '{print $2}' 