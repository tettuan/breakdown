# パス解決統合テストシナリオ

## シナリオ1: プロンプトファイルパス解決

### 前提条件
- DirectiveType: "to", LayerType: "project"
- プロンプトファイルが標準的な場所に存在

### テストステップ
1. DirectiveType と LayerType からパスパターンを生成
2. ファイルシステムで実際のファイルを探索
3. 複数の候補から最適なファイルを選択
4. ファイルの内容を読み込み

### 期待されるパス解決順序
```
1. .agent/breakdown/prompts/to/project/f_issue.md (最優先)
2. .agent/breakdown/prompts/to/project.md
3. prompts/to/project/f_issue.md (フォールバック)
4. prompts/to/project.md
```

### 検証ポイント
```typescript
// パス解決の検証
const resolvedPath = await resolver.resolvePromptPath(directiveType, layerType);
assert(resolvedPath.ok);
assert(await exists(resolvedPath.data));

// 優先順位の検証
const candidates = await resolver.getCandidatePaths(directiveType, layerType);
assertEquals(candidates[0], ".agent/breakdown/prompts/to/project/f_issue.md");
```

## シナリオ2: スキーマファイルパス解決

### 前提条件
- DirectiveType: "summary", LayerType: "issue"
- 複数のスキーマファイルが異なる場所に存在

### テストステップ
1. プロンプトファイルからスキーマ参照を抽出
2. スキーマファイルのパスを解決
3. 継承関係を考慮したスキーマの読み込み
4. スキーマの統合と検証

### スキーマ探索パターン
```
1. .agent/breakdown/schema/summary/issue.json
2. .agent/breakdown/schema/summary/issue/base.schema.md
3. schema/summary/issue.json
4. schema/summary/issue/base.schema.md
```

### 検証コード
```typescript
// スキーマパス解決
const schemaResult = await resolver.resolveSchemaPath(directiveType, layerType);
assert(schemaResult.ok);

// スキーマの継承チェーン
const inheritanceChain = await resolver.getSchemaInheritance(schemaResult.data);
assert(inheritanceChain.length > 0);
```

## シナリオ3: カスタムベースディレクトリ

### 前提条件
- 設定でカスタムパスが指定されている
- `promptBaseDir: "custom/prompts"`
- `schemaBaseDir: "custom/schemas"`

### テストステップ
1. カスタム設定の読み込み
2. カスタムパスでのファイル探索
3. デフォルトパスへのフォールバック確認

### 期待結果
- カスタムパスが優先される
- カスタムパスにファイルがない場合、デフォルトパスを探索
- 適切なエラーメッセージ

## シナリオ4: ファイル不在時のエラーハンドリング

### 前提条件
- 存在しない DirectiveType/LayerType の組み合わせ
- プロンプトファイルが見つからない状況

### テストステップ
1. 存在しないパスの解決を試行
2. エラーメッセージの生成
3. 代替候補の提示
4. デバッグ情報の出力

### 検証ポイント
```typescript
// エラーの詳細情報
const error = result.error;
assertEquals(error.kind, "FileNotFound");
assertStringIncludes(error.message, "Prompt file not found");

// 試行されたパスの一覧
assert(error.context.attemptedPaths.length > 0);
assert(error.context.suggestions.length > 0);
```

## シナリオ5: 相対パスと絶対パスの混在

### 前提条件
- 作業ディレクトリが変更される
- 相対パスと絶対パスが混在する設定

### テストステップ
1. 異なる作業ディレクトリから実行
2. 相対パスの正しい解決
3. 絶対パスの維持
4. シンボリックリンクの追跡

### テストケース
```typescript
// 作業ディレクトリの変更
const originalCwd = Deno.cwd();
try {
  Deno.chdir("/tmp/test-workspace");
  
  // 相対パスの解決
  const relativePath = await resolver.resolve("./prompts/to/project.md");
  assertEquals(relativePath, "/tmp/test-workspace/prompts/to/project.md");
  
  // 絶対パスの維持
  const absolutePath = await resolver.resolve("/opt/breakdown/prompts/to/project.md");
  assertEquals(absolutePath, "/opt/breakdown/prompts/to/project.md");
} finally {
  Deno.chdir(originalCwd);
}
```

## シナリオ6: パフォーマンスとキャッシング

### 前提条件
- 大量のファイルが存在するディレクトリ
- 同じパスの複数回解決

### テストステップ
1. 初回のパス解決時間を測定
2. 2回目以降のパス解決時間を測定
3. キャッシュの効果を確認
4. メモリ使用量の監視

### パフォーマンス目標
- 初回解決: < 50ms
- キャッシュ済み: < 5ms
- メモリ増加: < 10MB for 1000 paths

### 測定コード
```typescript
// パフォーマンス測定
const start = performance.now();
const result = await resolver.resolvePromptPath(directiveType, layerType);
const firstTime = performance.now() - start;

// キャッシュ効果の測定
const cacheStart = performance.now();
const cachedResult = await resolver.resolvePromptPath(directiveType, layerType);
const cacheTime = performance.now() - cacheStart;

assert(cacheTime < firstTime * 0.1); // 10%以下
```

## シナリオ7: 同時アクセスと競合状態

### 前提条件
- 複数のプロセスが同時にパス解決を実行
- ファイルの作成・削除が並行して発生

### テストステップ
1. 10個の並行リクエストを生成
2. 各リクエストで異なるパスを解決
3. ファイルの存在確認の一貫性を検証
4. ロック機構の動作確認

### 検証ポイント
- 競合状態でのエラーが発生しない
- ファイルの存在確認が一貫している
- 適切なリトライ機構が動作する