# エラーハンドリング統合テストシナリオ

## シナリオ1: バリデーションエラーの伝播

### 前提条件
- 各層でバリデーションが実装されている
- エラーの型定義が統一されている

### テストステップ
1. 無効な DirectiveType を入力（例: "invalid_directive"）
2. BreakdownParams でバリデーションエラー発生
3. エラーが上位層に伝播
4. 最終的にユーザーフレンドリーなメッセージ表示

### エラーフロー
```
CLI Input → BreakdownParams → DirectiveType.from() → Error Handler → User Output
```

### 検証コード
```typescript
// バリデーションエラーの検証
const result = await processCommand(["invalid_directive", "project", "input.md"]);

assert(!result.ok);
assertEquals(result.error.kind, "ValidationError");

// エラーコンテキストの確認
const context = result.error.context;
assertEquals(context.field, "directive");
assertEquals(context.input, "invalid_directive");
assert(context.validPatterns.length > 0);

// ユーザーメッセージの確認
const userMessage = formatError(result.error);
assertStringIncludes(userMessage, "Invalid directive type");
assertStringIncludes(userMessage, "Expected one of:");
assertStringIncludes(userMessage, "to, summary, defect, find");
```

## シナリオ2: ファイルシステムエラー

### 前提条件
- ファイルアクセス権限の問題
- ディスク容量不足
- ネットワークドライブの切断

### テストステップ
1. 読み取り権限のないファイルへのアクセス
2. 書き込み保護されたディレクトリへの出力
3. 存在しないパスの解決
4. エラーリカバリーの試行

### エラーケース
```typescript
const errorCases = [
  {
    name: "PermissionDenied",
    setup: () => Deno.chmod("test.md", 0o000),
    expectedError: "PermissionDenied"
  },
  {
    name: "DiskFull",
    setup: () => fillDisk(),
    expectedError: "DiskFull"
  },
  {
    name: "NetworkError",
    setup: () => disconnectNetwork(),
    expectedError: "NetworkError"
  }
];
```

### 検証ポイント
- 適切なエラー型が返される
- リトライ機構が動作する
- 代替パスの提案がある
- 一時ファイルが適切にクリーンアップされる

## シナリオ3: 設定エラーと不整合

### 前提条件
- 設定ファイルの形式エラー
- 必須項目の欠落
- 型の不一致

### テストステップ
1. 壊れた YAML ファイルの読み込み
2. 必須設定の欠落検出
3. デフォルト値での継続
4. 警告メッセージの表示

### 設定エラーの例
```yaml
# 壊れた設定ファイル
app_prompt:
  base_dir: [これは配列で文字列であるべき]
  
# 必須項目の欠落
user:
  # directive_patterns が欠落
  layer_patterns: "project|issue|task"
```

### 検証コード
```typescript
// 設定エラーの処理
const configResult = await loadConfig("broken-config.yml");

// 部分的な成功を確認
assert(configResult.ok);
assert(configResult.warnings.length > 0);

// デフォルト値の適用確認
assertEquals(configResult.data.app_prompt.base_dir, DEFAULT_PROMPT_DIR);

// 警告メッセージの確認
const warning = configResult.warnings[0];
assertEquals(warning.type, "InvalidType");
assertStringIncludes(warning.message, "Expected string");
```

## シナリオ4: 並行処理での競合状態

### 前提条件
- 複数のプロセスが同時に実行
- 共有リソースへのアクセス
- ロック機構の実装

### テストステップ
1. 10個の並行プロセスを起動
2. 同じ出力ファイルへの書き込み
3. 競合の検出とハンドリング
4. 最終的な整合性の確認

### 競合シナリオ
```typescript
// 並行処理での競合テスト
const processes = Array(10).fill(0).map((_, i) => 
  processDirectiveLayer({
    directive: "to",
    layer: "project",
    input: `input${i}.md`,
    output: "shared_output.md" // 同じ出力先
  })
);

const results = await Promise.allSettled(processes);
```

### 検証ポイント
- 適切なロック取得の失敗メッセージ
- リトライ機構の動作確認
- 最終的に1つのプロセスのみ成功
- データの整合性維持

## シナリオ5: タイムアウトとキャンセル

### 前提条件
- 長時間実行される処理
- ユーザーによる中断要求
- タイムアウト設定

### テストステップ
1. 大きなファイルの処理開始
2. タイムアウトの発生
3. 処理の適切な中断
4. リソースのクリーンアップ

### タイムアウト設定
```typescript
const config = {
  timeouts: {
    fileRead: 5000,    // 5秒
    processing: 30000, // 30秒
    total: 60000      // 1分
  }
};
```

### 検証コード
```typescript
// タイムアウトテスト
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 1000);

try {
  const result = await processLargeFile("huge.md", {
    signal: controller.signal
  });
  fail("Should have timed out");
} catch (error) {
  assertEquals(error.name, "AbortError");
  assertEquals(error.message, "Operation timed out");
} finally {
  clearTimeout(timeoutId);
}

// クリーンアップの確認
assert(!await exists("temp_processing_file"));
```

## シナリオ6: カスケードエラーの防止

### 前提条件
- エラーが連鎖的に発生する可能性
- サーキットブレーカーパターンの実装

### テストステップ
1. 初回エラーの発生
2. 連続したエラーの検出
3. サーキットブレーカーの作動
4. 一定時間後の自動回復

### エラーパターン
```typescript
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  
  async execute(fn: () => Promise<any>) {
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime > 60000) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### 検証ポイント
- 連続エラー後にサーキットが開く
- 新規リクエストが即座に拒否される
- 一定時間後に半開状態になる
- 成功後に完全に回復する

## シナリオ7: エラーレポートと診断情報

### 前提条件
- 詳細なエラー情報の収集
- スタックトレースの保持
- コンテキスト情報の付加

### テストステップ
1. 複雑な処理チェーンでエラー発生
2. 各層でのコンテキスト追加
3. 最終的なエラーレポート生成
4. 診断情報の出力

### エラーレポートの構造
```typescript
interface ErrorReport {
  id: string;
  timestamp: string;
  error: {
    kind: string;
    message: string;
    stack?: string;
  };
  context: {
    command: string[];
    environment: Record<string, string>;
    config: Record<string, any>;
    processingStage: string;
  };
  suggestions: string[];
  relatedErrors: ErrorReport[];
}
```

### 検証コード
```typescript
// エラーレポートの生成
const report = await generateErrorReport(error, context);

// 必須情報の確認
assert(report.id);
assert(report.timestamp);
assertEquals(report.error.kind, "ValidationError");

// コンテキスト情報の確認
assertEquals(report.context.processingStage, "DirectiveTypeValidation");
assert(report.context.command.length > 0);

// 提案の確認
assert(report.suggestions.length > 0);
assertStringIncludes(report.suggestions[0], "Did you mean");
```