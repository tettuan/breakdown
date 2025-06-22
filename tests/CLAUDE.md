# 禁止事項
- プロジェクト直下の examples/ 配下をテストすることは禁ずる。（テスト対象にしない。） examples/ 配下は、テストファイルでも実装ファイルでもない。
- テストファイル内で、`Deno.env.set` を使ってモードをセットすること

# デバッグ出力戦略

デバッグは、以下の方法で行う。

## テストファイルへの記載時

Breakdownプロジェクトのテストでは、BreakdownLoggerを使用しなさい。
BreakdownLoggerには、LOG_KEYをセットしなさい。


### インポート
```typescript
import { BreakdownLogger, LogLevel } from "@tettuan/breakdownlogger";
```

### インスタンス化
```typescript
// シンプルな初期化（推奨）
const logger = new BreakdownLogger();

// キー付き初期化（フィルタリング用）
const module_name_logger = new BreakdownLogger("module-name");
```

### LOG_KEY一覧

- `config`: 設定情報の出力に用いる、BreakdownConfigの出力に用いる
- `template`: prompt の出力に用いる、BreakdownPromptの出力に用いる
- `stdin`: STDIN の入力に用いる
- `params`: args, BreakdownParams の出力に用いる
- `options`: 引数のうち、オプションの出力に用いる
- `schema`: Schemaの出力に用いる
- `その他`:
  - 他に重複しないHash値: 非常に重要で、必ずピンポイントで見るべきデバッグ出力には固有のKEYを割り当てる

### 出力内容
前半に概略、後半に詳細データを加える。LOG_LENGTHで出力される範囲を意識する。

```sample_test.ts
module_name_logger.debug("冒頭のデバッグ内容の短文", "出力の意図", <Objectやインスタンスや変数> );
```

## テスト実行時

### 1. 最初の実行時

#### 通常のデバッグ出力を表示

```bash
LOG_LEVEL=debug deno test example_test.ts --allow-env --allow-write --allow-read
```

### 2. 詳細の把握時
#### 指定したKEYのデバッグ出力を表示

```bash
LOG_LEVEL=debug LOG_LENGTH=S LOG_KEY=config deno test --allow-env --allow-write --allow-read
```

##### 複数モジュールの監視

```bash
LOG_KEY="auth,validation,database" LOG_LENGTH=L deno test --allow-env --allow-write --allow-read # カンマ区切り
LOG_KEY="cli:args:parser" LOG_LEVEL=debug deno test cli/ --allow-env --allow-write --allow-read # コロン区切り（階層的）
LOG_KEY="tests/core/cli" deno test tests/core/ --allow-env --allow-write --allow-read # スラッシュ区切り（パス風）
```

#### ログ出力量を増やす 

```bash
deno test --allow-env --allow-write --allow-read # デフォルト: 30文字
LOG_LENGTH=S deno test --allow-env --allow-write --allow-read # S, SHORT: 100文字
LOG_LENGTH=L LOG_LEVEL=debug deno test failing_test.ts --allow-env --allow-write --allow-read # L, LONG: 200文字
LOG_LENGTH=W LOG_LEVEL=debug deno test complex_test.ts --allow-env --allow-write --allow-read # W,  WHOLE: 無制限（完全なデバッグ）
```

### 3. 特定のテスト失敗の調査
```bash
# 完全なトレース
LOG_LENGTH=W LOG_LEVEL=debug deno test failing_test.ts --allow-env --allow-write --allow-read # W, Whole:全文の出力
```

### 特定のモジュールのログが見えない
```typescript
// コード内でキーが正しく設定されているか確認
const logger = new BreakdownLogger("my-module");  // このキーを使用

// 実行時
LOG_KEY="my-module" LOG_LEVEL=debug deno test --allow-env --allow-write --allow-read
```

### ログが途切れる
```bash
# LOG_LENGTH を W (WHOLE) に設定
LOG_LENGTH=W deno test --allow-env --allow-write --allow-read
```

## ベストプラクティス

1. **開発時**: `LOG_LENGTH=L LOG_LEVEL=debug` で詳細情報を取得
2. **CI実行時**: `LOG_LEVEL=error` でノイズを削減
3. **デバッグ時**: `LOG_KEY` で特定モジュールに絞り込み
4. **本番テスト**: 最小限のログ設定でパフォーマンスを維持

## 環境変数サマリー

| 環境変数 | 値 | 説明 |
|---------|-----|------|
| LOG_LEVEL | debug, info, warn, error | ログレベル制御 |
| LOG_LENGTH | S, L, W | S=100文字, L=200文字, W=無制限 |
| LOG_KEY | 文字列（カンマ/コロン/スラッシュ区切り） | モジュールフィルタ |
