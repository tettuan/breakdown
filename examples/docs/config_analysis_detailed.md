# Breakdown Configuration Analysis - Detailed Guide

## 1. 各環境設定の具体的な使用シーン

### Development Environment (dev-app.yml)

**使用シーン**:
- ローカル開発時のデバッグ作業
- 新機能の実装とテスト
- エラーの詳細調査
- 実験的機能の検証

**設定の特徴**:
```yaml
logger:
  level: "debug"        # 全ての詳細ログを出力
  format: "text"        # 人間が読みやすいテキスト形式
  colorize: true        # カラー出力で視認性向上
features:
  experimentalFeatures: true  # 実験的機能を有効化
  debugMode: true            # デバッグモードON
```

**実際の活用例**:
```bash
# 新機能開発時のデバッグ
deno run -A jsr:@tettuan/breakdown defect issue --config=dev < debug_issue.md

# 詳細なスタックトレース付きで実行
LOG_LEVEL=debug deno run -A jsr:@tettuan/breakdown to project --config=dev
```

### Staging Environment (staging-app.yml)

**使用シーン**:
- 本番環境前の最終テスト
- パフォーマンステスト
- 負荷テストとスケーラビリティ検証
- CI/CDパイプラインでの自動テスト

**設定の特徴**:
```yaml
logger:
  level: "info"         # 重要な情報のみログ出力
  format: "json"        # 構造化ログでパース可能
app_schema:
  validation_enabled: true  # スキーマ検証を有効化
performance:
  maxFileSize: "5MB"       # ファイルサイズ制限
  timeout: 20000           # タイムアウト設定(20秒)
```

**実際の活用例**:
```bash
# CI環境での自動テスト
deno run -A jsr:@tettuan/breakdown summary task --config=staging < test_data.md

# ログ集約システムへの連携
deno run -A jsr:@tettuan/breakdown defect issue --config=staging 2>&1 | tee staging.log
```

### Production Environment (prod-app.yml)

**使用シーン**:
- 本番環境での実運用
- 重要なバグ修正作業
- セキュリティが重要な環境
- 監査ログが必要な環境

**設定の特徴**:
```yaml
logger:
  level: "error"              # エラーのみログ出力
  includeStackTrace: false    # スタックトレース非表示
app_schema:
  strict_mode: true          # 厳格なスキーマ検証
security:
  sanitizeInput: true        # 入力のサニタイズ
  auditLog: true            # 監査ログ有効
performance:
  concurrency: 8            # 並列処理数の制限
```

**実際の活用例**:
```bash
# 本番環境での安全な実行
deno run -A jsr:@tettuan/breakdown to project --config=prod < production_data.md

# 監査ログ付きでの実行
AUDIT_LOG=true deno run -A jsr:@tettuan/breakdown defect issue --config=prod
```

## 2. find bugsコマンドの活用方法

### 基本的な使用方法

```bash
# 標準的なバグ検出
deno run -A jsr:@tettuan/breakdown find bugs < codebase.md

# 設定ファイルを指定したバグ検出
deno run -A jsr:@tettuan/breakdown find bugs --config=production-bugs < source_files.md
```

### バグパターンの種類と意味

**TODO**: 実装予定の機能や改善点
```typescript
// TODO: Add input validation for user data
function processUser(data: any) {
  // 入力検証が未実装
}
```

**FIXME**: 修正が必要な既知の問題
```typescript
// FIXME: Memory leak in cache implementation
private cache = new Map(); // 古いエントリが削除されない
```

**BUG**: 明確なバグや不具合
```typescript
// BUG: Race condition when updating state
setState(prevState => {
  // 競合状態が発生する可能性
});
```

**HACK**: 一時的な回避策
```typescript
// HACK: Temporary workaround for API limitation
await new Promise(resolve => setTimeout(resolve, 1000));
```

**XXX**: 注意が必要な箇所
```typescript
// XXX: This assumes data is always valid
const result = JSON.parse(data);
```

**DEPRECATED**: 廃止予定の機能
```typescript
// DEPRECATED: Use newMethod() instead
oldMethod() {
  console.warn('This method is deprecated');
}
```

### 高度な活用方法

**1. 特定のパターンに絞った検出**:
```yaml
findBugs:
  patterns:
    - "SECURITY"
    - "VULNERABILITY"
    - "CRITICAL"
```

**2. ファイルタイプ別の検出**:
```yaml
findBugs:
  includeExtensions:
    - ".ts"      # TypeScriptのみ
    - ".tsx"     # React components
  excludeExtensions:
    - ".test.ts" # テストファイルは除外
```

**3. 優先度別のレポート生成**:
```bash
# 高優先度のバグのみ抽出
deno run -A jsr:@tettuan/breakdown find bugs --config=high-priority | grep -E "(BUG|CRITICAL|SECURITY)"

# チーム別にレポート分割
deno run -A jsr:@tettuan/breakdown find bugs | awk '/frontend/ {print > "frontend-bugs.md"} /backend/ {print > "backend-bugs.md"}'
```

## 3. 設定ファイルのカスタマイズ方法

### 基本的なカスタマイズ構造

```yaml
# カスタム設定の基本構造
customConfig:
  enabled: true
  
  # コマンドの有効化
  find:
    twoParams:
      - "bugs"      # find bugs コマンドを有効化
      - "security"  # find security コマンドを追加
      - "perf"      # find perf コマンドを追加
```

### ロガー設定のカスタマイズ

```yaml
logger:
  defaultLevel: "info"
  enableColors: true
  # カスタムログフォーマット
  format: "json"
  fields:
    timestamp: true
    level: true
    message: true
    metadata: true
  # ログ出力先の設定
  outputs:
    - type: "stdout"
      level: "info"
    - type: "file"
      path: "./logs/breakdown.log"
      level: "debug"
```

### パフォーマンス設定のカスタマイズ

```yaml
performance:
  # メモリ使用量の制限
  maxMemory: "512MB"
  
  # ファイルサイズ制限
  maxFileSize: "10MB"
  
  # 処理タイムアウト
  timeout: 30000
  
  # 並列処理数
  concurrency: 4
  
  # キャッシュ設定
  cache:
    enabled: true
    ttl: 3600  # 1時間
    maxSize: "100MB"
```

### セキュリティ設定のカスタマイズ

```yaml
security:
  # 入力検証
  sanitizeInput: true
  validateSchemas: true
  
  # 出力制御
  maskSensitiveData: true
  sensitivePatterns:
    - "password"
    - "token"
    - "api_key"
    - "secret"
  
  # 監査設定
  auditLog: true
  auditLevel: "all"  # all, write, read
  auditOutput: "./logs/audit.log"
  
  # アクセス制御
  allowedPaths:
    - "./src"
    - "./docs"
  blockedPaths:
    - "./.env"
    - "./secrets"
```

### 環境別の設定継承

```yaml
# base-config.yml - 共通設定
base:
  logger:
    format: "json"
  security:
    sanitizeInput: true

# dev-config.yml - 開発環境（baseを継承）
extends: "base-config.yml"
logger:
  level: "debug"  # baseのformatを継承し、levelを上書き
  
# prod-config.yml - 本番環境（baseを継承）  
extends: "base-config.yml"
logger:
  level: "error"
security:
  auditLog: true  # baseのsanitizeInputに追加
```

### カスタムバリデーションルール

```yaml
breakdownParams:
  customConfig:
    params:
      two:
        # カスタムパターンの定義
        demonstrativeType:
          pattern: "^(find|analyze|check|verify)$"
          errorMessage: "Invalid command type"
        layerType:
          pattern: "^(bugs|security|performance|quality)$"
          errorMessage: "Invalid layer type"
      
      # カスタムバリデーション関数
      validation:
        - name: "fileExists"
          type: "custom"
          function: "validateFileExists"
        - name: "maxLines"
          type: "numeric"
          max: 10000
```

### プロジェクト固有の設定例

**1. モノレポ対応設定**:
```yaml
monorepo:
  enabled: true
  packages:
    - name: "frontend"
      path: "./packages/frontend"
      config: "./packages/frontend/.breakdown.yml"
    - name: "backend"
      path: "./packages/backend"
      config: "./packages/backend/.breakdown.yml"
```

**2. チーム別設定**:
```yaml
teams:
  frontend:
    findBugs:
      includeExtensions: [".tsx", ".jsx", ".css"]
      patterns: ["TODO", "FIXME", "UI-BUG"]
  backend:
    findBugs:
      includeExtensions: [".ts", ".js", ".sql"]
      patterns: ["TODO", "FIXME", "API-BUG", "SECURITY"]
```

**3. CI/CD統合設定**:
```yaml
ci:
  enabled: true
  failOnBugs: true
  bugThreshold:
    critical: 0    # CRITICALバグは0個まで
    high: 5        # HIGHバグは5個まで
    medium: 20     # MEDIUMバグは20個まで
  reportFormat: "junit"  # CI用のレポート形式
  artifactPath: "./reports/bugs.xml"
```

これらの設定により、プロジェクトの要件に応じた柔軟なカスタマイズが可能になります。