#!/bin/bash

# 16_custom_config_example.sh
# BreakdownParams CustomConfig 設定例
# Demonstrates CustomConfig settings in user.yml

echo "=== CustomConfig Example - Breakdown Tool ==="
echo "このexampleはuser.ymlでBreakdownParams CustomConfigを設定する方法を示します。"
echo ""

# 作業ディレクトリの準備
WORK_DIR="examples/tmp/custom_config"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

# user.yml設定ファイルの作成
echo "=== 1. user.yml設定ファイルの作成 ==="
cat > user.yml << 'EOF'
# ユーザー設定ファイル
working_dir: .agent/breakdown
app_prompt:
  base_dir: prompts
app_schema:
  base_dir: schema

# BreakdownParams カスタム設定
breakdown_params:
  custom_config:
    # パラメータ定義
    params:
      two:
        demonstrativeType:
          pattern: "^(to|from|for|migrate)$"
          errorMessage: "無効なコマンドです。使用可能: to, from, for, migrate"
        layerType:
          pattern: "^(project|issue|task|architecture|component)$"
          errorMessage: "無効なレイヤーです。使用可能: project, issue, task, architecture, component"
    
    # オプション定義
    options:
      # フラグオプション（値なし）
      flags:
        verbose:
          shortForm: "v"
          description: "詳細出力を有効化"
        dry-run:
          description: "実行せずにコマンドを確認"
        interactive:
          shortForm: "i"
          description: "インタラクティブモード"
      
      # 値オプション（値あり）
      values:
        format:
          shortForm: "f"
          description: "出力フォーマット (markdown, json, yaml)"
          valueRequired: true
        template:
          shortForm: "t"
          description: "カスタムテンプレートパス"
          valueRequired: true
        language:
          shortForm: "l"
          description: "出力言語 (ja, en)"
          valueRequired: true
      
      # カスタム変数サポート
      customVariables:
        pattern: "^uv-"
        description: "ユーザー定義変数（--uv-プレフィックス）"
    
    # バリデーション設定
    validation:
      zero:
        allowedOptions: ["help", "version", "verbose"]
        valueOptions: []
      one:
        allowedOptions: ["help", "verbose", "format"]
        valueOptions: ["format"]
      two:
        allowedOptions: ["from", "destination", "format", "template", "language", "verbose", "dry-run", "interactive", "help"]
        valueOptions: ["from", "destination", "format", "template", "language"]
    
    # エラーハンドリング設定
    errorHandling:
      unknownOption: "error"      # 不明なオプション: error/warn/ignore
      duplicateOption: "warn"     # 重複オプション: error/warn/ignore
      emptyValue: "error"         # 空の値: error/warn/ignore
EOF

echo "✅ user.yml設定ファイル作成完了"

# サンプル入力ファイルの作成
echo ""
echo "=== 2. サンプル入力ファイルの作成 ==="
cat > project_spec.md << 'EOF'
# マイクロサービスアーキテクチャ設計

## 概要
新しいEコマースシステムのマイクロサービスアーキテクチャ設計

## サービス構成
- 認証サービス
- 商品カタログサービス
- 注文管理サービス
- 決済サービス

## 技術スタック
- Node.js/TypeScript
- gRPC通信
- PostgreSQL/Redis
- Kubernetes
EOF

echo "✅ サンプル入力ファイル作成完了: project_spec.md"

# 新しいコマンドタイプのテスト（migrate）
echo ""
echo "=== 3. 拡張されたコマンドタイプのテスト ==="
echo "新しいコマンドタイプ 'migrate' を使用："
echo "breakdown migrate architecture --from project_spec.md --destination architecture_design.md"
echo ""

# 実際のコマンド実行（エラーになる可能性があるが、カスタム設定の検証用）
deno run -A ../../../cli/breakdown.ts migrate architecture \
  --from project_spec.md \
  --destination architecture_design.md 2>&1 | head -10 || true

# 新しいレイヤータイプのテスト
echo ""
echo "=== 4. 拡張されたレイヤータイプのテスト ==="
echo "新しいレイヤータイプ 'component' を使用："
echo "breakdown to component --from project_spec.md --destination component_design.md"
echo ""

deno run -A ../../../cli/breakdown.ts to component \
  --from project_spec.md \
  --destination component_design.md 2>&1 | head -10 || true

# カスタムオプションのテスト
echo ""
echo "=== 5. カスタムオプションのテスト ==="
echo "新しいオプション '--format json' と '--language ja' を使用："
echo "breakdown to task --from project_spec.md --destination tasks.json --format json --language ja"
echo ""

deno run -A ../../../cli/breakdown.ts to task \
  --from project_spec.md \
  --destination tasks.json \
  --format json \
  --language ja 2>&1 | head -10 || true

# 短縮形オプションのテスト
echo ""
echo "=== 6. 短縮形オプションのテスト ==="
echo "短縮形オプション '-f json -l ja -v' を使用："
echo "breakdown to issue -f json -l ja -v --from project_spec.md --destination issues.json"
echo ""

deno run -A ../../../cli/breakdown.ts to issue \
  -f json \
  -l ja \
  -v \
  --from project_spec.md \
  --destination issues.json 2>&1 | head -10 || true

# カスタム変数との組み合わせ
echo ""
echo "=== 7. カスタム変数との組み合わせ ==="
echo "カスタム変数と新オプションの組み合わせ："
echo "breakdown to project --from project_spec.md --destination output.md \\"
echo "  --format markdown --language ja \\"
echo "  --uv-team 'Architecture Team' \\"
echo "  --uv-priority 'High' \\"
echo "  --uv-sprint 'Sprint 2025-Q1'"
echo ""

deno run -A ../../../cli/breakdown.ts to project \
  --from project_spec.md \
  --destination output.md \
  --format markdown \
  --language ja \
  --uv-team "Architecture Team" \
  --uv-priority "High" \
  --uv-sprint "Sprint 2025-Q1" 2>&1 | head -10 || true

# エラーハンドリングのテスト
echo ""
echo "=== 8. エラーハンドリングのテスト ==="
echo "不明なオプションでエラーハンドリングをテスト："
echo "breakdown to task --unknown-option value --from project_spec.md"
echo ""

deno run -A ../../../cli/breakdown.ts to task \
  --unknown-option value \
  --from project_spec.md 2>&1 | head -5 || true

# 設定ファイルの要約
echo ""
echo "=== CustomConfig設定の要約 ==="
echo "✅ 新しいコマンドタイプ: migrate"
echo "✅ 新しいレイヤータイプ: architecture, component"
echo "✅ カスタムオプション: format, template, language"
echo "✅ フラグオプション: verbose, dry-run, interactive"
echo "✅ 短縮形サポート: -f, -t, -l, -v, -i"
echo "✅ カスタム変数: --uv-* パターン"
echo "✅ エラーハンドリング: unknown=error, duplicate=warn, empty=error"
echo ""
echo "=== 生成されたファイル ==="
echo "- user.yml          (CustomConfig設定ファイル)"
echo "- project_spec.md   (サンプル入力)"
echo ""

cd ../../..
echo ""
echo "🎉 CustomConfig設定例の実行完了！"
echo ""
echo "注意: このexampleは設定ファイルの構造を示すデモンストレーションです。"
echo "実際にBreakdownがuser.ymlのbreakdown_paramsセクションを読み込むには、"
echo "BreakdownConfigとPromptVariablesFactoryの実装更新が必要です。"