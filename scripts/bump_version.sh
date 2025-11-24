#!/bin/bash

# Purpose: Automated version management script for Deno projects with PR workflow
#          - Manages version bumping through work branch → develop → main flow
#          - Each merge requires remote CI success
#          - Tracks progress through step identification codes
#
# Usage: ./scripts/bump_version.sh [--major|--minor|--patch] [--status] [--step]
#        Default: --patch
#        --status: Show current step without executing
#        --step: Execute only current step (default: auto-continue until blocking point)
#
# Step Flow:
#   A: Work Branch Phase
#      A-1: Version update (deno.json, src/version.ts)
#      A-2: Local CI check
#      A-3: Create PR to develop
#
#   B: Develop Integration Phase
#      B-1: Wait for PR merge (remote CI must pass)
#      B-2: Create PR to main
#
#   C: Main Release Phase
#      C-1: Wait for PR merge (remote CI must pass)
#      C-2: Create vtag on main merge commit
#
# Exit Codes:
# 0 - Success or status displayed
# 1 - Error or validation failed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
BUMP_TYPE="patch"
SHOW_STATUS=false
SINGLE_STEP=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --major)
            BUMP_TYPE="major"
            shift
            ;;
        --minor)
            BUMP_TYPE="minor"
            shift
            ;;
        --patch)
            BUMP_TYPE="patch"
            shift
            ;;
        --status)
            SHOW_STATUS=true
            shift
            ;;
        --step)
            SINGLE_STEP=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--major|--minor|--patch] [--status] [--step]"
            exit 1
            ;;
    esac
done

# =============================================================================
# Helper Functions
# =============================================================================

log_step() {
    echo -e "${BLUE}[$1]${NC} $2"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

log_info() {
    echo -e "  $1"
}

# Get current branch name
get_current_branch() {
    git rev-parse --abbrev-ref HEAD
}

# Get version from deno.json
get_deno_version() {
    deno eval "const config = JSON.parse(await Deno.readTextFile('deno.json')); console.log(config.version);"
}

# Get version from deno.json (single source of truth)
get_mod_version() {
    get_deno_version
}

# Check if PR exists for given head and base
get_pr_number() {
    local head=$1
    local base=$2
    gh pr list --head "$head" --base "$base" --state open --json number --jq '.[0].number // empty'
}

# Check PR CI status (GitHub Actions)
check_pr_ci_status() {
    local pr_number=$1
    local checks=$(gh pr checks "$pr_number" --json name,state,conclusion 2>/dev/null)

    if [ -z "$checks" ] || [ "$checks" = "[]" ]; then
        echo "success"
        return
    fi

    local failed=$(echo "$checks" | jq '[.[] | select(.conclusion == "failure")] | length')
    local pending=$(echo "$checks" | jq '[.[] | select(.state == "pending" or .state == "in_progress")] | length')

    if [ "$failed" -gt 0 ]; then
        echo "failed"
    elif [ "$pending" -gt 0 ]; then
        echo "pending"
    else
        echo "success"
    fi
}

# Display PR CI details
show_pr_ci_details() {
    local pr_number=$1
    log_info "GitHub Actions status for PR #$pr_number:"

    local checks=$(gh pr checks "$pr_number" --json name,state,conclusion 2>/dev/null)

    if [ -z "$checks" ] || [ "$checks" = "[]" ]; then
        log_info "  No checks found yet"
        return
    fi

    echo "$checks" | jq -r '.[] | "  \(.name): \(.state) \(if .conclusion then "(\(.conclusion))" else "" end)"'
}

# Check if branch has version bump commit (ahead of develop)
has_version_commit() {
    local branch=$1
    # Only check commits ahead of develop
    git log "develop..$branch" --oneline --grep="chore: bump version" -1 2>/dev/null | grep -q "bump version"
}

# Get the new version from latest version commit (ahead of develop)
get_version_from_commit() {
    local branch=$1
    git log "develop..$branch" --oneline --grep="chore: bump version" -1 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1
}

# =============================================================================
# Step Detection
# =============================================================================

detect_current_step() {
    local current_branch=$(get_current_branch)
    local work_branch=""

    # Determine work branch name
    if [ "$current_branch" != "main" ] && [ "$current_branch" != "develop" ]; then
        work_branch=$current_branch
    fi

    # Check for existing PRs
    local pr_to_develop=""
    local pr_to_main=""

    if [ -n "$work_branch" ]; then
        pr_to_develop=$(get_pr_number "$work_branch" "develop")
    fi
    pr_to_main=$(get_pr_number "develop" "main")

    # Detect step based on state

    # Step C-2: On main with version commit, need to tag
    if [ "$current_branch" = "main" ]; then
        if has_version_commit "main"; then
            local version=$(get_version_from_commit "main")
            if ! git tag -l "v$version" | grep -q "v$version"; then
                echo "C-2:$version"
                return
            fi
        fi
        echo "DONE"
        return
    fi

    # Step C-1: PR to main exists
    if [ -n "$pr_to_main" ]; then
        echo "C-1:$pr_to_main"
        return
    fi

    # Step B-2: On develop, need to create PR to main
    if [ "$current_branch" = "develop" ]; then
        # Check if develop has commits ahead of main
        local commits_ahead=$(git rev-list --count main..develop 2>/dev/null || echo "0")
        if [ "$commits_ahead" -gt 0 ]; then
            echo "B-2"
            return
        fi
    fi

    # Step B-1: PR to develop exists
    if [ -n "$pr_to_develop" ]; then
        echo "B-1:$pr_to_develop:$work_branch"
        return
    fi

    # Step A: On work branch
    if [ -n "$work_branch" ]; then
        # Check if version already bumped
        if has_version_commit "$work_branch"; then
            # Check if local CI passed (we'll assume it needs to be run)
            echo "A-3:$work_branch"
            return
        fi

        # Check for uncommitted version changes
        if git diff --name-only | grep -q "deno.json"; then
            echo "A-2:$work_branch"
            return
        fi

        echo "A-1:$work_branch"
        return
    fi

    echo "UNKNOWN"
}

# =============================================================================
# Step Execution Functions
# =============================================================================

# Step A-1: Update version on work branch
execute_step_a1() {
    local work_branch=$1
    log_step "A-1" "Updating version on branch: $work_branch"

    # Get current version
    local deno_version=$(get_deno_version)
    local mod_version=$(get_mod_version)

    # Version is managed in deno.json only
    log_info "Current version: $deno_version"

    # Get latest JSR version
    log_info "Fetching latest version from JSR..."
    local latest_jsr_version=$(curl -s https://jsr.io/@tettuan/breakdown/versions | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | sort -V | tail -n 1)

    if [ -z "$latest_jsr_version" ]; then
        log_warning "Could not fetch JSR version, using local: $deno_version"
        latest_jsr_version=$deno_version
    fi

    log_info "Current JSR version: $latest_jsr_version"

    # Generate new version
    IFS='.' read -r major minor patch <<< "$latest_jsr_version"

    case $BUMP_TYPE in
        "major")
            new_version="$((major + 1)).0.0"
            ;;
        "minor")
            new_version="$major.$((minor + 1)).0"
            ;;
        "patch")
            new_version="$major.$minor.$((patch + 1))"
            ;;
    esac

    log_info "New version: $new_version"

    # Update version in deno.json
    deno eval "const config = JSON.parse(await Deno.readTextFile('deno.json')); config.version = '$new_version'; await Deno.writeTextFile('deno.json', JSON.stringify(config, null, 2).trimEnd() + '\n');"

    # Update version in lib/version.ts
    deno eval "const content = \`// This file is auto-generated. Do not edit manually.
// The version is synchronized with deno.json.

/**
 * The current version of Breakdown CLI, synchronized with deno.json.
 * @module
 */
export const VERSION = \"$new_version\";
\`; await Deno.writeTextFile('lib/version.ts', content);"

    log_success "Version updated to $new_version in deno.json and lib/version.ts"

    # Return new version for next steps
    echo "$new_version"
}

# Step A-2: Commit version changes and run local CI
execute_step_a2() {
    local work_branch=$1
    log_step "A-2" "Committing version changes and running local CI"

    # Commit version changes first (CI requires clean working directory)
    local new_version=$(get_deno_version)
    git add deno.json lib/version.ts
    git commit -m "chore: bump version to $new_version"

    log_success "Version changes committed"

    # Run local CI
    if ! deno task ci; then
        log_error "Local CI failed. Please fix issues before continuing."
        log_info "You may need to amend the commit after fixing issues."
        exit 1
    fi

    log_success "Local CI passed"

    # Push to remote
    git push origin "$work_branch"

    log_success "Version commit pushed to $work_branch"
}

# Step A-3: Create PR to develop
execute_step_a3() {
    local work_branch=$1
    log_step "A-3" "Creating PR to develop"

    local new_version=$(get_deno_version)

    # Create PR
    local pr_url=$(gh pr create \
        --base develop \
        --head "$work_branch" \
        --title "chore: bump version to $new_version" \
        --body "$(cat <<EOF
## Summary
- Bump version to $new_version

## Checklist
- [ ] Remote CI passes
- [ ] Ready to merge to develop

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)")

    log_success "PR created: $pr_url"
    log_info "Wait for remote CI to pass, then merge the PR"
}

# Step B-1: Check PR to develop status
execute_step_b1() {
    local pr_number=$1
    local work_branch=$2
    log_step "B-1" "Checking PR #$pr_number to develop"

    show_pr_ci_details "$pr_number"
    local ci_status=$(check_pr_ci_status "$pr_number")

    case $ci_status in
        "success")
            log_success "All GitHub Actions passed"
            log_info "Merging PR #$pr_number to develop"

            gh pr merge "$pr_number" --merge --delete-branch
            log_success "PR merged to develop"

            # Switch to develop
            git checkout develop
            git pull origin develop
            ;;
        "pending")
            log_warning "GitHub Actions still running on PR #$pr_number"
            log_info "Wait for all checks to complete, then run --continue"
            ;;
        "failed")
            log_error "GitHub Actions failed on PR #$pr_number"
            log_info "Fix the issues and push again"
            exit 1
            ;;
    esac
}

# Step B-2: Create PR to main
execute_step_b2() {
    log_step "B-2" "Creating PR to main"

    local new_version=$(get_deno_version)

    # Create PR
    local pr_url=$(gh pr create \
        --base main \
        --head develop \
        --title "Release v$new_version" \
        --body "$(cat <<EOF
## Summary
- Release version $new_version

## Checklist
- [ ] Remote CI passes
- [ ] Ready to release to main

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)")

    log_success "PR created: $pr_url"
    log_info "Wait for remote CI to pass, then merge the PR"
}

# Step C-1: Check PR to main status
execute_step_c1() {
    local pr_number=$1
    log_step "C-1" "Checking PR #$pr_number to main"

    show_pr_ci_details "$pr_number"
    local ci_status=$(check_pr_ci_status "$pr_number")

    case $ci_status in
        "success")
            log_success "All GitHub Actions passed"
            log_info "Merging PR #$pr_number to main"

            gh pr merge "$pr_number" --merge
            log_success "PR merged to main"

            # Switch to main
            git checkout main
            git pull origin main
            ;;
        "pending")
            log_warning "GitHub Actions still running on PR #$pr_number"
            log_info "Wait for all checks to complete, then run --continue"
            ;;
        "failed")
            log_error "GitHub Actions failed on PR #$pr_number"
            log_info "Fix the issues and push again"
            exit 1
            ;;
    esac
}

# Step C-2: Create vtag on main
execute_step_c2() {
    local version=$1
    log_step "C-2" "Creating vtag for version $version"

    # Ensure we're on main
    local current_branch=$(get_current_branch)
    if [ "$current_branch" != "main" ]; then
        git checkout main
        git pull origin main
    fi

    # Create and push tag
    git tag "v$version"
    git push origin "v$version"

    log_success "Tag v$version created and pushed"
    log_success "Version $version released!"
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    echo "========================================"
    echo "  Version Bump with PR Workflow"
    echo "========================================"
    echo

    # Detect current step
    local step_info=$(detect_current_step)
    local step=$(echo "$step_info" | cut -d: -f1)

    # Show status
    echo "Current Step: $step"
    echo "Branch: $(get_current_branch)"
    echo "Bump Type: $BUMP_TYPE"
    echo

    if [ "$SHOW_STATUS" = true ]; then
        case $step in
            A-1*)
                log_info "Ready to update version"
                ;;
            A-2*)
                log_info "Ready to commit and run local CI"
                ;;
            A-3*)
                log_info "Ready to create PR to develop"
                ;;
            B-1*)
                local pr=$(echo "$step_info" | cut -d: -f2)
                log_info "PR #$pr to develop exists"
                show_pr_ci_details "$pr"
                local status=$(check_pr_ci_status "$pr")
                if [ "$status" = "success" ]; then
                    log_success "GitHub Actions passed - ready to merge"
                elif [ "$status" = "pending" ]; then
                    log_warning "GitHub Actions still running"
                else
                    log_error "GitHub Actions failed"
                fi
                ;;
            B-2*)
                log_info "Ready to create PR to main"
                ;;
            C-1*)
                local pr=$(echo "$step_info" | cut -d: -f2)
                log_info "PR #$pr to main exists"
                show_pr_ci_details "$pr"
                local status=$(check_pr_ci_status "$pr")
                if [ "$status" = "success" ]; then
                    log_success "GitHub Actions passed - ready to merge"
                elif [ "$status" = "pending" ]; then
                    log_warning "GitHub Actions still running"
                else
                    log_error "GitHub Actions failed"
                fi
                ;;
            C-2*)
                local version=$(echo "$step_info" | cut -d: -f2)
                log_info "Ready to create tag v$version"
                ;;
            DONE)
                log_success "Release process completed"
                ;;
            UNKNOWN)
                log_error "Could not determine current step"
                log_info "Please ensure you're on a work branch, develop, or main"
                ;;
        esac
        exit 0
    fi

    # Execute appropriate step (auto-continue by default, --step for single step)
    case $step in
        A-1*)
            local work_branch=$(echo "$step_info" | cut -d: -f2)
            execute_step_a1 "$work_branch"

            if [ "$SINGLE_STEP" = false ]; then
                execute_step_a2 "$work_branch"
                execute_step_a3 "$work_branch"
            fi
            ;;
        A-2*)
            local work_branch=$(echo "$step_info" | cut -d: -f2)
            execute_step_a2 "$work_branch"

            if [ "$SINGLE_STEP" = false ]; then
                execute_step_a3 "$work_branch"
            fi
            ;;
        A-3*)
            local work_branch=$(echo "$step_info" | cut -d: -f2)
            execute_step_a3 "$work_branch"
            # Stop here - need to wait for remote CI
            ;;
        B-1*)
            local pr=$(echo "$step_info" | cut -d: -f2)
            local work_branch=$(echo "$step_info" | cut -d: -f3)
            execute_step_b1 "$pr" "$work_branch"

            # Continue to B-2 if merged to develop
            if [ "$SINGLE_STEP" = false ] && [ "$(get_current_branch)" = "develop" ]; then
                execute_step_b2
            fi
            ;;
        B-2*)
            execute_step_b2
            # Stop here - need to wait for remote CI
            ;;
        C-1*)
            local pr=$(echo "$step_info" | cut -d: -f2)
            execute_step_c1 "$pr"

            # Continue to C-2 if merged to main
            if [ "$SINGLE_STEP" = false ] && [ "$(get_current_branch)" = "main" ]; then
                local version=$(get_deno_version)
                execute_step_c2 "$version"
            fi
            ;;
        C-2*)
            local version=$(echo "$step_info" | cut -d: -f2)
            execute_step_c2 "$version"
            ;;
        DONE)
            log_success "Release process already completed"
            ;;
        UNKNOWN)
            log_error "Could not determine current step"
            log_info "Please ensure you're on a work branch (not main or develop) to start"
            exit 1
            ;;
    esac

    echo
    log_info "Run './scripts/bump_version.sh --status' to check progress"
    log_info "Run './scripts/bump_version.sh' to proceed when ready"
}

main
