---
name: release
description: Use when user says 'release', 'リリース', 'publish', 'vtag', 'version up', 'バージョンアップ', 'bump version', 'prepare release', 'ship version', or discusses merging to main/develop. Guides through version bump and release flow.
allowed-tools: [Bash, Read, Edit, Grep, Glob]
---

# Release Procedure

全リリースフロー（version bump → CI → PR → merge → vtag → JSR publish）を管理する。各マージは明示的なユーザー指示が必要。

## Release Flow

```
develop → release/* →PR→ develop →PR→ main → vtag → publish.yml → JSR
```

## Version Files

`deno.json` の `"version"` と `lib/version.ts` の `VERSION` は一致必須。Patch (x.y.Z): バグ修正 / Minor (x.Y.0): 新機能 / Major (X.0.0): 破壊的変更

## Steps

```bash
# 1. Prepare release branch (bump version IMMEDIATELY after creation)
git checkout develop && git pull origin develop
git checkout -b release/v{X.Y.Z}

# 2. Version bump (MUST run right after step 1, before any other commits)
scripts/bump_version.sh --patch  # or --minor, --major
grep '"version"' deno.json && grep 'VERSION' lib/version.ts  # 確認

# 3. CHANGELOG.md 更新

# 4. Local CI
deno task ci

# 5. Commit & push
git add deno.json lib/version.ts CHANGELOG.md && git commit -m "chore: bump version to X.Y.Z"
git push -u origin release/vX.Y.Z

# 6. release → develop PR (CI pass → merge)
gh pr create --base develop --head release/vX.Y.Z --title "Release vX.Y.Z"
gh pr checks <PR#> --watch && gh pr merge <PR#> --merge

# 7. develop → main PR (CI pass → merge)
gh pr create --base main --head develop --title "Release vX.Y.Z"
gh pr checks <PR#> --watch && gh pr merge <PR#> --merge

# 8. vtag (手動作成)
git fetch origin main && git tag vX.Y.Z origin/main && git push origin vX.Y.Z

# 9. JSR publish (手動トリガー)
gh workflow run publish.yml -f tag=vX.Y.Z

# 10. Backmerge
git checkout develop && git pull origin develop && git merge origin/main && git push origin develop

# 11. Cleanup
git branch -D release/vX.Y.Z && git push origin --delete release/vX.Y.Z
```

連続マージ禁止: 各ステップでユーザー承認を得てから次に進む。ブランチ戦略は `/branch-management`、CI は `/local-ci` `/ci-troubleshooting` を参照。

## Checklist

- [ ] All features merged to develop
- [ ] `deno task ci` passes
- [ ] Version bumped (`deno.json` + `lib/version.ts`)
- [ ] CHANGELOG.md updated
- [ ] PR: release/* → develop (merged)
- [ ] PR: develop → main (merged)
- [ ] vtag created on main (`git tag vX.Y.Z origin/main && git push origin vX.Y.Z`)
- [ ] `gh workflow run publish.yml -f tag=vX.Y.Z`
- [ ] JSR publication verified
- [ ] Backmerge main → develop
- [ ] Release branch cleaned up

## Notes

- Never push directly to `main` or `develop`
- Version in `deno.json` must match `lib/version.ts` and tag
- Flow: `release/* → develop → main`（直接 main への PR は禁止）
- vtag は手動作成（auto-release.yml は head branch が `release/*` の場合のみ動作）
- JSR publish requires manual trigger after vtag
- **release ブランチ作成後、最初のコミットは必ず version bump にすること。他の変更を先にコミットしない。** GitHub Actions の Version Consistency Check が失敗する原因になる。
