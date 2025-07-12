# 基本統合テストシナリオ

## シナリオ1: 正常系 - CLIからプロンプト生成まで

### 前提条件
- BreakdownParams が正しく設定されている
- 設定ファイル（default-app.yml, default-user.yml）が存在する
- プロンプトテンプレートファイルが存在する

### テストステップ
1. CLI引数として `to project input.md` を受け取る
2. BreakdownParams が引数を解析し、TwoParams_Result を生成
3. DirectiveType.from() で "to" を DirectiveType に変換
4. LayerType.from() で "project" を LayerType に変換
5. プロンプトパスの解決
6. プロンプト変数の生成
7. 最終的なプロンプトの生成

### 期待結果
- 各ステップでエラーが発生しない
- 生成されたプロンプトに必要な変数が全て含まれている
- デバッグログに適切な情報が出力される

### 検証ポイント
```typescript
// 1. TwoParams_Result の検証
assertEquals(result.ok, true);
assertEquals(result.data.directive, "to");
assertEquals(result.data.layer, "project");

// 2. DirectiveType の検証
const directiveResult = DirectiveType.from(twoParamsResult);
assertEquals(directiveResult.ok, true);
assertEquals(directiveResult.data.getValue(), "to");

// 3. LayerType の検証
const layerResult = LayerType.from(twoParamsResult);
assertEquals(layerResult.ok, true);
assertEquals(layerResult.data.getValue(), "project");

// 4. プロンプト生成の検証
assertStringIncludes(generatedPrompt, "${input}");
assertStringIncludes(generatedPrompt, "${output}");
```

## シナリオ2: 設定プロファイルの切り替え

### 前提条件
- 複数のプロファイル設定が存在する（default, development, production）
- 各プロファイルで異なるパターンが定義されている

### テストステップ
1. development プロファイルを指定して初期化
2. DirectiveType と LayerType のパターンが変更されることを確認
3. 同じ入力値で異なる結果が得られることを検証

### 期待結果
- プロファイルに応じて異なるバリデーションパターンが適用される
- プロファイル固有の設定値が正しく読み込まれる

## シナリオ3: エラー伝播の検証

### 前提条件
- 無効な入力値を用意
- エラーハンドリングの各層が正しく実装されている

### テストステップ
1. 無効な DirectiveType 値（例: "invalid"）を入力
2. BreakdownParams でのバリデーションエラー
3. エラーが DirectiveType.from() に伝播
4. 最終的にユーザーに分かりやすいエラーメッセージが表示される

### 期待結果
- エラーが適切に伝播される
- エラーメッセージが具体的で理解しやすい
- スタックトレースが適切に保持される

### 検証ポイント
```typescript
// エラーの種類を検証
assertEquals(error.kind, "ValidationError");

// エラーメッセージの内容を検証
assertStringIncludes(error.message, "Invalid directive type");
assertStringIncludes(error.message, "Expected pattern");

// コンテキスト情報の検証
assertEquals(error.context.input, "invalid");
assertEquals(error.context.field, "directive");
```

## シナリオ4: 複数パラメータの組み合わせ

### 前提条件
- 有効な DirectiveType と LayerType の全組み合わせ

### テストステップ
1. 全ての有効な組み合わせでテストを実行
2. 各組み合わせで適切なパスが生成されることを確認
3. パフォーマンスを測定

### 期待結果
- 全ての組み合わせが正常に処理される
- 処理時間が許容範囲内（< 100ms per combination）

### テストデータ
```typescript
const directives = ["to", "summary", "defect", "find"];
const layers = ["project", "issue", "task"];

for (const directive of directives) {
  for (const layer of layers) {
    // 各組み合わせをテスト
  }
}
```

## シナリオ5: 並行処理とリソース管理

### 前提条件
- 複数の処理を同時に実行可能な環境

### テストステップ
1. 10個の異なるパラメータセットを並行処理
2. メモリ使用量を監視
3. ファイルハンドルのリークを確認

### 期待結果
- 並行処理でもエラーが発生しない
- メモリリークが発生しない
- ファイルハンドルが適切に解放される

### 検証コード
```typescript
const promises = testCases.map(async (testCase) => {
  const result = await processDirectiveLayer(testCase);
  return result;
});

const results = await Promise.all(promises);
// 全ての結果を検証
```