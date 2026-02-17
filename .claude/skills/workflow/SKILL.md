---
name: workflow
description: How to approach work. Applies to all tasks including implementation, planning, investigation, design, review, and auditing.
---

# Workflow

Main Agent はコンテキストを判断に集中させるため、調査・実装を全て Sub Agent に委譲する Conductor パターンで動く。

## Conductor Rule

Plan → Done Criteria → Team → ToDo → Delegate → Record → Next の順で進める。

| Do | Do NOT |
|----|--------|
| 計画・委譲・判断・統合 | ファイル探索・コード記述・テスト実行 |
| 各 ToDo 完了後に記録 | 複数 ToDo の同時作業 |
| 独立タスクは並列 Sub Agent | Sub Agent が持つべきコンテキストを保持 |

トリビアル修正（typo、3行以下）→ 自分で実行。それ以外 → 委譲。迷ったら委譲。

## Sub Agent Types

Explore (検索・探索) / Plan (設計比較) / general-purpose (実装・テスト・検証)

## Rules

1. 手作業は Sub Agent に委譲する
2. 思考を `tmp/<task>/` に外化する (plan.md, progress.md, analysis.md)
3. 1つ完了 → 記録 → 次へ（Sub Agent 並列は可）
4. Plan を TaskCreate で ToDo に分解する
5. plan.md に Team 表を書く（先頭行は常に Conductor）
6. 技術判断は自分で決める。方針判断は選択肢+推奨を提示する
7. 構造的コード変更には `/refactoring` skill を先に使う
8. テスト実行は `deno task ci` を基本とする（CLAUDE.md 規約）

## tmp/ Structure

```
tmp/<task>/
├── plan.md        # Goal, Done Criteria, Team, Approach, Scope
├── progress.md    # 逐次記録
├── analysis.md    # Mermaid diagrams
└── investigation/ # Sub Agent results
```
