# プロンプト変数生成統合テストシナリオ

## シナリオ1: 基本的な変数収集と変換

### 前提条件
- 入力ファイル: input.md が存在
- STDIN からの追加入力あり
- カスタム変数が設定されている

### テストステップ
1. ファイルパスから変数を抽出
   - input: "input.md"
   - output: "output/to/project/result.md"
2. STDIN から追加変数を読み込み
3. 設定ファイルからカスタム変数を読み込み
4. 全ての変数を統合してプロンプト変数を生成

### 期待される変数マッピング
```typescript
{
  input: "# Project Overview\n...",
  output: "output/to/project/result.md",
  directive: "to",
  layer: "project",
  timestamp: "2024-01-15T10:30:00Z",
  custom_author: "Test User",
  custom_version: "1.0.0"
}
```

### 検証コード
```typescript
// 変数生成の検証
const variables = await generator.generateVariables({
  directiveType,
  layerType,
  inputPath: "input.md",
  stdinContent: "Additional content from stdin"
});

// 必須変数の存在確認
assert(variables.has("input"));
assert(variables.has("output"));
assert(variables.has("directive"));
assert(variables.has("layer"));

// 変数の内容検証
assertEquals(variables.get("directive"), "to");
assertEquals(variables.get("layer"), "project");
```

## シナリオ2: プロンプトテンプレートへの変数適用

### 前提条件
- プロンプトテンプレートに変数プレースホルダーが存在
- 一部の変数が未定義

### テストステップ
1. プロンプトテンプレートの読み込み
2. 変数の置換処理
3. 未定義変数の検出
4. デフォルト値の適用

### テンプレート例
```markdown
# ${directive} ${layer}

Input content:
${input}

Expected output path: ${output}

Author: ${author:-Unknown}
Version: ${version:-0.0.0}

Undefined variable: ${undefined_var}
```

### 検証ポイント
```typescript
// 変数置換の検証
const result = await processor.processTemplate(template, variables);

// 定義済み変数の置換確認
assertStringIncludes(result.content, "to project");
assertNotStringIncludes(result.content, "${directive}");

// デフォルト値の適用確認
assertStringIncludes(result.content, "Author: Test User");
assertStringIncludes(result.content, "Version: 1.0.0");

// 未定義変数の警告
assertEquals(result.warnings.length, 1);
assertEquals(result.warnings[0].variable, "undefined_var");
```

## シナリオ3: 大きなファイルとメモリ管理

### 前提条件
- 10MB以上の入力ファイル
- メモリ制限が設定されている

### テストステップ
1. 大きなファイルの読み込み
2. ストリーミング処理の確認
3. メモリ使用量の監視
4. 部分読み込みの動作確認

### パフォーマンス要件
- メモリ使用量: ファイルサイズの2倍以下
- 処理時間: 1MB あたり 100ms 以下

### 検証コード
```typescript
// メモリ使用量の監視
const memBefore = Deno.memoryUsage();
const largeFileContent = await generator.processLargeFile("large_input.md");
const memAfter = Deno.memoryUsage();

const memoryIncrease = memAfter.heapUsed - memBefore.heapUsed;
assert(memoryIncrease < fileSize * 2);
```

## シナリオ4: 変数の優先順位と上書き

### 前提条件
- 同じ変数名が複数のソースで定義されている
- 優先順位: CLI引数 > STDIN > ファイル > 設定

### テストステップ
1. 各ソースから同名変数を読み込み
2. 優先順位に従って変数を統合
3. 最終的な変数値の確認

### テストデータ
```typescript
const sources = {
  cli: { version: "3.0.0", author: "CLI User" },
  stdin: { version: "2.0.0", description: "From STDIN" },
  file: { version: "1.0.0", author: "File Author", tag: "stable" },
  config: { version: "0.0.0", author: "Config Author", license: "MIT" }
};
```

### 期待結果
```typescript
{
  version: "3.0.0",      // CLI優先
  author: "CLI User",    // CLI優先
  description: "From STDIN", // STDINのみ
  tag: "stable",         // ファイルのみ
  license: "MIT"         // 設定のみ
}
```

## シナリオ5: 特殊文字とエスケープ処理

### 前提条件
- 変数値に特殊文字が含まれる
- テンプレートエンジンのメタ文字

### テストステップ
1. 特殊文字を含む変数の生成
2. エスケープ処理の適用
3. テンプレートでの正しい表示確認

### テストケース
```typescript
const specialVars = {
  code: "function test() { return \"${value}\"; }",
  regex: "/\\$\\{([^}]+)\\}/g",
  markdown: "# Title\n\n`${inline}` code",
  json: '{"key": "${value}", "nested": {"${key}": true}}'
};
```

### 検証ポイント
- 変数展開が意図しない場所で発生しない
- エスケープされた文字が正しく表示される
- ネストした変数参照が適切に処理される

## シナリオ6: 動的変数と計算値

### 前提条件
- 実行時に計算される変数が存在
- 他の変数に依存する変数

### テストステップ
1. 基本変数の収集
2. 動的変数の計算
3. 依存関係の解決
4. 循環参照の検出

### 動的変数の例
```typescript
const dynamicVars = {
  timestamp: () => new Date().toISOString(),
  outputPath: (vars) => `output/${vars.directive}/${vars.layer}/result.md`,
  hash: (vars) => createHash(vars.input),
  summary: async (vars) => await generateSummary(vars.input)
};
```

### 検証コード
```typescript
// 動的変数の解決
const resolved = await generator.resolveDynamicVariables(baseVars, dynamicVars);

// タイムスタンプの検証
assert(isValidISOString(resolved.timestamp));

// パス生成の検証
assertEquals(resolved.outputPath, "output/to/project/result.md");

// 非同期処理の完了確認
assert(resolved.summary.length > 0);
```

## シナリオ7: エラー処理とリカバリー

### 前提条件
- 一部の変数生成が失敗する可能性
- 部分的な成功を許容

### テストステップ
1. 複数ソースからの変数収集
2. 一部のソースでエラー発生
3. エラーの記録と継続処理
4. 部分的な結果の返却

### エラーシナリオ
- ファイル読み込みエラー
- STDIN タイムアウト
- 無効な変数名
- メモリ不足

### 検証ポイント
```typescript
// 部分的な成功の処理
const result = await generator.generateWithErrors(sources);

// 成功した変数の確認
assert(result.variables.size > 0);

// エラーの記録確認
assertEquals(result.errors.length, 2);
assertEquals(result.errors[0].source, "file");
assertEquals(result.errors[0].reason, "FileNotFound");

// 警告の確認
assert(result.warnings.length > 0);
```