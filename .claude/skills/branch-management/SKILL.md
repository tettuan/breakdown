---
name: branch-management
description: Review and guide branch strategy when creating PRs, merging, or creating branches involving main, develop, and release branches
allowed-tools: [Bash, Read, Grep, Glob]
---

# Branch Management

main/develop への直接 push を防ぐため、work branch → release/* → develop → main の順に PR でマージする。

## Rules

| 操作 | 許可 | 禁止 |
|------|------|------|
| main 変更 | develop からの PR merge のみ | 直接 push、他ブランチからの merge |
| develop 変更 | release/* からの PR merge のみ | 直接 push |
| release/* 作成 | develop から分岐 | main や work branch から分岐 |
| work branch 作成 | release/* から分岐 | main や develop から分岐 |

## Procedures

```bash
# Work branch 作成
git checkout release/vX.Y.Z && git checkout -b feature/my-feature

# PR 作成
gh pr create --base release/vX.Y.Z   # work → release
gh pr create --base develop           # release → develop
gh pr create --base main              # develop → main

# Merge (CI pass 後)
gh pr merge --squash   # work → release (履歴クリーン)
gh pr merge --merge    # release → develop / develop → main (履歴保持)
```

## Branch Naming

`feature/*` (新機能) / `fix/*` (バグ修正) / `refactor/*` (リファクタ) / `docs/*` (ドキュメント) / `release/vX.Y.Z` (リリース)

リリースフロー全体は `/release-procedure`、CI は `/local-ci` を参照。
