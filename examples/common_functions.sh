#!/bin/bash
# Common functions for Breakdown examples
# This file provides reusable functions for error handling, setup, and breakdown execution

# Enable strict error handling
set -euo pipefail

# Color codes for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[0;33m'
readonly BLUE='\033[0;34m'
readonly NC='\033[0m' # No Color

# =============================================================================
# ERROR HANDLING FUNCTIONS
# =============================================================================

# Handle errors with proper messaging and exit
# Usage: handle_error [exit_code] "error message"
handle_error() {
    local exit_code=$?
    local message=""
    
    # Check if first argument is a number (exit code)
    if [[ $# -gt 0 && "$1" =~ ^[0-9]+$ ]]; then
        exit_code=$1
        shift
    fi
    
    # Use remaining arguments as error message
    if [[ $# -gt 0 ]]; then
        message="$*"
    else
        message="An error occurred"
    fi
    
    echo -e "${RED}❌ ERROR: ${message}${NC}" >&2
    echo -e "${RED}   Exit code: ${exit_code}${NC}" >&2
    echo -e "${RED}   Line: ${BASH_LINENO[0]}${NC}" >&2
    echo -e "${RED}   Function: ${FUNCNAME[1]:-main}${NC}" >&2
    
    # Cleanup before exit if cleanup function exists
    if declare -f cleanup > /dev/null; then
        cleanup
    fi
    
    exit "${exit_code}"
}

# Setup error trap for the script
# Usage: setup_error_trap
setup_error_trap() {
    trap 'handle_error $? "Command failed: ${BASH_COMMAND}"' ERR
}

# =============================================================================
# DIRECTORY AND SETUP FUNCTIONS
# =============================================================================

# Setup directories with proper error handling
# Usage: setup_directories dir1 dir2 ...
setup_directories() {
    local dir
    for dir in "$@"; do
        if [[ -z "$dir" ]]; then
            handle_error 1 "Empty directory path provided to setup_directories"
        fi
        
        echo -e "${BLUE}📁 Creating directory: ${dir}${NC}"
        if ! mkdir -p "$dir"; then
            handle_error $? "Failed to create directory: $dir"
        fi
    done
}

# Clean up temporary files and directories
# Usage: cleanup_temp_files file1 file2 ...
cleanup_temp_files() {
    local file
    for file in "$@"; do
        if [[ -f "$file" ]]; then
            echo -e "${YELLOW}🧹 Removing temporary file: ${file}${NC}"
            rm -f "$file" || echo -e "${YELLOW}   Warning: Could not remove ${file}${NC}"
        fi
    done
}

# Setup example environment
# Usage: setup_example "example_name"
setup_example() {
    local example_name="${1:-example}"
    local script_dir="$(dirname "${BASH_SOURCE[0]}")"
    
    echo -e "${GREEN}🚀 Setting up ${example_name} example${NC}"
    echo "=================================================="
    
    # Store original directory
    export ORIGINAL_CWD="$(pwd)"
    
    # Change to script directory
    cd "$script_dir" || handle_error $? "Failed to change to script directory: $script_dir"
    
    # Set common directories
    export SCRIPT_DIR="$script_dir"
    export CONFIG_DIR="${CONFIG_DIR:-$HOME/.config/breakdown}"
    export OUTPUT_DIR="${OUTPUT_DIR:-./output}"
    export TEMP_DIR="${TEMP_DIR:-./tmp}"
    
    # Create necessary directories
    setup_directories "$CONFIG_DIR" "$OUTPUT_DIR" "$TEMP_DIR"
    
    # Setup cleanup trap
    trap 'cd "$ORIGINAL_CWD"' EXIT
}

# =============================================================================
# BREAKDOWN EXECUTION FUNCTIONS
# =============================================================================

# Run breakdown command with proper error handling
# Usage: run_breakdown [command] [args...]
run_breakdown() {
    local breakdown_cmd
    
    # Determine which breakdown command to use
    if command -v breakdown > /dev/null 2>&1; then
        # Use installed breakdown command
        breakdown_cmd="breakdown"
    elif [[ -f "../cli/breakdown.ts" ]]; then
        # Use deno run with proper permissions
        breakdown_cmd="deno run --allow-read --allow-write --allow-env --allow-net ../cli/breakdown.ts"
    elif command -v deno > /dev/null 2>&1 && deno task --help 2>&1 | grep -q breakdown; then
        # Use deno task
        breakdown_cmd="deno task breakdown"
    else
        handle_error 1 "Breakdown command not found. Please run from examples directory or install breakdown."
    fi
    
    echo -e "${BLUE}🔧 Running: ${breakdown_cmd} $*${NC}"
    
    # Execute the command
    if ! eval "${breakdown_cmd} $*"; then
        handle_error $? "Breakdown command failed: ${breakdown_cmd} $*"
    fi
}

# Execute breakdown with input/output files
# Usage: execute_breakdown "directive" "layer" "input_file" "output_file" ["config_name"]
execute_breakdown() {
    local directive="$1"
    local layer="$2"
    local input_file="$3"
    local output_file="$4"
    local config="${5:-}"
    
    # Validate inputs
    [[ -z "$directive" ]] && handle_error 1 "Directive is required"
    [[ -z "$layer" ]] && handle_error 1 "Layer is required"
    [[ -z "$input_file" ]] && handle_error 1 "Input file is required"
    [[ -z "$output_file" ]] && handle_error 1 "Output file is required"
    
    # Check input file exists
    [[ ! -f "$input_file" ]] && handle_error 1 "Input file not found: $input_file"
    
    # Build command arguments
    local cmd_args="$directive $layer --from=\"$input_file\" -o=\"$output_file\""
    
    # Add config if specified
    if [[ -n "$config" ]]; then
        cmd_args="$cmd_args --config=\"$config\""
    fi
    
    # Execute breakdown
    echo -e "${GREEN}⚡ Executing: breakdown ${cmd_args}${NC}"
    if run_breakdown $cmd_args; then
        echo -e "${GREEN}✅ Command executed successfully${NC}"
        echo -e "${BLUE}   Input: ${input_file}${NC}"
        echo -e "${BLUE}   Output reference: ${output_file}${NC}"
        echo -e "${DIM}   (Prompt sent to stdout)${NC}"
    else
        handle_error 1 "Command failed"
    fi
}

# =============================================================================
# CONFIGURATION FUNCTIONS
# =============================================================================

# Create a configuration file
# Usage: create_config "profile_name" "app|user" "content"
create_config() {
    local profile="$1"
    local config_type="$2"
    local content="$3"
    local config_file="${CONFIG_DIR}/${profile}-${config_type}.yml"
    
    echo -e "${BLUE}📝 Creating ${config_type} configuration: ${profile}${NC}"
    
    # Create config directory if needed
    setup_directories "$CONFIG_DIR"
    
    # Write configuration
    echo "$content" > "$config_file" || handle_error $? "Failed to create config file: $config_file"
    
    echo -e "${GREEN}✅ Created: ${config_file}${NC}"
}

# Check if configuration exists
# Usage: check_config "profile_name"
check_config() {
    local profile="$1"
    local app_config="${CONFIG_DIR}/${profile}-app.yml"
    local user_config="${CONFIG_DIR}/${profile}-user.yml"
    
    if [[ -f "$app_config" && -f "$user_config" ]]; then
        echo -e "${GREEN}✅ Configuration '${profile}' exists${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Configuration '${profile}' not found${NC}"
        return 1
    fi
}

# =============================================================================
# VALIDATION FUNCTIONS
# =============================================================================

# Validate file exists and is not empty
# Usage: validate_file "file_path" ["description"]
validate_file() {
    local file_path="$1"
    local description="${2:-File}"
    
    if [[ ! -f "$file_path" ]]; then
        handle_error 1 "${description} not found: $file_path"
    elif [[ ! -s "$file_path" ]]; then
        handle_error 1 "${description} is empty: $file_path"
    else
        echo -e "${GREEN}✅ ${description} is valid: ${file_path}${NC}"
        return 0
    fi
}

# Check if command exists
# Usage: check_command "command_name"
check_command() {
    local cmd="$1"
    
    if command -v "$cmd" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Command '${cmd}' is available${NC}"
        return 0
    else
        echo -e "${RED}❌ Command '${cmd}' is not available${NC}"
        return 1
    fi
}

# =============================================================================
# TEMPLATE FUNCTIONS
# =============================================================================

# Create a template file if it doesn't exist
# Usage: create_template "path" "content" ["description"]
create_template() {
    local template_path="$1"
    local content="$2"
    local description="${3:-template}"
    
    # Create parent directory if needed
    local template_dir="$(dirname "$template_path")"
    setup_directories "$template_dir"
    
    if [[ -f "$template_path" ]]; then
        echo -e "${YELLOW}⚠️  ${description} already exists: ${template_path}${NC}"
    else
        echo -e "${BLUE}📝 Creating ${description}: ${template_path}${NC}"
        echo "$content" > "$template_path" || handle_error $? "Failed to create ${description}"
        echo -e "${GREEN}✅ Created ${description}${NC}"
    fi
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Print section header
# Usage: print_section "Section Title"
print_section() {
    local title="$1"
    echo
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}${title}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo
}

# Print success message
# Usage: print_success "message"
print_success() {
    echo -e "${GREEN}✅ $*${NC}"
}

# Print warning message
# Usage: print_warning "message"
print_warning() {
    echo -e "${YELLOW}⚠️  $*${NC}"
}

# Print error message (without exiting)
# Usage: print_error "message"
print_error() {
    echo -e "${RED}❌ $*${NC}" >&2
}

# Print info message
# Usage: print_info "message"
print_info() {
    echo -e "${BLUE}ℹ️  $*${NC}"
}

# Get timestamp for file names
# Usage: timestamp=$(get_timestamp)
get_timestamp() {
    date +"%Y%m%d_%H%M%S"
}

# =============================================================================
# EXAMPLE USAGE MESSAGE
# =============================================================================

# Show how to use common functions
show_common_functions_usage() {
    cat << 'EOF'
Common Functions Usage Examples:

1. Error Handling:
   setup_error_trap
   handle_error 1 "Something went wrong"

2. Setup:
   setup_example "My Example"
   setup_directories "$OUTPUT_DIR" "$TEMP_DIR"

3. Breakdown Execution:
   run_breakdown --help
   execute_breakdown "to" "task" "input.md" "output.md" "myconfig"

4. Configuration:
   create_config "production" "app" "$CONFIG_CONTENT"
   check_config "production"

5. Validation:
   validate_file "input.md" "Input file"
   check_command "deno"

6. Templates:
   create_template "prompts/to/task/template.md" "$TEMPLATE_CONTENT"

7. Utilities:
   print_section "Processing Files"
   print_success "Operation completed"
   print_warning "This might take a while"
   print_error "Failed to process"
   print_info "Additional information"

Remember to source this file at the beginning of your script:
   source "$(dirname "$0")/common_functions.sh"
EOF
}

# Export functions for use in sourcing scripts
export -f handle_error setup_error_trap setup_directories cleanup_temp_files
export -f setup_example run_breakdown execute_breakdown
export -f create_config check_config validate_file check_command
export -f create_template print_section print_success print_warning print_error print_info
export -f get_timestamp show_common_functions_usage