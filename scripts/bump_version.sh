#!/bin/bash

# Check if there are any uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "Error: You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

# Get the latest commit hash
latest_commit=$(git rev-parse HEAD)

# Check GitHub Actions status for test.yml and version-check.yml
check_failed=false
version_check_failed=false
for workflow in "test.yml" "version-check.yml"; do
    echo "Checking $workflow..."
    gh run list --workflow=$workflow --limit=1 --json status,conclusion,headSha | jq -e '.[0].status == "completed" and .[0].conclusion == "success" and .[0].headSha == "'$latest_commit'"' > /dev/null
    if [ $? -ne 0 ]; then
        check_failed=true
        if [ "$workflow" = "version-check.yml" ]; then
            version_check_failed=true
        fi
    fi
    
    if [ "$check_failed" = true ]; then
        break
    fi

done

if [ "$check_failed" = true ]; then
    if [ "$version_check_failed" = true ]; then
        # Get latest version from git tags (strip 'v')
        latest_tag_version=$(git tag --list "v*" | sed 's/^v//' | sort -V | tail -n 1)
        current_version=$(deno eval "console.log(JSON.parse(await Deno.readTextFile('deno.json')).version)")
        if [ "$current_version" != "$latest_tag_version" ]; then
            echo "version-check failed: updating deno.json version ($current_version) to match latest tag ($latest_tag_version)."
            deno eval "const config = JSON.parse(await Deno.readTextFile('deno.json')); config.version = '$latest_tag_version'; await Deno.writeTextFile('deno.json', JSON.stringify(config, null, 2).trimEnd() + '\n');"
            git add deno.json
            git commit -m "fix: update deno.json version to match latest tag ($latest_tag_version) for version-check"
            git push
            echo "\ndenon.json updated to $latest_tag_version and pushed. Please re-run this script after CI passes.\n"
            exit 0
        fi
    fi
    echo "Error: Latest GitHub Actions workflow (test.yml or version-check.yml) has not completed successfully."
    exit 1
fi

# If both checks succeed, bump version
current_version=$(deno eval "console.log(JSON.parse(await Deno.readTextFile('deno.json')).version)")
IFS='.' read -r major minor patch <<< "$current_version"
new_patch=$((patch + 1))
new_version="$major.$minor.$new_patch"
echo "Bumping deno.json version from $current_version to $new_version."
deno eval "const config = JSON.parse(await Deno.readTextFile('deno.json')); config.version = '$new_version'; await Deno.writeTextFile('deno.json', JSON.stringify(config, null, 2).trimEnd() + '\n');"
git add deno.json
git commit -m "chore: bump version to $new_version"
git push
git tag v$new_version
git push origin v$new_version
echo "\nVersion bumped to $new_version, committed, and tagged.\n" 