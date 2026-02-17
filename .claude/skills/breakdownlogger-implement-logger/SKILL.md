---
name: breakdownlogger-implement-logger
description: Use when implementing features, adding code, or placing BreakdownLogger in source. Guides KEY naming, placement strategy, and validation. Trigger words - 'implement', '実装', 'add logger', 'ロガー追加', 'KEY naming', 'validate usage'.
allowed-tools: Read, Grep, Glob, Bash
---

# Implement Logger

**重要**: BreakdownLogger はテストファイルでのみ使用する（CLAUDE.md 規約）。実装コード（`lib/`）への配置は禁止。

## 1. KEY Discovery

重複 KEY はフィルタリングを壊すので、新規作成前に既存 KEY を検索する。

```bash
grep -rn 'new BreakdownLogger(' --include='*.ts' lib/ tests/ | grep -oP '"[^"]*"' | sort -u
```

既存 KEY がカバー → 再利用 / 広すぎ → sub-key 作成 / なし → 命名ルールで新規 / 一時調査 → `fix-<issue>` prefix（調査後削除）

## 2. KEY Naming

`LOG_KEY=...` で毎回タイプするフィルタハンドルなので、プロジェクトで1方式を選び一貫させる。

| 方式 | 用途 | 例 |
|------|------|-----|
| By domain | ドメイン境界ごと | `config-driven-test`, `path-resolution-test` |
| By test level | テスト粒度ごと | `e2e-two-params`, `validation-test` |
| By feature | 特定機能の検証 | `working-dir-dot-test`, `hardcode-check` |

制約: lowercase kebab-case + `-test` suffix、汎用名(`util`,`helper`)禁止、名前空間は prefix。

## 3. Placement (テストファイルのみ)

テストファイルの先頭でインスタンス生成し、テスト全体で利用する。

```typescript
import { BreakdownLogger } from "@tettuan/breakdownlogger";
const logger = new BreakdownLogger("my-feature-test");
```

## 4. Writing Style

`LOG_LENGTH` は末尾切り詰めなので、重要情報を先頭40字に置く。message=何が起きたか、data=証拠。

```typescript
logger.debug("Path resolved: template found", { path, resolved });
```

## 5. Validation

非テストファイルの BreakdownLogger import を検出する:

```bash
grep -rn 'BreakdownLogger' --include='*.ts' lib/ | grep -v '_test.ts' | grep -v 'test_helpers/'
```

上記で出力があれば CLAUDE.md 規約違反。テストファイル以外から削除すること。
