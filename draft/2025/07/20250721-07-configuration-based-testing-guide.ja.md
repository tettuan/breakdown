````markdown
# 設定ファイルベーステスト実装ガイド - ハードコーディング完全排除とBreakdownParams統合

## チームの構成

あなたは指揮官であり上司である。
最初にチームを立ち上げて進める。

`instructions/team-head.ja.md` に詳細の記載がある。
チーム立ち上げの指示なので、必ず最初に読むこと。

## 背景と緊急性

### 現在の問題
テストファイルに**20箇所以上のハードコード配列**と**ConfigProfile依存**が残存し、設定ファイルベースのテストが未整備の状態：

```typescript
// NG: 禁止パターン：ハードコードテスト
const validDirectiveTypes = ["to", "summary", "defect"];
const validLayerTypes = ["project", "issue", "task"];
DirectiveType.create("to", ConfigProfile.createDefault());

// NG: 禁止パターン：設定を無視したテスト
describe("DirectiveType validation", () => {
  test("accepts hardcoded values", () => {
    assertEquals(DirectiveType.create("to").isValid(), true);  // 設定無視
  });
});
```

### 必要な設計原則
- **設定ファイル駆動テスト**: 全テストは設定ファイルから値を取得
- **BreakdownParams統合**: JSR検証済み値としてのテスト実装
- **ConfigProfile短寿命**: 設定読み込み後は即座に破棄
- **パターンマッチング検証**: 設定ファイルのパターンでテスト実行

## 設定ファイルベーステスト設計

### 1. テスト設定ファイル階層

#### 基本設定ファイル
```
tests/fixtures/configs/
├── test-patterns/
│   ├── basic-user.yml           # 基本パターンテスト用
│   ├── strict-user.yml          # 厳格パターンテスト用
│   ├── liberal-user.yml         # 寛容パターンテスト用
│   └── edge-case-user.yml       # エッジケーステスト用
├── integration/
│   ├── default-integration.yml  # 統合テスト用デフォルト
│   ├── production-like.yml      # 本番環境類似設定
│   └── development.yml          # 開発環境設定
└── unit/
    ├── minimal.yml              # 最小限設定
    └── comprehensive.yml        # 包括的設定
```

#### アプリケーション設定ファイル
```
tests/fixtures/apps/
├── test-basic-app.yml           # 基本テスト用アプリ設定
├── test-integration-app.yml     # 統合テスト用アプリ設定
└── test-pattern-app.yml         # パターンテスト用アプリ設定
```

### 2. 設定ファイル内容設計

#### 基本パターンテスト設定（basic-user.yml）
```yaml
# 基本パターンテスト用設定
params:
  two:
    directiveType:
      pattern: "to|summary|defect"
      errorMessage: "Invalid directive type for basic test"
    layerType:
      pattern: "project|issue|task"
      errorMessage: "Invalid layer type for basic test"

# テスト用データセット
testData:
  validDirectives: ["to", "summary", "defect"]
  validLayers: ["project", "issue", "task"]
  invalidDirectives: ["invalid", "wrong", ""]
  invalidLayers: ["invalid", "wrong", ""]
  
# 境界値テスト
boundaryTests:
  minLength: 2
  maxLength: 10
  edgeCases: ["", "a", "verylongstring"]
```

#### 厳格パターンテスト設定（strict-user.yml）
```yaml
# 厳格パターンテスト用設定
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect)$"  # 完全一致
      errorMessage: "Directive must exactly match: to, summary, or defect"
    layerType:
      pattern: "^(project|issue|task)$"  # 完全一致
      errorMessage: "Layer must exactly match: project, issue, or task"

# テスト用データセット（厳格版）
testData:
  validDirectives: ["to", "summary", "defect"]
  validLayers: ["project", "issue", "task"]
  invalidDirectives: ["tos", "summarys", "defects", "TO", "Summary"]
  invalidLayers: ["projects", "issues", "tasks", "PROJECT", "Issue"]
```

#### エッジケーステスト設定（edge-case-user.yml）
```yaml
# エッジケーステスト用設定
params:
  two:
    directiveType:
      pattern: "^[a-z0-9]{1,50}$"  # 1-50文字の英数字
      errorMessage: "Directive must be 1-50 alphanumeric characters"
    layerType:
      pattern: "^[a-z0-9-_]{2,30}$"  # 2-30文字、ハイフン・アンダースコア許可
      errorMessage: "Layer must be 2-30 characters with hyphens/underscores allowed"

# エッジケース用データセット
testData:
  edgeCases:
    boundaries:
      - { directive: "a", layer: "aa", shouldPass: true }
      - { directive: "", layer: "aa", shouldPass: false }
      - { directive: "verylongdirectivethatexceedslimits", layer: "aa", shouldPass: false }
    specialCharacters:
      - { directive: "test", layer: "test-layer", shouldPass: true }
      - { directive: "test", layer: "test_layer", shouldPass: true }
      - { directive: "test", layer: "test layer", shouldPass: false }
```

### 3. 設定ファイルベーステスト実装パターン

#### ユニットテスト実装
```typescript
// OK: 正しいパターン：設定ファイルベースユニットテスト
import { assertEquals } from "jsr:@std/assert@0.224.0";
import { ConfigProfile } from "$lib/config/config_profile_name.ts";
import { loadUserConfig } from "$lib/config/user_config_loader.ts";
import { ParamsCustomConfig } from "$lib/config/params_custom_config.ts";
import { breakdownParams } from "@tettuan/breakdownparams";
import { DirectiveType, LayerType } from "./types.ts";

describe("DirectiveType - Configuration-Based Tests", () => {
  
  test("validates with basic configuration patterns", async () => {
    // 設定ファイル読み込み
    const profileName = ConfigProfile.create("test-basic");
    const userConfig = await loadUserConfig(profileName);
    const customConfig = ParamsCustomConfig.create(userConfig);
    
    // テストデータを設定ファイルから取得
    const validDirectives = userConfig.testData.validDirectives;
    const invalidDirectives = userConfig.testData.invalidDirectives;
    
    // 有効な値のテスト
    for (const directive of validDirectives) {
      const args = [directive, "project"];
      const result = await breakdownParams(args, customConfig);
      
      assertEquals(result.type, "two");
      if (result.type === "two") {
        const directiveType = new DirectiveType(result.data.directiveType);
        assertEquals(directiveType.value, directive);
      }
    }
    
    // 無効な値のテスト
    for (const directive of invalidDirectives) {
      const args = [directive, "project"];
      const result = await breakdownParams(args, customConfig);
      
      assertEquals(result.type, "error");
    }
  });
  
  test("validates with strict configuration patterns", async () => {
    const profileName = ConfigProfile.create("test-strict");
    const userConfig = await loadUserConfig(profileName);
    const customConfig = ParamsCustomConfig.create(userConfig);
    
    const testCases = userConfig.testData;
    
    // 厳格パターンでの検証
    for (const directive of testCases.validDirectives) {
      const args = [directive, "project"];
      const result = await breakdownParams(args, customConfig);
      assertEquals(result.type, "two");
    }
    
    for (const directive of testCases.invalidDirectives) {
      const args = [directive, "project"];
      const result = await breakdownParams(args, customConfig);
      assertEquals(result.type, "error");
    }
  });
  
  test("handles edge cases from configuration", async () => {
    const profileName = ConfigProfile.create("test-edge-case");
    const userConfig = await loadUserConfig(profileName);
    const customConfig = ParamsCustomConfig.create(userConfig);
    
    const edgeCases = userConfig.testData.edgeCases.boundaries;
    
    for (const testCase of edgeCases) {
      const args = [testCase.directive, testCase.layer];
      const result = await breakdownParams(args, customConfig);
      
      if (testCase.shouldPass) {
        assertEquals(result.type, "two", 
          `Expected success for directive="${testCase.directive}", layer="${testCase.layer}"`);
      } else {
        assertEquals(result.type, "error", 
          `Expected error for directive="${testCase.directive}", layer="${testCase.layer}"`);
      }
    }
  });
});
```

#### 統合テスト実装
```typescript
// OK: 正しいパターン：設定ファイルベース統合テスト
import { assertEquals } from "jsr:@std/assert@0.224.0";
import { TwoParamsService } from "$lib/application/services/two_params_service.ts";

describe("TwoParamsService - Configuration Integration Tests", () => {
  
  test("processes parameters with default configuration", async () => {
    const service = new TwoParamsService();
    const profileName = ConfigProfile.create("test-integration-default");
    
    // 設定読み込み
    const userConfig = await loadUserConfig(profileName);
    const testCases = userConfig.integrationTests.defaultCases;
    
    for (const testCase of testCases) {
      const result = await service.process(testCase.args, profileName);
      
      assertEquals(result.success, testCase.expectedSuccess);
      if (result.success && testCase.expectedValues) {
        assertEquals(result.data.directive.value, testCase.expectedValues.directive);
        assertEquals(result.data.layer.value, testCase.expectedValues.layer);
      }
    }
  });
  
  test("validates with production-like configuration", async () => {
    const service = new TwoParamsService();
    const profileName = ConfigProfile.create("test-production-like");
    
    const userConfig = await loadUserConfig(profileName);
    const productionTests = userConfig.integrationTests.productionCases;
    
    for (const testCase of productionTests) {
      const result = await service.process(testCase.args, profileName);
      
      // 本番環境類似の厳格な検証
      if (testCase.shouldPass) {
        assertEquals(result.success, true);
        assertEquals(result.data.source, "BREAKDOWN_PARAMS_VALIDATED");
      } else {
        assertEquals(result.success, false);
        assertEquals(result.error.type, testCase.expectedErrorType);
      }
    }
  });
});
```

### 4. パラメータ化テスト実装

#### 設定ファイル駆動パラメータ化テスト
```typescript
// OK: 正しいパターン：設定ファイル駆動パラメータ化テスト
describe("DirectiveType/LayerType - Parameterized Configuration Tests", () => {
  
  const testConfigurations = [
    "test-basic",
    "test-strict", 
    "test-liberal",
    "test-edge-case"
  ];
  
  for (const configName of testConfigurations) {
    describe(`Configuration: ${configName}`, () => {
      
      test("validates all configured test cases", async () => {
        const profileName = ConfigProfile.create(configName);
        const userConfig = await loadUserConfig(profileName);
        const customConfig = ParamsCustomConfig.create(userConfig);
        
        // 設定ファイルからテストケースを動的生成
        const testMatrix = generateTestMatrix(userConfig.testData);
        
        for (const testCase of testMatrix) {
          const args = [testCase.directive, testCase.layer];
          const result = await breakdownParams(args, customConfig);
          
          assertEquals(result.type, testCase.expectedType, 
            `Config: ${configName}, Case: ${JSON.stringify(testCase)}`);
        }
      });
    });
  }
});

function generateTestMatrix(testData: any): Array<{
  directive: string;
  layer: string;
  expectedType: "two" | "error";
}> {
  const matrix = [];
  
  // 有効な組み合わせ
  for (const directive of testData.validDirectives) {
    for (const layer of testData.validLayers) {
      matrix.push({ directive, layer, expectedType: "two" });
    }
  }
  
  // 無効な組み合わせ
  for (const directive of testData.invalidDirectives) {
    matrix.push({ 
      directive, 
      layer: testData.validLayers[0], 
      expectedType: "error" 
    });
  }
  
  for (const layer of testData.invalidLayers) {
    matrix.push({ 
      directive: testData.validDirectives[0], 
      layer, 
      expectedType: "error" 
    });
  }
  
  return matrix;
}
```

### 5. モックレス設定統合テスト

#### 実設定ファイル使用統合テスト
```typescript
// OK: 正しいパターン：モックレス設定統合テスト
describe("Real Configuration Integration Tests", () => {
  
  test("uses actual default configuration", async () => {
    // 実際のdefault-user.ymlを使用
    const profileName = ConfigProfile.createDefault();
    const userConfig = await loadUserConfig(profileName);
    const customConfig = ParamsCustomConfig.create(userConfig);
    
    // 実設定からパターンを取得
    const directivePattern = userConfig.params.two.directiveType.pattern;
    const layerPattern = userConfig.params.two.layerType.pattern;
    
    // パターンから有効な値を抽出してテスト
    const validDirectives = extractValidValues(directivePattern);
    const validLayers = extractValidValues(layerPattern);
    
    for (const directive of validDirectives) {
      for (const layer of validLayers) {
        const args = [directive, layer];
        const result = await breakdownParams(args, customConfig);
        
        assertEquals(result.type, "two");
        if (result.type === "two") {
          // JSR検証済み値としての検証
          assertEquals(result.data.directiveType, directive);
          assertEquals(result.data.layerType, layer);
        }
      }
    }
  });
  
  test("validates against custom configuration profiles", async () => {
    const customProfiles = ["development", "production", "testing"];
    
    for (const profileName of customProfiles) {
      const configProfile = ConfigProfile.create(profileName);
      
      try {
        const userConfig = await loadUserConfig(configProfile);
        const customConfig = ParamsCustomConfig.create(userConfig);
        
        // 設定ファイルで定義されたテストケースを実行
        if (userConfig.validationTests) {
          for (const testCase of userConfig.validationTests) {
            const result = await breakdownParams(testCase.args, customConfig);
            assertEquals(result.type, testCase.expectedType);
          }
        }
      } catch (error) {
        // 設定ファイルが存在しない場合はスキップ
        console.log(`Skipping ${profileName} profile: ${error.message}`);
      }
    }
  });
});

function extractValidValues(pattern: string): string[] {
  // 簡単なパターンから有効な値を抽出
  // 実装では正規表現解析やより高度な方法を使用
  const pipeDelimited = pattern.replace(/[()^$]/g, '').split('|');
  return pipeDelimited.filter(val => val.length > 0);
}
```

### 6. テストヘルパー関数

#### 設定ファイルベーステストヘルパー
```typescript
// OK: テストヘルパー：設定ファイル駆動テストサポート
export class ConfigurationTestHelper {
  
  static async loadTestConfiguration(configName: string) {
    const profileName = ConfigProfile.create(configName);
    const userConfig = await loadUserConfig(profileName);
    const customConfig = ParamsCustomConfig.create(userConfig);
    
    return { userConfig, customConfig, profileName };
  }
  
  static async runParameterValidationTests(
    configName: string,
    testCases: Array<{ args: string[]; expectedType: "two" | "error" }>
  ) {
    const { customConfig } = await this.loadTestConfiguration(configName);
    
    const results = [];
    for (const testCase of testCases) {
      const result = await breakdownParams(testCase.args, customConfig);
      results.push({
        ...testCase,
        actualType: result.type,
        passed: result.type === testCase.expectedType
      });
    }
    
    return results;
  }
  
  static generateCombinationTests(validDirectives: string[], validLayers: string[]) {
    const combinations = [];
    for (const directive of validDirectives) {
      for (const layer of validLayers) {
        combinations.push({
          args: [directive, layer],
          expectedType: "two" as const
        });
      }
    }
    return combinations;
  }
  
  static async validateConfigurationIntegrity(configName: string) {
    try {
      const { userConfig, customConfig } = await this.loadTestConfiguration(configName);
      
      // 設定ファイルの整合性チェック
      const checks = {
        hasDirectivePattern: !!userConfig.params?.two?.directiveType?.pattern,
        hasLayerPattern: !!userConfig.params?.two?.layerType?.pattern,
        hasTestData: !!userConfig.testData,
        customConfigValid: !!customConfig
      };
      
      return {
        valid: Object.values(checks).every(Boolean),
        checks,
        userConfig
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }
}
```

## 実装手順

### Phase 1: 設定ファイル準備（10分）
1. **テスト設定ファイル作成**
   - `tests/fixtures/configs/test-patterns/` 配下に基本設定作成
   - basic, strict, liberal, edge-case の4種類の設定ファイル作成
   - 各設定ファイルに testData セクション追加

2. **アプリケーション設定ファイル作成**
   - `tests/fixtures/apps/` 配下にテスト用アプリ設定作成
   - パターンテスト用の最小限設定

### Phase 2: テストヘルパー実装（15分）
1. **ConfigurationTestHelper クラス実装**
   - 設定ファイル読み込みヘルパー
   - パラメータ化テスト生成ヘルパー
   - 設定整合性チェック機能

2. **テスト実行インフラ構築**
   - 設定ファイル駆動テスト実行環境
   - エラーハンドリングとレポート機能

### Phase 3: ユニットテスト移行（30分）
1. **既存ハードコードテストの特定**
   ```bash
   grep -r "\[\"to\".*\"summary\"" lib/**/*test*.ts
   grep -r "ConfigProfile.*create.*Default" lib/**/*test*.ts
   ```

2. **設定ファイルベーステストへの段階的移行**
   - DirectiveType/LayerType のユニットテスト
   - TwoParams aggregateのテスト
   - バリデーター関連テスト

### Phase 4: 統合テスト実装（20分）
1. **エンドツーエンド設定統合テスト**
   - 実設定ファイル使用テスト
   - カスタム設定プロファイルテスト
   - 設定切り替えテスト

2. **パフォーマンステスト**
   - 大量パターンテスト
   - 設定読み込み性能テスト

### Phase 5: 検証と最適化（15分）
1. **移行完了検証**
   ```bash
   # ハードコード配列の完全除去確認
   grep -r "\[\"to\".*\"summary\"" lib/ || echo "[OK] No hardcoded arrays found"
   grep -r "ConfigProfile.*createDefault" lib/ || echo "[OK] No ConfigProfile dependencies found"
   ```

2. **テスト実行とパフォーマンス確認**
   ```bash
   deno task test
   deno task test:integration
   ```

## 完了条件

### 必須条件
- [ ] 全ハードコード配列がテストから除去されている
- [ ] ConfigProfile依存がテストから除去されている
- [ ] 設定ファイルベーステストが全カテゴリで実装されている
- [ ] `deno task test` が全て成功する
- [ ] 設定ファイル切り替えテストが動作する
- [ ] テストヘルパー関数が正しく動作する

### 品質条件
- [ ] 設定ファイル変更でテスト結果が正しく変わる
- [ ] パラメータ化テストが設定駆動で動作する
- [ ] エラーケースが設定ファイルで定義されている
- [ ] テスト実行時間が許容範囲内である

### 検証条件
```bash
# OK: これらの検索結果が空であること
grep -r "\[\"to\".*\"summary\"" lib/**/*test*.ts
grep -r "ConfigProfile.*createDefault" lib/**/*test*.ts
grep -r "hardcoded.*directive\|hardcoded.*layer" lib/

# OK: これらが正常動作すること
deno task test
deno task test:config-patterns
deno task test:integration
```

## 禁止事項

### 絶対禁止
- **ハードコード配列の残存**: テスト内でのハードコード配列使用禁止
- **ConfigProfile依存**: テスト内でのConfigProfile.createDefault()使用禁止
- **設定無視テスト**: 設定ファイルを無視したテスト実装禁止
- **モック設定**: 実設定ファイルを使わないモックテスト禁止

### 制限事項
- テスト用設定ファイルは `tests/fixtures/` 配下に限定
- 本番設定ファイルの変更は禁止
- パフォーマンスの大幅劣化は禁止

## 重要提言

この設定ファイルベーステスト実装は、**真の設定駆動アーキテクチャ**実現のための必須要件である。ハードコード配列とConfigProfile依存の完全除去により、設定ファイル変更が正しくテストに反映される仕組みを構築せよ。

**開始指示**: 直ちに設定ファイル準備から開始し、段階的にハードコードテストを設定ファイルベーステストに移行せよ。設計原則違反の根絶と真の設定駆動テストの実現を達成せよ。
````
