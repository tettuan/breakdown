#!/bin/bash

# This script initializes the Breakdown project structure using deno run

set -e

# Save the original CWD
ORIGINAL_CWD="$(pwd)"

# Ensure we return to the original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Move to the examples directory (script location)
cd "$(dirname "$0")"

echo "=== Initializing Breakdown Project Structure (deno run) ==="

# Check if .agent/breakdown already exists in examples directory
if [ -d ".agent/breakdown" ]; then
  echo "Warning: .agent/breakdown directory already exists in examples"
  echo "Continuing with profile configuration files creation..."
fi

# Initialize project structure if not exists
if [ ! -d ".agent/breakdown" ]; then
  # Initialize project structure manually due to version.ts export issues
  echo "Creating .agent/breakdown directory structure manually..."
  mkdir -p .agent/breakdown/{config,prompts,schema,temp,output}
  mkdir -p .agent/breakdown/prompts/{to,summary,defect}/{project,issue,task}
  
  # Create default-app.yml manually
  cat > .agent/breakdown/config/default-app.yml << 'EOF'
# Breakdown Default Configuration
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: ".agent/breakdown/prompts"
app_schema:
  base_dir: ".agent/breakdown/schema"
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
EOF
  echo "✅ Successfully created directory structure and default-app.yml"

  # Copy prompt templates from test fixtures to make examples functional
  echo "Copying prompt templates..."
  if [ -d "../tests/fixtures/prompts" ]; then
    cp -r ../tests/fixtures/prompts/* .agent/breakdown/prompts/ 2>/dev/null || echo "Warning: Some prompt templates could not be copied"
    echo "✅ Prompt templates copied from test fixtures"
  else
    echo "⚠️ Warning: Test fixtures not found, prompts directory will be empty"
  fi

  # Clean up incorrectly copied templates - remove files that don't match required pattern
  echo "Cleaning up incorrectly named templates..."
  find .agent/breakdown/prompts -name "*.md" -type f | while read -r file; do
    # Extract path components using dirname and basename
    directive=$(basename "$(dirname "$(dirname "$file")")")
    layer=$(basename "$(dirname "$file")")
    filename=$(basename "$file")
    expected_filename="f_${layer}.md"
    
    if [ "$filename" != "$expected_filename" ] && [ "$filename" != "test_prompt.md" ]; then
      echo "Removing incorrectly named template: $file"
      rm -f "$file"
    fi
  done

  # Create missing defect prompts that are expected by examples
  echo "Creating missing defect prompts..."
  mkdir -p .agent/breakdown/prompts/defect/project
  mkdir -p .agent/breakdown/prompts/defect/issue
  
  # Create basic defect/project template
  if [ ! -f ".agent/breakdown/prompts/defect/project/f_project.md" ]; then
    cat > .agent/breakdown/prompts/defect/project/f_project.md << 'EOF'
# Defect Analysis Template

## Input

{input_text}

> Note: {input_text} will be replaced with actual input when using STDIN (e.g., `echo "content" | breakdown defect project`).
> When running without STDIN, this placeholder will remain as-is for manual replacement.

## Output

- output.md

---

## Analysis Perspectives

- Error patterns and root causes
- Impact assessment
- Fix recommendations
- Prevention strategies
- Quality metrics

## Instructions

1. Analyze the defect information from the above perspectives.
2. Identify patterns and underlying causes.
3. Assess impact and urgency level.
4. Provide specific fix recommendations.
5. Suggest prevention measures.

## Output Format

- Output as structured Markdown.
EOF
  fi

  # Create basic defect/issue template
  if [ ! -f ".agent/breakdown/prompts/defect/issue/f_issue.md" ]; then
    cat > .agent/breakdown/prompts/defect/issue/f_issue.md << 'EOF'
# Issue Defect Analysis Template

## Input

{input_text}

## Output

- output.md

---

## Analysis Perspectives

- Issue description and context
- Error reproduction steps
- Impact on users/system
- Fix priority and timeline
- Testing requirements

## Instructions

1. Analyze the issue information from the above perspectives.
2. Break down the problem into actionable items.
3. Estimate fix complexity and timeline.
4. Define testing and verification steps.

## Output Format

- Output as structured Markdown.
EOF
  fi

  # Create missing summary prompts that are expected by examples
  echo "Creating missing summary prompts..."
  mkdir -p .agent/breakdown/prompts/summary/project
  mkdir -p .agent/breakdown/prompts/summary/issue
  
  # Create summary/project/f_project.md template
  if [ ! -f ".agent/breakdown/prompts/summary/project/f_project.md" ]; then
    cat > .agent/breakdown/prompts/summary/project/f_project.md << 'EOF'
# Project Summary Prompt

This prompt helps create comprehensive project summaries.

## Input

{input_text}

> Note: {input_text} will be replaced with actual input when using STDIN (e.g., `echo "content" | breakdown summary project`).
> When running without STDIN, this placeholder will remain as-is for manual replacement.

## Output

The output should be a structured project summary with:

- Project status overview
- Progress on key objectives
- Deliverable status
- Technical achievements
- Timeline assessment
- Resource utilization
- Dependency status
- Risk assessment
- Next steps

## Instructions

1. Analyze project documentation
2. Assess progress on objectives
3. Review deliverable status
4. Evaluate technical progress
5. Compare timeline estimates
6. Review resource usage
7. Check dependency status
8. Update risk assessment
9. Identify action items
EOF
  fi

  # Create summary/issue/f_issue.md template
  if [ ! -f ".agent/breakdown/prompts/summary/issue/f_issue.md" ]; then
    cat > .agent/breakdown/prompts/summary/issue/f_issue.md << 'EOF'
# Issue Summary Template

## Input

- {input_text}

## Output

- output.md

---

## Summary Perspectives

- Issue overview
- Key requirements and issues
- Dependencies summary
- Priority and urgency
- Effort estimation
- Status and blockers

## Instructions

1. Summarize the input information from the above perspectives.
2. Create summaries in units of 100, 200, and 300 characters.
3. Structure the summary with chapters and paragraphs.
4. Clearly indicate any missing information as "Missing Information".
5. Always use template variables.

## Output Format

- Output as structured Markdown.
EOF
  fi

  # Create missing summary/task template
  echo "Creating missing summary/task prompts..."
  mkdir -p .agent/breakdown/prompts/summary/task
  
  # Create summary/task/f_task.md template
  if [ ! -f ".agent/breakdown/prompts/summary/task/f_task.md" ]; then
    cat > .agent/breakdown/prompts/summary/task/f_task.md << 'EOF'
# Task Summary Template

## Input

{input_text}

## Output

The output should be a structured task summary with:

- Task overview and objectives
- Key deliverables and acceptance criteria
- Dependencies and prerequisites
- Effort estimation and timeline
- Risk assessment and mitigation
- Success metrics

## Instructions

1. Analyze task information from the above perspectives
2. Create executive summaries in 100, 200, and 300 character variants
3. Structure with clear headings and bullet points
4. Identify any missing information as "Missing Information"
5. Use template variables appropriately

## Output Format

- Output as structured Markdown
EOF
  fi

  # Create missing defect/task template
  echo "Creating missing defect/task prompts..."
  mkdir -p .agent/breakdown/prompts/defect/task
  
  # Create defect/task/f_task.md template
  if [ ! -f ".agent/breakdown/prompts/defect/task/f_task.md" ]; then
    cat > .agent/breakdown/prompts/defect/task/f_task.md << 'EOF'
# Task Defect Analysis Template

## Input

{input_text}

## Output

- output.md

---

## Analysis Perspectives

- Task definition clarity and completeness
- Implementation approach and feasibility
- Resource allocation and timeline
- Dependencies and blockers
- Risk factors and mitigation
- Quality criteria and testing

## Instructions

1. Analyze the task information from the above perspectives.
2. Identify potential issues and improvement areas.
3. Assess task complexity and implementation risks.
4. Provide specific recommendations for task refinement.

## Output Format

- Output as structured Markdown.
EOF
  fi

  # Create missing to/task template
  echo "Creating missing to/task prompts..."
  mkdir -p .agent/breakdown/prompts/to/task
  
  # Create to/task/f_task.md template
  if [ ! -f ".agent/breakdown/prompts/to/task/f_task.md" ]; then
    cat > .agent/breakdown/prompts/to/task/f_task.md << 'EOF'
# Task Breakdown Template

## Input

{input_text}

> Note: {input_text} will be replaced with actual input when using STDIN (e.g., `echo "content" | breakdown to task`).
> When running without STDIN, this placeholder will remain as-is for manual replacement.

## Output

- output.md

---

## Breakdown Perspectives

- Task decomposition and subtasks
- Implementation approach and methodology
- Resource requirements and allocation
- Timeline and milestone planning
- Dependencies and prerequisites
- Risk assessment and contingency
- Quality assurance and testing

## Instructions

1. Break down the input information according to the above perspectives.
2. Create actionable subtasks with clear ownership.
3. Define measurable success criteria.
4. Identify critical path and dependencies.
5. Structure as implementable work units.

## Output Format

- Output as structured Markdown according to the task schema.
EOF
  fi

  # Create missing to/issue/f_issue.md template
  echo "Creating missing to/issue prompts..."
  mkdir -p .agent/breakdown/prompts/to/issue
  
  # Create to/issue/f_issue.md template
  if [ ! -f ".agent/breakdown/prompts/to/issue/f_issue.md" ]; then
    cat > .agent/breakdown/prompts/to/issue/f_issue.md << 'EOF'
# Issue Breakdown Detailed Template

## Input

{input_text}

> Note: {input_text} will be replaced with actual input when using STDIN (e.g., `echo "content" | breakdown to issue`).
> When running without STDIN, this placeholder will remain as-is for manual replacement.

## Output

- output.md

---

## Breakdown Perspectives

- Requirements/specification classification
- Issue purpose, problems, background, and history
- MoSCoW analysis, DDD, design patterns
- Taskification and relationships between tasks (blocked, related, sub, parent)

## Instructions

1. Break down the input information according to the above perspectives.
2. Create a section for each perspective and organize the information.
3. Clearly indicate any missing information as "Missing Information".
4. Always use template variables.

## Output Format

- Output as structured Markdown according to the issue schema.
EOF
  fi

  # Create missing to/project/f_project.md template if needed
  mkdir -p .agent/breakdown/prompts/to/project
  if [ ! -f ".agent/breakdown/prompts/to/project/f_project.md" ]; then
    cat > .agent/breakdown/prompts/to/project/f_project.md << 'EOF'
# Project Breakdown Template

## Input

{input_text}

> Note: {input_text} will be replaced with actual input when using STDIN (e.g., `echo "content" | breakdown to project`).
> When running without STDIN, this placeholder will remain as-is for manual replacement.

## Output

- output.md

---

## Breakdown Perspectives

- Project scope and objectives
- Architecture and technical approach
- Resource planning and team structure
- Timeline and milestone breakdown
- Risk assessment and mitigation strategies
- Quality assurance and testing approach
- Deployment and operational considerations

## Instructions

1. Break down the input information according to the above perspectives.
2. Create comprehensive project documentation.
3. Define clear deliverables and success criteria.
4. Identify dependencies and critical path.
5. Structure as actionable project plan.

## Output Format

- Output as structured Markdown according to the project schema.
EOF
  fi

  # Create missing find/* templates
  echo "Creating find directive prompts..."
  mkdir -p .agent/breakdown/prompts/find/{project,issue,task,bugs}
  
  # Create find/bugs/f_bugs.md template
  if [ ! -f ".agent/breakdown/prompts/find/bugs/f_bugs.md" ]; then
    cat > .agent/breakdown/prompts/find/bugs/f_bugs.md << 'EOF'
# Find Bugs Template

## Input

{input_text}

## Output

- bugs_report.md

---

## Bug Detection Perspectives

- Code smells and anti-patterns
- Security vulnerabilities
- Performance bottlenecks
- Error handling issues
- Concurrency problems
- Memory leaks
- API misuse
- Dead code

## Instructions

1. Analyze the code for potential bugs
2. Categorize issues by severity (Critical, High, Medium, Low)
3. Provide specific line numbers and code references
4. Suggest fixes for each identified issue
5. Include best practice recommendations

## Output Format

- Output as structured Markdown with severity levels
EOF
  fi

  # Create find/project/f_project.md template
  if [ ! -f ".agent/breakdown/prompts/find/project/f_project.md" ]; then
    cat > .agent/breakdown/prompts/find/project/f_project.md << 'EOF'
# Find Project Issues Template

## Input

{input_text}

## Output

- project_issues.md

---

## Project Analysis Perspectives

- Architecture issues
- Technical debt
- Dependency problems
- Configuration issues
- Documentation gaps
- Testing coverage
- CI/CD problems
- Security concerns

## Instructions

1. Analyze project structure and configuration
2. Identify architectural and design issues
3. Find dependency and compatibility problems
4. Detect missing or outdated documentation
5. Assess testing and quality gaps

## Output Format

- Output as structured Markdown by category
EOF
  fi

  # Create find/issue/f_issue.md template
  if [ ! -f ".agent/breakdown/prompts/find/issue/f_issue.md" ]; then
    cat > .agent/breakdown/prompts/find/issue/f_issue.md << 'EOF'
# Find Issue Problems Template

## Input

{input_text}

## Output

- issue_problems.md

---

## Issue Analysis Perspectives

- Incomplete requirements
- Ambiguous specifications
- Missing acceptance criteria
- Dependency conflicts
- Resource constraints
- Timeline risks
- Technical blockers

## Instructions

1. Analyze issue description for completeness
2. Identify missing or unclear requirements
3. Find potential implementation problems
4. Detect dependency and resource issues
5. Assess risks and blockers

## Output Format

- Output as structured Markdown with recommendations
EOF
  fi

  # Create find/task/f_task.md template
  if [ ! -f ".agent/breakdown/prompts/find/task/f_task.md" ]; then
    cat > .agent/breakdown/prompts/find/task/f_task.md << 'EOF'
# Find Task Issues Template

## Input

{input_text}

## Output

- task_issues.md

---

## Task Analysis Perspectives

- Task definition clarity
- Missing prerequisites
- Unclear success criteria
- Resource allocation issues
- Time estimation problems
- Skill requirements gaps
- Testing approach issues

## Instructions

1. Analyze task definition for clarity
2. Identify missing prerequisites and dependencies
3. Find unclear or missing success criteria
4. Detect resource and time estimation issues
5. Assess testing and quality concerns

## Output Format

- Output as structured Markdown with action items
EOF
  fi

  # Verify the created structure
  if [ -d ".agent/breakdown" ]; then
    echo "✅ Successfully initialized project structure"
    echo
    echo "Created directories:"
    find .agent/breakdown -type d | head -10
    echo
    echo "Created prompt files:"
    find .agent/breakdown/prompts -type f | head -15
  else
    echo "❌ Failed to initialize project structure"
    exit 1
  fi
fi

echo "=== Creating Missing Profile Configuration Files ==="

# Create default profile configuration with find directive enabled
# Override the default configuration created by init command
echo "Updating default configuration to include find directive..."
cat > .agent/breakdown/config/default-app.yml << 'EOF'
# Breakdown Default Configuration (with find bugs support)
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: ".agent/breakdown/prompts"
app_schema:
  base_dir: ".agent/breakdown/schema"
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
EOF
echo "✅ Created default-app.yml with find bugs support"

# Create findbugs profile configuration
if [ ! -f ".agent/breakdown/config/findbugs-app.yml" ]; then
  cat > .agent/breakdown/config/findbugs-app.yml << 'EOF'
# Breakdown Configuration with Find Bugs Support
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: ".agent/breakdown/prompts"
app_schema:
  base_dir: ".agent/breakdown/schema"
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
EOF
  echo "✅ Created findbugs-app.yml"
fi

# Create stdin profile configuration
if [ ! -f ".agent/breakdown/config/stdin-app.yml" ]; then
  cat > .agent/breakdown/config/stdin-app.yml << 'EOF'
# Breakdown Configuration for STDIN Profile
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: ".agent/breakdown/prompts"
app_schema:
  base_dir: ".agent/breakdown/schema"
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
EOF
  echo "✅ Created stdin-app.yml"
fi

if [ ! -f ".agent/breakdown/config/stdin-user.yml" ]; then
  cat > .agent/breakdown/config/stdin-user.yml << 'EOF'
working_dir: ".agent/breakdown/examples"
username: "stdin-user"
project_name: "stdin-project"
EOF
  echo "✅ Created stdin-user.yml"
fi

# Create timeout profile configuration
if [ ! -f ".agent/breakdown/config/timeout-app.yml" ]; then
  cat > .agent/breakdown/config/timeout-app.yml << 'EOF'
# Breakdown Configuration for Timeout Profile
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: ".agent/breakdown/prompts"
app_schema:
  base_dir: ".agent/breakdown/schema"
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
timeout_seconds: 30
EOF
  echo "✅ Created timeout-app.yml"
fi

if [ ! -f ".agent/breakdown/config/timeout-user.yml" ]; then
  cat > .agent/breakdown/config/timeout-user.yml << 'EOF'
working_dir: ".agent/breakdown/examples"
username: "timeout-user"
project_name: "timeout-project"
EOF
  echo "✅ Created timeout-user.yml"
fi

# Create basic profile configuration
if [ ! -f ".agent/breakdown/config/basic-app.yml" ]; then
  cat > .agent/breakdown/config/basic-app.yml << 'EOF'
# Breakdown Configuration for Basic Profile
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: ".agent/breakdown/prompts"
app_schema:
  base_dir: ".agent/breakdown/schema"
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
basic_mode: true
EOF
  echo "✅ Created basic-app.yml"
fi

if [ ! -f ".agent/breakdown/config/basic-user.yml" ]; then
  cat > .agent/breakdown/config/basic-user.yml << 'EOF'
working_dir: ".agent/breakdown/examples"
username: "basic-user"
project_name: "basic-project"
EOF
  echo "✅ Created basic-user.yml"
fi

# Create team profile configuration
if [ ! -f ".agent/breakdown/config/team-app.yml" ]; then
  cat > .agent/breakdown/config/team-app.yml << 'EOF'
# Team development configuration
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: ".agent/breakdown/prompts"
  template_prefix: "team_"
app_schema:
  base_dir: ".agent/breakdown/schema"
  validation_enabled: true
  strict_mode: false
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
logger:
  level: "debug"
  format: "text"
  output: "stdout"
  includeTimestamp: true
  includeContext: true
collaboration:
  enableSharing: true
  defaultVisibility: "team"
  reviewRequired: true
output:
  format: "markdown"
  includeHeaders: true
  includeFooters: true
  includeMetadata: true
  authorInfo: true
features:
  cliValidation: true
  experimentalFeatures: true
  teamFeatures: true
  debugMode: true
EOF
  echo "✅ Created team-app.yml"
fi

if [ ! -f ".agent/breakdown/config/team-user.yml" ]; then
  cat > .agent/breakdown/config/team-user.yml << 'EOF'
working_dir: ".agent/breakdown/examples"
username: "team-user"
project_name: "team-project"
team_name: "development-team"
EOF
  echo "✅ Created team-user.yml"
fi

# Create production-bugs profile configuration
if [ ! -f ".agent/breakdown/config/production-bugs-app.yml" ]; then
  cat > .agent/breakdown/config/production-bugs-app.yml << 'EOF'
# Breakdown Configuration for Production Bugs Profile
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: ".agent/breakdown/prompts"
app_schema:
  base_dir: ".agent/breakdown/schema"
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
production_mode: true
bug_detection: true
EOF
  echo "✅ Created production-bugs-app.yml"
fi

if [ ! -f ".agent/breakdown/config/production-bugs-user.yml" ]; then
  cat > .agent/breakdown/config/production-bugs-user.yml << 'EOF'
working_dir: ".agent/breakdown/examples"
username: "production-bugs-user"
project_name: "production-bugs-project"
environment: "production"
EOF
  echo "✅ Created production-bugs-user.yml"
fi

# Create production-custom profile configuration
if [ ! -f ".agent/breakdown/config/production-custom-app.yml" ]; then
  cat > .agent/breakdown/config/production-custom-app.yml << 'EOF'
# Breakdown Configuration for Production Custom Profile
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: ".agent/breakdown/prompts"
app_schema:
  base_dir: ".agent/breakdown/schema"
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
production_mode: true
custom_config: true
advanced_features: true
EOF
  echo "✅ Created production-custom-app.yml"
fi

if [ ! -f ".agent/breakdown/config/production-custom-user.yml" ]; then
  cat > .agent/breakdown/config/production-custom-user.yml << 'EOF'
working_dir: ".agent/breakdown/examples"
username: "production-custom-user"
project_name: "production-custom-project"
environment: "production"
custom_settings:
  enable_advanced_analysis: true
  include_performance_metrics: true
EOF
  echo "✅ Created production-custom-user.yml"
fi

# Create production profile configuration
if [ ! -f ".agent/breakdown/config/production-app.yml" ]; then
  cat > .agent/breakdown/config/production-app.yml << 'EOF'
# Breakdown Configuration for Production Profile
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: ".agent/breakdown/prompts"
app_schema:
  base_dir: ".agent/breakdown/schema"
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
production_mode: true
logger:
  level: "warn"
  format: "json"
  output: "stderr"
  includeTimestamp: true
performance:
  maxFileSize: "10MB"
  timeout: 30000
  concurrency: 4
  cacheEnabled: true
output:
  format: "markdown"
  includeHeaders: true
  includeFooters: false
  maxLineLength: 120
security:
  sanitizeInput: true
  allowedProtocols: ["https", "file"]
  blockedPatterns: [".env", "secrets", "password"]
features:
  cliValidation: true
  experimentalFeatures: false
EOF
  echo "✅ Created production-app.yml"
fi

# Create missing production-user.yml (to complete production profile)
if [ ! -f ".agent/breakdown/config/production-user.yml" ]; then
  cat > .agent/breakdown/config/production-user.yml << 'EOF'
working_dir: ".agent/breakdown/examples"
username: "production-user"
project_name: "production-project"
environment: "production"
EOF
  echo "✅ Created production-user.yml"
fi

# Create environment-specific profile configurations (dev, staging, prod)
if [ ! -f ".agent/breakdown/config/dev-app.yml" ]; then
  cat > .agent/breakdown/config/dev-app.yml << 'EOF'
# Development environment configuration
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: ".agent/breakdown/prompts"
app_schema:
  base_dir: ".agent/breakdown/schema"
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
logger:
  level: "debug"
  format: "text"
  output: "stdout"
  colorize: true
features:
  experimentalFeatures: true
  debugMode: true
EOF
  echo "✅ Created dev-app.yml"
fi

if [ ! -f ".agent/breakdown/config/dev-user.yml" ]; then
  cat > .agent/breakdown/config/dev-user.yml << 'EOF'
working_dir: ".agent/breakdown/examples"
username: "dev-user"
project_name: "dev-project"
environment: "development"
EOF
  echo "✅ Created dev-user.yml"
fi

if [ ! -f ".agent/breakdown/config/staging-app.yml" ]; then
  cat > .agent/breakdown/config/staging-app.yml << 'EOF'
# Staging environment configuration
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: ".agent/breakdown/prompts"
app_schema:
  base_dir: ".agent/breakdown/schema"
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
logger:
  level: "info"
  format: "json"
  output: "stderr"
performance:
  maxFileSize: "5MB"
  timeout: 20000
features:
  experimentalFeatures: false
  debugMode: false
EOF
  echo "✅ Created staging-app.yml"
fi

if [ ! -f ".agent/breakdown/config/staging-user.yml" ]; then
  cat > .agent/breakdown/config/staging-user.yml << 'EOF'
working_dir: ".agent/breakdown/examples"
username: "staging-user"
project_name: "staging-project"
environment: "staging"
EOF
  echo "✅ Created staging-user.yml"
fi

if [ ! -f ".agent/breakdown/config/prod-app.yml" ]; then
  cat > .agent/breakdown/config/prod-app.yml << 'EOF'
# Production environment configuration
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: ".agent/breakdown/prompts"
app_schema:
  base_dir: ".agent/breakdown/schema"
params:
  two:
    directiveType:
      pattern: "^(to|summary|defect|find)$"
    layerType:
      pattern: "^(project|issue|task|bugs)$"
workspace:
  working_dir: ".agent/breakdown"
  temp_dir: ".agent/breakdown/temp"
logger:
  level: "error"
  format: "json"
  output: "stderr"
  includeStackTrace: false
performance:
  maxFileSize: "10MB"
  timeout: 30000
  concurrency: 8
security:
  sanitizeInput: true
  auditLog: true
features:
  experimentalFeatures: false
  debugMode: false
EOF
  echo "✅ Created prod-app.yml"
fi

if [ ! -f ".agent/breakdown/config/prod-user.yml" ]; then
  cat > .agent/breakdown/config/prod-user.yml << 'EOF'
working_dir: ".agent/breakdown/examples"
username: "prod-user"
project_name: "prod-project"
environment: "production"
EOF
  echo "✅ Created prod-user.yml"
fi

echo "=== Post-initialization Template Validation ==="
# Validate that all required templates exist
MISSING_TEMPLATES=()

# Check required templates based on TwoParams system
REQUIRED_TEMPLATES=(
  ".agent/breakdown/prompts/to/project/f_project.md"
  ".agent/breakdown/prompts/to/issue/f_issue.md"  
  ".agent/breakdown/prompts/to/task/f_task.md"
  ".agent/breakdown/prompts/summary/project/f_project.md"
  ".agent/breakdown/prompts/summary/issue/f_issue.md"
  ".agent/breakdown/prompts/summary/task/f_task.md"
  ".agent/breakdown/prompts/defect/project/f_project.md"
  ".agent/breakdown/prompts/defect/issue/f_issue.md"
  ".agent/breakdown/prompts/defect/task/f_task.md"
)

for template in "${REQUIRED_TEMPLATES[@]}"; do
  if [ ! -f "$template" ]; then
    MISSING_TEMPLATES+=("$template")
  fi
done

if [ ${#MISSING_TEMPLATES[@]} -eq 0 ]; then
  echo "✅ All required templates are present"
else
  echo "⚠️ Missing templates detected:"
  for missing in "${MISSING_TEMPLATES[@]}"; do
    echo "  - $missing"
  done
fi

echo "=== Configuration Files Validation ==="
# Validate that all required configuration files exist
MISSING_CONFIGS=()

# Check required configuration files based on script matrix (app files only - user files created by 03)
REQUIRED_CONFIGS=(
  ".agent/breakdown/config/default-app.yml"
  ".agent/breakdown/config/stdin-app.yml"
  ".agent/breakdown/config/timeout-app.yml"
  ".agent/breakdown/config/basic-app.yml"
  ".agent/breakdown/config/production-app.yml"
  ".agent/breakdown/config/team-app.yml"
  ".agent/breakdown/config/production-bugs-app.yml"
  ".agent/breakdown/config/production-custom-app.yml"
  ".agent/breakdown/config/dev-app.yml"
  ".agent/breakdown/config/staging-app.yml"
  ".agent/breakdown/config/prod-app.yml"
)

for config in "${REQUIRED_CONFIGS[@]}"; do
  if [ ! -f "$config" ]; then
    MISSING_CONFIGS+=("$config")
  fi
done

if [ ${#MISSING_CONFIGS[@]} -eq 0 ]; then
  echo "✅ All required app configuration files are present"
else
  echo "⚠️ Missing app configuration files detected:"
  for missing in "${MISSING_CONFIGS[@]}"; do
    echo "  - $missing"
  done
fi

echo "=== Initialization Completed ==="