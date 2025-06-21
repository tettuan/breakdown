#!/bin/bash
# Example 22: CI/CD Integration
# This example demonstrates how to use breakdown in CI/CD pipelines
set -euo pipefail

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Error handling
handle_error() {
    cd "$ORIGINAL_CWD"
    echo "Error: $1" >&2
    exit 1
}

# Set trap for better error reporting and CWD restoration
trap 'cd "$ORIGINAL_CWD"; handle_error "Command failed: ${BASH_COMMAND}"' ERR
trap 'cd "$ORIGINAL_CWD"' EXIT

# Get script directory and project root
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || handle_error "Failed to change to script directory"

echo "=== Example 22: CI/CD Integration ==="
echo "This example shows how to integrate breakdown into CI/CD pipelines"
echo

# Check if deno is installed
if ! command -v deno &> /dev/null; then
    echo "❌ Deno is not installed. Please install Deno first."
    exit 1
fi

# Set up directories
CI_DIR="tmp/ci-integration"
BUILD_DIR="$CI_DIR/build"
TEST_DIR="$CI_DIR/test-results"
REPORTS_DIR="$CI_DIR/reports"

echo "Creating CI/CD directories..."
mkdir -p "$BUILD_DIR" "$TEST_DIR" "$REPORTS_DIR" .agent/breakdown/config || handle_error "Failed to create directories"

# Create CI-specific configuration
cat > ".agent/breakdown/config/ci-app.yml" << 'EOF'
# CI/CD specific configuration
working_dir: "."
app_prompt:
  base_dir: "../lib/breakdown/prompts"
app_schema:
  base_dir: "../lib/breakdown/schema"
logger:
  level: "info"
  format: "text"
output:
  format: "markdown"
  includeHeaders: true
EOF

# Create sample source files to analyze
echo "=== Creating Sample Project for CI Analysis ==="

# Create a feature branch scenario
cat > "$CI_DIR/feature_branch_changes.md" << 'EOF'
# Feature Branch Changes

## New Features
- Added user authentication module
- Implemented REST API endpoints
- Added database migration scripts

## Bug Fixes
- Fixed memory leak in cache implementation
- Resolved race condition in async operations
- Fixed SQL injection vulnerability

## TODO Items
- Add unit tests for auth module
- Implement rate limiting
- Add API documentation
- Configure monitoring alerts

## Known Issues
- Performance degradation with large datasets
- Intermittent test failures on CI
- Docker image size needs optimization
EOF

# Create commit log for analysis
cat > "$CI_DIR/commit_log.txt" << 'EOF'
feat: Add user authentication module
fix: Resolve memory leak in cache implementation
chore: Update dependencies
docs: Add API documentation
test: Add integration tests for auth flow
refactor: Simplify error handling logic
feat: Implement rate limiting middleware
fix: SQL injection vulnerability patch
ci: Configure GitHub Actions workflow
perf: Optimize database queries
EOF

# Create error log from CI run
cat > "$CI_DIR/ci_error_log.txt" << 'EOF'
[ERROR] Test suite failed: AuthenticationTest
  Error: Connection refused at localhost:5432
  Stack trace:
    at PostgresConnection.connect (db/connection.ts:45)
    at AuthService.validateUser (services/auth.ts:123)
    at test_validateUser (tests/auth_test.ts:56)

[WARN] Linter warnings found:
  - Unused variable 'config' at src/utils/helpers.ts:34
  - Missing return type annotation at src/api/routes.ts:78
  - Complexity threshold exceeded in processData function

[ERROR] Build failed: TypeScript compilation errors
  TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
    at src/models/user.ts:89
  TS2551: Property 'username' does not exist on type 'User'
    at src/controllers/auth.ts:156

[INFO] Coverage report:
  - Overall coverage: 67.3%
  - Uncovered files:
    - src/utils/validators.ts (0%)
    - src/middleware/error.ts (45%)
    - src/config/database.ts (23%)
EOF

# CI configuration file for reference
cat > "$CI_DIR/ci_config.yml" << 'EOF'
# Example CI Configuration
name: Continuous Integration

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x
      
      - name: Analyze Changes with Breakdown
        run: |
          # Analyze commit messages
          git log --oneline -20 | breakdown summary changelog > reports/changelog.md
          
          # Analyze changed files
          git diff main...HEAD | breakdown to issue -o reports/issues/
          
          # Analyze test failures
          breakdown defect project < test-results/failed_tests.log > reports/test_analysis.md
          
      - name: Upload Analysis Reports
        uses: actions/upload-artifact@v3
        with:
          name: breakdown-analysis
          path: reports/
EOF

echo "Sample CI/CD files created."
echo

# Function to run breakdown command
run_breakdown() {
    local cmd="$1"
    echo "Running: $cmd"
    eval "$cmd"
    echo
}

echo "=== Running CI/CD Analysis Examples ==="
echo

# 1. Analyze feature branch changes
echo "1. Analyzing feature branch changes..."
run_breakdown "cat '$CI_DIR/feature_branch_changes.md' | deno run -A ../cli/breakdown.ts summary project --config=ci > '$REPORTS_DIR/feature_summary.md'"

echo "2. Breaking down changes into actionable items..."
run_breakdown "deno run -A ../cli/breakdown.ts to issue --config=ci < '$CI_DIR/feature_branch_changes.md' > '$REPORTS_DIR/issues.md'"

# 3. Analyze commit log
echo "3. Generating changelog from commits..."
run_breakdown "cat '$CI_DIR/commit_log.txt' | deno run -A ../cli/breakdown.ts summary project --config=ci > '$REPORTS_DIR/changelog.md'"

# 4. Analyze CI errors
echo "4. Analyzing CI error logs..."
run_breakdown "deno run -A ../cli/breakdown.ts defect project --config=ci < '$CI_DIR/ci_error_log.txt' > '$REPORTS_DIR/error_analysis.md'"

# 5. Create CI status report
echo "5. Creating comprehensive CI status report..."
cat > "$CI_DIR/ci_status.md" << 'EOF'
# CI Pipeline Status Report

## Build Information
- Build ID: #1234
- Branch: feature/user-auth
- Commit: a1b2c3d
- Triggered by: Pull Request #456

## Test Results
- Total Tests: 342
- Passed: 298
- Failed: 37
- Skipped: 7
- Coverage: 67.3%

## Quality Metrics
- Code Complexity: High (needs refactoring)
- Security Scan: 2 vulnerabilities found
- Performance: 15% regression detected

## Action Items
- Fix failing authentication tests
- Address security vulnerabilities
- Improve test coverage to 80%
- Optimize database queries
EOF

run_breakdown "deno run -A ../cli/breakdown.ts summary project --config=ci < '$CI_DIR/ci_status.md' > '$REPORTS_DIR/ci_summary.md'"

# 6. Generate PR review checklist
echo "6. Generating PR review checklist..."
cat > "$CI_DIR/pr_description.md" << 'EOF'
# Pull Request: Add User Authentication

## Description
This PR implements user authentication with JWT tokens.

## Changes
- Added auth service with login/logout
- Implemented JWT token generation
- Added password hashing with bcrypt
- Created auth middleware
- Added user session management

## Testing
- Unit tests for auth service
- Integration tests for auth flow
- Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] Documentation updated
- [ ] Security review completed
EOF

run_breakdown "deno run -A ../cli/breakdown.ts to task --config=ci < '$CI_DIR/pr_description.md' > '$REPORTS_DIR/pr_checklist.md'"

echo "=== CI/CD Integration Patterns ==="
echo

# Create shell script for CI integration
cat > "$REPORTS_DIR/ci_integration.sh" << 'EOF'
#!/bin/bash
# Breakdown CI Integration Script

set -euo pipefail

# Configuration
BREAKDOWN_VERSION="latest"
OUTPUT_DIR="breakdown-reports"

# Ensure output directory exists
mkdir -p "$OUTPUT_DIR"

# Function to check command success
check_status() {
    if [ $? -eq 0 ]; then
        echo "✅ $1 completed successfully"
    else
        echo "❌ $1 failed"
        exit 1
    fi
}

# 1. Analyze commit history
echo "📊 Analyzing commit history..."
git log --oneline -50 | breakdown summary changelog > "$OUTPUT_DIR/changelog.md"
check_status "Changelog generation"

# 2. Analyze code changes
echo "🔍 Analyzing code changes..."
if [ -n "${GITHUB_BASE_REF:-}" ]; then
    git diff "${GITHUB_BASE_REF}...HEAD" | breakdown to issue -o "$OUTPUT_DIR/issues/"
    check_status "Code change analysis"
fi

# 3. Analyze test results (if available)
if [ -f "test-results.xml" ]; then
    echo "🧪 Analyzing test results..."
    breakdown defect project < test-results.xml > "$OUTPUT_DIR/test_analysis.md"
    check_status "Test result analysis"
fi

# 4. Generate summary report
echo "📝 Generating summary report..."
cat > "$OUTPUT_DIR/build_info.md" << EOL
# Build Information
- Build Number: ${BUILD_NUMBER:-unknown}
- Branch: ${GITHUB_REF:-unknown}
- Commit: ${GITHUB_SHA:-unknown}
- Time: $(date)
EOL

breakdown summary project < "$OUTPUT_DIR/build_info.md" > "$OUTPUT_DIR/summary.md"
check_status "Summary generation"

echo "✨ CI analysis complete! Reports available in $OUTPUT_DIR/"
EOF

chmod +x "$REPORTS_DIR/ci_integration.sh"

echo "=== GitHub Actions Example ==="
cat > "$REPORTS_DIR/github_actions.yml" << 'EOF'
name: Breakdown Analysis

on: [push, pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0  # Full history for better analysis
    
    - uses: denoland/setup-deno@v1
    
    - name: Install Breakdown
      run: |
        deno install -A -n breakdown https://deno.land/x/breakdown/cli/breakdown.ts
        echo "$HOME/.deno/bin" >> $GITHUB_PATH
    
    - name: Analyze Changes
      run: |
        mkdir -p analysis-reports
        
        # Analyze commits
        git log --oneline -30 | breakdown summary changelog > analysis-reports/changelog.md
        
        # Analyze PR changes (if PR)
        if [ "${{ github.event_name }}" = "pull_request" ]; then
          git diff ${{ github.event.pull_request.base.sha }}...${{ github.event.pull_request.head.sha }} \
            | breakdown to issue -o analysis-reports/issues/
        fi
        
    - name: Comment PR
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const changelog = fs.readFileSync('analysis-reports/changelog.md', 'utf8');
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: '## Breakdown Analysis\n\n' + changelog
          });
    
    - name: Upload Reports
      uses: actions/upload-artifact@v3
      with:
        name: breakdown-analysis
        path: analysis-reports/
EOF

echo "=== GitLab CI Example ==="
cat > "$REPORTS_DIR/gitlab_ci.yml" << 'EOF'
# .gitlab-ci.yml
breakdown_analysis:
  stage: analyze
  image: denoland/deno:latest
  
  before_script:
    - deno install -A -n breakdown https://deno.land/x/breakdown/cli/breakdown.ts
    - export PATH="$HOME/.deno/bin:$PATH"
  
  script:
    - mkdir -p reports
    
    # Analyze merge request changes
    - |
      if [ -n "$CI_MERGE_REQUEST_IID" ]; then
        git diff origin/$CI_MERGE_REQUEST_TARGET_BRANCH_NAME...HEAD \
          | breakdown to issue -o reports/issues/
      fi
    
    # Analyze commit messages
    - git log --oneline -20 | breakdown summary changelog > reports/changelog.md
    
    # Analyze test results if available
    - |
      if [ -f "test-results.json" ]; then
        breakdown defect project < test-results.json > reports/test_analysis.md
      fi
  
  artifacts:
    reports:
      junit: reports/*.xml
    paths:
      - reports/
    expire_in: 1 week
  
  only:
    - merge_requests
    - main
    - develop
EOF

echo "=== Jenkins Pipeline Example ==="
cat > "$REPORTS_DIR/Jenkinsfile" << 'EOF'
pipeline {
    agent any
    
    environment {
        DENO_DIR = "${WORKSPACE}/.deno"
    }
    
    stages {
        stage('Setup') {
            steps {
                sh '''
                    curl -fsSL https://deno.land/x/install/install.sh | sh
                    export PATH="$HOME/.deno/bin:$PATH"
                    deno install -A -n breakdown https://deno.land/x/breakdown/cli/breakdown.ts
                '''
            }
        }
        
        stage('Analyze') {
            steps {
                sh '''
                    export PATH="$HOME/.deno/bin:$PATH"
                    mkdir -p analysis
                    
                    # Analyze recent changes
                    git log --oneline -30 | breakdown summary changelog > analysis/changelog.md
                    
                    # Analyze workspace changes
                    git diff HEAD~5...HEAD | breakdown to issue -o analysis/issues/
                    
                    # Analyze any test failures
                    if [ -f "test-results.log" ]; then
                        breakdown defect project < test-results.log > analysis/test_analysis.md
                    fi
                '''
            }
        }
        
        stage('Report') {
            steps {
                publishHTML([
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: 'analysis',
                    reportFiles: '*.md',
                    reportName: 'Breakdown Analysis'
                ])
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'analysis/**/*', fingerprint: true
        }
    }
}
EOF

echo
echo "=== Results Summary ==="
echo "Generated reports in: $REPORTS_DIR/"
ls -la "$REPORTS_DIR/"

echo
echo "=== CI/CD Integration Benefits ==="
echo "1. ✅ Automatic changelog generation from commits"
echo "2. ✅ Issue detection from code changes"
echo "3. ✅ Error log analysis and categorization"
echo "4. ✅ PR/MR review automation"
echo "5. ✅ Build status summarization"
echo "6. ✅ Test failure analysis"

echo
echo "=== Integration Tips ==="
echo "• Use breakdown in CI to analyze changes before merge"
echo "• Generate reports for code review discussions"
echo "• Automate issue creation from analysis results"
echo "• Track technical debt through continuous analysis"
echo "• Monitor code quality trends over time"

echo
echo "=== Example Complete ==="
echo "This example demonstrated:"
echo "• CI/CD pipeline integration patterns"
echo "• Automated code analysis workflows"
echo "• Report generation for different CI platforms"
echo "• Error and test failure analysis"
echo "• PR/MR automation helpers"

echo -e "\nExample 22 completed successfully!"