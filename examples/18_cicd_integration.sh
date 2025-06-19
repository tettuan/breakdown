#!/bin/bash
# Example 22: CI/CD Integration
# CI/CDパイプラインでのBreakdown活用例

set -e

# Save original working directory
ORIGINAL_CWD="$(pwd)"

# Ensure we return to original directory on exit
trap 'cd "$ORIGINAL_CWD"' EXIT

# Get script directory and ensure we're in the examples directory
SCRIPT_DIR="$(dirname "$0")"
cd "$SCRIPT_DIR" || exit 1

echo "=== CI/CD Integration Example ==="
echo "継続的インテグレーション環境でのBreakdown活用"
echo

# Ensure breakdown is available
if command -v breakdown &> /dev/null; then
    BREAKDOWN="breakdown"
else
    BREAKDOWN="deno run --allow-read --allow-write --allow-env --allow-net ../cli/breakdown.ts"
fi

# Create directories
OUTPUT_DIR="./output/cicd"
mkdir -p "$OUTPUT_DIR"

# CI環境変数のシミュレーション
export CI=true
export GITHUB_ACTIONS=true
export GITHUB_REPOSITORY="example/project"
export GITHUB_REF="refs/heads/feature/new-feature"
export GITHUB_SHA="abc123def456"
export GITHUB_ACTOR="developer"

# Example 1: GitHub Actions Workflow
echo "=== Example 1: GitHub Actions Workflow ==="
cat > "$OUTPUT_DIR/.github_workflows_breakdown.yml" << 'EOF'
name: Documentation Generation with Breakdown

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  generate-docs:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Deno
      uses: denoland/setup-deno@v1
      with:
        deno-version: v1.x
    
    - name: Install Breakdown
      run: |
        deno install -A -n breakdown https://deno.land/x/breakdown/cli/breakdown.ts
        echo "$HOME/.deno/bin" >> $GITHUB_PATH
    
    - name: Generate Project Summary
      run: |
        echo "# ${{ github.repository }}" > project_overview.md
        echo "Commit: ${{ github.sha }}" >> project_overview.md
        echo "Branch: ${{ github.ref }}" >> project_overview.md
        cat README.md >> project_overview.md
        
        breakdown summary project --from=project_overview.md \
          --uv-repo="${{ github.repository }}" \
          --uv-branch="${{ github.ref }}" \
          --uv-commit="${{ github.sha }}" \
          -o=docs/project_summary.md
    
    - name: Analyze Changes
      if: github.event_name == 'pull_request'
      run: |
        git diff ${{ github.event.pull_request.base.sha }}..HEAD > changes.diff
        breakdown defect project --from=changes.diff -o=pr_analysis.md
    
    - name: Generate Issue Report
      run: |
        find . -name "TODO" -o -name "FIXME" | xargs grep -l "" | \
        xargs cat | breakdown to issue -o=issues/
    
    - name: Upload Artifacts
      uses: actions/upload-artifact@v3
      with:
        name: breakdown-reports
        path: |
          docs/project_summary.md
          pr_analysis.md
          issues/
    
    - name: Comment PR
      if: github.event_name == 'pull_request'
      uses: actions/github-script@v6
      with:
        script: |
          const fs = require('fs');
          const analysis = fs.readFileSync('pr_analysis.md', 'utf8');
          github.rest.issues.createComment({
            issue_number: context.issue.number,
            owner: context.repo.owner,
            repo: context.repo.repo,
            body: '## Breakdown Analysis\\n\\n' + analysis
          });
EOF

echo "✅ GitHub Actions workflow 生成完了"

# Example 2: GitLab CI Pipeline
echo
echo "=== Example 2: GitLab CI Pipeline ==="
cat > "$OUTPUT_DIR/.gitlab-ci.yml" << 'EOF'
stages:
  - analyze
  - document
  - report

variables:
  BREAKDOWN_VERSION: "latest"

before_script:
  - apt-get update -qq && apt-get install -y curl
  - curl -fsSL https://deno.land/x/install/install.sh | sh
  - export PATH="$HOME/.deno/bin:$PATH"
  - deno install -A -n breakdown https://deno.land/x/breakdown/cli/breakdown.ts

analyze:changes:
  stage: analyze
  script:
    - |
      if [ "$CI_PIPELINE_SOURCE" == "merge_request_event" ]; then
        git diff $CI_MERGE_REQUEST_DIFF_BASE_SHA..HEAD > changes.diff
        breakdown defect project --from=changes.diff -o=analysis/defects.md
        breakdown summary project --from=changes.diff -o=analysis/summary.md
      fi
  artifacts:
    paths:
      - analysis/
    expire_in: 1 week
  only:
    - merge_requests

generate:docs:
  stage: document
  script:
    - find src -name "*.md" -type f | xargs cat > all_docs.md
    - breakdown summary project --from=all_docs.md -o=docs/project_overview.md
    - breakdown to issue --from=docs/project_overview.md -o=docs/issues/
  artifacts:
    paths:
      - docs/
    expire_in: 1 month
  only:
    - main
    - develop

quality:report:
  stage: report
  script:
    - |
      # コード品質メトリクス生成
      echo "# Code Quality Report" > quality.md
      echo "Pipeline: $CI_PIPELINE_ID" >> quality.md
      echo "Commit: $CI_COMMIT_SHA" >> quality.md
      
      # TODOとFIXMEの集計
      TODO_COUNT=$(grep -r "TODO" src/ | wc -l || echo 0)
      FIXME_COUNT=$(grep -r "FIXME" src/ | wc -l || echo 0)
      
      echo "## Technical Debt" >> quality.md
      echo "- TODO items: $TODO_COUNT" >> quality.md
      echo "- FIXME items: $FIXME_COUNT" >> quality.md
      
      breakdown summary task --from=quality.md \
        --uv-pipeline_id="$CI_PIPELINE_ID" \
        --uv-commit="$CI_COMMIT_SHA" \
        -o=reports/quality_summary.md
  artifacts:
    reports:
      junit: reports/quality_summary.xml
    paths:
      - reports/
EOF

echo "✅ GitLab CI pipeline 生成完了"

# Example 3: Jenkins Pipeline
echo
echo "=== Example 3: Jenkins Pipeline ==="
cat > "$OUTPUT_DIR/Jenkinsfile" << 'EOF'
pipeline {
    agent any
    
    environment {
        BREAKDOWN_PATH = "${WORKSPACE}/breakdown"
    }
    
    stages {
        stage('Setup') {
            steps {
                script {
                    // Install Deno and Breakdown
                    sh '''
                        curl -fsSL https://deno.land/x/install/install.sh | sh
                        export PATH="$HOME/.deno/bin:$PATH"
                        deno install -A -n breakdown https://deno.land/x/breakdown/cli/breakdown.ts
                        cp $HOME/.deno/bin/breakdown ${BREAKDOWN_PATH}
                    '''
                }
            }
        }
        
        stage('Analyze PR') {
            when {
                changeRequest()
            }
            steps {
                script {
                    sh '''
                        git diff origin/${CHANGE_TARGET}...HEAD > pr_changes.diff
                        ${BREAKDOWN_PATH} defect project --from=pr_changes.diff -o=pr_analysis.md
                        ${BREAKDOWN_PATH} summary project --from=pr_changes.diff -o=pr_summary.md
                    '''
                    
                    // Post comment to PR
                    def analysis = readFile('pr_analysis.md')
                    pullRequest.comment("### Breakdown Analysis\\n${analysis}")
                }
            }
        }
        
        stage('Generate Documentation') {
            steps {
                sh '''
                    # Collect all markdown files
                    find . -name "*.md" -not -path "./node_modules/*" > md_files.txt
                    
                    # Generate comprehensive documentation
                    cat md_files.txt | xargs cat > all_content.md
                    ${BREAKDOWN_PATH} summary project \
                        --from=all_content.md \
                        --uv-build_number="${BUILD_NUMBER}" \
                        --uv-job_name="${JOB_NAME}" \
                        -o=docs/build_${BUILD_NUMBER}_summary.md
                '''
            }
        }
        
        stage('Issue Tracking') {
            steps {
                sh '''
                    # Extract issues from codebase
                    grep -r "TODO\\|FIXME\\|HACK\\|BUG" src/ > issues_raw.txt || true
                    
                    ${BREAKDOWN_PATH} to issue \
                        --from=issues_raw.txt \
                        --uv-build="${BUILD_NUMBER}" \
                        -o=issues/
                    
                    # Count issues by type
                    TODO_COUNT=$(grep -c "TODO" issues_raw.txt || echo 0)
                    FIXME_COUNT=$(grep -c "FIXME" issues_raw.txt || echo 0)
                    
                    echo "TODO Count: ${TODO_COUNT}" > issue_metrics.txt
                    echo "FIXME Count: ${FIXME_COUNT}" >> issue_metrics.txt
                '''
            }
        }
        
        stage('Quality Gates') {
            steps {
                script {
                    def todoCount = sh(
                        script: 'grep -c "TODO" issues_raw.txt || echo 0',
                        returnStdout: true
                    ).trim().toInteger()
                    
                    if (todoCount > 50) {
                        unstable("Too many TODOs: ${todoCount}")
                    }
                }
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'docs/**, issues/**, *.md', 
                             allowEmptyArchive: true
            
            publishHTML([
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'docs',
                reportFiles: '*.md',
                reportName: 'Breakdown Reports'
            ])
        }
    }
}
EOF

echo "✅ Jenkins Pipeline 生成完了"

# Example 4: CircleCI Configuration
echo
echo "=== Example 4: CircleCI Configuration ==="
cat > "$OUTPUT_DIR/.circleci_config.yml" << 'EOF'
version: 2.1

orbs:
  deno: denoland/deno@1.0.0

jobs:
  analyze:
    docker:
      - image: denoland/deno:latest
    steps:
      - checkout
      
      - run:
          name: Install Breakdown
          command: |
            deno install -A -n breakdown https://deno.land/x/breakdown/cli/breakdown.ts
            echo 'export PATH="$HOME/.deno/bin:$PATH"' >> $BASH_ENV
      
      - run:
          name: Analyze Code Changes
          command: |
            if [ -n "$CIRCLE_PULL_REQUEST" ]; then
              git diff origin/main..HEAD > changes.diff
              breakdown defect project --from=changes.diff -o=analysis/defects.md
              breakdown summary project --from=changes.diff -o=analysis/summary.md
            fi
      
      - store_artifacts:
          path: analysis
          destination: breakdown-analysis

  document:
    docker:
      - image: denoland/deno:latest
    steps:
      - checkout
      
      - run:
          name: Install Breakdown
          command: |
            deno install -A -n breakdown https://deno.land/x/breakdown/cli/breakdown.ts
            echo 'export PATH="$HOME/.deno/bin:$PATH"' >> $BASH_ENV
      
      - run:
          name: Generate Documentation
          command: |
            # Generate project documentation
            breakdown to project --from=README.md \
              --uv-build_num="$CIRCLE_BUILD_NUM" \
              --uv-branch="$CIRCLE_BRANCH" \
              -o=docs/project.md
            
            # Generate issue tracking
            find . -name "*.md" | xargs grep -l "TODO\|FIXME" | \
            xargs cat | breakdown to issue -o=docs/issues/
      
      - persist_to_workspace:
          root: docs
          paths:
            - "*"

  report:
    docker:
      - image: denoland/deno:latest
    steps:
      - checkout
      - attach_workspace:
          at: docs
      
      - run:
          name: Generate Quality Report
          command: |
            echo "# Build Quality Report" > report.md
            echo "Build: $CIRCLE_BUILD_NUM" >> report.md
            echo "Branch: $CIRCLE_BRANCH" >> report.md
            echo "" >> report.md
            
            # Add metrics
            TODO_COUNT=$(grep -r "TODO" . | wc -l || echo 0)
            echo "## Metrics" >> report.md
            echo "- TODO items: $TODO_COUNT" >> report.md
            
            cat report.md
      
      - store_test_results:
          path: test-results

workflows:
  version: 2
  build-and-analyze:
    jobs:
      - analyze
      - document:
          requires:
            - analyze
      - report:
          requires:
            - document
EOF

echo "✅ CircleCI configuration 生成完了"

# Example 5: CI環境でのBreakdown実行シミュレーション
echo
echo "=== Example 5: CI Environment Simulation ==="

# PRの変更を分析
if [ -d ../.git ]; then
    echo "Git差分から変更分析を生成:"
    git diff HEAD~1..HEAD > "$OUTPUT_DIR/recent_changes.diff" 2>/dev/null || \
        echo "No recent changes" > "$OUTPUT_DIR/recent_changes.diff"
    
    $BREAKDOWN summary project --from="$OUTPUT_DIR/recent_changes.diff" \
        --uv-ci="true" \
        --uv-build_id="$(date +%s)" \
        --uv-branch="$(git branch --show-current 2>/dev/null || echo 'main')" \
        -o="$OUTPUT_DIR/ci_change_summary.md"
    
    echo "✅ 変更分析完了"
fi

# メトリクスレポート生成
echo
echo "=== CI Metrics Report ==="
cat > "$OUTPUT_DIR/ci_metrics.md" << EOF
# CI/CD Metrics Report

Generated: $(date)
Environment: ${CI:-local}
Repository: ${GITHUB_REPOSITORY:-local/repo}

## Code Quality Indicators

### Technical Debt
- TODO items: $(grep -r "TODO" . 2>/dev/null | wc -l || echo 0)
- FIXME items: $(grep -r "FIXME" . 2>/dev/null | wc -l || echo 0)
- HACK items: $(grep -r "HACK" . 2>/dev/null | wc -l || echo 0)

### File Statistics
- Markdown files: $(find . -name "*.md" | wc -l)
- Script files: $(find . -name "*.sh" | wc -l)
- Total files: $(find . -type f | wc -l)

## Breakdown Integration Benefits

1. **Automated Documentation**: 
   - コミットごとにドキュメント自動生成
   - 変更内容の自動要約

2. **Code Quality Tracking**:
   - 技術的負債の可視化
   - 問題の早期発見

3. **PR Analysis**:
   - 変更内容の自動レビュー
   - 影響範囲の分析

4. **Issue Management**:
   - TODOの自動イシュー化
   - 優先度の自動判定

## Integration Examples

- GitHub Actions: .github/workflows/breakdown.yml
- GitLab CI: .gitlab-ci.yml
- Jenkins: Jenkinsfile
- CircleCI: .circleci/config.yml

EOF

cat "$OUTPUT_DIR/ci_metrics.md"

# Display generated files
echo
echo "=== 生成されたCI/CD設定ファイル ==="
ls -la "$OUTPUT_DIR"/*.yml "$OUTPUT_DIR"/Jenkinsfile 2>/dev/null

echo
echo "=== CI/CD Integration Best Practices ==="
echo "1. PRごとの自動分析"
echo "2. ドキュメントの自動生成"
echo "3. 技術的負債の追跡"
echo "4. 品質ゲートの設定"
echo "5. アーティファクトの保存"

echo
echo "=== CI/CD Integration Example Completed ==="