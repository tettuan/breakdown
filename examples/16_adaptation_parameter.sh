#!/bin/bash
# Example 20: Adaptation Parameter Template Selection
# This example demonstrates how the -a/--adaptation parameter affects template selection

# === 実装状況 ===
# --adaptation パラメータは実装予定の機能要件です。
# このスクリプトは、将来実装される機能の期待動作を示すための参考例です。
# 現在は、DirectiveType と LayerType の組み合わせを使用してください。
# ===

set -euo pipefail

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Error handling
handle_error() {
    cd "$ORIGINAL_CWD"
    echo "Error: $1" >&2
    exit 1
}

# Set trap for error handling and cleanup
trap 'cd "$ORIGINAL_CWD"' EXIT
trap 'handle_error "Command failed: ${BASH_COMMAND}"' ERR

# Get script directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || handle_error "Failed to change to script directory"

echo "=== Example 20: Adaptation Parameter (--adaptation/-a) Template Selection ==="
echo "This example demonstrates how --adaptation affects which template variant is selected"
echo
echo "📖 仕様参照: docs/breakdown/generic_domain/system/overview/glossary.ja.md"
echo "   - 118-119行目: -i, --input オプションの説明"
echo "   - 83行目: adaptationType の説明"
echo
echo "🎯 実装されている動作:"
echo "   1. プロンプトテンプレートパス: {base_dir}/{directiveType}/{layerType}/f_{fromLayerType}[_{adaptation}].md"
echo "   2. fromLayerType指定: --input パラメータで明示的に指定（推奨）"
echo "   3. adaptation適用: --adaptation指定時は f_{fromLayerType}_{adaptation}.md を使用"
echo "   4. フォールバック: adaptation テンプレートが存在しない場合は基本テンプレートを使用"
echo

# Set up
OUTPUT_DIR="./output/adaptation_parameter_test"
TEMPLATE_DIR="./.agent/breakdown/prompts/to/task"
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMPLATE_DIR"

# Ensure breakdown is available
if command -v breakdown &> /dev/null; then
    BREAKDOWN="breakdown"
else
    BREAKDOWN='deno run --allow-all ../cli/breakdown.ts'
fi

# Create required template files for CLI commands in this script
echo "=== Creating Required Template Files ==="

# This script tests --adaptation parameter with "breakdown to task" commands
# Commands executed: 
# - breakdown to task (default, needs f_task.md)
# - breakdown to task --adaptation=strict (needs f_task_strict.md)
# - breakdown to task --adaptation=agile (needs f_task_agile.md) 
# - breakdown to task --adaptation=detailed (needs f_task_detailed.md)
# - breakdown to task --adaptation=custom (fallback to f_task.md)

mkdir -p "$TEMPLATE_DIR"

# Base template (no adaptation)
cat > "$TEMPLATE_DIR/f_task.md" << 'EOF'
# Standard Task Breakdown

## Template: DEFAULT (no adaptation)
This is the standard template used when no adaptation is specified.

## Input
{{input_text}}

## Task Breakdown
Here are the tasks in standard format...

## Output
Standard task list with basic structure.
EOF

# Strict adaptation template
cat > "$TEMPLATE_DIR/f_task_strict.md" << 'EOF'
# Strict Task Breakdown

## Template: STRICT ADAPTATION
This template enforces rigid formatting and detailed specifications.

## Input
{{input_text}}

## Strict Task Analysis
1. **Mandatory Requirements**: Non-negotiable specifications
2. **Compliance Checks**: Required validations and standards
3. **Detailed Specifications**: Comprehensive technical requirements
4. **Quality Gates**: Strict acceptance criteria

## Output
Highly detailed, compliance-focused task breakdown with strict formatting.
EOF

# Agile adaptation template  
cat > "$TEMPLATE_DIR/f_task_agile.md" << 'EOF'
# Agile Task Breakdown

## Template: AGILE ADAPTATION  
This template follows agile methodology patterns and practices.

## Input
{{input_text}}

## Agile Task Analysis
1. **User Stories**: Feature breakdown from user perspective
2. **Sprint Planning**: Iterative development approach
3. **Story Points**: Relative estimation and complexity
4. **Definition of Done**: Clear completion criteria

## Output
Agile-formatted task breakdown with user stories and sprint structure.
EOF

# Detailed adaptation template
cat > "$TEMPLATE_DIR/f_task_detailed.md" << 'EOF'
# Detailed Task Breakdown

## Template: DETAILED ADAPTATION
This template provides comprehensive analysis and extensive documentation.

## Input  
{{input_text}}

## Detailed Task Analysis
1. **Comprehensive Planning**: Thorough requirement analysis
2. **Risk Assessment**: Detailed risk identification and mitigation
3. **Resource Planning**: Extensive resource allocation and timeline
4. **Documentation**: Complete specification and design docs

## Output
Extensively detailed task breakdown with comprehensive documentation.
EOF

echo "✓ Created adaptation templates: f_task.md, f_task_strict.md, f_task_agile.md, f_task_detailed.md"
echo

# Create test input file
echo "=== Creating Test Input File ==="
cat > "$OUTPUT_DIR/project_requirements.md" << 'EOF'
# Project Requirements

## User Management System
- User registration and authentication
- Role-based access control
- Password reset functionality
- User profile management
- Activity logging

## Technical Requirements
- RESTful API design
- JWT authentication
- PostgreSQL database
- Comprehensive testing
- API documentation
EOF
echo "✅ Created test input file"
echo

# Create different adaptation templates
echo "=== Creating Adaptation Template Variants ==="

# Default template (no adaptation)
cat > "$TEMPLATE_DIR/f_project.md" << 'EOF'
# Standard Task Breakdown

## Template: DEFAULT (no adaptation)
This is the standard template used when no adaptation is specified.

## Input
{{input_text}}

## Task Breakdown
Here are the tasks in standard format...
EOF

# Strict adaptation template
cat > "$TEMPLATE_DIR/f_project_strict.md" << 'EOF'
# Strict Task Breakdown

## Template: STRICT Adaptation
This template enforces strict formatting and detailed specifications.

## Requirements Specification
{{input_text}}

## Strict Task Definition
Each task must include:
- Clear acceptance criteria
- Time estimates
- Dependencies
- Risk assessment

### Tasks with Strict Format:
1. Task ID: T001
   - Description: [Detailed description]
   - Acceptance Criteria: [Specific criteria]
   - Estimate: [Hours]
   - Dependencies: [List]
EOF

# Agile adaptation template
cat > "$TEMPLATE_DIR/f_project_agile.md" << 'EOF'
# Agile Task Breakdown

## Template: AGILE Adaptation
This template follows agile methodology patterns.

## Product Backlog Input
{{input_text}}

## User Stories and Tasks
Following agile methodology:

### Epic: User Management System
As a product owner, I want user management functionality...

#### User Stories:
- As a user, I want to register...
- As an admin, I want to manage roles...

#### Sprint Tasks:
- Story points estimation
- Sprint planning considerations
EOF

# Detailed adaptation template
cat > "$TEMPLATE_DIR/f_project_detailed.md" << 'EOF'
# Detailed Task Breakdown

## Template: DETAILED Adaptation
This template provides comprehensive task analysis.

## System Requirements
{{input_text}}

## Comprehensive Task Analysis
### Technical Architecture Tasks
- Database schema design
- API endpoint planning
- Security implementation

### Development Tasks
- Frontend components
- Backend services
- Integration layers

### Quality Assurance Tasks
- Unit test creation
- Integration testing
- Performance testing
EOF

echo "✅ Created adaptation templates:"
echo "  - f_project.md (default, no adaptation)"
echo "  - f_project_strict.md (--adaptation=strict)"
echo "  - f_project_agile.md (--adaptation=agile)"
echo "  - f_project_detailed.md (--adaptation=detailed)"
echo

# Demonstration
echo "=== Demonstration of --adaptation Parameter ==="
echo

# Example 1: Without adaptation (default)
echo "【Example 1: Without --adaptation parameter】"
echo "Command: breakdown to task --from=project_requirements.md"
echo "🎯 動作: fromLayerType='task' (デフォルト値) または --input で明示指定"
echo "📄 使用テンプレート: .agent/breakdown/prompts/to/task/f_task.md (デフォルト)"
echo "📖 参照: glossary.ja.md 118-119行目 (--input オプションによる明示指定)"
echo

$BREAKDOWN to task --from="$OUTPUT_DIR/project_requirements.md" -o="$OUTPUT_DIR/result_no_adaptation.md" > "$OUTPUT_DIR/result_no_adaptation.md" 2>&1

if [ -f "$OUTPUT_DIR/result_no_adaptation.md" ]; then
    echo "Result preview:"
    grep -A 2 "Template:" "$OUTPUT_DIR/result_no_adaptation.md" 2>/dev/null | sed 's/^/  /' || head -5 "$OUTPUT_DIR/result_no_adaptation.md" | sed 's/^/  /'
    echo
    
    # Check which template was used
    if grep -q "Template: DEFAULT" "$OUTPUT_DIR/result_no_adaptation.md"; then
        echo "✅ Used default template (f_project.md)"
    else
        echo "⚠️  期待されたテンプレートマーカーが見つからない"
        echo "💡 デバッグ情報: 実際のテンプレートファイル確認 → ls -la $TEMPLATE_DIR/f_*.md"
        echo "📖 仕様確認: glossary.ja.md でfromLayerType推定ロジックを参照"
    fi
fi
echo

# Example 2: With --adaptation=strict
echo "【Example 2: With --adaptation=strict】"
echo "Command: breakdown to task --from=project_requirements.md --adaptation=strict"
echo "🎯 動作: fromLayerType='task' (デフォルト) + adaptation='strict'"
echo "📄 使用テンプレート: .agent/breakdown/prompts/to/task/f_task_strict.md"
echo "📖 参照: glossary.ja.md 83行目 (adaptationType)"
echo

$BREAKDOWN to task --from="$OUTPUT_DIR/project_requirements.md" --adaptation=strict -o="$OUTPUT_DIR/result_strict.md" > "$OUTPUT_DIR/result_strict.md" 2>&1

if [ -f "$OUTPUT_DIR/result_strict.md" ]; then
    echo "Result preview:"
    grep -A 2 "Template:" "$OUTPUT_DIR/result_strict.md" 2>/dev/null | sed 's/^/  /' || head -5 "$OUTPUT_DIR/result_strict.md" | sed 's/^/  /'
    echo
    
    # Check which template was used
    if grep -q "Template: STRICT" "$OUTPUT_DIR/result_strict.md"; then
        echo "✅ Used strict adaptation template (f_project_strict.md)"
    elif grep -q "Task ID:" "$OUTPUT_DIR/result_strict.md"; then
        echo "✅ Found strict format markers"
    else
        echo "⚠️  adaptation テンプレートが使用されていない可能性"
        echo "💡 フォールバック動作: adaptation テンプレートが見つからない場合は基本テンプレートを使用"
        echo "🔍 確認手順: 1) テンプレートファイル存在確認 2) fromLayerType推定結果確認"
        echo "📖 仕様: glossary.ja.md template path resolution"
    fi
fi
echo

# Example 3: With --adaptation=agile
echo "【Example 3: With --adaptation=agile】"
echo "Command: breakdown to task --from=project_requirements.md --adaptation=agile"
echo "Expected: Should use f_project_agile.md template"
echo

$BREAKDOWN to task --from="$OUTPUT_DIR/project_requirements.md" --adaptation=agile -o="$OUTPUT_DIR/result_agile.md" > "$OUTPUT_DIR/result_agile.md" 2>&1

if [ -f "$OUTPUT_DIR/result_agile.md" ]; then
    echo "Result preview:"
    grep -A 2 "Template:" "$OUTPUT_DIR/result_agile.md" 2>/dev/null | sed 's/^/  /' || head -5 "$OUTPUT_DIR/result_agile.md" | sed 's/^/  /'
    echo
    
    # Check which template was used
    if grep -q "Template: AGILE" "$OUTPUT_DIR/result_agile.md"; then
        echo "✅ Used agile adaptation template (f_project_agile.md)"
    elif grep -q "User Stories" "$OUTPUT_DIR/result_agile.md"; then
        echo "✅ Found agile format markers"
    else
        echo "⚠️  May have fallen back to default template"
    fi
fi
echo

# Example 4: With short form -a
echo "【Example 4: Using short form -a=】"
echo "Command: breakdown to task --from=project_requirements.md -a=detailed"
echo "Expected: Should use f_project_detailed.md template"
echo

$BREAKDOWN to task --from="$OUTPUT_DIR/project_requirements.md" -a=detailed -o="$OUTPUT_DIR/result_detailed.md" > "$OUTPUT_DIR/result_detailed.md" 2>&1

if [ -f "$OUTPUT_DIR/result_detailed.md" ]; then
    echo "Result preview:"
    grep -A 2 "Template:" "$OUTPUT_DIR/result_detailed.md" 2>/dev/null | sed 's/^/  /' || head -5 "$OUTPUT_DIR/result_detailed.md" | sed 's/^/  /'
    echo
    
    # Check which template was used
    if grep -q "Template: DETAILED" "$OUTPUT_DIR/result_detailed.md"; then
        echo "✅ Used detailed adaptation template (f_project_detailed.md)"
    elif grep -q "Comprehensive Task Analysis" "$OUTPUT_DIR/result_detailed.md"; then
        echo "✅ Found detailed format markers"
    else
        echo "⚠️  May have fallen back to default template"
    fi
fi
echo

# Example 5: Non-existent adaptation (fallback test)
echo "【Example 5: Non-existent adaptation (fallback behavior)】"
echo "Command: breakdown to task --from=project_requirements.md --adaptation=custom"
echo "Expected: Should fall back to default template (f_project.md)"
echo

$BREAKDOWN to task --from="$OUTPUT_DIR/project_requirements.md" --adaptation=custom -o="$OUTPUT_DIR/result_custom.md" > "$OUTPUT_DIR/result_custom.md" 2>&1

if [ -f "$OUTPUT_DIR/result_custom.md" ]; then
    echo "Result preview:"
    grep -A 2 "Template:" "$OUTPUT_DIR/result_custom.md" 2>/dev/null | sed 's/^/  /' || head -5 "$OUTPUT_DIR/result_custom.md" | sed 's/^/  /'
    echo
    
    # Check fallback behavior
    if grep -q "Template: DEFAULT" "$OUTPUT_DIR/result_custom.md"; then
        echo "✅ Correctly fell back to default template"
    else
        echo "⚠️  Fallback behavior unclear"
    fi
fi
echo

# Summary
echo "=== Summary of --adaptation Parameter Behavior ==="
echo
echo "Template Selection with Adaptation:"
echo "1. Base pattern: f_{fromLayerType}.md"
echo "2. With adaptation: f_{fromLayerType}_{adaptation}.md"
echo "3. Fallback: If adaptation template doesn't exist, uses base template"
echo
echo "Examples:"
echo "  breakdown to task --from=project_requirements.md                    → f_project.md (fromLayerType inferred)"
echo "  breakdown to task --from=project_requirements.md --adaptation=strict → f_project_strict.md"
echo "  breakdown to task --from=project_requirements.md -a agile           → f_project_agile.md"
echo "  breakdown to task --from=project_requirements.md -a nonexistent     → f_project.md (fallback)"
echo
echo "Adaptation represents the 'personality' or style of the prompt:"
echo "  - strict: Enforces rigid formatting and specifications"
echo "  - agile: Follows agile methodology patterns"
echo "  - detailed: Provides comprehensive analysis"
echo "  - custom: User-defined variations"
echo

# Check actual implementation
echo "=== Checking Created Files ==="
echo
if [ -d "$TEMPLATE_DIR" ]; then
    echo "Created adaptation templates in: $TEMPLATE_DIR"
    ls -la "$TEMPLATE_DIR"/f_project*.md 2>/dev/null | sed 's/^/  /'
fi
echo
if [ -d "$OUTPUT_DIR" ]; then
    echo "Generated outputs:"
    ls -la "$OUTPUT_DIR"/result_*.md 2>/dev/null | sed 's/^/  /'
fi

# Verify actual behavior
echo
echo "=== 実際の動作の検証 ==="
echo "adaptation テンプレートが実際に使用されているかチェック中..."
echo
echo "📖 仕様確認ポイント:"
echo "   - テンプレートパス構成: {base_dir}/{directiveType}/{layerType}/f_{fromLayerType}[_{adaptation}].md"
echo "   - fromLayerType指定: --inputパラメータで明示的に指定（推奨）またはデフォルト値"
echo "   - adaptation適用: --adaptation=strict → f_{fromLayerType}_strict.md"
echo

# Count how many results contain template markers
DEFAULT_COUNT=$(grep -l "Template: DEFAULT" "$OUTPUT_DIR"/result_*.md 2>/dev/null | wc -l | xargs echo | tr -d ' ' || echo "0")
ADAPTATION_COUNT=$(grep -l "Template: \(STRICT\|AGILE\|DETAILED\)" "$OUTPUT_DIR"/result_*.md 2>/dev/null | wc -l | xargs echo | tr -d ' ' || echo "0")

echo "結果分析:"
echo "  デフォルトテンプレート使用: $DEFAULT_COUNT ファイル"
echo "  adaptation テンプレート使用: $ADAPTATION_COUNT ファイル"

if [ "$ADAPTATION_COUNT" -eq 0 ]; then
    echo
    echo "⚠️  問題: adaptation テンプレートが使用されていない"
    echo "🔍 考えられる原因:"
    echo "   1. fromLayerTypeのデフォルト値が期待と異なる可能性"
    echo "   2. テンプレートファイルのパスまたは命名が不正"
    echo "   3. adaptation パラメータが正しく処理されていない"
    echo
    echo "💡 デバッグ手順:"
    echo "   1. LOG_LEVEL=debug で実行してパス解決過程を確認"
    echo "   2. 実際のテンプレートファイル存在確認: ls -la $TEMPLATE_DIR/"
    echo "   3. --input=project で明示的にfromLayerTypeを指定してテスト"
    echo
    echo "📖 仕様参照:"
    echo "   - docs/breakdown/generic_domain/system/overview/glossary.ja.md"
    echo "   - docs/breakdown/domain_core/prompt_template_path.ja.md"
else
    echo
    echo "✅ Adaptation parameter は期待通りに動作している"
fi

echo "=== Adaptation Parameter Example Complete ==="
echo
echo "Key Takeaways:"
echo "- The --adaptation parameter adds a suffix to template filename"
echo "- Allows maintaining multiple prompt variations for different use cases"
echo "- Falls back gracefully when adaptation template doesn't exist"
echo "- Short form -a= works the same as --adaptation (必ずイコール記号を使用)"