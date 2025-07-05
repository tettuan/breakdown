# Breakdown テスト戦略

## 概要

Breakdownは、プロジェクト管理のための階層的なタスク分解をサポートするプロンプト生成ツールです。テスト戦略は**ドメイン駆動設計（DDD）**に基づいて構築されています。

## テスト構造

```
tests/
├── core_domain/              # 核心ドメインテスト
├── supporting_domain/        # 支援ドメインテスト  
├── generic_domain/           # 技術基盤ドメインテスト
├── interface_layer/          # インターフェース層テスト
├── cross_domain/             # ドメイン間統合テスト
├── helpers/                  # 共通テストユーティリティ
└── fixtures/                 # テストデータ
```

### 技術テストカテゴリ

各ドメイン内で以下の技術テストが利用可能：

- **`_architecture/`** - アーキテクチャ制約
- **`_behavior/`** - 動作検証  
- **`_structure/`** - 構造整合性
- **`_core/`** - コア機能テスト

## テスト実行方法

```bash
# 全ドメインテスト実行
deno test tests/

# ドメイン別実行
deno test tests/core_domain/          # 核心ドメイン
deno test tests/supporting_domain/   # 支援ドメイン
deno test tests/generic_domain/      # 技術基盤
deno test tests/interface_layer/     # インターフェース層
deno test tests/cross_domain/        # 統合テスト
```

## 移行完了状況

✅ **移行完了**: 188テストファイルの完全移行  
✅ **技術品質層**: `_architecture/`, `_behavior/`, `_structure/`, `_core/` 統合完了  
✅ **ドメイン価値検証**: 新構造で実装済み  
✅ **クロスドメイン統合**: E2E〜協働テスト配置完了

## 依存ライブラリ

アプリケーションは以下のJSRパッケージに依存しています：

- **@tettuan/breakdownconfig**: 設定管理ドメイン
- **@tettuan/breakdownparams**: パラメータ解析ドメイン
- **@tettuan/breakdownprompt**: プロンプト生成ドメイン
- **@tettuan/breakdownlogger**: 技術基盤ドメイン

## 詳細な設計思想

詳細なテスト戦略、設計思想、各ドメインのサンプルコードについては：

**[DDD_STRATEGY.md](./DDD_STRATEGY.md)** - 完全なドメイン駆動テスト戦略

---

**移行完了**: ドメイン駆動テスト戦略への完全移行完了（188ファイル）

## 共通テストユーティリティ

### Test Helpers (helpers/)

共通テストヘルパー：

- **`setup.ts`** - テスト環境のセットアップ
- **`assertions.ts`** - カスタムアサーション
- **`test_utils.ts`** - テストユーティリティ

### Test Fixtures (fixtures/)

テストデータ：

- **`config/`** - 設定ファイルサンプル
- **`prompts/`** - プロンプトテンプレート
- **`projects/`** - プロジェクトデータサンプル

## CI/CD での実行

### GitHub Actions での実行

```yaml
name: Domain-Driven Tests

on: [push, pull_request]

jobs:
  domain-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
      
      - name: Core Domain Tests
        run: deno test tests/core_domain/
      
      - name: Supporting Domain Tests
        run: deno test tests/supporting_domain/
      
      - name: Generic Domain Tests
        run: deno test tests/generic_domain/
      
      - name: Interface Layer Tests
        run: deno test tests/interface_layer/
      
      - name: Cross Domain Tests
        run: deno test tests/cross_domain/
```

### ローカルでの実行

```bash
# 全テスト実行
deno test tests/

# ドメイン別実行
deno test tests/core_domain/
deno test tests/supporting_domain/
deno test tests/generic_domain/
deno test tests/interface_layer/
deno test tests/cross_domain/
```


