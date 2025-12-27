#!/bin/bash

# Setup script for Breakdown examples environment
# This script creates the necessary directory structure and configuration files
# that enable the examples to run properly.

set -euo pipefail

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m'

# Save original directory
ORIGINAL_CWD="$(pwd)"

# Cleanup function
cleanup() {
    local exit_code=$?
    cd "$ORIGINAL_CWD" || true
    exit $exit_code
}

trap cleanup EXIT INT TERM

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR" || { echo "Error: Failed to change to script directory"; exit 1; }

echo "=== Setting Up Breakdown Examples Environment ==="
echo "Working directory: $SCRIPT_DIR"

# Define paths
AGENT_DIR=".agent/climpt"
CONFIG_DIR="${AGENT_DIR}/config"
PROMPTS_DIR="${AGENT_DIR}/prompts"
SCHEMA_DIR="${AGENT_DIR}/schema"

# Source templates location (relative to examples/)
SOURCE_TEMPLATES="../tests/fixtures/prompts"

# =============================================================================
# STEP 1: Create directory structure
# =============================================================================

echo -e "\n${BLUE}[Step 1/4] Creating directory structure...${NC}"

# Create base directories
mkdir -p "${CONFIG_DIR}"
mkdir -p "${SCHEMA_DIR}"

# Create prompt directories for all DirectiveType x LayerType combinations
DIRECTIVES=("to" "summary" "defect")
LAYERS=("project" "issue" "task")

for directive in "${DIRECTIVES[@]}"; do
    for layer in "${LAYERS[@]}"; do
        mkdir -p "${PROMPTS_DIR}/${directive}/${layer}"
    done
done

echo -e "${GREEN}✓ Directory structure created${NC}"

# =============================================================================
# STEP 2: Copy prompt templates from test fixtures
# =============================================================================

echo -e "\n${BLUE}[Step 2/4] Copying prompt templates...${NC}"

if [ -d "$SOURCE_TEMPLATES" ]; then
    for directive in "${DIRECTIVES[@]}"; do
        for layer in "${LAYERS[@]}"; do
            src_dir="${SOURCE_TEMPLATES}/${directive}/${layer}"
            dest_dir="${PROMPTS_DIR}/${directive}/${layer}"

            if [ -d "$src_dir" ]; then
                for template in "$src_dir"/*.md; do
                    if [ -f "$template" ]; then
                        cp "$template" "$dest_dir/"
                    fi
                done
                echo -e "  ${GREEN}✓${NC} Copied ${directive}/${layer} templates"
            fi
        done
    done
    echo -e "${GREEN}✓ Prompt templates copied${NC}"
else
    echo -e "${YELLOW}⚠ Source templates not found at $SOURCE_TEMPLATES${NC}"
    echo -e "${BLUE}  Creating minimal templates...${NC}"

    # Create minimal templates if source not available
    for directive in "${DIRECTIVES[@]}"; do
        for layer in "${LAYERS[@]}"; do
            cat > "${PROMPTS_DIR}/${directive}/${layer}/f_${layer}.md" << EOF
# ${directive^} ${layer^} Template

Input: {input_text}

Generate ${directive} analysis for ${layer} level.
EOF
            # Also create f_default.md
            cp "${PROMPTS_DIR}/${directive}/${layer}/f_${layer}.md" \
               "${PROMPTS_DIR}/${directive}/${layer}/f_default.md"
        done
    done
    echo -e "${GREEN}✓ Minimal templates created${NC}"
fi

# Ensure f_default.md exists for each combination
echo -e "\n${BLUE}  Ensuring f_default.md templates exist...${NC}"
for directive in "${DIRECTIVES[@]}"; do
    for layer in "${LAYERS[@]}"; do
        dest_dir="${PROMPTS_DIR}/${directive}/${layer}"
        if [ ! -f "${dest_dir}/f_default.md" ]; then
            if [ -f "${dest_dir}/f_${layer}.md" ]; then
                cp "${dest_dir}/f_${layer}.md" "${dest_dir}/f_default.md"
                echo -e "  ${GREEN}✓${NC} Created f_default.md for ${directive}/${layer}"
            fi
        fi
    done
done

# =============================================================================
# STEP 3: Create configuration files
# =============================================================================

echo -e "\n${BLUE}[Step 3/4] Creating configuration files...${NC}"

# Create default-app.yml
cat > "${CONFIG_DIR}/default-app.yml" << 'EOF'
# Default application configuration for examples
working_dir: ".agent/climpt"
app_prompt:
  base_dir: "prompts"
app_schema:
  base_dir: "schema"
log_level: info
validation:
  strict_mode: false
  allow_custom_patterns: true
EOF
echo -e "  ${GREEN}✓${NC} Created default-app.yml"

# Create default-user.yml
cat > "${CONFIG_DIR}/default-user.yml" << 'EOF'
# Default user configuration for examples
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
user:
  name: "Example User"
  preferences:
    verboseOutput: true
EOF
echo -e "  ${GREEN}✓${NC} Created default-user.yml"

# Create basic-app.yml
cat > "${CONFIG_DIR}/basic-app.yml" << 'EOF'
# Basic application configuration
working_dir: ".agent/climpt"
app_prompt:
  base_dir: "prompts"
app_schema:
  base_dir: "schema"
basic_mode: true
EOF
echo -e "  ${GREEN}✓${NC} Created basic-app.yml"

# Create basic-user.yml
cat > "${CONFIG_DIR}/basic-user.yml" << 'EOF'
# Basic user configuration
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect)$"
    layerType:
      pattern: "^(project|issue|task)$"
EOF
echo -e "  ${GREEN}✓${NC} Created basic-user.yml"

# Create stdin-app.yml
cat > "${CONFIG_DIR}/stdin-app.yml" << 'EOF'
# STDIN input configuration
working_dir: ".agent/climpt"
app_prompt:
  base_dir: "prompts"
app_schema:
  base_dir: "schema"
input:
  prefer_stdin: true
EOF
echo -e "  ${GREEN}✓${NC} Created stdin-app.yml"

# Create stdin-user.yml
cat > "${CONFIG_DIR}/stdin-user.yml" << 'EOF'
# STDIN user configuration
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect)$"
    layerType:
      pattern: "^(project|issue|task)$"
EOF
echo -e "  ${GREEN}✓${NC} Created stdin-user.yml"

# Create timeout-user.yml
cat > "${CONFIG_DIR}/timeout-user.yml" << 'EOF'
# Timeout configuration
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect)$"
    layerType:
      pattern: "^(project|issue|task)$"
timeout: 60000
EOF
echo -e "  ${GREEN}✓${NC} Created timeout-user.yml"

# Create findbugs-app.yml
cat > "${CONFIG_DIR}/findbugs-app.yml" << 'EOF'
# Find bugs application configuration
working_dir: ".agent/climpt"
app_prompt:
  base_dir: "prompts"
app_schema:
  base_dir: "schema"
EOF
echo -e "  ${GREEN}✓${NC} Created findbugs-app.yml"

# Create findbugs-user.yml
cat > "${CONFIG_DIR}/findbugs-user.yml" << 'EOF'
# Find bugs user configuration
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
EOF
echo -e "  ${GREEN}✓${NC} Created findbugs-user.yml"

# Create production-app.yml
cat > "${CONFIG_DIR}/production-app.yml" << 'EOF'
# Production application configuration
working_dir: ".agent/climpt"
app_prompt:
  base_dir: "prompts"
app_schema:
  base_dir: "schema"
log_level: warn
validation:
  strict_mode: true
EOF
echo -e "  ${GREEN}✓${NC} Created production-app.yml"

# Create production-user.yml
cat > "${CONFIG_DIR}/production-user.yml" << 'EOF'
# Production user configuration
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect)$"
    layerType:
      pattern: "^(project|issue|task)$"
EOF
echo -e "  ${GREEN}✓${NC} Created production-user.yml"

# Create team-app.yml
cat > "${CONFIG_DIR}/team-app.yml" << 'EOF'
# Team application configuration
working_dir: ".agent/climpt"
app_prompt:
  base_dir: "prompts"
app_schema:
  base_dir: "schema"
EOF
echo -e "  ${GREEN}✓${NC} Created team-app.yml"

# Create team-user.yml
cat > "${CONFIG_DIR}/team-user.yml" << 'EOF'
# Team user configuration
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect)$"
    layerType:
      pattern: "^(project|issue|task)$"
team:
  name: "Development Team"
EOF
echo -e "  ${GREEN}✓${NC} Created team-user.yml"

# Create production-bugs-app.yml
cat > "${CONFIG_DIR}/production-bugs-app.yml" << 'EOF'
# Production bugs application configuration
working_dir: ".agent/climpt"
app_prompt:
  base_dir: "prompts"
app_schema:
  base_dir: "schema"
log_level: warn
EOF
echo -e "  ${GREEN}✓${NC} Created production-bugs-app.yml"

# Create production-bugs-user.yml
cat > "${CONFIG_DIR}/production-bugs-user.yml" << 'EOF'
# Production bugs user configuration
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
EOF
echo -e "  ${GREEN}✓${NC} Created production-bugs-user.yml"

# Create production-custom-app.yml
cat > "${CONFIG_DIR}/production-custom-app.yml" << 'EOF'
# Production custom application configuration
working_dir: ".agent/climpt"
app_prompt:
  base_dir: "prompts"
app_schema:
  base_dir: "schema"
log_level: warn
EOF
echo -e "  ${GREEN}✓${NC} Created production-custom-app.yml"

# Create production-custom-user.yml
cat > "${CONFIG_DIR}/production-custom-user.yml" << 'EOF'
# Production custom user configuration
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect)$"
    layerType:
      pattern: "^(project|issue|task)$"
custom:
  enabled: true
EOF
echo -e "  ${GREEN}✓${NC} Created production-custom-user.yml"

echo -e "${GREEN}✓ Configuration files created${NC}"

# =============================================================================
# STEP 4: Create find/bugs prompt templates
# =============================================================================

echo -e "\n${BLUE}[Step 4/4] Creating find/bugs prompt templates...${NC}"

mkdir -p "${PROMPTS_DIR}/find/bugs"

cat > "${PROMPTS_DIR}/find/bugs/f_bugs.md" << 'EOF'
# Bug Finding Template

## Input Code
{input_text}

## Instructions
Analyze the provided code and identify potential bugs:

1. **Syntax Errors**: Look for syntax mistakes
2. **Logic Errors**: Identify flawed logic
3. **Security Issues**: Find security vulnerabilities
4. **Best Practice Violations**: Note coding standard violations

## Output Format
Provide a detailed bug report in markdown format.
EOF

cp "${PROMPTS_DIR}/find/bugs/f_bugs.md" "${PROMPTS_DIR}/find/bugs/f_default.md"
echo -e "  ${GREEN}✓${NC} Created find/bugs templates"

echo -e "${GREEN}✓ find/bugs templates created${NC}"

# =============================================================================
# Summary
# =============================================================================

echo -e "\n${GREEN}=== Environment Setup Complete ===${NC}"
echo ""
echo "Created structure:"
echo "  ${AGENT_DIR}/"
echo "  ├── config/          # Configuration files"
echo "  ├── prompts/         # Prompt templates"
echo "  │   ├── to/          # 'to' directive templates"
echo "  │   ├── summary/     # 'summary' directive templates"
echo "  │   ├── defect/      # 'defect' directive templates"
echo "  │   └── find/        # 'find' directive templates"
echo "  └── schema/          # Schema files"
echo ""
echo "You can now run the other example scripts."
