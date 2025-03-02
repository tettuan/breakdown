#!/bin/zsh

# このスクリプトは現在のブランチの変更を親ブランチにマージします
# 使用方法: ./scripts/merge_to_parent.sh [コミットメッセージ]

# エラーが発生したら停止
set -e

# 現在のブランチ名を取得
current_branch=$(git rev-parse --abbrev-ref HEAD)
echo "現在のブランチ: $current_branch"

# 未コミットの変更があるか確認
if [[ -n $(git status --porcelain) ]]; then
  echo "未コミットの変更があります。"
  echo "安全なマージのために、先に変更をコミットするか、スタッシュしてください。"
  echo "処理を停止します。"
  exit 1
fi

# 親ブランチを特定
parent_branch=$(./scripts/find_parent_branch.sh)

# 親ブランチが特定できなかった場合
if [[ -z "$parent_branch" ]]; then
  echo "親ブランチを特定できませんでした。このブランチはリポジトリの最初のブランチかもしれません。"
  exit 1
fi

echo "親ブランチ: $parent_branch"

# 親ブランチが存在するか確認
if ! git show-ref --verify --quiet refs/heads/$parent_branch; then
  echo "親ブランチ ($parent_branch) がローカルに存在しません。"
  echo "処理を停止します。"
  exit 1
fi

# リモートリポジトリが存在するか確認
remote_exists=false
if git ls-remote --exit-code origin $parent_branch &>/dev/null; then
  remote_exists=true
  echo "リモートブランチ origin/$parent_branch が存在します。最新の変更を取得します..."
  git fetch origin $parent_branch:$parent_branch || echo "リモートからの取得に失敗しましたが、ローカルブランチでマージを続行します。"
else
  echo "リモートブランチ origin/$parent_branch が存在しません。ローカルブランチでマージを続行します。"
fi

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

# リモートが存在する場合のみプッシュを確認
if $remote_exists; then
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
else
  echo ""
  echo "リモートブランチが存在しないため、プッシュはスキップされます。"
  echo "リモートにブランチを作成しますか？ (y/n)"
  read answer
  
  if [[ "$answer" == "y" || "$answer" == "Y" ]]; then
    echo "リモートブランチを作成してプッシュします..."
    git push -u origin $parent_branch
    echo "リモートブランチの作成とプッシュが完了しました。"
  else
    echo "リモートブランチの作成はキャンセルされました。必要に応じて手動で作成してください。"
  fi
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