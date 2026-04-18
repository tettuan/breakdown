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

## Execution Rules（必読）

**このskill起動時、以下のタスクリストをTaskCreateで必ず登録し、1ステップずつ順番に実行・完了マーク（`[x]`）すること。スキップ・一括実行・順序変更は禁止。**

- 各ステップは**実行 → 結果確認 → ユーザー承認** の3点セット。連続マージ禁止。
- 前ステップが未完了（`[ ]`）の状態で次ステップへ進まない。
- 失敗時は該当ステップに留まり、原因を解消してから再実行（次へ進まない）。
- コマンド実行後は必ず出力を確認し、成功を明示してからチェックを入れる。
- `X.Y.Z` は実際のバージョンに置換する。`<PR#>` は作成後に取得した番号に置換する。

## Task List（必ず全段階を順に実施）

### Phase 1: Preparation

- [ ] **Step 1. Prepare release branch** — `git checkout develop && git pull origin develop && git checkout -b release/vX.Y.Z`
  - 確認: `git branch --show-current` で `release/vX.Y.Z` を表示することを確認してからチェック。
- [ ] **Step 2. Version bump（Step 1の直後に必ず実施、他コミットを先行させない）** — `scripts/bump_version.sh --patch`（または `--minor` / `--major`）
  - 確認: `grep '"version"' deno.json` と `grep 'VERSION' lib/version.ts` が一致することを確認してからチェック。
- [ ] **Step 3. Update CHANGELOG.md** — 今回のリリース内容を追記
  - 確認: `git diff CHANGELOG.md` で差分を確認してからチェック。
- [ ] **Step 4. Local CI** — `deno task ci`
  - 確認: 全テストが pass したことを確認してからチェック。失敗したらこのステップに留まる。

### Phase 2: Release Branch → Develop

- [ ] **Step 5. Commit & push** — `git add deno.json lib/version.ts CHANGELOG.md && git commit -m "chore: bump version to X.Y.Z" && git push -u origin release/vX.Y.Z`
  - 確認: `git log -1` と `git status` で push 完了を確認してからチェック。
- [ ] **Step 6. Create PR: release/* → develop** — `gh pr create --base develop --head release/vX.Y.Z --title "Release vX.Y.Z"`
  - 確認: 返された PR URL/番号を記録してからチェック。
- [ ] **Step 7. Wait CI & merge (release → develop)** — `gh pr checks <PR#> --watch && gh pr merge <PR#> --merge`
  - 確認: CI green かつ merged 状態を `gh pr view <PR#>` で確認。**ユーザー承認を得てから merge** すること。

### Phase 3: Develop → Main

- [ ] **Step 8. Create PR: develop → main** — `gh pr create --base main --head develop --title "Release vX.Y.Z"`
  - 確認: 返された PR URL/番号を記録してからチェック。
- [ ] **Step 9. Wait CI & merge (develop → main)** — `gh pr checks <PR#> --watch && gh pr merge <PR#> --merge`
  - 確認: CI green かつ merged 状態を確認。**ユーザー承認を得てから merge** すること。

### Phase 4: Tag & Publish

- [ ] **Step 10. Create vtag on main** — `git fetch origin main && git tag vX.Y.Z origin/main && git push origin vX.Y.Z`
  - 確認: `git ls-remote --tags origin vX.Y.Z` で tag が remote に存在することを確認してからチェック。
- [ ] **Step 11. Trigger JSR publish** — `gh workflow run publish.yml -f tag=vX.Y.Z`
  - 確認: `gh run list --workflow=publish.yml` で run が開始されたことを確認してからチェック。
- [ ] **Step 12. Verify JSR publication** — JSR ページでバージョン反映を確認
  - 確認: `https://jsr.io/@tettuan/breakdown` で vX.Y.Z が公開されたことを確認してからチェック。

### Phase 5: Post-release

- [ ] **Step 13. Backmerge main → develop** — `git checkout develop && git pull origin develop && git merge origin/main && git push origin develop`
  - 確認: `git log develop..origin/main` が空になったことを確認してからチェック。
- [ ] **Step 14. Cleanup release branch** — `git branch -D release/vX.Y.Z && git push origin --delete release/vX.Y.Z`
  - 確認: `git branch -a | grep release/vX.Y.Z` が空であることを確認してからチェック。

ブランチ戦略は `/branch-management`、CI は `/local-ci` `/ci-troubleshooting` を参照。

## Notes

- Never push directly to `main` or `develop`
- Version in `deno.json` must match `lib/version.ts` and tag
- Flow: `release/* → develop → main`（直接 main への PR は禁止）
- vtag は手動作成（auto-release.yml は head branch が `release/*` の場合のみ動作）
- JSR publish requires manual trigger after vtag
- **release ブランチ作成後、最初のコミットは必ず version bump にすること。他の変更を先にコミットしない。** GitHub Actions の Version Consistency Check が失敗する原因になる。
