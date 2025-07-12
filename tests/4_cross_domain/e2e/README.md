# E2E テストシナリオ設計書

## 概要

このディレクトリには、Breakdown システム全体のエンドツーエンド（E2E）テストシナリオが含まれています。これらのテストは、全ドメインの統合後に実行され、CLIからプロンプト生成まで全工程をカバーします。

## 設計原則

### 1. 全工程カバレッジ

E2Eテストは以下の全ての段階をカバーします：

1. **CLI引数解析** - BreakdownParams による引数処理
2. **設定読み込み** - BreakdownConfig による設定管理
3. **型安全変換** - DirectiveType, LayerType の生成
4. **パス解決** - プロンプト・スキーマファイルパス決定
5. **変数生成** - PromptVariables の構築
6. **プロンプト生成** - BreakdownPrompt による最終出力
7. **出力処理** - 結果の出力と検証

### 2. リアルワールドシナリオ

実際のユーザー利用シナリオに基づくテストケース：

- **開発者の日常業務**: プロジェクト分析、課題分解、タスク管理
- **複数プロファイル**: 開発、ステージング、本番環境での動作
- **エラーハンドリング**: 不正入力、ファイル不足、権限エラーなど
- **パフォーマンス**: 大規模データ、並行処理、メモリ使用量

### 3. Totality準拠

すべてのテストケースでTotality原則に準拠：

- **完全性**: すべてのエラーケースの明示的処理
- **型安全性**: Result型による確実なエラーハンドリング
- **一貫性**: 全ドメインでの統一されたエラー伝播

## テストシナリオ分類

### Tier 1: 基本機能シナリオ

最小限の正常系動作を検証する基本テスト群。

#### S1.1: 基本コマンド実行
```bash
breakdown to project sample.md
```

**期待結果**:
- DirectiveType: "to", LayerType: "project" の正常生成
- プロンプトテンプレート読み込み成功
- 変数置換完了
- 最終プロンプト出力

#### S1.2: 異なる組み合わせ
```bash
breakdown summary issue bug-report.md
breakdown defect task error-analysis.md
```

**期待結果**:
- 各組み合わせの適切なパス解決
- 層固有のテンプレート適用
- コンテキスト保持

#### S1.3: STDIN入力処理
```bash
echo "content" | breakdown to project
```

**期待結果**:
- STDIN読み込み成功
- 入力内容の変数への組み込み
- パイプライン処理の安定性

### Tier 2: 設定・環境シナリオ

多様な設定環境での動作を検証する応用テスト群。

#### S2.1: プロファイル切り替え
```bash
BREAKDOWN_PROFILE=development breakdown to project input.md
BREAKDOWN_PROFILE=production breakdown summary issue input.md
```

**期待結果**:
- プロファイル固有設定の適用
- パターンバリデーションの変更
- 出力フォーマットの切り替え

#### S2.2: カスタム設定ファイル
```bash
breakdown --config custom-app.yml to project input.md
```

**期待結果**:
- カスタム設定の読み込み
- デフォルト設定のオーバーライド
- 設定継承の適切な処理

#### S2.3: ワークスペース設定
```bash
cd project-workspace && breakdown to issue workspace-file.md
```

**期待結果**:
- ワークスペース固有設定の検出
- 相対パス解決の正確性
- プロジェクト固有テンプレートの使用

### Tier 3: エラーハンドリングシナリオ

異常系・エラー状況での resilience を検証する頑健性テスト群。

#### S3.1: 無効引数エラー
```bash
breakdown invalid_directive project input.md
breakdown to invalid_layer input.md
breakdown to project nonexistent.md
```

**期待結果**:
- 段階的エラー検出（BreakdownParams → DirectiveType/LayerType）
- ユーザーフレンドリーなエラーメッセージ
- 適切な終了コード

#### S3.2: ファイルシステムエラー
```bash
breakdown to project /protected/file.md  # 権限エラー
breakdown to project huge-file.md        # 大容量ファイル
```

**期待結果**:
- 権限エラーの適切なハンドリング
- メモリ制限の尊重
- リソースクリーンアップ

#### S3.3: 設定エラー
```bash
breakdown --config broken-config.yml to project input.md
breakdown --config missing-config.yml to project input.md
```

**期待結果**:
- 設定ファイル破損の検出
- フォールバック機構の動作
- エラー詳細情報の提供

### Tier 4: パフォーマンス・スケーラビリティシナリオ

システムの性能と拡張性を検証する負荷テスト群。

#### S4.1: 大規模データ処理
```bash
breakdown to project large-document.md    # 10MB+ファイル
breakdown summary project complex-project.md  # 複雑構造
```

**期待結果**:
- メモリ使用量の制御（<500MB）
- 処理時間の許容範囲（<30秒）
- ガベージコレクションの効率性

#### S4.2: 並行処理
```bash
# 同時に10プロセス実行
for i in {1..10}; do
  breakdown to project "input-${i}.md" &
done
wait
```

**期待結果**:
- 並行処理の安全性
- リソース競合の回避
- 一貫した結果出力

#### S4.3: 連続処理
```bash
# 100回連続実行
for i in {1..100}; do
  breakdown to project input.md
done
```

**期待結果**:
- メモリリークの防止
- パフォーマンス劣化の回避
- 安定した処理時間

### Tier 5: 統合・互換性シナリオ

外部システムや異なる環境での統合動作を検証する相互運用性テスト群。

#### S5.1: JSRパッケージ統合
```typescript
// プログラマティック利用
import { Breakdown } from "@tettuan/breakdown";
const result = await Breakdown.process(["to", "project", "input.md"]);
```

**期待結果**:
- APIとCLIの一貫性
- TypeScript型安全性
- モジュール境界の適切性

#### S5.2: CI/CD環境
```bash
# GitHub Actions環境
docker run --rm -v $(pwd):/workspace breakdown to project README.md
```

**期待結果**:
- コンテナ環境での安定動作
- 環境変数の適切な処理
- ログ出力の構造化

#### S5.3: 異なるシェル環境
```bash
# Fish shell
breakdown to project input.md

# Zsh with custom settings
breakdown to project input.md

# PowerShell (Windows)
breakdown to project input.md
```

**期待結果**:
- シェル固有の引数処理
- 文字エンコーディング対応
- プラットフォーム固有パス処理

## 実装戦略

### Phase 1: コアシナリオ実装
- Tier 1 基本機能シナリオの完全実装
- 核心ドメインの統合動作検証
- CI/CD パイプラインへの組み込み

### Phase 2: 応用シナリオ拡張
- Tier 2 設定・環境シナリオの実装
- 支援ドメインとの統合検証
- パフォーマンスベースライン確立

### Phase 3: 頑健性テスト強化
- Tier 3 エラーハンドリングシナリオの実装
- カオスエンジニアリング手法の導入
- セキュリティ観点の検証

### Phase 4: スケーラビリティ検証
- Tier 4 パフォーマンス・スケーラビリティシナリオの実装
- ベンチマーク自動化
- パフォーマンス回帰検出

### Phase 5: エコシステム統合
- Tier 5 統合・互換性シナリオの実装
- 外部システム連携テスト
- 長期安定性検証

## 期待される成果

### 1. 品質保証
- 全機能の動作保証
- エラーケースの完全カバレッジ
- パフォーマンス要件の充足

### 2. 開発者体験
- 明確なテスト仕様による開発ガイド
- 回帰防止による安定した開発サイクル
- デバッグ支援情報の充実

### 3. 運用安定性
- 本番環境での信頼性確保
- モニタリング・アラート基準の確立
- インシデント予防体制の構築

### 4. 継続的改善
- テスト駆動による機能改善
- ユーザーフィードバックループの確立
- システム進化の品質保証

---

このE2Eテストシナリオ設計書は、Breakdown システムの全体品質を保証し、ユーザーに信頼性の高い体験を提供するための包括的なテスト戦略を提供します。