# プロジェクト: BreakdownParams統合実装 - ハードコード除去と設定ファイルベース実装

## チームの構成

あなたは指揮官であり上司である。最初にチームを立ち上げて進める。

`instructions/team-head.ja.md` に詳細の記載がある。
チーム立ち上げの指示なので、必ず最初に読むこと。

## 緊急対応の必要性

### 残存問題
- **Directive/Layer配列**: 10箇所のハードコード残存
- **ConfigProfile依存**: 1箇所残存
- **テストヘルパー**: 設定ファイル未使用

### 設計原則（参照ドキュメント）
- `domain_boundaries_flow.ja.md`: ドメイン境界とデータフロー
- `two_params_types.ja.md`: DirectiveType/LayerType設計
- `totality.ja.md`: 全域性原則

## タスクとゴール

```yml
- 背景: ハードコード削除作業で120箇所以上を解決済み、残存30-40箇所の対応が必要
- 主要タスク: |
  1. 設定ファイル(*-user.yml)からCustomConfig生成フロー実装 |
  2. BreakdownParams統合によるTwoParamsResult取得 |
  3. TwoParamsResult→DirectiveType/LayerType純粋実装 |
  4. ConfigProfile依存完全除去 |
  5. 設定ファイルベーステスト実装 |
  6. 残存ハードコード完全除去 |
- ゴール: 設定ファイル駆動のBreakdownParams統合システム実現
```

## 実装要件

### 1. 設定ファイルベース統合フロー

#### 完全統合実装
```typescript
// ✅ 設定ファイル → CustomConfig → BreakdownParams → TwoParamsResult
async function createCustomConfigFromProfile(profileName: string): Promise<ParamsCustomConfig> {
  const breakdownConfig = await loadUserConfig(profileName);
  return ParamsCustomConfig.create({
    params: {
      two: {
        directiveType: {
          pattern: breakdownConfig.params.two.directiveType.pattern,
          errorMessage: breakdownConfig.params.two.directiveType.errorMessage
        },
        layerType: {
          pattern: breakdownConfig.params.two.layerType.pattern,
          errorMessage: breakdownConfig.params.two.layerType.errorMessage
        }
      }
    }
  });
}

async function executeBreakdownParams(args: string[], profileName: string = "default"): Promise<TwoParamsResult> {
  const customConfig = await createCustomConfigFromProfile(profileName);
  const result = await breakdownParams(args, customConfig);
  if (result.type !== "two") throw new Error(`Expected two params result, got: ${result.type}`);
  return result.data;
}
```

### 2. DirectiveType/LayerType純粋実装（ConfigProfile依存除去）

```typescript
// ✅ BreakdownParams検証済み値の純粋実装
class DirectiveType {
  readonly source = "BREAKDOWN_PARAMS_VALIDATED" as const;
  constructor(readonly value: string) { Object.freeze(this); }
  equals(other: DirectiveType): boolean { return this.value === other.value; }
}

class LayerType {
  readonly source = "BREAKDOWN_PARAMS_VALIDATED" as const;
  constructor(readonly value: string) { Object.freeze(this); }
  equals(other: LayerType): boolean { return this.value === other.value; }
}

// TwoParamsResult → DirectiveType/LayerType変換
function fromTwoParamsResult(twoParamsResult: TwoParamsResult): TwoParams {
  return {
    directive: new DirectiveType(twoParamsResult.directiveType),
    layer: new LayerType(twoParamsResult.layerType)
  };
}
```

### 3. 設定ファイルベーステスト実装

```typescript
// ✅ 設定ファイルベーステストヘルパー
export class BreakdownParamsTestHelper {
  static async createTwoParamsFromConfig(args: string[], profileName: string = "test"): Promise<TwoParams> {
    const twoParamsResult = await executeBreakdownParams(args, profileName);
    return fromTwoParamsResult(twoParamsResult);
  }
}

// ❌ 削除対象：ハードコードテストヘルパー
// - createDirectiveType(value: string): DirectiveType
// - getValidDirectives(): string[]
// - ConfigProfile.createDefault() 使用
```

### 4. 設定ファイル構造（*-user.yml）

```yaml
# config/test-user.yml（テスト専用設定）
params:
  two:
    directiveType:
      pattern: "to|summary|defect|find|test_directive"
      errorMessage: "Test: Invalid directive type"
    layerType:
      pattern: "project|issue|task|test_layer"
      errorMessage: "Test: Invalid layer type"
```

## 作業手順

### Phase 1: 基盤実装
1. `config/test-user.yml` 作成
2. `breakdown_params_integration.ts` 実装
3. `breakdown_params_test_helper.ts` 実装

### Phase 2: ConfigProfile依存除去
1. `directive_type.ts` / `layer_type.ts` からConfigProfile関連削除
2. `two_params_optimized.ts` 修正

### Phase 3: ハードコード除去
1. `test_data_manager.ts` - 4箇所修正
2. `configuration_test_helper.ts` - 2箇所修正
3. `*_test.ts` ファイル修正

### Phase 4: 統合テスト
1. `breakdown_params_integration.test.ts` 作成
2. 全設定での動作確認

## 対象ファイル

### 新規作成
```
lib/application/breakdown_params_integration.ts
lib/test_helpers/breakdown_params_test_helper.ts
tests/integration/breakdown_params_integration.test.ts
config/test-user.yml
```

### 修正対象（優先度1）
```
lib/domain/core/value_objects/directive_type.ts     # ConfigProfile依存除去
lib/domain/core/value_objects/layer_type.ts         # ConfigProfile依存除去
lib/test_helpers/test_data_manager.ts               # ハードコード除去（4箇所）
lib/test_helpers/configuration_test_helper.ts       # ハードコード除去（2箇所）
```

## 完了条件

### 必須条件
- [ ] 設定ファイル → BreakdownParams → DirectiveType/LayerType の完全フロー実装
- [ ] ConfigProfile依存完全除去
- [ ] 残存ハードコード配列（10箇所）完全除去
- [ ] 設定ファイルベーステストヘルパー実装
- [ ] `deno task test` 全pass

### 検証条件
- [ ] `grep -r "ConfigProfile.*DirectiveType\|DirectiveType.*ConfigProfile" lib/` の結果が空
- [ ] `grep -r "\[\"to\", \"summary\"\|\[\"project\", \"issue\"" lib/` の結果が空
- [ ] 設定ファイル変更でパターンが動的変更される

## 禁止事項

### 絶対禁止
- ConfigProfile依存の残存
- ハードコード配列の残存 
- テスト内ハードコード使用
- 設定ファイル回避実装

## 参照ドキュメント

- `domain_boundaries_flow.ja.md`: ドメイン境界とデータフロー設計
- `two_params_types.ja.md`: DirectiveType/LayerType型定義
- `totality.ja.md`: 全域性原則とSmart Constructor

## 作業開始指示

**開始指示**: 直ちにチームを統合実装モードで立ち上げ、BreakdownParams完全統合作業を開始せよ。ハードコード除去と設定ファイルベース設計の完全実装を達成せよ。
