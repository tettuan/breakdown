# テスト仕様 - 実行ガイド

> **重要**: このドキュメントは**テスト実行の実用的なガイド**です。完全なテスト戦略については [../../tests/README.md](../../tests/README.md) を参照してください。

## 現在の状況

### テスト戦略の確立

**ドメイン駆動設計**に基づくテスト戦略が確立されています：

- **完全なテスト戦略**: [../../tests/README.md](../../tests/README.md)
- **テスト配置**: `tests/` 配下（番号付きドメイン構造）
- **実行状況**: 188テストファイルの完全移行完了

### テスト配置の方針

- **単体テスト**: `lib/`配下の実装ファイルと同じディレクトリに配置
- **統合・E2Eテスト**: `tests/`配下の独立したテストディレクトリに配置

```
lib/                          # 実装ファイル + 単体テスト
├── domain/
│   ├── service.ts
│   └── service.test.ts       # 単体テスト（実装と同じ場所）
└── ...

tests/                        # 統合・E2Eテスト専用
├── 0_core_domain/            # 核心ドメイン統合テスト
├── 4_cross_domain/           # ドメイン間統合テスト
│   ├── collaboration/        # ドメイン間協働・結合テスト
│   └── e2e/                 # システム全体のE2Eテスト
└── ...
```

## テスト実行方法

### 基本的な実行方法

```bash
# 単体テスト実行（lib/配下）
deno test lib/

# 統合・E2Eテスト実行（tests/配下）
deno test tests/

# 全テスト実行（推奨：単体テスト → 統合テスト の順序）
deno test lib/ && deno test tests/

# 全ドメインテスト実行（番号順に実行される）
deno test tests/

# ドメイン別実行（推奨される実行順序）
deno test tests/0_core_domain/        # 核心ドメイン（最優先）
deno test tests/1_supporting_domain/  # 支援ドメイン
deno test tests/2_generic_domain/     # 技術基盤
deno test tests/3_interface_layer/    # インターフェース層
deno test tests/4_cross_domain/       # 統合テスト（最後）
```

### テストカテゴリ別実行

```bash
# 単体テスト（lib/配下）
deno test lib/ --filter="0_architecture"  # アーキテクチャ制約テスト
deno test lib/ --filter="1_behavior"      # 動作検証テスト
deno test lib/ --filter="2_structure"     # 構造整合性テスト

# 統合・E2Eテスト（tests/配下）
deno test tests/*/3_core/             # コア機能テスト
deno test tests/4_cross_domain/e2e/     # E2Eテスト
deno test tests/4_cross_domain/collaboration/  # 結合テスト
```

### 実行順序の設計思想

1. **`0_architecture/`**: システムの基盤が正しく構築されていることを最初に検証
2. **`1_behavior/`**: 基本機能が正常に動作することを検証
3. **`2_structure/`**: データ構造の整合性を検証
4. **`3_core/`**: ドメイン内統合機能を検証
5. **`4_cross_domain/`**: システム全体の協働を最後に検証

### CI/CDでの実行

```bash
# 従来のCI実行方法（スクリプト使用）
bash scripts/local_ci.sh

# 段階的実行（推奨）
deno test lib/                    # 単体テスト
deno test tests/0_core_domain/    # 核心ドメイン統合テスト
deno test tests/4_cross_domain/   # E2E・結合テスト
```

## デバッグとログ出力

### BreakdownLoggerの使用

BreakdownLoggerは**テストコードでのみ使用**してください：

```typescript
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("domain-test");
logger.debug("ドメインテスト実行開始", { 
  domain: "core_domain",
  testCase: "prompt_path_resolution" 
});
```

### デバッグログレベルとフィルタリング

- `LOG_LEVEL`: debug, info, warn, error
- `LOG_KEY`: 特定モジュールのフィルタリング
- `LOG_LENGTH`: メッセージ長制御

詳細は [debug.ja.md](./debug.ja.md) を参照してください。

### LOG_KEY による特定ログの抽出

特定のキーワードを含むログメッセージのみを出力：

```bash
# 特定の機能に関連するログのみ表示
LOG_KEY="parser" deno test --allow-env --allow-write --allow-read

# 複数のキーワードでフィルタリング
LOG_KEY="parser,validation" deno test --allow-env --allow-write --allow-read
```

### LOG_LENGTH による出力制御

```bash
# 短縮表示（100文字）
LOG_LENGTH=S deno test --allow-env --allow-write --allow-read

# 詳細表示（制限なし）
LOG_LENGTH=W deno test --allow-env --allow-write --allow-read
```

### テスト段階別のログ設定

```bash
# 開発・デバッグ時
LOG_LEVEL=debug LOG_LENGTH=W deno test

# 特定機能のテスト時
LOG_KEY="target_function" LOG_LEVEL=debug deno test

# CI実行時
LOG_LEVEL=info LOG_LENGTH=S deno test
```

## エラー処理とデバッグ

### エラー発生時の調査手順

1. デバッグログの確認
2. テスト環境の状態確認
3. 関連するテストケースの実行
4. エラー再現手順の文書化

### テスト失敗時の対応

1. エラーメッセージの確認
2. デバッグモードでの再実行
3. 関連する実装の確認
4. テスト失敗の前処理判定
5. 修正と再テスト

### テスト失敗の前処理判定

- テストの目的ではない前処理で失敗した場合、別の処理前のテストが必要
- 前処理のテストは実行順を前段階で配置する
- 前処理の例：
  - 設定判定のテストだが設定ファイルの読み込みに失敗する
    → 設定ファイルの読み込みテストを作る
- テストの前処理は、該当テストより前に実施された確認済みプロセスを利用すること

---

**役割**: このドキュメントは**テスト実行の実用的なガイド**です  
**完全なテスト戦略**: [../../tests/README.md](../../tests/README.md) を参照
