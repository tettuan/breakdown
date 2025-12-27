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
TEMPLATE_DIR="./.agent/climpt/prompts/to/task"
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
# - breakdown to task (default, needs f_default.md - fromLayerType defaults to "default")
# - breakdown to task --adaptation=strict (needs f_default_strict.md)
# - breakdown to task --adaptation=agile (needs f_default_agile.md)
# - breakdown to task --adaptation=detailed (needs f_default_detailed.md)
# - breakdown to task --adaptation=custom (fallback to f_default.md)
#
# Note: Per spec (docs/breakdown/domain_core/prompt_template_path.ja.md line 42-43):
#   "FromLayerTypeは --edition オプションで指定。未指定の場合は 'default' を用いる"
# Template filename pattern: f_{fromLayerType}[_{adaptation}].md

mkdir -p "$TEMPLATE_DIR"

# Base template (no adaptation) - uses f_default.md because --edition is not specified
cat > "$TEMPLATE_DIR/f_default.md" << 'EOF'
# Standard Task Breakdown

## Template: DEFAULT (no adaptation)
This is the standard template used when no adaptation is specified.
fromLayerType defaults to "default" when --edition is not provided.

## Input
{{input_text}}

## Task Breakdown
Here are the tasks in standard format...

## Output
Standard task list with basic structure.
EOF

# Strict adaptation template - uses f_default_strict.md
cat > "$TEMPLATE_DIR/f_default_strict.md" << 'EOF'
# Strict Task Breakdown

## Template: DEFAULT STRICT ADAPTATION
This template enforces rigid formatting and detailed specifications.
Using --adaptation=strict with default fromLayerType.

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

# Agile adaptation template - uses f_default_agile.md
cat > "$TEMPLATE_DIR/f_default_agile.md" << 'EOF'
# Agile Task Breakdown

## Template: DEFAULT AGILE ADAPTATION
This template follows agile methodology patterns and practices.
Using --adaptation=agile with default fromLayerType.

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

# Detailed adaptation template - uses f_default_detailed.md
cat > "$TEMPLATE_DIR/f_default_detailed.md" << 'EOF'
# Detailed Task Breakdown

## Template: DEFAULT DETAILED ADAPTATION
This template provides comprehensive analysis and extensive documentation.
Using --adaptation=detailed with default fromLayerType.

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

echo "✓ Created adaptation templates: f_default.md, f_default_strict.md, f_default_agile.md, f_default_detailed.md"
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

# Note: Template variants already created above as f_default_*.md
# The following section is kept for backward compatibility demonstration
# but now uses correct f_default_* naming pattern
echo "=== Verifying Template Structure ==="
echo "✅ Templates created with correct naming convention:"
echo "  - f_default.md (default, no adaptation - fromLayerType='default')"
echo "  - f_default_strict.md (--adaptation=strict)"
echo "  - f_default_agile.md (--adaptation=agile)"
echo "  - f_default_detailed.md (--adaptation=detailed)"
echo

# Demonstration
echo "=== Demonstration of --adaptation Parameter ==="
echo

# Note: breakdown outputs to stdout per design specification (docs/breakdown/interface/cli_commands.ja.md)
# The -o option provides output path as a template variable, not for file writing
# Use shell redirection (>) to save output to files

# Example 1: Without adaptation (default)
echo "【Example 1: Without --adaptation parameter】"
echo "Command: breakdown to task < input.md"
echo "🎯 動作: fromLayerType='default' (未指定時のデフォルト値)"
echo "📄 使用テンプレート: .agent/climpt/prompts/to/task/f_default.md"
echo "📖 参照: docs/breakdown/domain_core/prompt_template_path.ja.md line 42-43"
echo

RESULT_1=$($BREAKDOWN to task < "$OUTPUT_DIR/project_requirements.md" 2>&1)
echo "$RESULT_1" > "$OUTPUT_DIR/result_no_adaptation.md"

# Check which template was used
if echo "$RESULT_1" | grep -q "Template: DEFAULT"; then
    echo "✅ Used default template (f_default.md)"
    echo "$RESULT_1"
else
    echo "⚠️  期待されたテンプレートマーカーが見つからない"
    echo "💡 デバッグ情報: 実際のテンプレートファイル確認 → ls -la $TEMPLATE_DIR/f_*.md"
    echo "$RESULT_1"
fi
echo

# Example 2: With --adaptation=strict
echo "【Example 2: With --adaptation=strict】"
echo "Command: breakdown to task --adaptation=strict < input.md"
echo "Expected: Should use f_default_strict.md template"
echo

RESULT_2=$($BREAKDOWN to task --adaptation=strict < "$OUTPUT_DIR/project_requirements.md" 2>&1)
echo "$RESULT_2" > "$OUTPUT_DIR/result_strict.md"

if echo "$RESULT_2" | grep -q "Template: DEFAULT STRICT ADAPTATION"; then
    echo "✅ Used strict adaptation template (f_default_strict.md)"
    echo "$RESULT_2"
elif echo "$RESULT_2" | grep -q "Template: DEFAULT" && ! echo "$RESULT_2" | grep -q "STRICT"; then
    echo "❌ Incorrectly used basic default template instead of strict adaptation"
    echo "$RESULT_2"
else
    echo "⚠️ Template content differs from expected pattern"
    echo "$RESULT_2"
fi
echo

# Example 3: With --adaptation=agile
echo "【Example 3: With --adaptation=agile】"
echo "Command: breakdown to task --adaptation=agile < input.md"
echo "Expected: Should use f_default_agile.md template"
echo

RESULT_3=$($BREAKDOWN to task --adaptation=agile < "$OUTPUT_DIR/project_requirements.md" 2>&1)
echo "$RESULT_3" > "$OUTPUT_DIR/result_agile.md"

if echo "$RESULT_3" | grep -q "Template: DEFAULT AGILE ADAPTATION"; then
    echo "✅ Used agile adaptation template (f_default_agile.md)"
    echo "$RESULT_3"
elif echo "$RESULT_3" | grep -q "Template: DEFAULT" && ! echo "$RESULT_3" | grep -q "AGILE"; then
    echo "❌ Incorrectly used basic default template instead of agile adaptation"
    echo "$RESULT_3"
else
    echo "⚠️ Template content differs from expected pattern"
    echo "$RESULT_3"
fi
echo

# Example 4: With short form -a
echo "【Example 4: Using short form -a=】"
echo "Command: breakdown to task -a=detailed < input.md"
echo "Expected: Should use f_default_detailed.md template"
echo "Note: Short form -a= works the same as --adaptation (equal sign required)"
echo

RESULT_4=$($BREAKDOWN to task -a=detailed < "$OUTPUT_DIR/project_requirements.md" 2>&1)
echo "$RESULT_4" > "$OUTPUT_DIR/result_detailed.md"

if echo "$RESULT_4" | grep -q "Template: DEFAULT DETAILED ADAPTATION"; then
    echo "✅ Used detailed adaptation template (f_default_detailed.md)"
    echo "$RESULT_4"
elif echo "$RESULT_4" | grep -q "Template: DEFAULT" && ! echo "$RESULT_4" | grep -q "DETAILED"; then
    echo "❌ Incorrectly used basic default template instead of detailed adaptation"
    echo "$RESULT_4"
else
    echo "⚠️ Template content differs from expected pattern"
    echo "$RESULT_4"
fi
echo

# Example 5: Non-existent adaptation (fallback test)
echo "【Example 5: Non-existent adaptation (fallback behavior)】"
echo "Command: breakdown to task --adaptation=custom < input.md"
echo "Expected: Should fall back to default template (f_default.md)"
echo

RESULT_5=$($BREAKDOWN to task --adaptation=custom < "$OUTPUT_DIR/project_requirements.md" 2>&1)
echo "$RESULT_5" > "$OUTPUT_DIR/result_custom.md"

# Check fallback behavior - should use f_default.md (no adaptation suffix)
if echo "$RESULT_5" | grep -q "Template: DEFAULT" && ! echo "$RESULT_5" | grep -q "ADAPTATION"; then
    echo "✅ Correctly fell back to default template (f_default.md)"
    echo "$RESULT_5"
else
    echo "⚠️  Fallback behavior unclear"
    echo "$RESULT_5"
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
echo "  breakdown to task                                                   → f_default.md (fromLayerType defaults to 'default')"
echo "  breakdown to task --adaptation=strict                               → f_default_strict.md"
echo "  breakdown to task --adaptation=agile                                → f_default_agile.md"
echo "  breakdown to task --adaptation=nonexistent                          → f_default.md (fallback)"
echo "  breakdown to task --edition=project --adaptation=strict             → f_project_strict.md (explicit fromLayerType)"
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
    if ls "$TEMPLATE_DIR"/f_default*.md >/dev/null 2>&1; then
        ls -la "$TEMPLATE_DIR"/f_default*.md 2>/dev/null | sed 's/^/  /'
    fi
fi
echo
if [ -d "$OUTPUT_DIR" ]; then
    echo "Generated outputs:"
    if ls "$OUTPUT_DIR"/result_*.md >/dev/null 2>&1; then
        ls -la "$OUTPUT_DIR"/result_*.md 2>/dev/null | sed 's/^/  /'
    fi
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
DEFAULT_COUNT=0
ADAPTATION_COUNT=0

if ls "$OUTPUT_DIR"/result_*.md >/dev/null 2>&1; then
    for file in "$OUTPUT_DIR"/result_*.md; do
        if grep -q "Template: DEFAULT" "$file" 2>/dev/null; then
            DEFAULT_COUNT=$((DEFAULT_COUNT + 1))
        fi
        if grep -q "Template: DEFAULT STRICT ADAPTATION\|Template: DEFAULT AGILE ADAPTATION\|Template: DEFAULT DETAILED ADAPTATION" "$file" 2>/dev/null; then
            ADAPTATION_COUNT=$((ADAPTATION_COUNT + 1))
        fi
    done
fi

echo "結果分析:"
echo "  デフォルトテンプレート使用: $DEFAULT_COUNT ファイル"
echo "  adaptation テンプレート使用: $ADAPTATION_COUNT ファイル"

if [ "$ADAPTATION_COUNT" -gt 0 ]; then
    echo
    echo "✅ Adaptation templates are being used correctly"
else
    echo
    echo "❌ Adaptation templates are NOT being used"
    echo "   Expected behavior: --adaptation=X should use f_default_X.md template"
    echo "   Actual behavior: All examples used default template"
fi

echo "=== Adaptation Parameter Example Complete ==="
echo
echo "Key Takeaways:"
echo "- The --adaptation parameter controls template variant selection"
echo "- Template path pattern: f_{fromLayerType}[_{adaptation}].md"
echo "- --adaptation=X adds '_X' suffix to template filename"
echo "- If adaptation template doesn't exist, falls back to base template"
echo "- Short form -a= works the same as --adaptation (equal sign required)"