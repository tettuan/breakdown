#!/bin/bash

# ============================================================================
# Automated Version Management Script for Breakdown (Deno/JSR)
#
# Purpose:
#   - Ensures version consistency between deno.json and lib/version.ts
#   - Handles version bumping (major/minor/patch) with atomic updates
#   - Performs pre-release checks (git status, local CI, GitHub Actions)
#   - Manages GitHub tags and JSR version synchronization
#   - Automatically commits, tags, and pushes version changes
#
# Usage:
#   ./scripts/bump_version.sh [--major|--minor|--patch]
#   (default: --patch)
#
# Categories:
#   1. Status Checks
#      - Local Git Status Check
#      - Version Sync Check
#      - GitHub Actions Status Check
#      - JSR Version Check
#      - GitHub Tags Cleanup and Version Sync
#   2. Local CI
#      - Local CI Check
#      - JSR Pre-publish Check
#   3. New Version Bump
#      - New Version Generation
#      - Version Update (Atomic)
#      - Version Verification
#   4. Git Operations
#      - Git Commit
#      - Git Tag
#      - Push Changes
# ============================================================================

set -euo pipefail

# Constants
DENO_JSON="deno.json"
VERSION_TS="lib/version.ts"
JSR_META_URL="https://jsr.io/@tettuan/breakdown/meta.json"

# Helper Functions
get_deno_version() {
  jq -r '.version' "$DENO_JSON"
}

get_ts_version() {
  grep 'export const VERSION' "$VERSION_TS" | sed -E 's/.*\"([0-9.]+)\".*/\1/'
}

# ============================================================================
# 1. Status Checks
# ============================================================================
echo "Running Status Checks..."

# 1.1 Branch Check
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$current_branch" != "main" ]]; then
  echo "Error: You must be on the 'main' branch to run this script. Current branch: $current_branch"
  exit 1
fi

# 1.2 Git Push Check
if [[ -n "$(git log --branches --not --remotes)" ]]; then
  echo "Error: You have local commits that have not been pushed to the remote repository. Please push them first."
  exit 1
fi

# 1.3 Local Git Status Check
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: You have uncommitted changes. Please commit or stash them first."
  exit 1
fi

# 1.4 Version Sync Check
deno_ver=$(get_deno_version)
ts_ver=$(get_ts_version)
if [[ "$deno_ver" != "$ts_ver" ]]; then
  echo "Error: Version mismatch between $DENO_JSON ($deno_ver) and $VERSION_TS ($ts_ver)"
  exit 1
fi

# 1.5 GitHub Actions Status Check
latest_commit=$(git rev-parse HEAD)
for workflow in "test.yml" "version-check.yml"; do
  echo "Checking $workflow..."
  if ! gh run list --workflow=$workflow --limit=1 --json status,conclusion,headSha 2>/dev/null | jq -e '.[0].status == "completed" and .[0].conclusion == "success" and .[0].headSha == "'$latest_commit'"' > /dev/null; then
    echo "Warning: Could not verify $workflow status. Please check manually at https://github.com/tettuan/breakdown/actions"
    echo "Continuing with version bump..."
  fi
done

# 1.6 JSR Version Check
latest_jsr_version=$(curl -s "$JSR_META_URL" | jq -r '.versions | keys | .[]' | sort -V | tail -n 1)
echo "Latest JSR published version: $latest_jsr_version"

# 1.7 GitHub Tags Cleanup and Version Sync
git fetch --tags
current_version=$(get_deno_version)
echo "Current version in deno.json: $current_version"

# Check if any tags are ahead of JSR version
for tag in $(git tag --list 'v*' | sed 's/^v//' | sort -V); do
  if [[ "$tag" > "$latest_jsr_version" ]]; then
    echo "\n===============================================================================\nLocal tags are ahead of JSR version ($latest_jsr_version).\nPlease run scripts/rewind_to_jsr.sh to rewind local versions and tags.\n===============================================================================\n"
    exit 1
  fi
done

# 1.8 Version Consistency Check
jsr_ver="$latest_jsr_version"
git_tag_ver=$(git tag --list 'v*' | sed 's/^v//' | sort -V | tail -n 1)
deno_ver=$(get_deno_version)
ts_ver=$(get_ts_version)

all_match=true
if [[ "$jsr_ver" != "$git_tag_ver" ]]; then
  echo "Mismatch: JSR version ($jsr_ver) != GitHub tag ($git_tag_ver)"; all_match=false
fi
if [[ "$jsr_ver" != "$deno_ver" ]]; then
  echo "Mismatch: JSR version ($jsr_ver) != deno.json ($deno_ver)"; all_match=false
fi
if [[ "$jsr_ver" != "$ts_ver" ]]; then
  echo "Mismatch: JSR version ($jsr_ver) != version.ts ($ts_ver)"; all_match=false
fi
if [[ "$all_match" == true ]]; then
  echo "Version Consistency Check: true (all versions match: $jsr_ver)"
else
  echo "Version Consistency Check: false"
fi

echo "✓ Status Checks passed"

# ============================================================================
# 2. Local CI
# ============================================================================
echo -e "\nRunning Local CI..."

# 2.1 Local CI Check
if ! bash scripts/local_ci.sh; then
  echo "Error: Local CI failed. Aborting version bump."
  exit 1
fi

# 2.2 JSR Pre-publish Check
echo "Running JSR pre-publish check..."
if ! deno publish --dry-run --allow-dirty --no-check > /dev/null 2>&1; then
  echo "Error: JSR pre-publish check failed. Please fix any issues before bumping version."
  exit 1
fi

echo "✓ Local CI passed"

# ============================================================================
# 3. New Version Bump
# ============================================================================
echo -e "\nBumping Version..."

# 3.1 New Version Generation
bump_type="patch"
if [[ $# -gt 0 ]]; then
  case "$1" in
    --major) bump_type="major" ;;
    --minor) bump_type="minor" ;;
    --patch) bump_type="patch" ;;
    *) echo "Unknown bump type: $1"; exit 1 ;;
  esac
fi

IFS='.' read -r major minor patch <<< "$latest_jsr_version"
case "$bump_type" in
  major) major=$((major + 1)); minor=0; patch=0 ;;
  minor) minor=$((minor + 1)); patch=0 ;;
  patch) patch=$((patch + 1)) ;;
esac
new_version="$major.$minor.$patch"
echo "Bumping version from latest JSR version $latest_jsr_version -> $new_version"

# 3.2 Version Update (Atomic)
tmp_deno="${DENO_JSON}.tmp"
tmp_ts="${VERSION_TS}.tmp"
jq --arg v "$new_version" '.version = $v' "$DENO_JSON" > "$tmp_deno"
cat > "$tmp_ts" <<EOF
// This file is auto-generated. Do not edit manually.
// The version is synchronized with deno.json.

/**
 * The current version of Breakdown CLI, synchronized with deno.json.
 * @module
 */
export const VERSION = "$new_version";
EOF
mv "$tmp_deno" "$DENO_JSON"
mv "$tmp_ts" "$VERSION_TS"
deno fmt "$VERSION_TS"

# 3.3 Version Verification
if [[ "$(get_deno_version)" != "$new_version" ]] || [[ "$(get_ts_version)" != "$new_version" ]]; then
  echo "Error: Version update failed."
  exit 1
fi

echo "✓ Version bump completed"

# ============================================================================
# 4. Git Operations
# ============================================================================
echo -e "\nPerforming Git Operations..."

# 4.1 Git Commit
git add "$DENO_JSON" "$VERSION_TS"
git commit -m "chore: bump version to $new_version"

# 4.2 Git Tag
git tag "v$new_version"

# 4.3 Push Changes
git push
git push origin "v$new_version"

echo "✓ Git operations completed"

echo "\nVersion bumped to $new_version, committed, tagged, and pushed.\n" 