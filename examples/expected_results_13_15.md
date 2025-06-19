# Expected Results and Usage Examples for Scripts 13-15

## Script 13: config_environments.sh

### Purpose
Demonstrates environment-specific configurations (dev/staging/prod) with different settings for each environment.

### Expected Output
1. Creates three environment configuration files:
   - `.agent/breakdown/config/dev-app.yml`
   - `.agent/breakdown/config/staging-app.yml`
   - `.agent/breakdown/config/prod-app.yml`

2. Each configuration contains environment-specific settings:
   - **Development**: Debug mode, experimental features, verbose logging
   - **Staging**: JSON logging, validation enabled, moderate settings
   - **Production**: Error-only logging, strict validation, security features

3. Tests the `defect issue` command with each configuration

### Usage Example
```bash
# Run the script from examples directory
cd examples
bash 13_config_environments.sh

# After execution, you can use specific environments:
deno run -A jsr:@tettuan/breakdown defect issue --config=dev < your_issue.md
deno run -A jsr:@tettuan/breakdown defect issue --config=staging < your_issue.md
deno run -A jsr:@tettuan/breakdown defect issue --config=prod < your_issue.md
```

### Generated Configuration Files

#### dev-app.yml
- Logger level: debug
- Output format: text with colors
- Experimental features: enabled
- Debug mode: enabled
- Validation: disabled

#### staging-app.yml
- Logger level: info
- Output format: JSON
- Performance limits: 5MB files, 20s timeout
- Validation: enabled
- Debug features: disabled

#### prod-app.yml
- Logger level: error
- Output format: JSON without stack traces
- Performance: 10MB files, 30s timeout, 8 concurrent operations
- Security: input sanitization, audit logging
- Strict validation mode

## Script 14: config_production_example.sh

### Purpose
Demonstrates the "find bugs" feature with production-grade configuration for detecting code quality issues.

### Expected Output
1. Creates production bug detection configuration:
   - `.agent/breakdown/config/production-bugs-app.yml`

2. Configuration includes:
   - Bug detection patterns: TODO, FIXME, HACK, BUG, XXX, DEPRECATED
   - File extensions to scan: .ts, .js, .py, .go
   - Excluded directories: node_modules, .git, dist, build
   - Detailed reporting enabled
   - Maximum 100 results

3. Creates sample code files with various bug indicators
4. Runs bug detection and generates a report

### Usage Example
```bash
# Run the script
cd examples
bash 14_config_production_example.sh

# Use the configuration for your own code
deno run -A jsr:@tettuan/breakdown find bugs --config=production-bugs < your_code_list.md
```

### Sample Bug Indicators Found
The script demonstrates detection of:
- **TODO**: Tasks to be completed (e.g., "Move to environment variables")
- **FIXME**: Known issues requiring fixes (e.g., "Add proper error handling")
- **BUG**: Identified bugs (e.g., "Currency validation is missing")
- **HACK**: Temporary workarounds (e.g., "Temporary workaround for decimal precision")
- **XXX**: Questions or concerns (e.g., "Should we log successful payments?")
- **DEPRECATED**: Obsolete code (e.g., "Use processPayment instead")

### Test Files Created
1. `payment_service.ts`: TypeScript payment processing with various issues
2. `user_auth.py`: Python authentication module with security concerns

## Script 15: (If exists - not found in current directory)

*Note: Script 15 was not found in the examples directory during verification.*

## Common Verification Steps

### Pre-execution Requirements
1. Project must be initialized: `breakdown init`
2. Working directory must be the examples folder
3. Configuration directory `.agent/breakdown/config` must exist

### Post-execution Cleanup
Both scripts clean up temporary files after execution:
- Removes test markdown files
- Removes sample code directories
- Removes generated output files

### Error Handling
- Scripts use `set -e` for fail-fast behavior
- Trap ensures return to original directory on exit
- Checks for initialization before proceeding
- Clear error messages for missing prerequisites