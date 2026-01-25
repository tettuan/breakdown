# Breakdown テスト戦略

## 概要

Breakdownは、プロジェクト管理のための階層的なタスク分解をサポートするプロンプト生成ツールです。テスト戦略は**ドメイン駆動設計（DDD）**に基づいて構築されています。

## テスト構造

### 配置方針

テストは以下の配置方針に基づいて組織されています：

- **単体テスト**: `lib/`配下の実装ファイルと同じディレクトリに配置
- **統合・E2Eテスト**: `tests/`配下の独立したテストディレクトリに配置

### 配置方針の詳細

#### 単体テスト（lib/配下）配置の利点

1. **関心の分離**: 実装ファイルと密結合したテストは同じ場所に配置
2. **開発効率**: 実装変更時に対応するテストがすぐに見つかる
3. **保守性**: ファイル移動時にテストも自動的に移動される
4. **Denoベストプラクティス**: Denoコミュニティの標準的なパターンに準拠

#### 統合・E2Eテスト（tests/配下）配置の利点

1. **独立性**: システム全体の振る舞いを検証するテストは独立した場所に配置
2. **実行制御**: CI/CDパイプラインでの段階的実行が容易
3. **スケーラビリティ**: 複雑なテストシナリオの管理が可能
4. **チーム開発**: テスト専用ディレクトリで協働開発が効率的

#### ディレクトリ構造

```
lib/                          # 実装ファイル + 単体テスト
├── domain/
│   ├── prompt_resolver.ts
│   ├── prompt_resolver.test.ts        # 単体テスト（実装と同じ場所）
│   ├── variable_generator.ts
│   └── variable_generator.test.ts     # 単体テスト（実装と同じ場所）
├── config/
│   ├── loader.ts
│   ├── loader.test.ts                 # 単体テスト（実装と同じ場所）
│   └── ...
└── ...

tests/                        # 統合・E2Eテスト専用
├── 0_core_domain/            # 核心ドメイン統合テスト（最優先実行）
├── 1_supporting_domain/      # 支援ドメイン統合テスト
├── 2_generic_domain/         # 技術基盤ドメイン統合テスト
├── 3_interface_layer/        # インターフェース層統合テスト
├── 4_cross_domain/           # ドメイン間統合テスト（最後に実行）
│   ├── collaboration/        # ドメイン間協働・結合テスト
│   └── e2e/                 # システム全体のE2Eテスト
├── helpers/                  # 共通テストユーティリティ
└── fixtures/                 # テストデータ
```

### 技術テストカテゴリ

テストは以下の分類に基づいて組織されています：

#### 単体テスト (Unit Tests) - `lib/`配下に配置
実装ファイルと同じディレクトリに配置され、各モジュールの基本機能を個別に検証：

- **`0_architecture/`** - アーキテクチャ制約（最初に実行）
- **`1_behavior/`** - 動作検証（基本機能の確認）
- **`2_structure/`** - 構造整合性（データ構造の検証）

#### 統合テスト (Integration Tests) - `tests/`配下に配置
ドメイン内の複数コンポーネントの協働を検証：

- **`3_core/`** - コア機能テスト（ドメイン内統合検証）

#### E2E・結合テスト (End-to-End & Integration Tests) - `tests/`配下に配置
システム全体やドメイン間の協働を検証：

- **`4_cross_domain/collaboration/`** - ドメイン間協働・結合テスト
- **`4_cross_domain/e2e/`** - システム全体のE2Eテスト

> **実行順序制御**: フォルダ名とファイル名に番号プレフィックスを付けることで、Denoのテスト実行順序が制御されます。

## テスト実行方法

### 単体テスト（lib/配下）

```bash
# 全単体テスト実行
deno test lib/

# 特定のドメインの単体テスト実行
deno test lib/domain/
deno test lib/config/
deno test lib/factory/

# 特定のテストカテゴリのみ実行
deno test lib/ --filter="0_architecture"  # アーキテクチャ制約テスト
deno test lib/ --filter="1_behavior"      # 動作検証テスト
deno test lib/ --filter="2_structure"     # 構造整合性テスト
```

### 統合・E2Eテスト（tests/配下）

```bash
# 全統合テスト実行（番号順に実行される）
deno test tests/

# ドメイン別実行（推奨される実行順序）
deno test tests/0_core_domain/        # 核心ドメイン（最優先）
deno test tests/1_supporting_domain/  # 支援ドメイン
deno test tests/2_generic_domain/     # 技術基盤
deno test tests/3_interface_layer/    # インターフェース層
deno test tests/4_cross_domain/       # 統合テスト（最後）

# 特定のテストタイプのみ実行
deno test tests/*/3_core/             # コア機能テスト
deno test tests/4_cross_domain/e2e/     # E2Eテスト
deno test tests/4_cross_domain/collaboration/  # 結合テスト
```

### 全テスト実行

```bash
# 全テスト実行（推奨：単体テスト → 統合テスト の順序）
deno test lib/ && deno test tests/

# または単純に全テスト実行
deno test
```

## 移行完了状況

**移行完了**: 188テストファイルの完全移行
**技術品質層**: `_architecture/`, `_behavior/`, `_structure/`, `_core/` 統合完了
**ドメイン価値検証**: 新構造で実装済み
**クロスドメイン統合**: E2E〜協働テスト配置完了

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
  tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
      
      # 単体テスト（高速実行）
      - name: Unit Tests
        run: deno test lib/
      
      # 統合テスト（ドメイン別）
      - name: Core Domain Tests
        run: deno test tests/0_core_domain/
      
      - name: Supporting Domain Tests
        run: deno test tests/1_supporting_domain/
      
      - name: Generic Domain Tests
        run: deno test tests/2_generic_domain/
      
      - name: Interface Layer Tests
        run: deno test tests/3_interface_layer/
      
      # E2E・結合テスト（最後に実行）
      - name: Cross Domain Tests
        run: deno test tests/4_cross_domain/
```

### ローカルでの実行

```bash
# 段階的実行（推奨）
deno test lib/                    # 単体テスト
deno test tests/0_core_domain/    # 核心ドメイン統合テスト
deno test tests/1_supporting_domain/  # 支援ドメイン統合テスト
deno test tests/2_generic_domain/     # 技術基盤統合テスト
deno test tests/3_interface_layer/    # インターフェース層統合テスト
deno test tests/4_cross_domain/       # E2E・結合テスト

# 全テスト実行
deno test
```

### deno.json タスク設定

```json
{
  "tasks": {
    "test": "deno test",
    "test:unit": "deno test lib/",
    "test:integration": "deno test tests/",
    "test:e2e": "deno test tests/4_cross_domain/e2e/",
    "test:collaboration": "deno test tests/4_cross_domain/collaboration/",
    "test:ci": "deno test lib/ && deno test tests/"
  }
}
```


