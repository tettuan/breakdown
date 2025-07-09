# Breakdown デバッグ出力機能について

## デバッグモードの有効化

Breakdown CLIやライブラリの実行時に、[@tettuan/breakdownlogger](https://jsr.io/@tettuan/breakdownlogger) を使用した詳細なデバッグ出力が得られます。

### 基本的な使用方法

```sh
# デバッグレベルでの実行
LOG_LEVEL=debug deno run -A cli/breakdown.ts ...

# 情報レベルでの実行（デフォルト）
LOG_LEVEL=info deno run -A cli/breakdown.ts ...

# エラーのみ表示
LOG_LEVEL=error deno run -A cli/breakdown.ts ...
```

### 高度なデバッグ制御

BreakdownLoggerは以下の環境変数による詳細制御が可能です：

```sh
# 特定のモジュールのみデバッグ
LOG_KEY=processor,config LOG_LEVEL=debug deno run -A cli/breakdown.ts ...

# メッセージ長の制御（100文字まで）
LOG_LENGTH=S LOG_LEVEL=debug deno run -A cli/breakdown.ts ...

# 完全な詳細出力（制限なし）
LOG_LENGTH=W LOG_LEVEL=debug deno run -A cli/breakdown.ts ...
```

## 出力される内容

BreakdownLoggerを使用することで、以下の詳細な情報が構造化されたログ形式で出力されます：

### 基本情報
- **current working directory**: コマンド実行時のカレントディレクトリ
- **app.yml path**: 参照している *-app.yml の絶対パス
- **app.yml content**: *-app.yml の設定内容
- **user.yml path**: 参照している *-user.yml の絶対パス  
- **user.yml content**: *-user.yml の設定内容

### プロンプト関連
- **prompt template path**: 実際に参照しているプロンプトテンプレートのパス
- **JSON schema path**: 参照しているスキーマファイルのパス
- **variables for PromptManager**: PromptManager に渡す変数（JSON形式）

### ログ出力形式

```
[timestamp] [LEVEL] [key] message
Data: { optional data object }
```

例：
```
[2025-06-15T12:00:00.000Z] [DEBUG] [processor] Processing template variables
Data: { templatePath: "/path/to/template.md", variables: {...} }
```

## 環境変数詳細

### LOG_LEVEL - ログレベル制御

| レベル | 説明 | 出力内容 |
|--------|------|----------|
| `debug` | 最も詳細 | DEBUG, INFO, WARN, ERROR |
| `info` | 標準（デフォルト） | INFO, WARN, ERROR |
| `warn` | 警告以上 | WARN, ERROR |
| `error` | エラーのみ | ERROR |

### LOG_LENGTH - メッセージ長制御

| 設定値 | 制限文字数 | 用途 |
|--------|------------|------|
| 未設定 | 30文字 | CI/CD、簡易確認 |
| `S` | 100文字 | 通常のデバッグ |
| `L` | 200文字 | 詳細調査 |
| `W` | 制限なし | 完全なデバッグ |

### LOG_KEY - モジュールフィルタリング

特定のモジュールやコンポーネントのログのみを出力：

```sh
# 単一モジュール
LOG_KEY=processor

# 複数モジュール（カンマ区切り）
LOG_KEY=processor,config,validator

# 階層的フィルタ（コロン区切り）
LOG_KEY=prompt:processor:template

# パス風フィルタ（スラッシュ区切り）
LOG_KEY=lib/prompt/processor
```

## 出力箇所・実装方法

### テストコード内での使用

```typescript
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// モジュール特定のロガー作成
const logger = new BreakdownLogger("prompt-processor");

// デバッグ情報の出力
logger.debug("テンプレート処理開始", { 
  templatePath: templatePath,
  variables: variables 
});

logger.info("設定ファイル読み込み完了", { 
  configPath: configPath 
});

logger.error("バリデーションエラー", { 
  error: errorMessage,
  input: inputData 
});
```

### 重要な注意事項

- BreakdownLoggerは**テストコードでのみ使用**してください
- アプリケーションコードでは使用しないでください
- 本番運用時は適切なログレベルを設定してください

## 段階的デバッグ戦略

### 1. 問題の概要把握
```sh
LOG_LEVEL=error deno run -A cli/breakdown.ts ...
```

### 2. 警告レベルでの調査
```sh
LOG_LEVEL=warn deno run -A cli/breakdown.ts ...
```

### 3. 特定モジュールの詳細調査
```sh
LOG_KEY=processor LOG_LENGTH=L LOG_LEVEL=debug deno run -A cli/breakdown.ts ...
```

### 4. 完全なトレース
```sh
LOG_LENGTH=W LOG_LEVEL=debug deno run -A cli/breakdown.ts ...
```

## 活用例・トラブルシュート

### 設定ファイルの問題調査
```sh
LOG_KEY=config LOG_LENGTH=W LOG_LEVEL=debug deno run -A cli/breakdown.ts ...
```

### プロンプト処理の問題調査
```sh
LOG_KEY=prompt,processor LOG_LENGTH=L LOG_LEVEL=debug deno run -A cli/breakdown.ts ...
```

### パフォーマンス問題の調査
```sh
LOG_LEVEL=warn LOG_LENGTH=S deno run -A cli/breakdown.ts ...
```

### CI/CD環境での最小限ログ
```sh
LOG_LEVEL=error deno run -A cli/breakdown.ts ...
```

---

**備考**
- ログ出力は標準エラー出力に出力されます
- ファイル出力には対応していません
- ログレベルとフィルタリングを組み合わせることで効率的なデバッグが可能です
- 詳細は [BreakdownLogger GitHub](https://github.com/tettuan/breakdownlogger) を参照してください 