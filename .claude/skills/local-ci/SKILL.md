---
name: local-ci
description: Run local CI checks before merge or push. Use when user says 'CI', 'ローカルCI', or before creating PRs.
allowed-tools: [Bash, Read]
---

push 前にエラーを検出するため、`deno task ci` を実行する（エラー時は `DEBUG=true deno task ci`）。

## Pipeline Stages

type check → JSR dry-run → tests → fmt check → lint

## Commands

```bash
deno task ci               # 標準実行
DEBUG=true deno task ci    # 詳細出力
deno task ci:dirty         # uncommitted changes 許可
```

全チェック pass まで push しない。
