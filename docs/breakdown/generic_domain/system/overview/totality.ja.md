# 全域性原則：型安全なコード設計指針

## 核心理念
**部分関数を全域関数に変換**し、型システムで「ありえない状態」を排除する。

## 基本パターン

### パターン1：Discriminated Union
```typescript
// ❌ 悪い例：オプショナルプロパティで状態を表現
interface BadState { a?: X; b?: Y; }

// ✅ 良い例：タグ付きユニオンで状態を表現
type GoodState = { kind: "A"; data: X } | { kind: "B"; data: Y };
```

### パターン2：Smart Constructor
```typescript
// ❌ 悪い例：無制限な値を許可
type Rate = number;

// ❌ 悪い例：列挙型の値で制約を表現
enum LayerType {
  PROJECT = "project",
  ISSUE = "issue",
  TASK = "task"
}

// ✅ 良い例：制約のある値型
class ValidRate {
  private constructor(readonly value: number) {}
  static create(n: number): Result<ValidRate, ValidationError & { message: string }> {
    if (0 <= n && n <= 1) {
      return { ok: true, data: new ValidRate(n) };
    }
    return { ok: false, error: createError({ kind: "OutOfRange", value: n, min: 0, max: 1 }) };
  }
}

// ✅ 良い例：Configルールで制約を表現
class LayerTypePattern {
  private constructor(readonly pattern: RegExp) {}
  static create(patternString: string): Result<LayerTypePattern, ValidationError & { message: string }> {
    try {
      return { ok: true, data: new LayerTypePattern(new RegExp(patternString)) };
    } catch {
      return { ok: false, error: createError({ kind: "InvalidRegex", pattern: patternString }) };
    }
  }
  test(value: string): boolean { return this.pattern.test(value); }
}

class LayerType {
  private constructor(readonly value: string) {}
  static create(value: string, pattern: LayerTypePattern): Result<LayerType, ValidationError & { message: string }> {
    if (pattern.test(value)) {
      return { ok: true, data: new LayerType(value) };
    }
    return { ok: false, error: createError({ kind: "PatternMismatch", value, pattern: pattern.pattern.source }) };
  }
  getValue(): string { return this.value; }
}
```

### パターン3：Result型によるエラー値化
```typescript
type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };

// 共通エラー型定義
type ValidationError = 
  | { kind: "OutOfRange"; value: unknown; min?: number; max?: number }
  | { kind: "InvalidRegex"; pattern: string }
  | { kind: "PatternMismatch"; value: string; pattern: string }
  | { kind: "ParseError"; input: string }
  | { kind: "EmptyInput" }
  | { kind: "TooLong"; value: string; maxLength: number };

// エラー作成ヘルパー
const createError = (error: ValidationError, customMessage?: string): ValidationError & { message: string } => ({
  ...error,
  message: customMessage || getDefaultMessage(error)
});

const getDefaultMessage = (error: ValidationError): string => {
  switch (error.kind) {
    case "OutOfRange": 
      return `Value ${error.value} is out of range ${error.min ?? "?"}-${error.max ?? "?"}`;
    case "InvalidRegex": 
      return `Invalid regex pattern: ${error.pattern}`;
    case "PatternMismatch": 
      return `Value "${error.value}" does not match pattern ${error.pattern}`;
    case "ParseError": 
      return `Cannot parse "${error.input}"`;
    case "EmptyInput": 
      return "Input cannot be empty";
    case "TooLong": 
      return `Value "${error.value}" exceeds maximum length of ${error.maxLength}`;
  }
};
```

## 人間による設計観点

### 🧠 ビジネスルール分析
全域性適用前に、人間が明確化すべき設計観点：

1. **状態の洗い出し**: データが取りうる「正当な状態」を全て列挙
2. **遷移の定義**: 状態間の有効な変更パターンを特定
3. **制約の明文化**: 値の範囲、組み合わせ制限、依存関係を特定
4. **例外ケース**: エラー状態、境界値、異常系の処理方針を決定

### 📋 ビジネスルール収集テンプレート

Claudeにビジネスルールを提示する際の推奨フォーマット：

```markdown
## ドメインルール定義

### 1. エンティティの状態
- **[エンティティ名]** の取りうる状態：
  - 状態A: [条件・説明]
  - 状態B: [条件・説明]
  - ❌ 不正状態: [ありえない組み合わせ]

### 2. 値の制約
- **[プロパティ名]**: [型] - [制約条件]
  - 例: `割引率: number - 0以上1以下`
  - 例: `在庫数: number - 0以上の整数`

### 3. 状態遷移ルール
- [状態A] → [状態B]: [遷移条件]
- [状態B] → [状態C]: [遷移条件]
- ❌ 禁止遷移: [状態X] → [状態Y]

### 4. ビジネス例外
- **正常系**: [期待される動作]
- **異常系**: [エラー条件] → [対応方法]
```

### 人間によるType設定一覧
- [`docs/breakdown/overview/totality-type.ja.yml`](./totality-type.ja.yml)

### 具体的な適用例
- **LayerTypeとDirectiveTypeのSmart Constructor化実例**（実装予定）
  - TYPE設計はドメイン駆動設計によって定義される
  - 詳細なドメイン設計については [#file:domain_core](../../domain_core/) を参照
  - 核心ドメインにおける型安全性の実装パターン

### 実例テンプレート
```markdown
## 割引システムのルール

### 1. 割引の状態
- **パーセント割引**: 割引率(0-100%)と上限額を持つ
- **固定額割引**: 固定金額を持つ
- ❌ 不正状態: 両方の割引が同時に存在、どちらも存在しない

### 2. 値の制約
- **割引率**: number - 0以上1以下
- **上限額**: number - 0以上
- **固定金額**: number - 0以上

### 3. 計算ルール
- パーセント割引: min(商品額 × 割引率, 上限額)
- 固定額割引: min(固定金額, 商品額)
```

## エラー処理の圧縮テクニック

### 1. 共通エラー型の活用
```typescript
// ❌ 冗長：各クラスで個別エラー型
class A { static create(): Result<A, { kind: "AError"; message: string }> }
class B { static create(): Result<B, { kind: "BError"; message: string }> }

// ✅ 簡潔：共通エラー型
class A { static create(): Result<A, ValidationError & { message: string }> }
class B { static create(): Result<B, ValidationError & { message: string }> }
```

### 2. エラー作成ヘルパーの活用
```typescript
// ❌ 冗長：毎回エラーオブジェクト作成
return { ok: false, error: { kind: "EmptyInput", message: "Input cannot be empty" } };

// ✅ 簡潔：ヘルパー使用
return { ok: false, error: createError({ kind: "EmptyInput" }) };
```

### 3. ビルダーパターンの活用
```typescript
// 複雑なバリデーションの場合
class ValidatedValue<T> {
  static builder<T>() {
    return new ValidationBuilder<T>();
  }
}

class ValidationBuilder<T> {
  private validators: Array<(input: T) => ValidationError | null> = [];
  
  notEmpty() { 
    this.validators.push(input => !input ? { kind: "EmptyInput" } : null);
    return this;
  }
  
  pattern(regex: RegExp) {
    this.validators.push(input => 
      !regex.test(String(input)) ? { kind: "PatternMismatch", value: String(input), pattern: regex.source } : null
    );
    return this;
  }
  
  build(input: T): Result<ValidatedValue<T>, ValidationError & { message: string }> {
    for (const validator of this.validators) {
      const error = validator(input);
      if (error) return { ok: false, error: createError(error) };
    }
    return { ok: true, data: new ValidatedValue(input) };
  }
}

// 使用例
const result = ValidatedValue.builder<string>()
  .notEmpty()
  .pattern(/^[a-z]+$/)
  .build("test");
```

## 実装チェックリスト

### 🚫 禁止パターン
- `as Type`による強制型変換
- オプショナルプロパティによる状態表現 `{ a?: X; b?: Y }`
- `any`/`unknown`の安易な使用
- 例外による制御フロー

### ✅ 推奨パターン
- タグ付きユニオン： `{ kind: string; ... }`
- Result型： `{ ok: boolean; ... }`
- Smart Constructor： `private constructor + static create`
- `switch`文による網羅的分岐

## 段階的適用手順

1. **ビジネスルール収集**: 上記テンプレートでドメイン情報を整理
2. **型定義修正**: オプショナル → Discriminated Union
3. **戻り値修正**: `T | null` → `Result<T, E>`
4. **分岐修正**: `if (obj.prop)` → `switch (obj.kind)`
5. **検証追加**: コンパイラの網羅性チェック確認

## 品質指標
- [ ] ビジネスルールが型定義に反映されている
- [ ] コンパイル時に不正状態を検出
- [ ] `switch`文に`default`不要
- [ ] 型アサーション使用量最小化
- [ ] 関数の戻り値が予測可能

## Claude向け実装指示

### 指示解釈
「全域性原則を適用してコードを改善して」と依頼された場合：

1. **ビジネスルール確認**: 上記テンプレートでのルール提示を要求
2. **部分関数を特定**: 戻り値が`undefined`/`null`になる関数、型アサーションを使う箇所を特定し、Result型に変換
3. **型定義を改善**: オプショナルプロパティ → Discriminated Union
4. **エラー処理を改善**: 例外 → Result型
5. **分岐を改善**: `if`チェーン → `switch`文

### ビジネスルール質問例
```
以下の情報を教えてください：
1. [エンティティ]が取りうる状態は何ですか？
2. 各状態で必要なプロパティは何ですか？
3. 状態間の遷移ルールはありますか？
4. 値の制約（範囲、形式）はありますか？
5. ありえない組み合わせや禁止状態はありますか？
```

### 優先順位
1. ビジネスルール理解（ドメイン知識）
2. 型安全性（コンパイル時検証）
3. 網羅性（全ケース処理）
4. 可読性（自己説明的）
5. 保守性（変更容易性）

### 実装テンプレート
```typescript
// 状態定義（ビジネスルールを反映）
type State = { kind: "A"; data: X } | { kind: "B"; data: Y };

// 処理関数（全ての状態を網羅）
function handle(state: State): Result<Output, ValidationError & { message: string }> {
  switch (state.kind) {
    case "A": return { ok: true, data: processA(state.data) };
    case "B": return { ok: true, data: processB(state.data) };
  }
}

// 制約のある値（ビジネスルールで制限）
class ValidValue<T> {
  private constructor(readonly value: T) {}
  static create<T>(input: T, validator: (input: T) => ValidationError | null): Result<ValidValue<T>, ValidationError & { message: string }> {
    const error = validator(input);
    if (error) {
      return { ok: false, error: createError(error) };
    }
    return { ok: true, data: new ValidValue(input) };
  }
}

// 使用例
const result = ValidValue.create("test", (input) => 
  input.length === 0 ? { kind: "EmptyInput" } : null
);
```

**目標**: ビジネスルールが型に反映され、コンパイラが不正状態を検出し、`switch`文に`default`が不要な設計
