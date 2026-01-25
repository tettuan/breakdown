# 残課題・未修正項目一覧

## [OK] 修正済み（設定ファイル問題のみ）

### 1. 設定ファイル名不一致
- **問題**: `--config=default`が`default-app.yml`を要求するが`app.yml`のみ存在
- **修正**: `default-app.yml`作成済み
- **場所**: `.agent/breakdown/config/default-app.yml`, `examples/.agent/breakdown/config/default-app.yml`

### 2. テンプレートファイル不在
- **問題**: examples/実行時に`lib/breakdown/prompts/`が存在しない
- **修正**: examples/にプロンプト・スキーマファイルをコピー済み
- **場所**: `examples/lib/breakdown/prompts/`, `examples/lib/breakdown/schema/`

## [NG] 未修正（重要な問題が残存）

### 1. プロセス置換引数エラー
- **問題**: `<(echo "...")`が引数として認識され、Too many argumentsエラー
- **発生箇所**: `examples/15_pipeline_processing.sh:105行目`
- **エラー**: `$BREAKDOWN summary task --config=default <(echo "CPU: 80%...") --uv-report_type="システム状態" -o="$OUTPUT_DIR/system_status.md"`
- **修正方法**: プロセス置換をパイプに変更するか、引数解析制限を緩和
- **優先度**: [HIGH] 高

### 2. CLI側STDINタイムアウト未設定
- **問題**: `cli/breakdown.ts`でのreadStdin()呼び出し時にtimeout指定なし（無制限待機）
- **発生箇所**: `cli/breakdown.ts:48,50`
- **現状**: `readStdin({allowEmpty:false})`
- **修正方法**: `readStdin({allowEmpty:false, timeout:30000})`等の設定追加
- **優先度**: [MEDIUM] 中

### 3. 引数解析制限
- **問題**: 最大2引数制限に抵触
- **発生箇所**: プロセス置換使用時
- **影響**: 15_pipeline_processing.shの複数箇所
- **修正方法**: 引数解析ロジックの制限緩和
- **優先度**: [MEDIUM] 中

## [PENDING] 検証未完了

### 1. 14_custom_variables.sh
- **状況**: 修正効果の確認未実施
- **期待**: テンプレートファイル不在エラーの解消
- **検証方法**: `cd /Users/tettuan/github/breakdown && ./examples/14_custom_variables.sh`
- **優先度**: [LOW] 低

### 2. 18_cicd_integration.sh
- **状況**: 修正効果の確認未実施
- **期待**: テンプレートファイル不在エラーの解消
- **検証方法**: `cd /Users/tettuan/github/breakdown && ./examples/18_cicd_integration.sh`
- **優先度**: [LOW] 低

### 3. ファイル出力問題
- **問題**: 12_summary_issue.shで出力ファイルが生成されない
- **現状**: 標準出力のみ、`examples/output/summary_issue/issue_summary.md`未作成
- **調査必要**: 出力ディレクトリ作成、ファイル書き込み権限、パス解決
- **優先度**: [MEDIUM] 中

## 実行コマンド例

### 未修正項目の対処

#### 1. プロセス置換エラー修正
```bash
# 15_pipeline_processing.sh:105行目を修正
# 変更前: $BREAKDOWN summary task --config=default <(echo "CPU: 80%...") 
# 変更後: echo "CPU: 80%..." | $BREAKDOWN summary task --config=default --from=-
```

#### 2. STDINタイムアウト設定
```bash
# cli/breakdown.ts の readStdin() 呼び出し箇所を修正
# 変更前: readStdin({allowEmpty:false})
# 変更後: readStdin({allowEmpty:false, timeout:30000})
```

### 検証コマンド

```bash
# 14_custom_variables.sh検証
cd /Users/tettuan/github/breakdown && ./examples/14_custom_variables.sh

# 18_cicd_integration.sh検証  
cd /Users/tettuan/github/breakdown && ./examples/18_cicd_integration.sh

# ファイル出力確認
ls -la examples/output/summary_issue/
```

## 完了条件

- [ ] プロセス置換引数エラーの修正
- [ ] STDINタイムアウト設定の追加
- [ ] 引数解析制限の緩和
- [ ] 14_custom_variables.sh の動作確認
- [ ] 18_cicd_integration.sh の動作確認  
- [ ] ファイル出力問題の解決
- [ ] `deno task ci` の成功確認