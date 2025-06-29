# Totality原則実装例：Smart Constructor化

## 背景：アンチパターンの問題

従来のLayerTypeとDirectiveTypeは、以下の問題を抱えていました：

1. **重複した責任**: 型とバリデーションが混在し、コードが複雑化
2. **分散したバリデーション**: パターンチェックが複数箇所に散在
3. **依存関係の複雑化**: TwoParamsResult以外の入力を受け入れ、設計が曖昧

```typescript
// ❌ 従来の問題のある設計
class LayerType {
  static create(value: string, pattern?: LayerTypePattern): LayerType | null
  static createFromTwoParams(result: TwoParamsResult): LayerType | null
}
```

## Totality原則適用

**Single Source of Truth**: バリデーションはBreakdownParamsで一元化、型は検証済み値のみ扱う

```typescript
// ✅ 改善後：Smart Constructor
class LayerType {
  private constructor(private readonly result: TwoParamsResult) {}
  static create(result: TwoParamsResult): LayerType {
    return new LayerType(result);
  }
  get value(): string { return this.result.layerType; }
}
```

## 設定管理実例：ParamsCustomConfig

Totality原則を設定管理に適用した実装例（`lib/types/params_custom_config.ts`）：

```typescript
export class ParamsCustomConfig {
  private constructor() {} // Smart Constructor

  // 設定不在判定：undefinedでデフォルト使用を促す
  private static isConfigMissing(config: Record<string, unknown>): boolean {
    const breakdown = config.breakdown;
    if (!breakdown || typeof breakdown !== 'object') return true;
    
    const obj = breakdown as Record<string, unknown>;
    return !(obj.params || obj.options || obj.validation || obj.errorHandling);
  }

  // Result型で型安全なエラーハンドリング
  static create(config: Record<string, unknown>): Result<CustomConfig | undefined, ConfigError> {
    if (ParamsCustomConfig.isConfigMissing(config)) {
      return { status: ResultStatus.SUCCESS, data: undefined };
    }

    try {
      // DEFAULT_CUSTOM_CONFIG + 部分上書き
      const customConfig: CustomConfig = {
        ...DEFAULT_CUSTOM_CONFIG,
        ...ParamsCustomConfig.extractOverrides(config)
      };
      return { status: ResultStatus.SUCCESS, data: customConfig };
    } catch (error) {
      return { status: ResultStatus.ERROR, error: new ConfigError(...) };
    }
  }
}
```

### 核心パターン
1. **Smart Constructor + Result型**: 失敗を値として明示的に扱う
2. **undefined戦略**: ⚠️ Totalityアンチパターンだが、BreakdownParams仕様に合わせて協調
3. **部分上書き**: `...DEFAULT_CONFIG + ...userOverrides` で安全合成

### 使用例
```typescript
const result = ParamsCustomConfig.create(userConfig);
if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
  new ParamsParser(undefined, result.data); // カスタム設定使用
} else if (result.status === ResultStatus.SUCCESS && result.data === undefined) {
  new ParamsParser(undefined, undefined);   // デフォルト設定使用
} else {
  console.error("Config error:", result.error);
}
```
