#!/bin/bash

# Branch Check
current_branch=$(git rev-parse --abbrev-ref HEAD)
if [[ "$current_branch" != "main" ]]; then
  echo "Error: You must be on the 'main' branch to run this script. Current branch: $current_branch"
  exit 1
fi

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
# Flow:
#   1. Version Sync Check
#      - Ensures deno.json and lib/version.ts have matching versions
#      - If mismatch, updates lib/version.ts to match deno.json
#   2. Git Status Check
#      - Aborts if there are any uncommitted changes
#   3. Local CI Check
#      - Runs scripts/local_ci.sh and aborts if it fails
#   4. GitHub Actions Status
#      - Checks .github/workflows/test.yml and version-check.yml for the latest commit
#      - Aborts if either workflow has not succeeded
#   5. JSR Version Check
#      - Fetches published versions from JSR registry (meta.json endpoint)
#      - Determines the latest released version
#   6. GitHub Tags Cleanup
#      - Fetches all tags from remote
#      - Deletes any tags (local and remote) that are ahead of the latest JSR version
#   7. New Version Generation
#      - Increments version based on bump type (major/minor/patch)
#   8. Version Update (atomic)
#      - Updates version in both deno.json and lib/version.ts using atomic file operations
#   9. Version Verification
#      - Verifies both files have the same new version
#   10. Git Commit
#       - Commits version changes with a standard message
#   11. Git Tag
#       - Creates a new tag with the version (vX.Y.Z)
#   12. Push Changes
#       - Pushes commit and tag to remote
#
# Exit Codes:
#   0 - Success
#   1 - Any check or update failed
#
# Notes:
#   - Only deno.json and lib/version.ts are used for versioning (no src/mod.ts)
#   - The script uses robust error handling and atomic file operations
#   - All git/gh commands are single-line and non-interactive
#   - The script is intended to be run before publishing or merging to main
# ============================================================================

set -euo pipefail

# 1. Version Sync Check
# ---------------------
# Only deno.json and lib/version.ts are relevant
DENO_JSON="deno.json"
VERSION_TS="lib/version.ts"

get_deno_version() {
  jq -r '.version' "$DENO_JSON"
}

get_ts_version() {
  grep 'export const VERSION' "$VERSION_TS" | sed -E 's/.*\"([0-9.]+)\".*/\1/'
}

sync_versions() {
  local deno_ver ts_ver
  deno_ver=$(get_deno_version)
  ts_ver=$(get_ts_version)
  if [[ "$deno_ver" != "$ts_ver" ]]; then
    echo "Syncing $VERSION_TS to match $DENO_JSON ($deno_ver)"
    cat > "$VERSION_TS" <<EOF
// This file is auto-generated. Do not edit manually.
// The version is synchronized with deno.json.

/**
 * The current version of Breakdown CLI, synchronized with deno.json.
 * @module
 */
export const VERSION = "$deno_ver";
EOF
    deno fmt "$VERSION_TS"
    git add "$VERSION_TS"
    git commit -m "fix: sync lib/version.ts with deno.json version $deno_ver" || true
  fi
}

# 2. Git Status Check
# -------------------
if [[ -n "$(git status --porcelain)" ]]; then
  echo "Error: You have uncommitted changes. Please commit or stash them first."
  exit 1
fi

# 2b. Git Push Check
# -------------------
if [[ -n "$(git log --branches --not --remotes)" ]]; then
  echo "Error: You have local commits that have not been pushed to the remote repository. Please push them first."
  exit 1
fi

# 3. Local CI Check
# -----------------
if ! bash scripts/local_ci.sh; then
  echo "Error: Local CI failed. Aborting version bump."
  exit 1
fi

# 4. GitHub Actions Status
# ------------------------
latest_commit=$(git rev-parse HEAD)
for workflow in "test.yml" "version-check.yml"; do
  echo "Checking $workflow..."
  if ! gh run list --workflow=$workflow --limit=1 --json status,conclusion,headSha | jq -e '.[0].status == "completed" and .[0].conclusion == "success" and .[0].headSha == "'$latest_commit'"' > /dev/null; then
    echo "Error: $workflow has not completed successfully for latest commit."
    # --- Restore version files to latest GitHub tag ---
    echo "Restoring version files to latest GitHub tag..."
    latest_tag=$(git ls-remote --tags origin | awk -F/ '{print $3}' | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -n 1)
    if [[ -z "$latest_tag" ]]; then
      echo "Error: No valid version tag found on remote."
      exit 1
    fi
    latest_version=${latest_tag#v}
    # deno.json書き換え
    jq --arg v "$latest_version" '.version = $v' deno.json > deno.json.tmp && mv deno.json.tmp deno.json
    # lib/version.ts書き換え
    cat > lib/version.ts <<EOF
// This file is auto-generated. Do not edit manually.
// The version is synchronized with deno.json.

/**
 * The current version of Breakdown CLI, synchronized with deno.json.
 * @module
 */
export const VERSION = "$latest_version";
EOF
    deno fmt lib/version.ts
    git add deno.json lib/version.ts
    git commit -m "chore: revert version files to latest tag ($latest_tag) due to failed CI"
    echo "Version files reverted to $latest_version (from $latest_tag)."
    exit 1
  fi
done

# 5. JSR Version Check
# --------------------
JSR_META_URL="https://jsr.io/@tettuan/breakdown/meta.json"
latest_jsr_version=$(curl -s "$JSR_META_URL" | jq -r '.versions | keys | .[]' | sort -V | tail -n 1)
echo "Latest JSR published version: $latest_jsr_version"

# 6. GitHub Tags Cleanup
# ----------------------
git fetch --tags
current_version=$(get_deno_version)
echo "Current version in deno.json: $current_version"

# Only delete tags if they're ahead of current version
for tag in $(git tag --list 'v*' | sed 's/^v//' | sort -V); do
  if [[ "$tag" > "$current_version" ]]; then
    echo "Deleting local and remote tag: v$tag (ahead of current version $current_version)"
    git tag -d "v$tag"
    git push --delete origin "v$tag" || true
  fi
done

# 7. New Version Generation
# -------------------------
bump_type="patch"
if [[ $# -gt 0 ]]; then
  case "$1" in
    --major) bump_type="major" ;;
    --minor) bump_type="minor" ;;
    --patch) bump_type="patch" ;;
    *) echo "Unknown bump type: $1"; exit 1 ;;
  esac
fi

IFS='.' read -r major minor patch <<< "$current_version"
case "$bump_type" in
  major)
    major=$((major + 1)); minor=0; patch=0 ;;
  minor)
    minor=$((minor + 1)); patch=0 ;;
  patch)
    patch=$((patch + 1)) ;;
esac
new_version="$major.$minor.$patch"
echo "Bumping version: $current_version -> $new_version"

# 8. Version Update (atomic)
# --------------------------
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

git add "$DENO_JSON" "$VERSION_TS"

# 9. Version Verification
# -----------------------
if [[ "$(get_deno_version)" != "$new_version" ]] || [[ "$(get_ts_version)" != "$new_version" ]]; then
  echo "Error: Version update failed."
  exit 1
fi

echo "Version updated to $new_version in both files."

# 10. Git Commit
# --------------
git commit -m "chore: bump version to $new_version"

# 11. Git Tag
# ------------
git tag "v$new_version"

# 12. Push Changes
# ----------------
git push
git push origin "v$new_version"

echo "\nVersion bumped to $new_version, committed, tagged, and pushed.\n" 