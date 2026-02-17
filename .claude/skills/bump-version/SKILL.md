---
name: bump-version
description: Bump the project version for release. Use when user says 'version', 'バージョン', or preparing a release.
argument-hint: "[--major|--minor|--patch] [--status] [--step]"
disable-model-invocation: true
allowed-tools: [Bash, Read]
---

`deno.json` と `lib/version.ts` のバージョンを同期させるため、`scripts/bump_version.sh $ARGUMENTS` を実行する（デフォルト: `--patch`）。

## Version Files

| File | Field |
|------|-------|
| `deno.json` | `"version": "x.y.z"` |
| `lib/version.ts` | `export const VERSION = "x.y.z"` |

両ファイルのバージョンは一致必須。

## Script Flow

```
A-1: Version update (JSR latest check) → A-2: Local CI → commit & push → A-3: PR to develop
B-1: PR merge 待ち → B-2: PR to main
C-1: PR merge 待ち → C-2: vtag on main
```

`--status` で進捗確認、`--step` で1ステップ実行。明示的指示があるときのみ実行する。
