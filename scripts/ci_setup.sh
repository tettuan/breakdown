#!/bin/bash

# ===============================================================================
# ci_setup.sh - CI環境での初期セットアップスクリプト
#
# Purpose:
#   CI環境でBreakdownが動作するために必要な最小限のテンプレート構造を生成
#   テストが実行できる最小限の環境を確実に構築
#
# Usage:
#   ./scripts/ci_setup.sh
#
# ===============================================================================

set -euo pipefail

echo "🚀 Setting up CI environment for Breakdown..."

# プロジェクトルートの確認
if [[ ! -f "deno.json" ]]; then
    echo "❌ Error: Must be run from project root (deno.json not found)"
    exit 1
fi

# 必要なディレクトリを作成
echo "📁 Creating required directories..."
mkdir -p prompts/to/project
mkdir -p prompts/to/issue  
mkdir -p prompts/to/task
mkdir -p prompts/summary/project
mkdir -p prompts/summary/issue
mkdir -p prompts/summary/task
mkdir -p prompts/defect/project
mkdir -p prompts/defect/issue
mkdir -p prompts/defect/task

# テスト用のプロンプトディレクトリも作成
echo "📁 Creating test fixture directories..."
mkdir -p tests/fixtures/prompts/to/project
mkdir -p tests/fixtures/prompts/to/issue  
mkdir -p tests/fixtures/prompts/to/task
mkdir -p tests/fixtures/prompts/summary/project
mkdir -p tests/fixtures/prompts/summary/issue
mkdir -p tests/fixtures/prompts/summary/task
mkdir -p tests/fixtures/prompts/defect/project
mkdir -p tests/fixtures/prompts/defect/issue
mkdir -p tests/fixtures/prompts/defect/task

mkdir -p schema/to/project
mkdir -p schema/to/issue
mkdir -p schema/to/task
mkdir -p schema/summary/project
mkdir -p schema/summary/issue
mkdir -p schema/summary/task
mkdir -p schema/defect/project
mkdir -p schema/defect/issue
mkdir -p schema/defect/task

mkdir -p config
mkdir -p output
mkdir -p input
mkdir -p tmp

echo "📄 Creating minimal template files..."

# 基本的なプロンプトテンプレートを作成
create_template() {
    local directive=$1
    local layer=$2
    local content="# $directive $layer Prompt

Transform the input using $directive approach for $layer level.

## Input
{{input_content}}

## Instructions
- Apply $directive methodology
- Focus on $layer level analysis
- Provide structured output

## Output Format
Structured $directive analysis for $layer level."

    # メインプロンプトディレクトリ
    echo "$content" > "prompts/$directive/$layer/f_$layer.md"
    
    # テストフィクスチャー用
    if [ ! -f "tests/fixtures/prompts/$directive/$layer/f_$layer.md" ]; then
        echo "$content" > "tests/fixtures/prompts/$directive/$layer/f_$layer.md"
    fi
}

# 必要な全組み合わせのテンプレートを作成
for directive in to summary defect; do
    for layer in project issue task; do
        create_template "$directive" "$layer"
    done
done

# 基本的なスキーマファイルを作成
cat > schema/to/project/default.json << 'EOF'
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "project": {
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "description": {"type": "string"},
        "tasks": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "id": {"type": "string"},
              "title": {"type": "string"}
            }
          }
        }
      }
    }
  }
}
EOF

cat > schema/summary/project/default.json << 'EOF'
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "summary": {
      "type": "string",
      "description": "Project summary"
    }
  }
}
EOF

cat > schema/defect/project/default.json << 'EOF'
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "defects": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "type": {"type": "string"},
          "description": {"type": "string"},
          "severity": {"type": "string"}
        }
      }
    }
  }
}
EOF

# 既存の設定ファイルがない場合のみ作成
if [[ ! -f "config/default-app.yml" ]]; then
    cp .agent/breakdown/config/default-app.yml config/default-app.yml || true
fi

if [[ ! -f "config/default-user.yml" ]]; then
    cp config/default-user.yml config/default-user.yml 2>/dev/null || cat > config/default-user.yml << 'EOF'
params:
  two:
    directiveType:
      patterns:
        - "^to$"
        - "^summary$"
        - "^defect$"
    layerType:
      patterns:
        - "^project$"
        - "^issue$"
        - "^task$"
EOF
fi

echo "✅ CI environment setup completed successfully!"
echo "📊 Created directories and template files for basic Breakdown functionality"

# ファイル構造の確認
echo ""
echo "📋 Directory structure:"
find prompts schema -type f | head -10
echo "... and more files"

echo ""
echo "🚀 Ready for CI tests!"