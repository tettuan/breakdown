# TotalityTypes設計：LayerTypeとDirectiveTypeのSmart Constructor化

## 背景

従来のLayerTypeとDirectiveTypeは、以下の問題を抱えていました：

1. **重複した責任**: 型とバリデーションが混在し、コードが複雑化
2. **分散したバリデーション**: パターンチェックが複数箇所に散在
3. **依存関係の複雑化**: TwoParamsResult以外の入力を受け入れ、設計が曖昧

```typescript
// ❌ 従来の問題のある設計
class LayerType {
  static create(value: string, pattern?: LayerTypePattern): LayerType | null
  static createFromTwoParams(result: TwoParamsResult): LayerType | null
  // 複数の作成方法とバリデーション責任の混在
}
```

## 設計思想

### 全域性原則の適用
**Single Source of Truth**: バリデーションはBreakdownParamsで一元化し、LayerType/DirectiveTypeは検証済みの値のみを扱う純粋な値型とする。

### Smart Constructor Pattern
```typescript
// ✅ 改善後の設計
class LayerType {
  private constructor(private readonly result: TwoParamsResult) {}
  
  static create(result: TwoParamsResult): LayerType {
    return new LayerType(result);
  }
  
  get value(): string {
    return this.result.layerType;
  }
}
```

## 採用した方法

### 1. 責任の分離
- **BreakdownParams**: 入力値の検証とTwoParamsResultの生成
- **LayerType/DirectiveType**: 検証済み値の型安全なアクセス

### 2. Smart Constructor単一化
- `TwoParamsResult`のみを受け入れる`create`メソッド
- パターンバリデーション機能の完全除去
- 検証済み前提での安全な値アクセス

### 3. 型安全性の強化
```typescript
// 検証はBreakdownParamsで実施
const params = BreakdownParams.create(layer, directive);
if (!params) {
  throw new Error("Invalid parameters");
}

// LayerType/DirectiveTypeは検証済み値のみを扱う
const layerType = LayerType.create(params);
const directiveType = DirectiveType.create(params);
```

## 利点

1. **単一責任**: 各クラスの役割が明確
2. **型安全性**: コンパイル時にバリデーション済みを保証
3. **保守性**: バリデーションロジックの一元化
4. **可読性**: Smart Constructorパターンによる意図の明確化

## 使用例

```typescript
// 入力値の検証
const result = BreakdownParams.create("project", "summary");
if (!result) {
  return { ok: false, error: "Invalid parameters" };
}

// 型安全な値の取得
const layerType = LayerType.create(result);
const directiveType = DirectiveType.create(result);

console.log(layerType.value);      // "project"
console.log(directiveType.value);  // "summary"
```

## 移行の影響

既存のファクトリクラス（TypeFactory等）は、新しい`create`シグネチャに合わせて更新が必要です。これにより、バリデーション責任がより明確になり、コードベース全体の設計一貫性が向上します。
