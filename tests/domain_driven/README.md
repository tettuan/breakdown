# ドメイン駆動テスト戦略

## 概要

Breakdown CLIのテスト戦略は、**ドメイン駆動設計**の思想に基づき、各ドメインの責務と価値を正確に検証することを目的としています。この戦略により、核心ドメインの価値創出とシステム全体の品質を保証します。

## テスト戦略の設計原則

### 1. ドメイン中心のテスト分類

テストは以下のドメイン構造に基づいて分類されます：

```
domain_driven/
├── core_domain/              # 核心ドメインテスト
│   ├── prompt_path_resolution/    # プロンプトパス決定ドメイン
│   ├── prompt_variable_generation/ # プロンプト変数生成ドメイン
│   ├── parameter_parsing/         # パラメータ解析ドメイン
│   └── configuration_management/  # 設定管理ドメイン
├── supporting_domain/        # 支援ドメインテスト
│   ├── template_management/       # テンプレート管理ドメイン
│   ├── workspace_management/      # ワークスペース管理ドメイン
│   └── initialization/           # 初期化ドメイン
├── generic_domain/           # 技術基盤ドメインテスト
│   ├── factory/                  # ファクトリードメイン
│   └── system/                   # システムドメイン
├── interface_layer/          # インターフェース層テスト
│   ├── cli/                      # CLIインターフェース
│   ├── configuration/            # 設定インターフェース
│   └── path_resolution/          # パス解決インターフェース
└── cross_domain/             # ドメイン間統合テスト
    ├── e2e/                      # エンドツーエンドシナリオ
    └── collaboration/            # ドメイン間協働
```

### 2. 価値創出の検証

各テストは、対応するドメインの**存在価値**を検証します：

- **核心ドメイン**: プロンプト生成の核心価値
- **支援ドメイン**: 環境構築による核心ドメイン支援
- **技術基盤ドメイン**: システム基盤の安定性
- **インターフェース層**: ユーザー体験の品質

### 3. 境界コンテキストの尊重

テストは、ドメイン間の境界を明確に保ち、各ドメインの独立性を検証します。

### 4. 既存テストの移行戦略

既存のテスト資産を活用し、DDDベースの新構成に移行します：

- **0_foundation/** → **generic_domain/** および **interface_layer/**
- **1_core/** → **core_domain/** および **supporting_domain/**
- **2_integration/** → **cross_domain/collaboration/**
- **4_e2e/** → **cross_domain/e2e/**

## テストピラミッド（ドメイン駆動版）

```
           [クロスドメイン統合テスト]
          /                        \
    [核心ドメイン統合]      [インターフェース統合]
   /              \              /
[支援ドメイン]   [技術基盤]   [利用者体験]
   \              /              \
    [ドメインユニットテスト群]
```

### レベル1: ドメインユニットテスト
- **目的**: 各ドメインの最小単位機能の検証
- **スコープ**: 単一ドメイン内の純粋な機能
- **実行頻度**: 最も高頻度（開発時）
- **移行元**: 既存の1_core/配下の個別テスト

### レベル2: ドメイン統合テスト
- **目的**: ドメイン内のサービス連携の検証
- **スコープ**: 単一ドメイン内の複数サービス
- **実行頻度**: 高頻度（機能実装時）
- **移行元**: 既存の2_integration/配下の部分統合テスト

### レベル3: インターフェース統合テスト
- **目的**: ユーザーインターフェースの品質検証
- **スコープ**: CLI〜プロンプト出力の完全フロー
- **実行頻度**: 中頻度（リリース前）
- **移行元**: 既存の0_foundation/配下のCLIテスト

### レベル4: クロスドメイン統合テスト
- **目的**: システム全体の価値創出検証
- **スコープ**: 全ドメインの協働
- **実行頻度**: 低頻度（重要リリース前）
- **移行元**: 既存の4_e2e/配下のシステムテスト

## 核心ドメインテスト戦略

### 1. プロンプトパス決定ドメイン

**検証対象**: ユーザーの意図を正確なファイルパスに変換する確実性

```typescript
// tests/domain_driven/core_domain/prompt_path_resolution/
describe('プロンプトパス決定ドメイン', () => {
  describe('確実性の保証', () => {
    it('同じ入力からは必ず同じパスを生成する', () => {
      // 決定論的アルゴリズムの検証
    });
    
    it('パス生成の100%確実性を提供する', () => {
      // エラーケースでも確実なパス生成
    });
  });
  
  describe('準備コストの非対称性対応', () => {
    it('ファイル不存在時に明確なエラーメッセージを提供する', () => {
      // 「パスは正確、ファイル準備が必要」メッセージ
    });
  });
});
```

### 2. プロンプト変数生成ドメイン

**検証対象**: 入力データの3段階変容の正確性

```typescript
// tests/domain_driven/core_domain/prompt_variable_generation/
describe('プロンプト変数生成ドメイン', () => {
  describe('3段階変容', () => {
    it('PromptVariableSource → PromptVariables', () => {
      // 生の材料から完成品への変容
    });
    
    it('PromptVariables → PromptParams', () => {
      // 完成品から最終形態への変容
    });
  });
  
  describe('型安全性', () => {
    it('各段階で型安全な変換を実行する', () => {
      // TypeScriptの型システムとの整合性
    });
  });
});
```

### 3. パラメータ解析ドメイン

**検証対象**: CLI引数から型安全なドメインオブジェクトへの変換

```typescript
// tests/domain_driven/core_domain/parameter_parsing/
describe('パラメータ解析ドメイン', () => {
  describe('TwoParams構築', () => {
    it('DirectiveType と LayerType の型安全な構築', () => {
      // Smart Constructors の検証
    });
    
    it('パターンベースバリデーション', () => {
      // 設定ファイルのパターンによる検証
    });
  });
});
```

### 4. 設定管理ドメイン

**検証対象**: 環境固有設定の統一的管理

```typescript
// tests/domain_driven/core_domain/configuration_management/
describe('設定管理ドメイン', () => {
  describe('プロファイル切り替え', () => {
    it('プロファイル別設定の正確な読み込み', () => {
      // breakdown, search, custom プロファイルの切り替え
    });
  });
  
  describe('設定階層', () => {
    it('アプリケーション設定とユーザー設定の適切なマージ', () => {
      // 優先順位の正確な適用
    });
  });
});
```

## 支援ドメインテスト戦略

### 1. テンプレート管理ドメイン

**検証対象**: プロンプトテンプレートとスキーマファイルの配置管理

```typescript
// tests/domain_driven/supporting_domain/template_management/
describe('テンプレート管理ドメイン', () => {
  describe('ファイル配置ルール', () => {
    it('プロンプトテンプレートの正確な配置検証', () => {
      // ディレクトリ構造とファイル命名規則
    });
    
    it('スキーマファイルの配置検証', () => {
      // JSONスキーマファイルの構造検証
    });
  });
});
```

### 2. ワークスペース管理ドメイン

**検証対象**: プロジェクト環境の設定と管理

```typescript
// tests/domain_driven/supporting_domain/workspace_management/
describe('ワークスペース管理ドメイン', () => {
  describe('環境構築', () => {
    it('プロジェクト固有設定の適切な管理', () => {
      // ワークスペース固有の設定管理
    });
  });
});
```

### 3. 初期化ドメイン

**検証対象**: プロジェクトの初期セットアップ

```typescript
// tests/domain_driven/supporting_domain/initialization/
describe('初期化ドメイン', () => {
  describe('セットアップ', () => {
    it('初期ディレクトリ構造の作成', () => {
      // 必要なディレクトリとファイルの生成
    });
  });
});
```

## 技術基盤ドメインテスト戦略

### 1. ファクトリードメイン

**検証対象**: ドメインオブジェクトの構築と依存関係管理

```typescript
// tests/domain_driven/generic_domain/factory/
describe('ファクトリードメイン', () => {
  describe('PromptVariablesFactory', () => {
    it('パラメータ構築の一元化', () => {
      // 全てのパラメータ構築を一箇所で管理
    });
    
    it('依存関係の適切な注入', () => {
      // モジュール間の結合度の確認
    });
  });
});
```

### 2. システムドメイン

**検証対象**: システム基盤とエラーハンドリング

```typescript
// tests/domain_driven/generic_domain/system/
describe('システムドメイン', () => {
  describe('エラーハンドリング', () => {
    it('標準化されたエラー処理', () => {
      // 一貫したエラー処理の検証
    });
  });
});
```

## インターフェース層テスト戦略

### 1. CLIインターフェース

**検証対象**: コマンドライン引数の仕様準拠

```typescript
// tests/domain_driven/interface_layer/cli/
describe('CLIインターフェース', () => {
  describe('基本コマンド', () => {
    it('breakdown to task の正確な実行', () => {
      // 基本的なコマンド実行の検証
    });
  });
  
  describe('オプション処理', () => {
    it('全オプションの正確な解析', () => {
      // -f, -o, --adaptation 等の処理
    });
  });
});
```

### 2. 設定インターフェース

**検証対象**: 設定ファイルの読み込みと管理

```typescript
// tests/domain_driven/interface_layer/configuration/
describe('設定インターフェース', () => {
  describe('設定ファイル読み込み', () => {
    it('app.yml と user.yml の正確なマージ', () => {
      // 設定ファイルの統合処理
    });
  });
});
```

## クロスドメイン統合テスト戦略

### 1. エンドツーエンドシナリオ

**検証対象**: システム全体の価値創出

```typescript
// tests/domain_driven/cross_domain/e2e/
describe('エンドツーエンドシナリオ', () => {
  describe('基本的なプロンプト生成フロー', () => {
    it('CLI実行からプロンプト出力までの完全フロー', async () => {
      // 1. CLI引数解析
      // 2. 設定読み込み
      // 3. パス解決
      // 4. 変数生成
      // 5. プロンプト生成
      // 6. 出力
    });
  });
  
  describe('複雑なシナリオ', () => {
    it('カスタム変数と適応タイプを使用した処理', async () => {
      // 高度な機能の組み合わせテスト
    });
  });
});
```

### 2. ドメイン間協働

**検証対象**: ドメイン間の境界と協働関係

```typescript
// tests/domain_driven/cross_domain/collaboration/
describe('ドメイン間協働', () => {
  describe('核心ドメイン間の連携', () => {
    it('パス決定→変数生成→プロンプト生成の連携', () => {
      // 核心ドメイン間のデータフロー検証
    });
  });
  
  describe('支援ドメインによる核心ドメイン支援', () => {
    it('テンプレート管理による正確なファイル提供', () => {
      // 支援ドメインの価値検証
    });
  });
});
```

## テスト実行戦略

### 1. 段階的実行

```bash
# レベル1: ドメインユニットテスト
deno test tests/domain_driven/core_domain/ --parallel

# レベル2: ドメイン統合テスト
deno test tests/domain_driven/supporting_domain/ tests/domain_driven/generic_domain/

# レベル3: インターフェース統合テスト
deno test tests/domain_driven/interface_layer/

# レベル4: クロスドメイン統合テスト
deno test tests/domain_driven/cross_domain/
```

### 2. CI/CD統合

```yaml
# .github/workflows/domain-driven-tests.yml
name: Domain-Driven Tests

on: [push, pull_request]

jobs:
  core-domain:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
      - run: deno test tests/domain_driven/core_domain/ --coverage

  integration:
    needs: core-domain
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: denoland/setup-deno@v1
      - run: deno test tests/domain_driven/cross_domain/
```

## 品質メトリクス

### 1. ドメイン別カバレッジ

- **核心ドメイン**: 95%以上（価値創出の中核）
- **支援ドメイン**: 85%以上（環境構築の信頼性）
- **技術基盤ドメイン**: 90%以上（システムの安定性）
- **インターフェース層**: 80%以上（ユーザー体験）

### 2. 境界テスト

- **ドメイン境界**: 各ドメイン間のインターフェース
- **エラー境界**: 例外ケースとエラーハンドリング
- **データ境界**: 入力・出力データの検証

### 3. パフォーマンス

- **応答時間**: 基本コマンド 1秒以内
- **メモリ使用量**: 50MB以内
- **ファイルI/O**: 効率的なファイル操作

## 関連ドキュメント

### ドメイン設計
- **[ドメイン境界と協働](../docs/breakdown/domain_core/domain_boundaries_flow.ja.md)** - テスト対象の理解
- **[核心ドメイン](../docs/breakdown/domain_core/)** - 各ドメインの詳細仕様

### テスト実装
- **[テストヘルパー](./helpers/)** - 共通テストユーティリティ
- **[フィクスチャ](./fixtures/)** - テストデータとモック

---

**設計方針**: ドメインの価値を正確に検証するテスト戦略  
**更新日**: 2025年1月
