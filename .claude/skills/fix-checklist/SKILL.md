---
name: fix-checklist
description: Use when about to fix code, modify implementation, or address errors. MUST read before saying "fix", "修正します", "直す", "対処する". Prevents symptom-driven fixes.
allowed-tools: [Read, Glob, Grep]
---

# Before You Fix

症状ドリブンの修正は設計を壊すので、コード変更前に根本原因を特定する。

## Checklist

1. **Stop** — まだコードを書かない
2. **Ask Why** — エラーは症状。システムは何をしようとし、何が期待と違ったか？
3. **Read Design** — 関連する設計ドキュメント (`docs/breakdown/`) を読み、意図された振る舞いを理解する
4. **Trace Flow** — CLI引数 → `BreakdownParams`(TwoParams) → `BreakdownConfig` → `PromptVariablesFactory` → `PathResolutionFacade` → `VariableProcessor` → prompt output
5. **Root Cause** — エラー発生箇所と原因箇所は異なることが多い

| エラー箇所 | 根本原因の典型箇所 |
|------------|-------------------|
| パス解決エラー | `lib/factory/` のパスリゾルバ群 |
| 型エラー・バリデーション | `lib/types/` の型定義・enum |
| 変数未置換 | `lib/processor/` の VariableProcessor |
| 設定読み込みエラー | `lib/config/` または `@tettuan/breakdownconfig` |
| パラメータ解析エラー | `lib/application/` または `@tettuan/breakdownparams` |
| テスト失敗 | `lib/domain/` のドメインロジック |

6. **State** — 根本原因・設計の意図・最小限の正しい修正を述べる
7. **Then Fix** — 根本原因に対する最小変更を行う

複雑な問題は `tmp/investigation/<issue>/` に overview.md, trace.md, root-cause.md を書き出す（mermaid図必須）。

## Issue-driven Fix: コミット・PR に issue 番号を必ず紐づける

issue 起因の修正作業（GitHub issue / ユーザー報告で番号が存在する場合）は、以下を**必ず**守る:

- **コミットメッセージ末尾に `Fixes #<issue-number>` を記載**（複数 issue は `Fixes #12, Fixes #34`）
  - 例: `fix(parser): handle empty DirectiveType\n\nFixes #123`
  - `Fixes` / `Closes` / `Resolves` いずれも可（GitHub が自動 close するキーワード）
  - 単なる関連付けで close させたくない場合は `Refs #<issue-number>`
- **PR 本文冒頭に `Fixes #<issue-number>` を記載**（PR merge 時に issue が自動 close される）
- issue 番号が不明な場合は**修正着手前にユーザーに確認**し、番号が判明してからコミットする
- work branch 名にも番号を含める: `fix/<issue-number>-<short-desc>`（例: `fix/123-empty-directive`）

理由: issue ↔ コミット ↔ PR のトレーサビリティを担保し、close漏れ・重複対応・原因追跡の迷子を防ぐ。
