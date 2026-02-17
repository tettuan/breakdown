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
