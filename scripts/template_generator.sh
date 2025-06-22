#!/bin/bash

# Template Generator Script
# テンプレートファイル不足の自動解決スクリプト

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${BLUE}=== Template Generator Script ===${NC}"
echo "Project Root: $PROJECT_ROOT"

# Template mapping: source -> destination (using arrays for compatibility)
TEMPLATE_SOURCES=(
  "/lib/breakdown/prompts/summary/issue/f_issue.md"
  "/lib/breakdown/prompts/summary/project/f_project.md"
  "/lib/breakdown/prompts/defect/issue/f_issue.md"
  "/lib/breakdown/prompts/dev/defect/issue/f_issue.md"
  "/lib/breakdown/prompts/find/bugs/f_bugs.md"
  "/lib/breakdown/prompts/prod/defect/issue/f_issue.md"
  "/lib/breakdown/prompts/production/defect/issue/f_issue.md"
  "/lib/breakdown/prompts/staging/defect/issue/f_issue.md"
  "/lib/breakdown/prompts/team/to/task/f_task.md"
)

TEMPLATE_DESTINATIONS=(
  "/examples/prompts/summary/issue/f_issue.md"
  "/examples/prompts/summary/project/f_project.md"
  "/examples/prompts/defect/issue/f_issue.md"
  "/examples/prompts/dev/defect/issue/f_issue.md"
  "/examples/prompts/find/bugs/f_bugs.md"
  "/examples/prompts/prod/defect/issue/f_issue.md"
  "/examples/prompts/production/defect/issue/f_issue.md"
  "/examples/prompts/staging/defect/issue/f_issue.md"
  "/examples/prompts/team/to/task/f_task.md"
)

# Function to copy template file
copy_template() {
    local src="$1"
    local dest="$2"
    local full_src="${PROJECT_ROOT}${src}"
    local full_dest="${PROJECT_ROOT}${dest}"
    
    # Check if source exists
    if [[ ! -f "$full_src" ]]; then
        echo -e "${RED}❌ Source template not found: $src${NC}"
        return 1
    fi
    
    # Create destination directory
    local dest_dir="$(dirname "$full_dest")"
    mkdir -p "$dest_dir"
    
    # Copy template file
    cp "$full_src" "$full_dest"
    echo -e "${GREEN}✅ Copied: $src -> $dest${NC}"
    
    return 0
}

# Function to check template dependencies
check_template_dependencies() {
    echo -e "${BLUE}--- Checking Template Dependencies ---${NC}"
    
    local missing_count=0
    local total_count=${#TEMPLATE_SOURCES[@]}
    
    for (( i=0; i<${#TEMPLATE_SOURCES[@]}; i++ )); do
        local src="${TEMPLATE_SOURCES[$i]}"
        local dest="${TEMPLATE_DESTINATIONS[$i]}"
        local full_src="${PROJECT_ROOT}${src}"
        local full_dest="${PROJECT_ROOT}${dest}"
        
        if [[ ! -f "$full_dest" ]]; then
            echo -e "${YELLOW}⚠️  Missing: $dest${NC}"
            missing_count=$((missing_count + 1))
        else
            echo -e "${GREEN}✅ Exists: $dest${NC}"
        fi
    done
    
    echo -e "${BLUE}Summary: $missing_count/$total_count templates missing${NC}"
    return $missing_count
}

# Function to generate all missing templates
generate_missing_templates() {
    echo -e "${BLUE}--- Generating Missing Templates ---${NC}"
    
    local generated_count=0
    local failed_count=0
    
    for (( i=0; i<${#TEMPLATE_SOURCES[@]}; i++ )); do
        local src="${TEMPLATE_SOURCES[$i]}"
        local dest="${TEMPLATE_DESTINATIONS[$i]}"
        local full_dest="${PROJECT_ROOT}${dest}"
        
        # Skip if already exists
        if [[ -f "$full_dest" ]]; then
            echo -e "${BLUE}ℹ️  Already exists: $dest${NC}"
            continue
        fi
        
        # Copy template
        if copy_template "$src" "$dest"; then
            generated_count=$((generated_count + 1))
        else
            failed_count=$((failed_count + 1))
        fi
    done
    
    echo -e "${BLUE}--- Generation Complete ---${NC}"
    echo -e "${GREEN}Generated: $generated_count templates${NC}"
    echo -e "${RED}Failed: $failed_count templates${NC}"
    
    return $failed_count
}

# Function to validate examples readiness
validate_examples_readiness() {
    echo -e "${BLUE}--- Validating Examples Readiness ---${NC}"
    
    # Check if all required templates exist
    local ready=true
    
    for (( i=0; i<${#TEMPLATE_SOURCES[@]}; i++ )); do
        local dest="${TEMPLATE_DESTINATIONS[$i]}"
        local full_dest="${PROJECT_ROOT}${dest}"
        
        if [[ ! -f "$full_dest" ]]; then
            echo -e "${RED}❌ Missing required template: $dest${NC}"
            ready=false
        fi
    done
    
    if $ready; then
        echo -e "${GREEN}✅ All templates ready for examples execution${NC}"
        return 0
    else
        echo -e "${RED}❌ Examples not ready - missing templates detected${NC}"
        return 1
    fi
}

# Main execution
main() {
    case "${1:-generate}" in
        "check")
            check_template_dependencies
            ;;
        "generate")
            check_template_dependencies || true  # Continue even if templates missing
            echo
            generate_missing_templates
            echo
            validate_examples_readiness
            ;;
        "validate")
            validate_examples_readiness
            ;;
        "clean")
            echo -e "${YELLOW}Cleaning generated templates...${NC}"
            for dest in "${TEMPLATE_DESTINATIONS[@]}"; do
                local full_dest="${PROJECT_ROOT}${dest}"
                if [[ -f "$full_dest" ]]; then
                    rm -f "$full_dest"
                    echo -e "${YELLOW}🗑️  Removed: $dest${NC}"
                fi
            done
            ;;
        *)
            echo "Usage: $0 [check|generate|validate|clean]"
            echo "  check    - Check missing templates"
            echo "  generate - Generate missing templates (default)"
            echo "  validate - Validate examples readiness"
            echo "  clean    - Remove generated templates"
            exit 1
            ;;
    esac
}

main "$@"