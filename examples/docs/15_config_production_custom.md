# Example 15: Production Custom Configuration with Advanced Error Handling

## 概要

`15_config_production_custom.sh`は、Breakdown CLIの本番環境向け高度な設定例です。特に、エラーハンドリング、作業ディレクトリ管理、JSRパッケージの使用方法、そしてfind bugs機能の準備状況を詳細に示しています。

## 主な特徴

### 1. 高度なエラーハンドリング

#### Bashの厳格モード
```bash
set -euo pipefail
```
- `-e`: コマンドエラー時に即座に終了
- `-u`: 未定義変数の使用を防止
- `-o pipefail`: パイプライン内のエラーも検出

#### カスタムエラーハンドラー
```bash
handle_error() {
    cd "$ORIGINAL_CWD"
    echo "Error: $1" >&2
    exit 1
}
```

#### trapによる自動クリーンアップ
```bash
trap 'cd "$ORIGINAL_CWD"; handle_error "Command failed: ${BASH_COMMAND}"' ERR
trap 'cd "$ORIGINAL_CWD"' EXIT
```

### 2. 作業ディレクトリの確実な管理

- **元のディレクトリの保存**: `ORIGINAL_CWD="$(pwd)"`
- **自動復帰**: trapによりエラー時も正常終了時も元のディレクトリに戻る
- **エラー時の詳細情報**: 失敗したコマンドを表示

### 3. 包括的な設定ファイル

```yaml
customConfig:
  enabled: true
  find:
    twoParams:
      - bugs
      - issues
      - todos
  findBugs:
    enabled: true
    sensitivity: medium
    patterns:
      - TODO
      - FIXME
      - BUG
      - HACK
      - XXX
      - DEPRECATED
    includeExtensions:
      - .ts
      - .js
      - .tsx
      - .jsx
      - .md
    excludeDirectories:
      - node_modules
      - .git
      - dist
      - build
      - coverage
      - .obsidian
    maxResults: 100
    detailedReports: true
```

### 4. テストプロジェクトの構造

スクリプトは以下の構造を持つテストプロジェクトを生成します：

```
tmp/production-custom-test/
├── src/
│   ├── services/
│   │   └── api_service.ts      # APIサービスの実装
│   ├── components/
│   │   └── UserProfile.tsx     # Reactコンポーネント
│   └── utils/
│       └── auth.ts             # 認証ユーティリティ
├── tests/
└── README.md                   # プロジェクトドキュメント
```

### 5. セキュリティとパフォーマンスの問題例

#### api_service.ts
- 設定のハードコード
- レート制限の欠如
- エラー処理の不備
- キャッシュのメモリリーク

#### UserProfile.tsx
- useEffectの依存配列の欠如
- 型定義の不足
- nullチェックの欠如

#### auth.ts
- 脆弱なパスワードハッシュ（Base64）
- ハードコードされた管理者認証
- 予測可能なセッションID生成

### 6. JSRパッケージの使用デモンストレーション

スクリプトは、Breakdown CLIをJSRパッケージとして使用する方法を示します：

```typescript
// JSRパッケージからのインポート
import { breakdown } from 'jsr:@tettuan/breakdown';

// CLIとしての実行
deno run -A jsr:@tettuan/breakdown/cli <command>

// denoタスクとしての実行
deno task breakdown <command>
```

### 7. Find Bugs機能の実装状況

スクリプトは現在の実装状況を明確に示します：

**実装済み**:
- ✅ プロンプトファイル: `lib/breakdown/prompts/find/bugs/`
- ✅ スキーマファイル: `lib/breakdown/schema/find/bugs/`
- ✅ 型定義: DemonstrativeTypeとLayerType

**未実装**:
- ❌ app.ymlでの'find'パターンの有効化
- ❌ app.ymlでの'bugs'パターンの有効化

## 使用方法

```bash
# スクリプトの実行
./examples/15_config_production_custom.sh

# 任意のディレクトリから実行（自動的に元のディレクトリに戻る）
bash /path/to/examples/15_config_production_custom.sh
```

## エラーハンドリングの例

1. **ディレクトリ作成失敗時**:
   ```
   Error: Failed to create config directory
   ```

2. **コマンド実行失敗時**:
   ```
   Error: Command failed: mkdir -p non_existent_path/subfolder
   ```

3. **スクリプトディレクトリへの移動失敗時**:
   ```
   Error: Failed to change to script directory
   ```

## 設定ファイルの配置

新しい構造では、設定ファイルは以下の場所に配置されます：

- **システム設定**: `.agent/breakdown/config/app.yml`
- **ユーザー設定**: `.agent/breakdown/config/user.yml`
- **本番環境設定**: `.agent/breakdown/config/production-user.yml`

## ベストプラクティス

1. **エラーハンドリング**: 常に`set -euo pipefail`を使用
2. **作業ディレクトリ**: trapを使用して元のディレクトリへの復帰を保証
3. **設定の検証**: 設定ファイルの存在を確認してから処理を実行
4. **クリーンアップ**: 一時ファイルは自動的に削除
5. **詳細なログ**: エラー時には失敗したコマンドを表示

## 関連ファイル

- `examples/14_config_production_example.sh`: 基本的なfind bugs機能の例
- `docs/breakdown/breakdownconfig/`: BreakdownConfigの詳細ドキュメント
- `lib/cli/config/`: 設定ファイルの処理ロジック

## 今後の展望

Find bugs機能を完全に有効化するには：

1. `app.yml`のdemonstrativeTypeパターンに'find'を追加
2. `app.yml`のlayerTypeパターンに'bugs'を追加
3. 既存の2パラメータCLIロジックがコマンドを処理

これにより、`breakdown find bugs`コマンドが完全に機能するようになります。