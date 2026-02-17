---
name: release
description: Create a release following Git Flow strategy. Use when preparing a release, bumping version, creating release branch, or when user says "release", "bump version", "prepare release", "ship version".
allowed-tools: Bash, Read, Edit
---

# Release Process

リリースの詳細手順は `/release-procedure` を参照。このスキルはリリースの概要とチェックリストを提供する。

## Release Flow

```
develop ──▶ release/v{X.Y.Z} ──PR──▶ develop ──PR──▶ main ──▶ vtag ──▶ JSR publish
```

## Quick Steps

1. `git checkout develop && git pull origin develop`
2. `deno task ci` — 全テスト pass を確認
3. `git checkout -b release/v{NEW_VERSION}`
4. `bash scripts/bump_version.sh` — `deno.json` + `lib/version.ts` 更新
5. CHANGELOG.md 更新
6. `git add deno.json lib/version.ts CHANGELOG.md && git commit -m "chore: bump version to {NEW_VERSION}"`
7. `git push -u origin release/v{NEW_VERSION}`
8. PR: `release/* → develop` (merge 後)
9. PR: `develop → main` (merge で auto-release.yml が tag 作成)
10. `gh workflow run publish.yml -f tag=v{NEW_VERSION}` — JSR publish
11. Backmerge: `git checkout develop && git merge origin/main && git push origin develop`

## Checklist

- [ ] All features merged to develop
- [ ] `deno task ci` passes
- [ ] Version bumped (`deno.json` + `lib/version.ts`)
- [ ] CHANGELOG.md updated
- [ ] PR: release/* → develop → main
- [ ] vtag created on main
- [ ] `gh workflow run publish.yml -f tag=v{VERSION}`
- [ ] JSR publication verified
- [ ] Backmerge main → develop

## Notes

- Never push directly to `main` or `develop`
- Version in `deno.json` must match `lib/version.ts` and tag
- Flow: `release/* → develop → main`（直接 main への PR は禁止）
- JSR publish requires manual trigger after auto-release
