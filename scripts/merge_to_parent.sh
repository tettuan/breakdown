#!/bin/zsh

# このスクリプトは現在のブランチの変更を親ブランチにマージします
# 使用方法: ./script/merge_to_parent.sh [コミットメッセージ]

# エラーが発生したら停止
set -e

# 現在のブランチ名を取得
current_branch=$(git rev-parse --abbrev-ref HEAD)
echo "現在のブランチ: $current_branch"

# 親ブランチを特定
parent_branch=$(./scripts/find_parent_branch.sh)

# 親ブランチが特定できなかった場合
if [[ -z "$parent_branch" ]]; then
  echo "親ブランチを特定できませんでした。このブランチはリポジトリの最初のブランチかもしれません。"
  exit 1
fi

echo "親ブランチ: $parent_branch"

# 未コミットの変更があるか確認
if [[ -n $(git status --porcelain) ]]; then
  echo "未コミットの変更があります。コミットします..."
  
  # コミットメッセージが指定されていれば使用、なければデフォルトのメッセージを使用
  commit_message=${1:-"Changes before merging to parent branch $parent_branch"}
  
  git add .
  git commit -m "$commit_message"
  echo "変更をコミットしました: $commit_message"
fi

# 親ブランチの最新の変更を取得
echo "親ブランチ ($parent_branch) の最新の変更を取得します..."
git fetch origin $parent_branch:$parent_branch

# 親ブランチに切り替え
echo "親ブランチ ($parent_branch) に切り替えます..."
git checkout $parent_branch

# 現在のブランチをマージ
echo "$current_branch ブランチをマージします..."
git merge $current_branch

# マージの結果を表示
echo "マージが完了しました。$current_branch ブランチの変更を $parent_branch ブランチにマージしました。"

# マージの履歴を表示
echo "マージの履歴:"
git log --oneline --graph --decorate -5

# プッシュするか確認
echo ""
echo "変更を origin/$parent_branch にプッシュしますか？ (y/n)"
read answer

if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
  echo "変更をプッシュします..."
  git push origin $parent_branch
  echo "プッシュが完了しました。"
else
  echo "プッシュはキャンセルされました。必要に応じて手動でプッシュしてください。"
fi

# 元のブランチに戻るか確認
echo ""
echo "$current_branch ブランチに戻りますか？ (y/n)"
read answer

if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
  echo "$current_branch ブランチに戻ります..."
  git checkout $current_branch
  echo "ブランチを切り替えました: $current_branch"
else
  echo "$parent_branch ブランチのままです。"
fi 