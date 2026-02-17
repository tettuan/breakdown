---
name: absolute-path-checker
description: Verify no absolute paths exist in implementation code when discussing tests, refactoring, portability, or directory hierarchy
allowed-tools: [Grep, Read, Edit, Bash]
---

# Absolute Path Checker

ポータビリティを維持するため、`lib/` 内の絶対パスを検出し相対パスに変換する。

## Procedure

```bash
grep -r "/Users/\|/home/" --include="*.ts" --include="*.js" lib/ cli/
```

| 種別 | 対応 |
|------|------|
| 実装内リテラル | 相対パスに変換（`Deno.cwd()`, `import.meta.url`, `./` を使用） |
| テスト出力/ログ | 許可（ただしアサーション内は不可） |
| config デフォルト | 環境変数 or 相対パスに変換 |

パス構築は `join()`/`resolve()` を使い文字列結合しない。`$HOME`, `~` も絶対パス扱い（`Deno.env.get("HOME")` は許可）。変更後は `deno task ci` で検証する。
