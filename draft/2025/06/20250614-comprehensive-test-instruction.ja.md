# Breakdown プロジェクト ユースケース中心テスト作成指示書

## 概要

添付された6つのプロジェクト指示書から抽出されたユースケースを網羅的に検証するための統合テストスイートを作成する。実際のユーザーが行う操作パターンを中心に、機能の動作を検証する。

## 主要ユースケースの分析

### UC1: カスタム設定を使った バグ検出ワークフロー
- **シナリオ**: `breakdown find bugs` コマンドでカスタム設定を使用
- **検証項目**: カスタム設定の適用、コマンド実行、出力生成

### UC2: チーム開発向けカスタム変数ワークフロー
- **シナリオ**: プロジェクト固有の変数（--uv-team等）を使った開発フロー
- **検証項目**: カスタム変数の設定、テンプレート適用、チーム情報の埋め込み

### UC3: 設定ファイル駆動ワークフロー
- **シナリオ**: YAML設定ファイルによる動作制御
- **検証項目**: 設定読み込み、CustomConfig構造の変換、BreakdownParamsとの連携

### UC4: エラー処理とリカバリワークフロー
- **シナリオ**: 各種エラー発生時の適切な処理とユーザーへのフィードバック
- **検証項目**: エラー検知、エラーメッセージ、リカバリ手順

### UC5: 完全統合開発ワークフロー
- **シナリオ**: プロジェクト初期化から完成まで全ステップの実行
- **検証項目**: 初期化→設定→実行→出力の連続フロー

### UC6: Examples再現ワークフロー
- **シナリオ**: examples/ 配下のスクリプトで示される実際の使用例
- **検証項目**: 各exampleの動作確認、期待される結果の検証

## ユースケース中心テスト戦略

### Phase 1: 基本ユースケーステスト
位置: `tests/0_foundation/6_usecase_validation/`

#### 1.1 基本コマンド実行テスト
```typescript
// basic_command_execution_test.ts
Deno.test("UC1: Basic find bugs command execution", async () => {
  // 基本的な `breakdown find bugs` コマンドの実行を検証
  // 入力ファイル → コマンド実行 → 出力ファイル生成
});
```

#### 1.2 設定ファイル読み込みテスト
```typescript
// config_file_loading_test.ts  
Deno.test("UC3: Configuration file driven workflow", async () => {
  // YAML設定ファイルからCustomConfig構造への変換を検証
});
```

### Phase 2: コア統合ユースケーステスト
位置: `tests/1_core/5_integration/`

#### 2.1 カスタム設定統合テスト
```typescript
// custom_config_integration_test.ts
Deno.test("UC1: Custom configuration integration workflow", async () => {
  // カスタム設定を使った完全なワークフローを検証
  // 設定読み込み → 解析 → 適用 → 実行 → 出力
});
```

#### 2.2 カスタム変数統合テスト
```typescript
// custom_variables_integration_test.ts
Deno.test("UC2: Team development custom variables workflow", async () => {
  // チーム開発向けカスタム変数の完全フローを検証
  // 変数設定 → テンプレート適用 → 出力生成
});
```

### Phase 3: 実用ユースケーステスト
位置: `tests/2_integration/2_usecases/`

#### 3.1 バグ検出ワークフローテスト
```typescript
// bug_detection_workflow_test.ts
Deno.test("UC1: Complete bug detection workflow", async () => {
  // バグを含むコードファイルからレポート生成までの全フロー
});
```

#### 3.2 チーム開発ワークフローテスト
```typescript
// team_development_workflow_test.ts
Deno.test("UC2: Team development workflow with custom variables", async () => {
  // プロジェクト情報を含んだチーム開発フローの検証
});
```

### Phase 4: 実践シナリオテスト
位置: `tests/3_scenarios/2_realistic/`

#### 4.1 完全開発サイクルテスト
```typescript
// complete_development_cycle_test.ts
Deno.test("UC5: Complete development cycle workflow", async () => {
  // プロジェクト開始から完了まで全ステップの実行
});
```

#### 4.2 エラー対応シナリオテスト
```typescript
// error_handling_scenarios_test.ts
Deno.test("UC4: Error handling and recovery workflows", async () => {
  // 各種エラーケースでのユーザー体験の検証
});
```

### Phase 5: Examples再現テスト
位置: `tests/2_integration/3_examples_reproduction/`

#### 5.1 Examples実行テスト
```typescript
// examples_execution_test.ts
Deno.test("UC6: All examples execution validation", async () => {
  // examples/ 配下の全スクリプトの動作検証
});
```

## テスト実装要件

### 1. テスト環境
- **実行方法**: `deno task ci` での統合実行
- **デバッグモード**: `DEBUG=true scripts/local_ci.sh`
- **ログ出力**: BreakdownLogger を使用した詳細ログ

## ユースケース別テストデータ

### 1. UC1: バグ検出ワークフロー用データ
```
tests/fixtures/usecases/bug_detection/
├── inputs/
│   ├── simple_bugs.js          # 基本的なバグを含むコード
│   ├── complex_bugs.ts         # 複雑なバグパターン
│   └── multi_file_project/     # 複数ファイルプロジェクト
├── configs/
│   ├── basic_bug_config.yml    # 基本バグ検出設定
│   └── advanced_bug_config.yml # 高度なバグ検出設定
└── expected_outputs/
    ├── simple_bug_report.md
    └── complex_bug_report.md
```

### 2. UC2: チーム開発ワークフロー用データ
```
tests/fixtures/usecases/team_development/
├── inputs/
│   ├── feature_request.md      # 機能要求書
│   ├── bug_report_template.md  # バグレポートテンプレート
│   └── project_planning.md     # プロジェクト計画書
├── configs/
│   ├── team_alpha_config.yml   # チームAlpha設定
│   └── team_beta_config.yml    # チームBeta設定
└── expected_outputs/
    ├── team_alpha_output.md
    └── team_beta_output.md
```

### 3. UC3: 設定ファイル駆動ワークフロー用データ
```
tests/fixtures/usecases/config_driven/
├── configs/
│   ├── minimal_config.yml      # 最小設定
│   ├── full_config.yml         # 完全設定
│   └── custom_config.yml       # カスタム設定
├── inputs/
│   └── generic_input.md        # 汎用入力ファイル
└── expected_behaviors/
    ├── minimal_behavior.json   # 最小設定時の期待動作
    └── full_behavior.json      # 完全設定時の期待動作
```

### 4. UC4: エラー処理ワークフロー用データ
```
tests/fixtures/usecases/error_handling/
├── invalid_inputs/
│   ├── corrupted_file.md       # 破損ファイル
│   ├── invalid_syntax.js       # 構文エラーファイル
│   └── missing_references/     # 参照不備
├── invalid_configs/
│   ├── malformed_config.yml    # 不正設定
│   └── missing_fields_config.yml
└── expected_errors/
    ├── input_error_messages.json
    └── config_error_messages.json
```

### 3. ユースケース検証戦略
- **ユーザー体験重視**: 実際のユーザーが行う操作フローを重視
- **エンドツーエンド**: 入力から出力まで一貫したフローの検証
- **現実的シナリオ**: 実際の開発現場で発生するケースを想定
- **エラー体験**: エラー発生時のユーザー体験も重要な検証対象

### 4. ユースケースカバレッジ要件
- **基本ユースケース**: 全ての主要機能が正常動作する
- **応用ユースケース**: 複数機能の組み合わせが正常動作する
- **エラーユースケース**: エラー時の処理が適切に動作する
- **パフォーマンス**: 実用的な応答時間で動作する

## ユースケース実装順序

### Step 1: 基本ユースケースの実装
1. UC1: 基本バグ検出ワークフローテスト
2. UC3: 基本設定ファイル駆動ワークフローテスト
3. テストデータとフィクスチャの準備

### Step 2: 応用ユースケースの実装
1. UC2: チーム開発ワークフローテスト
2. UC5: 完全統合開発ワークフローテスト
3. カスタム変数とカスタム設定の統合テスト

### Step 3: エラー対応ユースケースの実装
1. UC4: エラー処理とリカバリワークフローテスト
2. 各種エラーシナリオの網羅的テスト
3. ユーザーへのエラーフィードバック検証

### Step 4: 実践ユースケースの実装
1. UC6: Examples再現テスト
2. 実際の開発シナリオに基づくテスト
3. パフォーマンスとユーザビリティの検証

### Step 5: 統合とCI連携
1. 全ユースケースの統合テスト実行
2. CI/CDパイプラインへの組み込み
3. テスト結果レポートの自動生成

## ユースケース成功基準

### 基本ユースケース成功基準
- [ ] UC1: バグ検出ワークフローが期待通りに動作する
- [ ] UC2: チーム開発ワークフローでカスタム変数が正しく適用される
- [ ] UC3: 設定ファイルからCustomConfig構造への変換が正常に動作する
- [ ] UC4: エラー発生時に適切なメッセージとリカバリ手順が提供される
- [ ] UC5: 完全統合開発ワークフローが一貫して動作する
- [ ] UC6: 全てのexamplesが期待通りの結果を生成する

### ユーザー体験基準
- [ ] 各ユースケースが5秒以内で完了する
- [ ] エラーメッセージが分かりやすく具体的である
- [ ] 出力結果が期待される品質と形式を満たす
- [ ] ユーザーが次に何をすべきか明確である

### 技術的成功基準
- [ ] `deno task ci` が成功する
- [ ] 全てのユースケーステストが通過する
- [ ] メモリリークやリソースリークがない
- [ ] 並行実行時の競合条件がない

## ユースケーステストの保守性

### 1. ユーザーストーリー駆動ドキュメント
- 各テストは実際のユーザーストーリーに基づいて記述
- テストケース名は「ユーザーが〜したい時」の形式で命名
- 失敗時はユーザーの困った状況として説明

### 2. シナリオ拡張性
- 新しいユースケースの追加が容易
- 既存ユースケースの変更に対応可能
- テストデータの更新と管理が簡単

### 3. ユーザビリティ重視
- テスト結果からユーザー体験が理解できる
- エラー時の改善提案が含まれる
- 実際の利用シーンを想起できる

## まとめ

このユースケース中心テスト指示書は、実際のユーザーが Breakdown プロジェクトを利用する際の体験を重視した検証を行う。技術的な正確性だけでなく、ユーザーにとっての使いやすさと期待される結果の実現を保証することで、プロジェクトの実用性と品質を担保する。
