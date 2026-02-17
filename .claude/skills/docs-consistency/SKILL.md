---
name: docs-consistency
description: Verify and fix documentation to match implementation. Use when updating docs, releasing versions, or when user mentions 'docs consistency', 'docs verify', 'ドキュメント更新', 'docsを直して'.
allowed-tools: [Read, Edit, Grep, Glob, Bash]
---

# Docs Consistency

ドキュメントは実装を説明するものなので、設計意図 → 実装調査 → docs 差分 → ギャップ修正の順で整合性を取る。

## Phases

1. **Design Intent** — `docs/breakdown/` の設計ドキュメントから What/Why/制約を抽出する
2. **Implementation Survey** — `mod.ts`, `lib/domain/`, `lib/types/`, `lib/factory/`, `lib/processor/`, `lib/application/` の公開 API・デフォルト値・エッジケースを確認する
3. **Diff** — 設計+実装 vs 現行 docs のギャップ表を作る
4. **Fix** — 実装向けドキュメントのみ修正する（設計ドキュメントは変更しない）。優先順: README.md → docs/usage.md → docs/breakdown/ 配下
5. **Verify** — `grep "^export" mod.ts` で公開 export とドキュメントの一致を確認する

## Doc Structure

| Path | Content |
|------|---------|
| `docs/breakdown/index.ja.md` | 仕様書インデックス（ドメイン設計） |
| `docs/breakdown/domain_core/` | 核心ドメイン仕様 |
| `docs/breakdown/supporting_domain/` | 支援ドメイン仕様 |
| `docs/breakdown/interface/` | CLI・設定・パス解決 |
| `docs/breakdown/generic_domain/` | 技術基盤・ファクトリー |
| `docs/usage.md` / `docs/usage.ja.md` | 利用ガイド |

言語: `*.md` = English、`*.ja.md` = Japanese。`/update-docs` (作成・更新)、`/update-changelog` (CHANGELOG) と併用。
