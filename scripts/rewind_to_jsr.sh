#!/bin/bash

# Rewind local versions and tags to match the latest JSR version
# Usage: ./scripts/rewind_to_jsr.sh
# This script will:
#   1. Check version consistency between JSR, GitHub tags, and local files
#   2. Remove all tags ahead of the latest JSR version (local and remote)
#   3. Set deno.json and lib/version.ts to the JSR version
#   4. Create/push a tag for the JSR version if missing
#   5. Print clear instructions and summary

set -euo pipefail

DENO_JSON="deno.json"
VERSION_TS="lib/version.ts"
JSR_META_URL="https://jsr.io/@tettuan/breakdown/meta.json"

# Function to get version from deno.json
get_deno_version() {
  jq -r '.version' "$DENO_JSON"
}

# Function to get version from version.ts
get_ts_version() {
  grep 'export const VERSION' "$VERSION_TS" | sed -E 's/.*\"([0-9.]+)\".*/\1/'
}

# Function to check if versions match
check_versions() {
  local jsr_ver="$1"
  local deno_ver="$2"
  local ts_ver="$3"
  local tag_ver="$4"

  echo "Version Check:"
  echo "- JSR Version:     $jsr_ver"
  echo "- deno.json:       $deno_ver"
  echo "- version.ts:      $ts_ver"
  echo "- Latest Tag:      $tag_ver"

  if [[ "$deno_ver" != "$ts_ver" ]]; then
    echo "Error: deno.json and version.ts versions do not match"
    return 1
  fi

  if [[ "$deno_ver" != "$jsr_ver" ]]; then
    echo "Error: Local version ($deno_ver) does not match JSR version ($jsr_ver)"
    return 1
  fi

  if [[ "$tag_ver" != "" && "$tag_ver" != "$jsr_ver" ]]; then
    echo "Error: Latest tag ($tag_ver) does not match JSR version ($jsr_ver)"
    return 1
  fi

  echo "✓ All versions are consistent"
  return 0
}

# Step 1: Get latest JSR version and check current state
echo "Step 1: Checking current version state..."
latest_jsr_version=$(curl -s "$JSR_META_URL" | jq -r '.versions | keys | .[]' | sort -V | tail -n 1)
current_deno_version=$(get_deno_version)
current_ts_version=$(get_ts_version)
latest_tag=$(git tag --list 'v*' | sed 's/^v//' | sort -V | tail -n 1 || echo "")

if ! check_versions "$latest_jsr_version" "$current_deno_version" "$current_ts_version" "$latest_tag"; then
  echo "Version inconsistency detected. Proceeding with rewind..."
else
  echo "All versions are already in sync with JSR version $latest_jsr_version"
  exit 0
fi

# Step 2: Remove tags ahead of JSR version
echo -e "\nStep 2: Removing tags ahead of JSR version..."
removed_any=false
git fetch --tags
for tag in $(git tag --list 'v*' | sed 's/^v//' | sort -V); do
  if [[ "$tag" > "$latest_jsr_version" ]]; then
    echo "Deleting local tag: v$tag (ahead of latest JSR version $latest_jsr_version)"
    git tag -d "v$tag" && echo "Local tag v$tag deleted." || echo "Failed to delete local tag v$tag."
    echo "Deleting remote tag: v$tag"
    if git push --delete origin "v$tag"; then
      echo "Remote tag v$tag deleted."
    else
      echo "Failed to delete remote tag v$tag."
    fi
    removed_any=true
  fi
done

if $removed_any; then
  echo "\n>>> TAG CLEANUP COMPLETE <<<\n"
else
  echo "No tags ahead of JSR version were found."
fi

# Step 3: Set local versions to match JSR
echo -e "\nStep 3: Setting local versions to match JSR version $latest_jsr_version..."
tmp_deno="${DENO_JSON}.tmp"
tmp_ts="${VERSION_TS}.tmp"

# Update deno.json
jq --arg v "$latest_jsr_version" '.version = $v' "$DENO_JSON" > "$tmp_deno"
mv "$tmp_deno" "$DENO_JSON"

# Update version.ts
cat > "$tmp_ts" <<EOF
// This file is auto-generated. Do not edit manually.
// The version is synchronized with deno.json.

/**
 * The current version of Breakdown CLI, synchronized with deno.json.
 * @module
 */
export const VERSION = "$latest_jsr_version";
EOF
mv "$tmp_ts" "$VERSION_TS"
deno fmt "$VERSION_TS"

# Step 4: Commit changes and ensure tag exists
echo -e "\nStep 4: Committing changes and ensuring tag exists..."
git add "$DENO_JSON" "$VERSION_TS"
git commit -m "chore: rewind versions to match JSR version $latest_jsr_version"

# Ensure a tag exists for the JSR version
if ! git tag | grep -q "v$latest_jsr_version"; then
  git tag "v$latest_jsr_version"
  git push origin "v$latest_jsr_version"
  echo "Created and pushed tag v$latest_jsr_version to match JSR version."
fi

# Final version check
echo -e "\nStep 5: Verifying final version state..."
final_deno_version=$(get_deno_version)
final_ts_version=$(get_ts_version)
final_tag=$(git tag --list 'v*' | sed 's/^v//' | sort -V | tail -n 1)

if check_versions "$latest_jsr_version" "$final_deno_version" "$final_ts_version" "$final_tag"; then
  echo "\n===============================================================================
>>> REWIND COMPLETE <<<
===============================================================================
All versions are now synchronized with JSR version $latest_jsr_version.
Please:
1. Review the changes
2. Run 'deno task ci' to verify everything
3. Push the changes if CI passes
==============================================================================="
else
  echo "\nError: Version synchronization failed. Please check the changes manually."
  exit 1
fi 