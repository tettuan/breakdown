---
name: ci-troubleshooting
description: Use when encountering CI errors, JSR connection issues, 'deno task ci' failures, or sandbox-related build problems. Provides solutions for common CI issues.
allowed-tools: [Bash, Read, Edit, Grep, Glob]
---

# CI Troubleshooting

CI エラーには既知の解決パターンがあるので、エラーメッセージから対応を引く。

## JSR Connection Failed

`JSR package manifest ... failed to load` → sandbox を無効にして実行: `Bash({ command: "deno task ci", dangerouslyDisableSandbox: true })`

## Lint Rules

| Rule | Fix |
|------|-----|
| `no-import-prefix` | インライン `jsr:`/`npm:`/`https:` → `deno.json` の import map エイリアスに変更 |
| `no-console` | `// deno-lint-ignore no-console` を追加 |
| `prefer-ascii` | コメントを英語に変更 |
| `no-await-in-loop` | ignore 追加 or `Promise.all` にリファクタ |
| `eqeqeq` | `!=` → `!==` |
| `explicit-function-return-type` | 戻り値型を追加 |
| `ban-unused-ignore` | 不要な ignore を削除 |
| `verbatim-module-syntax` | `import type` を使用（deno.json で有効化済み） |

新依存追加時は `deno.json` の `imports` にエントリ追加 → コードで使用の順。lint ignore: ファイル単位 `// deno-lint-ignore-file rule1 rule2` / 行単位 `// deno-lint-ignore rule`

## Test / Format

フレーキーテスト（タイミング）→ 逐次実行 + delay。型エラー → 型アサーション・mock・fixture を確認。

```bash
deno check mod.ts                    # type check
deno lint                            # lint
deno fmt --check                     # format check (fix: deno fmt)
deno test --allow-env --allow-write --allow-read tests/<file>_test.ts  # 単一テスト
LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read 2>&1 | head -100  # verbose
deno task ci                         # 全CI実行
DEBUG=true deno task ci              # CI詳細出力
```

CI 実行は `/local-ci`、リリースフローは `/release-procedure` を参照。
