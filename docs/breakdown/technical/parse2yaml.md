# ソースコードから型フローYAMLを構築するプロンプト

## 概要
TypeScriptソースコードを解析し、全域性原則に基づく型変換フローをYAMLで表現するためのプロンプトテンプレート。

## プロンプトテンプレート

### 基本指示

```
あなたは、TypeScriptソースコードを解析し、全域性原則に基づく型変換フローをYAMLで表現するエキスパートです。

以下の条件に従って、指定されたソースコードの型フローをYAMLで構築してください：

## 解析対象
- スタート関数: [関数名]
- 終了条件: [終了条件/型]
- スコープ: [解析範囲]

## 出力形式
以下の構造でYAMLを作成：

```yaml
# [プロジェクト名] 型フロー - [スタート] から [終了] まで
# 全域性原則に基づく主要な型宣言の受け渡し

# 核心的な型変換フロー
type_flow:
  name: "Type transformation pipeline"
  description: "[フローの説明]"
  
  transformations:
    - step: [番号]
      from: "[入力型]"
      to: "[出力型]"
      operation: "[関数/メソッド名]"
      description: "[変換の説明]"
      totality_principle: "[全域性原則の適用方法]"

# 全域性原則適用の主要型
totality_types:
  [型名]:
    pattern: "[Smart Constructor|Discriminated Union|Result型]"
    file: "[ファイルパス]"
    principle: "[適用した全域性原則]"
    structure:
      [型の構造定義]
    validation:
      [検証ルール]

# 型安全性保証
type_safety:
  input_validation:
    - "[検証内容]"
  error_as_values:
    - "[エラー値化の内容]"
  impossible_states_elimination:
    - "[不可能状態の排除内容]"

# 主要な型受け渡しポイント
key_handoffs:
  [境界名]:
    type: "[入力型] → [出力型]"
    responsibility: "[責務]"
    files: ["[関連ファイル]"]

# 境界とスコープ
boundaries:
  scope: "[解析スコープ]"
  next_phase: "[次フェーズ]"
  type_boundary: "[型境界]"
```

## 重要な解析ポイント

### 1. 型変換の特定
- 関数の入力型と出力型を明確に特定
- 型変換が発生するポイントを洗い出し
- 中間型の役割を理解

### 2. 全域性原則の適用確認
- **Smart Constructor**: `private constructor + static create`
- **Discriminated Union**: `{ kind: string; ... }`
- **Result型**: `{ status: SUCCESS|ERROR; data?: T; error?: E }`

### 3. エラーハンドリングパターン
- 例外 → Result型
- undefined/null → 明示的な状態表現
- 部分関数 → 全域関数への変換

### 4. 型安全性の保証方法
- 入力検証の仕組み
- 不可能状態の排除方法
- エラーの値化手法

## 具体例

### 入力例
```typescript
// main関数からBreakdownConfigの値を得るまで
async function main() {
  await runBreakdown();
}

export async function runBreakdown(args: string[] = Deno.args): Promise<void> {
  const configProfileName = ConfigProfileName.create(ConfigPrefixDetector.detect(args));
  const config = await loadBreakdownConfig(configProfileName.value, Deno.cwd());
  const configResult = ParamsCustomConfig.create(config);
  // ...
}
```

### 出力例
```yaml
type_flow:
  transformations:
    - step: 1
      from: "string[]"
      to: "string | null"
      operation: "ConfigPrefixDetector.detect()"
      description: "CLI引数から設定プレフィックスを抽出"
      
    - step: 2
      from: "string | null"
      to: "ConfigProfileName"
      operation: "ConfigProfileName.create()"
      description: "Smart Constructor パターンで検証済み型を作成"
      totality_principle: "null → ConfigProfileName { value: null }"
```

## 注意事項

1. **詳細フローは不要**: 個別の処理ステップではなく、型変換に焦点を当てる
2. **全域性原則の強調**: 部分関数を全域関数に変換している箇所を明確に
3. **型安全性の保証**: コンパイル時の型検証がどう働くかを表現
4. **境界の明確化**: 責務の境界と型の境界を明確に分離

## 検証チェックリスト

- [ ] すべての主要な型変換が含まれている
- [ ] 全域性原則の適用が明確に表現されている
- [ ] エラーハンドリングが型で表現されている
- [ ] 不可能状態の排除方法が明確
- [ ] 型安全性の保証方法が具体的
- [ ] 境界とスコープが明確に定義されている
```

## 使用方法

1. 解析対象のソースコードを特定
2. 上記プロンプトテンプレートの `[関数名]`, `[終了条件/型]`, `[解析範囲]` を具体的に指定
3. プロンプトを実行して型フローYAMLを生成
4. 生成されたYAMLを検証チェックリストで確認
5. **完成したYAMLを `docs/breakdown/yaml/` ディレクトリに保存**

## 出力指示

生成された型フローYAMLは以下の場所に保存してください：

```
docs/breakdown/yaml/[プロジェクト名]-[スコープ].yml
```

例：
- `docs/breakdown/yaml/breakdown-main-to-config.yml`
- `docs/breakdown/yaml/breakdown-params-to-prompt.yml`
- `docs/breakdown/yaml/breakdown-validation-flow.yml`

## 参考資料

- [全域性原則](../breakdown/overview/totality.ja.md)
- [型フロー実例](../yaml/codingtree.yml)
- [全域性適用型リスト](../breakdown/overview/totality-type.ja.yml)
