# パフォーマンス統合テストシナリオ

## シナリオ1: 大規模パラメータ組み合わせ

### 前提条件
- 10種類の DirectiveType
- 10種類の LayerType
- 100通りの組み合わせを処理

### テストステップ
1. 全組み合わせのテストケース生成
2. 並列処理での実行
3. 処理時間の測定
4. リソース使用量の監視

### パフォーマンス目標
- 平均処理時間: < 50ms/組み合わせ
- 最大処理時間: < 200ms
- メモリ増加: < 100MB
- CPU使用率: < 80%

### 測定コード
```typescript
// パフォーマンス測定
const combinations = generateAllCombinations(directives, layers);
const results: PerformanceResult[] = [];

const startTime = performance.now();
const startMemory = Deno.memoryUsage();

// 並列処理
const batchSize = 10;
for (let i = 0; i < combinations.length; i += batchSize) {
  const batch = combinations.slice(i, i + batchSize);
  const batchResults = await Promise.all(
    batch.map(async (combo) => {
      const start = performance.now();
      const result = await processDirectiveLayer(combo);
      const duration = performance.now() - start;
      
      return {
        combination: combo,
        duration,
        success: result.ok,
        memoryUsed: Deno.memoryUsage().heapUsed
      };
    })
  );
  results.push(...batchResults);
}

const totalTime = performance.now() - startTime;
const memoryIncrease = Deno.memoryUsage().heapUsed - startMemory.heapUsed;

// アサーション
const avgTime = totalTime / combinations.length;
assert(avgTime < 50, `Average time ${avgTime}ms exceeds 50ms`);
assert(memoryIncrease < 100 * 1024 * 1024, `Memory increase ${memoryIncrease} exceeds 100MB`);
```

## シナリオ2: 大容量ファイル処理

### 前提条件
- 入力ファイルサイズ: 1MB, 10MB, 100MB
- ストリーミング処理の実装
- メモリ効率的な処理

### テストステップ
1. 異なるサイズのファイルを準備
2. 各ファイルの処理時間測定
3. メモリ使用量の監視
4. 処理速度の線形性確認

### ベンチマーク基準
```typescript
const benchmarks = [
  { size: "1MB", maxTime: 100, maxMemory: 10 },
  { size: "10MB", maxTime: 1000, maxMemory: 50 },
  { size: "100MB", maxTime: 10000, maxMemory: 200 }
];
```

### 検証コード
```typescript
// ストリーミング処理のテスト
for (const benchmark of benchmarks) {
  const file = `test_${benchmark.size}.md`;
  const startMem = Deno.memoryUsage().heapUsed;
  const startTime = performance.now();
  
  // ストリーミング読み込み
  const reader = await Deno.open(file);
  const decoder = new TextDecoder();
  let content = "";
  
  try {
    const buffer = new Uint8Array(1024 * 1024); // 1MB chunks
    let bytesRead;
    
    while ((bytesRead = await reader.read(buffer)) !== null) {
      content += decoder.decode(buffer.subarray(0, bytesRead));
      
      // チャンクごとの処理
      if (content.length > 1024 * 1024) {
        await processChunk(content);
        content = "";
      }
    }
    
    // 残りの処理
    if (content.length > 0) {
      await processChunk(content);
    }
  } finally {
    reader.close();
  }
  
  const duration = performance.now() - startTime;
  const memUsed = (Deno.memoryUsage().heapUsed - startMem) / 1024 / 1024;
  
  assert(duration < benchmark.maxTime);
  assert(memUsed < benchmark.maxMemory);
}
```

## シナリオ3: キャッシュ効率性

### 前提条件
- LRU キャッシュの実装
- キャッシュサイズ: 1000エントリ
- ヒット率目標: > 80%

### テストステップ
1. 頻出パターンでのアクセス
2. キャッシュヒット率の測定
3. キャッシュミス時のペナルティ
4. メモリ使用量の監視

### キャッシュ実装
```typescript
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private usage = new Map<K, number>();
  private maxSize: number;
  private hits = 0;
  private misses = 0;
  
  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }
  
  get(key: K): V | undefined {
    if (this.cache.has(key)) {
      this.hits++;
      this.usage.set(key, Date.now());
      return this.cache.get(key);
    }
    this.misses++;
    return undefined;
  }
  
  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    this.cache.set(key, value);
    this.usage.set(key, Date.now());
  }
  
  getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? this.hits / total : 0;
  }
}
```

### 検証ポイント
```typescript
// キャッシュ効率性テスト
const cache = new LRUCache<string, ProcessResult>(1000);
const testPatterns = generateTestPatterns(10000); // 10000アクセスパターン

for (const pattern of testPatterns) {
  const cacheKey = `${pattern.directive}:${pattern.layer}`;
  let result = cache.get(cacheKey);
  
  if (!result) {
    result = await processDirectiveLayer(pattern);
    cache.set(cacheKey, result);
  }
}

const hitRate = cache.getHitRate();
assert(hitRate > 0.8, `Hit rate ${hitRate} is below 80%`);
```

## シナリオ4: 並行処理スケーラビリティ

### 前提条件
- Worker Pool の実装
- 並行度: 1, 2, 4, 8, 16
- CPU コア数に応じた最適化

### テストステップ
1. 異なる並行度での実行
2. スループットの測定
3. レスポンスタイムの分布
4. 最適な並行度の決定

### ワーカープール実装
```typescript
class WorkerPool {
  private workers: Worker[] = [];
  private queue: Task[] = [];
  private activeWorkers = 0;
  
  constructor(private maxWorkers: number) {
    for (let i = 0; i < maxWorkers; i++) {
      this.workers.push(new Worker("./worker.ts", { type: "module" }));
    }
  }
  
  async process(task: Task): Promise<Result> {
    return new Promise((resolve, reject) => {
      this.queue.push({ ...task, resolve, reject });
      this.tryProcessNext();
    });
  }
  
  private tryProcessNext() {
    if (this.activeWorkers >= this.maxWorkers || this.queue.length === 0) {
      return;
    }
    
    const task = this.queue.shift()!;
    const worker = this.workers[this.activeWorkers++];
    
    worker.postMessage(task);
    worker.onmessage = (e) => {
      this.activeWorkers--;
      task.resolve(e.data);
      this.tryProcessNext();
    };
  }
}
```

### スケーラビリティ測定
```typescript
// 並行度別のベンチマーク
const concurrencyLevels = [1, 2, 4, 8, 16];
const results = new Map<number, BenchmarkResult>();

for (const concurrency of concurrencyLevels) {
  const pool = new WorkerPool(concurrency);
  const tasks = generateTasks(1000);
  
  const start = performance.now();
  const processedTasks = await Promise.all(
    tasks.map(task => pool.process(task))
  );
  const duration = performance.now() - start;
  
  results.set(concurrency, {
    throughput: tasks.length / (duration / 1000), // tasks/sec
    avgLatency: duration / tasks.length,
    maxLatency: Math.max(...processedTasks.map(t => t.duration))
  });
}

// 最適な並行度の確認
const optimal = findOptimalConcurrency(results);
console.log(`Optimal concurrency: ${optimal}`);
```

## シナリオ5: メモリリーク検出

### 前提条件
- 長時間実行されるプロセス
- 定期的なメモリ使用量監視
- ガベージコレクションの追跡

### テストステップ
1. 1000回の処理を繰り返し実行
2. 100回ごとにメモリ使用量記録
3. メモリ増加傾向の分析
4. リークの有無判定

### メモリ監視コード
```typescript
// メモリリーク検出
const memorySnapshots: MemorySnapshot[] = [];
const iterations = 1000;
const snapshotInterval = 100;

for (let i = 0; i < iterations; i++) {
  // 処理実行
  await processDirectiveLayer({
    directive: "to",
    layer: "project",
    input: `input${i}.md`
  });
  
  // 定期的なスナップショット
  if (i % snapshotInterval === 0) {
    // 強制的なGC実行（Deno特有）
    if (globalThis.gc) {
      globalThis.gc();
    }
    
    const memory = Deno.memoryUsage();
    memorySnapshots.push({
      iteration: i,
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      external: memory.external,
      timestamp: Date.now()
    });
  }
}

// メモリ増加傾向の分析
const trend = analyzeMemoryTrend(memorySnapshots);
assert(trend.slope < 0.1, `Memory leak detected: ${trend.slope} MB/iteration`);
```

## シナリオ6: プロファイリングとボトルネック分析

### 前提条件
- CPU プロファイリングツール
- 処理時間の詳細分析
- ホットスポットの特定

### テストステップ
1. プロファイリング有効化
2. 代表的なワークロード実行
3. プロファイルデータ収集
4. ボトルネック箇所の特定

### プロファイリング実装
```typescript
class PerformanceProfiler {
  private measurements = new Map<string, number[]>();
  
  measure<T>(name: string, fn: () => T): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      if (!this.measurements.has(name)) {
        this.measurements.set(name, []);
      }
      this.measurements.get(name)!.push(duration);
    }
  }
  
  getReport(): ProfileReport {
    const report: ProfileReport = {};
    
    for (const [name, durations] of this.measurements) {
      const sorted = durations.sort((a, b) => a - b);
      report[name] = {
        count: durations.length,
        total: durations.reduce((a, b) => a + b, 0),
        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p50: sorted[Math.floor(sorted.length * 0.5)],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      };
    }
    
    return report;
  }
}
```

### ボトルネック分析
```typescript
// プロファイリング実行
const profiler = new PerformanceProfiler();

// 各処理ステップを測定
const result = await profiler.measure("total", async () => {
  const params = await profiler.measure("parseParams", () => 
    parseParameters(args)
  );
  
  const directive = await profiler.measure("createDirective", () =>
    DirectiveType.from(params)
  );
  
  const layer = await profiler.measure("createLayer", () =>
    LayerType.from(params)
  );
  
  const path = await profiler.measure("resolvePath", () =>
    resolvePath(directive, layer)
  );
  
  const variables = await profiler.measure("generateVariables", () =>
    generateVariables(path)
  );
  
  return await profiler.measure("processTemplate", () =>
    processTemplate(variables)
  );
});

// レポート生成
const report = profiler.getReport();
console.log("Performance Report:", report);

// ボトルネックの特定
const bottleneck = Object.entries(report)
  .filter(([name]) => name !== "total")
  .sort((a, b) => b[1].total - a[1].total)[0];

console.log(`Bottleneck: ${bottleneck[0]} (${bottleneck[1].total}ms total)`);
```