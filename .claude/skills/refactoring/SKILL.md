---
name: refactoring
description: Use when refactoring code, reorganizing modules, renaming types, deleting old paths, or migrating architecture. MUST read before any structural code change. Prevents incomplete refactoring.
allowed-tools: [Read, Glob, Grep, Edit, Write, Bash, Task]
---

# Refactoring

旧パスのすべての契約を新パスが継承したと証明できるまで削除しない。不完全な削除は中間状態で契約を破壊する。

## Phases

**1. Inventory** — 削除・変更対象と全消費者をリストアップする。

```bash
grep -r "OldName" --include="*.ts" lib/ tests/ cli/ mod.ts
```

消費者にマイグレーション先がなければ削除不可。

**2. Contract** — Before/After 表を作成する。After が空の行がある = 準備不足。

| Behavior | Before | After | Verified |
|----------|--------|-------|----------|

**3. Execute** — 1 commit = 1 concern（新パス追加 → 消費者移行 → 旧パス削除 → docs 更新）。各 commit で `deno task ci` が pass すること。dead code は同一 PR で削除する。

**4. Verify** — キャッシュクリア後、旧名の残存参照をゼロにする。

```bash
grep -r "OldName" --include="*.ts" lib/ tests/ cli/ mod.ts
grep -r "OldName" --include="*.md" docs/ README.md
```

root cause 分析は `/fix-checklist`、docs 更新は `/docs-consistency` を併用。
