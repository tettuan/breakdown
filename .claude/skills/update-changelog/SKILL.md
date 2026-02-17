---
name: update-changelog
description: Use when completing features, fixes, or changes that should be recorded. Updates CHANGELOG.md with concise, searchable entries following Keep a Changelog format.
allowed-tools: [Read, Edit, Grep, Glob]
---

# CHANGELOG Update

変更履歴を検索可能に保つため、Keep a Changelog 形式で CHANGELOG.md に1行エントリを追加する。

## Sections

| Section | 用途 |
|---------|------|
| `Added` | 新機能 |
| `Changed` | 既存動作の変更 |
| `Deprecated` | 将来削除 |
| `Removed` | 削除済み |
| `Fixed` | バグ修正 |
| `Security` | 脆弱性修正 |

## Entry Format

`<What>: <Impact> (\`identifier\`)` — 検索可能で、影響を述べ、識別子を含む1行。`[Unreleased]` セクションに配置し、リリース時に `[x.y.z] - YYYY-MM-DD` に移動する。

例: `- Custom variable support with \`{variable-name}\` syntax (hyphens allowed)`

曖昧な記述（"New feature for templates"）、実装詳細（"Refactored VariableReplacer"）、文脈不足（"Fixed the bug"）は禁止。
