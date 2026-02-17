---
name: release-procedure
description: Use when user says 'release', 'リリース', 'publish', 'vtag', 'version up', 'バージョンアップ', or discusses merging to main/develop. Guides through version bump and release flow.
disable-model-invocation: true
allowed-tools: [Bash, Read, Edit, Grep, Glob]
---

# Release Procedure

全リリースフロー（version bump → CI → PR → merge → vtag → JSR publish）を管理する。各マージは明示的なユーザー指示が必要。

## Release Flow

```
develop ──▶ release/v{X.Y.Z} ──PR──▶ develop ──PR──▶ main
                                                       │
                                                       ▼
                                                 (auto-release.yml)
                                                       │
                                                       ▼
                                                  tag: v{X.Y.Z}
                                                       │
                                                 (manual trigger)
                                                 gh workflow run publish.yml -f tag=v{X.Y.Z}
                                                       │
                                                       ▼
                                                  JSR publish
```

## Version Files

`deno.json` の `"version"` と `lib/version.ts` の `VERSION` は一致必須。Patch (x.y.Z): バグ修正 / Minor (x.Y.0): 新機能 / Major (X.0.0): 破壊的変更

## Steps

```bash
# 1. Version bump on release/*
scripts/bump_version.sh --patch  # or --minor, --major
grep '"version"' deno.json && grep 'VERSION' lib/version.ts  # 確認

# 2. Local CI
deno task ci

# 3. Commit & push
git add deno.json lib/version.ts && git commit -m "chore: bump version to X.Y.Z"
git push -u origin release/vX.Y.Z

# 4-5. release → develop PR (CI pass → merge)
gh pr create --base develop --head release/vX.Y.Z --title "Release vX.Y.Z"
gh pr checks <PR#> --watch && gh pr merge <PR#> --merge

# 6-7. develop → main PR (CI pass → merge → JSR publish 自動)
gh pr create --base main --head develop --title "Release vX.Y.Z"
gh pr checks <PR#> --watch && gh pr merge <PR#> --merge

# 8. vtag
git fetch origin main && git tag vX.Y.Z origin/main && git push origin vX.Y.Z

# 9. JSR publish (手動トリガー)
gh workflow run publish.yml -f tag=vX.Y.Z

# 10. Cleanup
git branch -D release/vX.Y.Z && git push origin --delete release/vX.Y.Z
```

連続マージ禁止: 各ステップでユーザー承認を得てから次に進む。ブランチ戦略は `/branch-management`、CI は `/local-ci` `/ci-troubleshooting` を参照。
