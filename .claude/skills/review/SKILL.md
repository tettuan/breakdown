---
name: review
description: Review code changes for quality, correctness, and adherence to project conventions. Use when user says 'review', 'レビュー', or asks to check code quality.
argument-hint: "[file-or-path]"
allowed-tools: [Read, Grep, Glob, Bash]
---

# Code Review

コード品質と規約準拠を担保するため、`$ARGUMENTS` 指定ファイル（未指定時は `git diff`）を以下の観点でレビューする。

| 観点 | 基準 |
|------|------|
| 型安全性 | strict mode 準拠、`any` 禁止（正当理由なし）、DDD の型（TwoParams, PromptVariables, PathResolutionOption 等）の適切な使用 |
| 命名 | TS: camelCase (変数/関数), PascalCase (型/クラス)、テスト: `*_test.ts` (tests/) / `*.test.ts` (lib/) |
| エラー処理 | Result 型パターン、UnifiedError 系の型使用 |
| パス検証 | `lib/factory/` のリゾルバ群経由、絶対パス禁止 (`/absolute-path-checker`) |
| テスト | 単体は `lib/` 内同一ディレクトリ、統合は `tests/0_core_domain/` → `tests/4_cross_domain/` |
| import | `deno.json` の import map エイリアス（`$lib/`, `$std/`, `$test/`）必須、インライン `jsr:`/`npm:`/`https:` 禁止 |
| フォーマット | 2スペース、100文字幅、ダブルクォート（`deno fmt` 準拠） |
| BreakdownLogger | テストファイルのみ使用可、実装コード(`lib/`)での使用禁止 |
| DDD 準拠 | ドメイン境界の尊重、JSR パッケージ（config/params/prompt/logger）の責務分離 |

ファイルパスと行番号付きで報告する。
