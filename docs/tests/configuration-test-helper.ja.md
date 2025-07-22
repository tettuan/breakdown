# ConfigurationTestHelper - 利用方法ガイド

ConfigurationTestHelperは、設定ファイルベースのテスト環境をサポートするヘルパークラスです。ハードコード値の設定ファイル分離、テストケース生成、設定プロファイル管理機能を提供します。

## 概要

### 主な機能

1. **設定ファイル管理** - YAMLファイルからのテスト設定読み込み
2. **テストケース生成** - 設定に基づく自動テストケース生成
3. **設定整合性チェック** - 設定ファイルの構造と内容の検証
4. **プロファイル切り替え** - 複数のテストプロファイルによる柔軟なテスト実行
5. **ハードコード排除** - テストコード内のハードコード値を設定ファイルに分離

### クラス構成

- **ConfigurationTestHelper** - メインヘルパークラス（フル機能版）
- **ConfigurationTestHelperSimple** - 軽量版ヘルパークラス（基本機能のみ）

## 基本的な使用方法

### 1. 設定ファイルの準備

テスト設定ファイルを `tests/fixtures/configs/` 配下に配置します。

#### ディレクトリ構成

```
tests/fixtures/configs/
├── test-patterns/
│   ├── basic-user.yml          # 基本パターン設定
│   ├── strict-user.yml         # 厳格パターン設定
│   └── liberal-user.yml        # 寛容パターン設定
├── integration/
│   ├── production-like.yml     # 本番環境類似設定
│   └── default-integration.yml # 統合テスト設定
└── unit/
    └── test-helper-user.yml    # 単体テスト設定
```

#### 設定ファイルの基本構造

```yaml
# 基本パターン例（basic-user.yml）
params:
  two:
    directiveType:
      pattern: "^[a-z0-9_-]{1,20}$"
      errorMessage: "Invalid directive type for basic test"
    layerType:
      pattern: "^[a-z0-9_-]{1,20}$"
      errorMessage: "Invalid layer type for basic test"

testData:
  validDirectives: ["to", "summary", "defect"]
  validLayers: ["project", "issue", "task"]
  invalidDirectives: ["", "INVALID", "test@email"]
  invalidLayers: ["", "INVALID@LAYER", "test space"]

custom_variables:
  author: "Test Suite"
  version: "1.0.0"
```

### 2. テストコードでの使用

#### 基本的な使用例

```typescript
import { ConfigurationTestHelper } from "$lib/test_helpers/configuration_test_helper.ts";
import { assertEquals, assertExists } from "jsr:@std/assert@0.224.0";

describe("設定ファイルベーステスト", () => {
  it("should load test configuration", async () => {
    // 設定読み込み
    const { userConfig } = await ConfigurationTestHelper.loadTestConfiguration("test-patterns/basic");
    
    // 設定から値を取得
    const validDirectives = userConfig.testData.validDirectives;
    const validLayers = userConfig.testData.validLayers;
    
    assertEquals(validDirectives.includes("to"), true);
    assertEquals(validLayers.includes("project"), true);
  });
});
```

#### 設定に基づく動的テスト生成

```typescript
describe("パラメータ検証テスト", () => {
  it("should validate parameters using configuration", async () => {
    const configName = "test-patterns/basic";
    const { userConfig } = await ConfigurationTestHelper.loadTestConfiguration(configName);
    
    // 設定から有効な組み合わせを自動生成
    const testMatrix = ConfigurationTestHelper.generateTestMatrix(userConfig.testData);
    
    for (const testCase of testMatrix) {
      const result = await someValidator.validate(testCase.args);
      assertEquals(result.type, testCase.expectedType);
    }
  });
});
```

## 実装パターン

### 1. ハードコード値の設定ファイル分離

#### 移行前（ハードコードあり）

```typescript
// ❌ ハードコード値を使用
const validDirectives = ["to", "summary", "defect"];
const validLayers = ["project", "issue", "task"];

for (const directive of validDirectives) {
  // テスト処理
}
```

#### 移行後（設定ファイル使用）

```typescript
// ✅ 設定ファイルから動的に読み込み
const { userConfig } = await ConfigurationTestHelper.loadTestConfiguration("test-patterns/basic");
const validDirectives = userConfig.testData.validDirectives;
const validLayers = userConfig.testData.validLayers;

for (const directive of validDirectives) {
  // テスト処理
}
```

### 2. 複数プロファイルでのテスト実行

```typescript
describe("複数プロファイルテスト", () => {
  const profiles = ["test-patterns/basic", "test-patterns/strict", "test-patterns/liberal"];
  
  profiles.forEach(profile => {
    it(`should work with ${profile} profile`, async () => {
      const { userConfig } = await ConfigurationTestHelper.loadTestConfiguration(profile);
      
      // プロファイル固有のテストロジック
      const testCases = ConfigurationTestHelper.generateCombinationTests(
        userConfig.testData.validDirectives,
        userConfig.testData.validLayers
      );
      
      // 各テストケースを実行
      for (const testCase of testCases) {
        // テスト実行
      }
    });
  });
});
```

### 3. エッジケーステスト

```typescript
describe("エッジケーステスト", () => {
  it("should handle edge cases from configuration", async () => {
    const configName = "test-patterns/edge-case";
    const { userConfig } = await ConfigurationTestHelper.loadTestConfiguration(configName);
    
    const edgeCases = [
      { directive: "to", layer: "task", shouldPass: true },
      { directive: "invalid", layer: "task", shouldPass: false },
      { directive: "to", layer: "INVALID@LAYER", shouldPass: false }
    ];
    
    const results = await ConfigurationTestHelper.runEdgeCaseTests(configName, edgeCases);
    
    for (const result of results) {
      assertEquals(result.result, true, result.message);
    }
  });
});
```

## 設定プロファイルの種類

### 1. 基本パターン（basic-user.yml）
- **用途**: 標準的なテストケース
- **特徴**: バランスの取れた検証ルール
- **パターン**: `^[a-z0-9_-]{1,20}$`

### 2. 厳格パターン（strict-user.yml）
- **用途**: 厳密な検証が必要なテスト
- **特徴**: 完全一致による厳格な検証
- **パターン**: `^(to|summary|defect)$`

### 3. 寛容パターン（liberal-user.yml）
- **用途**: 柔軟な入力を許可するテスト
- **特徴**: より幅広い入力パターンを受け入れ
- **パターン**: `[a-z]+` (小文字のみ)

### 4. フレキシブルパターン（flexible-test-user.yml）
- **用途**: ハッシュ記号や特殊文字を含む拡張パターン
- **特徴**: `#`, `_`, `-` を含む複雑なパターンをサポート
- **パターン**: `^[a-zA-Z0-9_#-]{2,20}$`

## 既存テストの移行手順

### ステップ1: ハードコード値の特定

既存テストコードから以下のハードコード値を特定：

```typescript
// 移行対象のハードコード値例
const validDirectives = ["to", "summary", "defect"];
const validLayers = ["project", "issue", "task"];
const invalidInputs = ["", "INVALID"];
```

### ステップ2: 設定ファイル作成

特定した値を設定ファイルに移行：

```yaml
# migration-example-user.yml
testData:
  validDirectives: ["to", "summary", "defect"]
  validLayers: ["project", "issue", "task"]
  invalidDirectives: ["", "INVALID"]
  invalidLayers: ["", "INVALID@LAYER"]

params:
  two:
    directiveType:
      pattern: "^(to|summary|defect)$"
    layerType:
      pattern: "^(project|issue|task)$"
```

### ステップ3: テストコード修正

```typescript
// 移行前
describe("Legacy Test", () => {
  const validDirectives = ["to", "summary", "defect"];
  
  it("should validate directives", () => {
    for (const directive of validDirectives) {
      // テスト処理
    }
  });
});

// 移行後
describe("Configuration-Based Test", () => {
  it("should validate directives", async () => {
    const { userConfig } = await ConfigurationTestHelper.loadTestConfiguration("migration-example");
    const validDirectives = userConfig.testData.validDirectives;
    
    for (const directive of validDirectives) {
      // テスト処理
    }
  });
});
```

### ステップ4: テストケース生成の活用

```typescript
// 自動テストケース生成を活用
describe("Automated Test Generation", () => {
  it("should generate test cases automatically", async () => {
    const { userConfig } = await ConfigurationTestHelper.loadTestConfiguration("migration-example");
    
    // 自動組み合わせ生成
    const combinations = ConfigurationTestHelper.generateCombinationTests(
      userConfig.testData.validDirectives,
      userConfig.testData.validLayers
    );
    
    // 自動マトリックス生成
    const matrix = ConfigurationTestHelper.generateTestMatrix(userConfig.testData);
    
    // 生成されたテストケースを実行
    for (const testCase of matrix) {
      // 動的テスト実行
    }
  });
});
```

## ベストプラクティス

### 1. 設定ファイルの命名規則

- **プレフィクス**: `test-` で始める
- **カテゴリ**: 用途別にディレクトリ分割
- **サフィックス**: `-user.yml` で終わる

```
test-patterns/basic-user.yml      # 基本パターン
test-patterns/edge-case-user.yml  # エッジケース
integration/production-like.yml   # 統合テスト
```

### 2. 設定の構造化

```yaml
# 推奨される設定構造
params:          # バリデーションパラメータ
  two:
    directiveType:
      pattern: "..."
      errorMessage: "..."
    layerType:
      pattern: "..."
      errorMessage: "..."

testData:        # テスト用データセット
  validDirectives: [...]
  validLayers: [...]
  invalidDirectives: [...]
  invalidLayers: [...]
  
custom_variables:  # カスタム変数
  author: "..."
  version: "..."
  
profile_metadata:  # プロファイル メタデータ
  name: "..."
  description: "..."
```

### 3. テストコードの構造化

```typescript
describe("Configuration-Based Tests", () => {
  let testConfig: any;
  
  // 設定を事前読み込み
  beforeAll(async () => {
    const result = await ConfigurationTestHelper.loadTestConfiguration("test-profile");
    testConfig = result.userConfig;
  });
  
  describe("Valid Cases", () => {
    it("should handle all valid combinations", () => {
      const combinations = ConfigurationTestHelper.generateCombinationTests(
        testConfig.testData.validDirectives,
        testConfig.testData.validLayers
      );
      // テスト実行
    });
  });
  
  describe("Invalid Cases", () => {
    it("should reject invalid inputs", () => {
      // 無効ケーステスト
    });
  });
});
```

### 4. エラーハンドリング

```typescript
describe("Configuration Error Handling", () => {
  it("should handle missing configuration files", async () => {
    try {
      await ConfigurationTestHelper.loadTestConfiguration("non-existent");
    } catch (error) {
      assertEquals(error.message.includes("configuration file not found"), true);
    }
  });
  
  it("should validate configuration integrity", async () => {
    const result = await ConfigurationTestHelper.validateConfigurationIntegrity("test-profile");
    
    assertEquals(result.valid, true);
    assertEquals(result.checks?.hasDirectivePattern, true);
    assertEquals(result.checks?.hasLayerPattern, true);
  });
});
```

### 5. パフォーマンス最適化

```typescript
// 設定キャッシュの活用
class TestConfigCache {
  private static cache = new Map<string, any>();
  
  static async getConfig(profileName: string) {
    if (this.cache.has(profileName)) {
      return this.cache.get(profileName);
    }
    
    const config = await ConfigurationTestHelper.loadTestConfiguration(profileName);
    this.cache.set(profileName, config);
    return config;
  }
}
```

## トラブルシューティング

### 1. 設定ファイルが見つからない

**エラー**: `Configuration file not found`

**対処法**:
- ファイルパスの確認
- ファイル名の確認（`-user.yml` サフィックス）
- ディレクトリ構造の確認

### 2. 設定構造が不正

**エラー**: `Invalid configuration structure`

**対処法**:
```typescript
// 設定の整合性チェック
const integrity = await ConfigurationTestHelper.validateConfigurationIntegrity("profile-name");
console.log(integrity.checks);
```

### 3. テストケース生成エラー

**エラー**: `No test cases generated`

**対処法**:
- `testData` セクションの存在確認
- `validDirectives` と `validLayers` の配列チェック

```yaml
testData:
  validDirectives: []  # ❌ 空配列
  validDirectives: ["to", "summary"]  # ✅ 値あり
```

### 4. パターンマッチングエラー

**エラー**: `Pattern validation failed`

**対処法**:
- 正規表現パターンの確認
- テストデータとパターンの整合性チェック

## mgr%41への状態報告

ConfigurationTestHelperクラス利用方法ドキュメントの作成が完了しました。以下の内容を含む包括的なドキュメントを作成：

**成果物**: `docs/tests/configuration-test-helper.ja.md`

**内容**:
- 基本的な使用方法とクラス構成
- 設定ファイルの構造と配置方法
- 実装パターンとハードコード値の移行手順
- 複数プロファイル対応とテストケース自動生成
- ベストプラクティスとトラブルシューティング

**特徴**:
- 既存テストの移行を段階的にサポート
- 設定ファイルベースの柔軟なテスト環境構築
- ハードコード排除による保守性向上
- 29の既存テストファイルでの使用例を参考に実用的な内容を提供

ドキュメンテーションワーカーとしての任務を完了いたします。