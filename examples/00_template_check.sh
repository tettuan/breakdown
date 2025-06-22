#!/bin/bash

# Template Check Script
# examples実行前のテンプレート確認・補完スクリプト

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Save the original CWD
ORIGINAL_CWD="$(pwd)"

# Ensure we return to the original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Move to the examples directory (script location)
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || exit 1

echo -e "${BLUE}=== Template Check for Examples ===${NC}"

# Function to check if template file exists
check_template() {
    local template_path="$1"
    if [[ -f "$template_path" ]]; then
        echo -e "${GREEN}✅ $template_path${NC}"
        return 0
    else
        echo -e "${RED}❌ $template_path${NC}"
        return 1
    fi
}

# Function to run template validator
run_template_validator() {
    echo -e "${BLUE}--- Running Template Validator ---${NC}"
    
    # Move to project root for template validation
    cd "$(dirname "$SCRIPT_DIR")"
    
    # Run TypeScript template validator
    if deno run --allow-read --allow-write lib/helpers/template_validator.ts; then
        echo -e "${GREEN}✅ Template validation completed${NC}"
        return 0
    else
        echo -e "${RED}❌ Template validation failed${NC}"
        return 1
    fi
}

# Function to auto-generate missing templates
auto_generate_templates() {
    echo -e "${YELLOW}--- Auto-generating Missing Templates ---${NC}"
    
    # Move to project root
    cd "$(dirname "$SCRIPT_DIR")"
    
    # Run template generator script
    if bash scripts/template_generator.sh generate; then
        echo -e "${GREEN}✅ Template generation completed${NC}"
        return 0
    else
        echo -e "${RED}❌ Template generation failed${NC}"
        return 1
    fi
}

# Function to create minimal config if needed
ensure_config_structure() {
    echo -e "${BLUE}--- Ensuring Config Structure ---${NC}"
    
    local config_dir=".agent/breakdown/config"
    
    if [[ ! -d "$config_dir" ]]; then
        echo -e "${YELLOW}Creating config directory structure...${NC}"
        mkdir -p "$config_dir"
        
        # Create basic config file if it doesn't exist
        if [[ ! -f "$config_dir/app.yml" ]]; then
            cat > "$config_dir/app.yml" << 'EOF'
# Breakdown Configuration for Examples
app_prompt:
  base_dir: "prompts"
app_schema:
  base_dir: "schema"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
performance:
  timeout: 60000
EOF
            echo -e "${GREEN}✅ Created basic config: $config_dir/app.yml${NC}"
        fi
    else
        echo -e "${GREEN}✅ Config structure exists${NC}"
    fi
}

# Main execution logic
main() {
    local mode="${1:-check}"
    
    case "$mode" in
        "check")
            echo -e "${BLUE}Checking template availability...${NC}"
            run_template_validator
            ;;
        "generate")
            echo -e "${BLUE}Generating missing templates...${NC}"
            auto_generate_templates
            ;;
        "full")
            echo -e "${BLUE}Full template setup (check + generate + config)...${NC}"
            ensure_config_structure
            echo
            
            # First check
            if run_template_validator; then
                echo -e "${GREEN}✅ All templates ready!${NC}"
            else
                echo -e "${YELLOW}⚠️  Missing templates detected, generating...${NC}"
                echo
                auto_generate_templates
                echo
                
                # Verify after generation
                if run_template_validator; then
                    echo -e "${GREEN}✅ Template setup completed successfully!${NC}"
                else
                    echo -e "${RED}❌ Template setup failed${NC}"
                    exit 1
                fi
            fi
            ;;
        "manual")
            echo -e "${BLUE}Manual template check...${NC}"
            
            # Required templates for examples
            declare -a REQUIRED_TEMPLATES=(
                "prompts/summary/issue/f_issue.md"
                "prompts/summary/project/f_project.md"
                "prompts/defect/issue/f_issue.md"
                "prompts/dev/defect/issue/f_issue.md"
                "prompts/find/bugs/f_bugs.md"
                "prompts/prod/defect/issue/f_issue.md"
                "prompts/production/defect/issue/f_issue.md"
                "prompts/staging/defect/issue/f_issue.md"
                "prompts/team/to/task/f_task.md"
            )
            
            local missing_count=0
            
            for template in "${REQUIRED_TEMPLATES[@]}"; do
                if ! check_template "$template"; then
                    missing_count=$((missing_count + 1))
                fi
            done
            
            echo
            if [[ $missing_count -eq 0 ]]; then
                echo -e "${GREEN}✅ All ${#REQUIRED_TEMPLATES[@]} required templates are present${NC}"
            else
                echo -e "${RED}❌ $missing_count/${#REQUIRED_TEMPLATES[@]} templates missing${NC}"
                echo -e "${YELLOW}💡 Run: $0 generate${NC}"
                exit 1
            fi
            ;;
        *)
            echo "Usage: $0 [check|generate|full|manual]"
            echo "  check    - Run TypeScript template validator"
            echo "  generate - Auto-generate missing templates"
            echo "  full     - Complete setup (recommended)"
            echo "  manual   - Manual file existence check"
            exit 1
            ;;
    esac
}

main "$@"