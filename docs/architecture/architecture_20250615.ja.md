# Breakdown アーキテクチャ解析レポート 2025/06/15

## エグゼクティブサマリー

本レポートは、Breakdown CLIツールの完全なアーキテクチャ解析結果をまとめたものです。8つの分析チームによる並列調査により、以下の重要な発見事項が明らかになりました：

1. **設定の優先順位システム**: app.yml → user.yml → CLI引数 → カスタム変数の4段階優先順位
2. **Factory層の中央ハブ機能**: 全てのビジネスロジックが`lib/factory/`を経由する設計
3. **STDIN対応**: パイプライン処理と対話的入力の両方をサポート
4. **二段階パラメータシステム**: "find bugs"のような自然な命令形式のサポート

## 1. システム全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                     ユーザー入力層                           │
│  CLI引数 / STDIN / 設定ファイル / カスタム変数               │
└───────────────┬─────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────────┐
│                  CLI層 (lib/cli/)                            │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ args.ts     │  │ breakdown.ts │  │ commands.ts     │  │
│  │ 引数解析    │  │ メインエントリ│  │ コマンド定義    │  │
│  └─────────────┘  └──────────────┘  └─────────────────┘  │
│         │                 │                    │            │
│         └─────────────────┴────────────────────┘            │
│                           │                                  │
│  ┌────────────────────────▼─────────────────────────────┐  │
│  │          parser/enhanced_params_parser.ts            │  │
│  │  二段階パラメータ解析・イコール形式サポート           │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Factory層 (lib/factory/)                       │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              breakdown_factory.ts                    │  │
│  │         ビジネスロジックの中央ハブ                   │  │
│  └──────────────────┬──────────────────────────────────┘  │
│                     │                                       │
│  ┌─────────────────┴──────────────┐                      │
│  │   各種Handlerクラス群           │                      │
│  │  - TwoParameterHandler          │                      │
│  │  - OneParameterHandler          │                      │
│  │  - ZeroParameterHandler         │                      │
│  └─────────────────────────────────┘                      │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              外部パッケージ依存層                            │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │ BreakdownParams │  │ BreakdownConfig │                │
│  │ 引数バリデーション│  │ 設定ファイル管理│                │
│  └─────────────────┘  └─────────────────┘                │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │BreakdownPrompts │  │ BreakdownLogger │                │
│  │ プロンプト処理  │  │ デバッグ出力    │                │
│  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## 2. 設定システムの優先順位

### 2.1 優先順位階層（低→高）

1. **app.yml** (デフォルト設定)
   - `lib/config/app.yml`に配置
   - システムのデフォルト動作を定義

2. **user.yml** (ユーザー設定)
   - `.agent/breakdown/config/user.yml`に配置
   - ユーザー固有のカスタマイズ

3. **CLI引数**
   - コマンドライン実行時の指定
   - `--from`, `--destination`, `--config`など

4. **カスタム変数** (--uv-*)
   - 最高優先度
   - 動的な値の注入用

### 2.2 設定マージ処理

```typescript
// BreakdownConfigFactory.get()の処理フロー
設定読み込み順序:
1. loadAppYaml() → アプリケーションデフォルト
2. loadUserConfig() → ユーザー設定でオーバーライド
3. mergeWithCliOptions() → CLI引数で上書き
4. applyCustomVariables() → カスタム変数で最終調整
```

## 3. EnhancedParamsParser の詳細

### 3.1 主要機能

1. **二段階パラメータサポート**
   ```bash
   breakdown find bugs  # demonstrativeType="find", layerType="bugs"
   ```

2. **イコール形式オプション**
   ```bash
   breakdown to project -f=input.md -o=output.md
   ```

3. **カスタム変数**
   ```bash
   breakdown to project --uv-project=myproject --uv-debug
   ```

### 3.2 処理フロー

```
入力引数
└→ separateArgs()
   ├→ 位置引数: ["find", "bugs"]
   ├→ オプション: {f: "input.md", o: "output.md"}
   └→ カスタム変数: {project: "myproject", debug: "true"}
      ↓
   BreakdownParams.parse(位置引数のみ)
      ↓
   mergeResults()
      ↓
   最終的なParamsResult
```

## 4. Factory層の役割

### 4.1 BreakdownFactory (中央ハブ)

```typescript
class BreakdownFactory {
  // パラメータ数に応じたハンドラーの振り分け
  create(paramsResult: ParamsResult): BreakdownInterface {
    switch (paramsResult.type) {
      case "zero": return new ZeroParameterHandler(paramsResult);
      case "one": return new OneParameterHandler(paramsResult);
      case "two": return new TwoParameterHandler(paramsResult);
      case "error": throw new CliError(...);
    }
  }
}
```

### 4.2 各Handlerの責務

- **ZeroParameterHandler**: ヘルプ、バージョン表示
- **OneParameterHandler**: init, validate等の単一コマンド
- **TwoParameterHandler**: to/summary/defect/find等の変換処理

## 5. STDIN処理の仕組み

### 5.1 入力ソースの判定

```typescript
// args.tsでの処理
if (options.from === "-" || !options.from) {
  // STDINから読み取り
  const decoder = new TextDecoder();
  const stdin = await Deno.readAll(Deno.stdin);
  inputContent = decoder.decode(stdin);
} else {
  // ファイルから読み取り
  inputContent = await Deno.readTextFile(options.from);
}
```

### 5.2 パイプライン対応

```bash
# パイプラインでの使用
cat input.md | breakdown to project -o output.md

# リダイレクトでの使用
breakdown to project < input.md > output.md
```

## 6. エラーハンドリング戦略

### 6.1 エラーコード体系

```typescript
enum CliErrorCode {
  INVALID_OPTION = "INVALID_OPTION",
  MISSING_REQUIRED = "MISSING_REQUIRED",
  CONFLICTING_OPTIONS = "CONFLICTING_OPTIONS",
  FILE_NOT_FOUND = "FILE_NOT_FOUND",
  CONFIG_ERROR = "CONFIG_ERROR",
  // ...
}
```

### 6.2 エラーフォーマット

- **simple**: 簡潔なエラーメッセージ
- **detailed**: スタックトレース付き
- **json**: 構造化されたJSON形式

## 7. 重要な発見事項

### 7.1 アーキテクチャの特徴

1. **責務の明確な分離**
   - 各層が単一の責任を持つ
   - 外部パッケージへの依存を最小化

2. **拡張性の高い設計**
   - 新しいコマンドタイプの追加が容易
   - Handlerパターンによる柔軟な処理

3. **テスト可能性**
   - 各コンポーネントが独立してテスト可能
   - モックしやすい構造

### 7.2 設定の柔軟性

1. **多段階の設定オーバーライド**
   - デフォルト → ユーザー → CLI → カスタム変数

2. **環境別設定**
   - test.yml, dev.yml, prod.ymlのサポート
   - --config オプションでの切り替え

### 7.3 ユーザビリティ

1. **自然な命令形式**
   - "find bugs"のような英語的な表現

2. **柔軟な入力方法**
   - ファイル、STDIN、パイプライン全対応

3. **詳細なエラーメッセージ**
   - 問題の原因と解決方法を明示

## 8. 今後の改善提案

1. **パフォーマンス最適化**
   - 大規模ファイルのストリーミング処理
   - 並列処理の導入

2. **機能拡張**
   - プラグインシステムの導入
   - より多くの変換タイプのサポート

3. **開発者体験**
   - より詳細なデバッグモード
   - 対話的な設定ウィザード

## 9. まとめ

Breakdownは、明確な層構造と責務分離により、保守性と拡張性に優れたアーキテクチャを実現しています。特に、設定の優先順位システムとFactory層の中央ハブ設計は、複雑な要求を柔軟に処理できる強力な基盤となっています。

---

*本レポートは、8つの分析チームによる並列調査の結果を統合したものです。*
*作成日: 2025年6月15日*
        ├─ schemaFilePath → 検証層へ
        └─ customVariables → テンプレート変数展開へ
```

## 完全データフロー（統合版）

```
1. 起動フェーズ
   CLI引数 (breakdown find bugs --config prod -f=test.js -o=output/)
       ↓
       BreakdownConfigOption.parseConfigOption()
           → prefix [P]: "prod"

2. 設定フェーズ
   [P] → BreakdownConfig
       ├─ prod-app.yml → [APP_CFG]
       └─ prod-user.yml → [USER_CFG]
           ↓ マージ
           FullConfig [A]
               ├─ customConfig [CC]
               ├─ breakdownParams [BP]
               └─ logger [LOG]

3. 解析フェーズ
   [CC] → EnhancedParamsParser([CC])
       ↓ parse(CLI引数)
       ├─ 位置引数 [POS]: ["find", "bugs"]
       ├─ オプション [OPT]: {f: "test.js", o: "output/"}
       └─ カスタム変数 [CV]: {project: "myapp"}
           ↓
           ParamsResult [B]
               ├─ type: "two"
               ├─ demonstrativeType: "find"
               └─ layerType: "bugs"

4. 実行準備フェーズ
   [B] + [A] → PromptVariablesFactory.create()
       ↓ 各Resolver実行
       ├─ InputFilePathResolver → [INPUT_PATH]: "test.js"
       ├─ OutputFilePathResolver → [OUTPUT_PATH]: "output/bugs_report.md"
       ├─ PromptTemplatePathResolver → [PROMPT_PATH]: "prompts/find/bugs/f_bugs.md"
       └─ SchemaFilePathResolver → [SCHEMA_PATH]: "schema/find/bugs/base.schema.md"
           ↓
           getAllParams() → [PARAMS]

5. 実行フェーズ
   [PARAMS] → プロンプト処理
       ├─ プロンプトロード ([PROMPT_PATH])
       ├─ 変数置換 ({{from}}, {{project}} 等)
       └─ generateWithPrompt() 実行
           ↓
           最終出力生成
```

## デザインパターン適用箇所

### 1. Factory Pattern
- PromptVariablesFactory.create() - 静的ファクトリーメソッド
- 各Resolverの生成と組み合わせ

### 2. Facade Pattern
- PromptVariablesFactory - 複雑な内部処理を統一インターフェースで提供
- getAllParams() - 全パラメータを一括取得

### 3. Strategy Pattern
- 各Resolver - パス解決戦略の切り替え可能な実装

### 4. Dependency Injection
- Constructor Injection - 設定とパラメータの注入
- 疎結合な設計により、テスト容易性確保

## パッケージ依存関係（最終版）

```
内部実装                    依存パッケージ              役割
────────────────────────────────────────────────────────────
cli/breakdown.ts
├─ BreakdownConfigOption → @tettuan/breakdownconfig    設定管理
├─ EnhancedParamsParser  → @tettuan/breakdownparams    引数解析
├─ PromptVariablesFactory → (内部実装)                 パス解決
├─ PromptLoader          → @tettuan/breakdownprompt    プロンプト処理
└─ Logger                → @tettuan/breakdownlogger    ログ出力
```

## 重要な発見事項

1. **設定の優先順位**: user.yml > app.yml > デフォルト値
2. **二段階パラメータ**: CustomConfigで"find bugs"等を定義可能
3. **Factory層の役割**: 全パス解決の中央ハブとして機能
4. **エラー伝播**: 各層で適切にthrowまたはtype:"zero"で処理
5. **STDIN対応**: InputFilePathResolverが"-"を特別処理