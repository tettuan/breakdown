#!/bin/bash

# Check if there are any uncommitted changes
if [ -n "$(git status --porcelain)" ]; then
    echo "Error: You have uncommitted changes. Please commit or stash them first."
    exit 1
fi

# Get the latest commit hash
latest_commit=$(git rev-parse HEAD)

# Check GitHub Actions status for all workflows
echo "Checking GitHub Actions status..."
for workflow in "test.yml" "version-check.yml"; do
    echo "Checking $workflow..."
    gh run list --workflow=$workflow --limit=1 --json status,conclusion,headSha | jq -e '.[0].status == "completed" and .[0].conclusion == "success" and .[0].headSha == "'$latest_commit'"' > /dev/null

    if [ $? -ne 0 ]; then
        echo "Error: Latest GitHub Actions workflow ($workflow) has not completed successfully."
        echo "Please ensure all tests pass before bumping version."
        exit 1
    fi
done

# Try to get latest version from JSR
echo "Checking latest version from JSR..."
latest_jsr_version=$(curl -s https://jsr.io/@tettuan/breakdown/meta.json | jq -r '.versions | keys | .[-1]')

if [ -z "$latest_jsr_version" ]; then
    echo "Warning: Could not determine latest version from JSR, using local version"
    # Get latest version from git tags (strip 'v')
    latest_tag_version=$(git tag --list "v*" | sed 's/^v//' | sort -V | tail -n 1)

    # Read current version from deno.json
    current_version=$(deno eval "console.log(JSON.parse(await Deno.readTextFile('deno.json')).version)")

    # If deno.json is behind the latest tag, update to the tag version and push, then exit (neutralize for version-check)
    if [ "$(printf '%s\n%s\n' "$current_version" "$latest_tag_version" | sort -V | head -n 1)" = "$current_version" ] && [ "$current_version" != "$latest_tag_version" ]; then
        echo "deno.json version ($current_version) is behind latest tag ($latest_tag_version). Updating deno.json to $latest_tag_version."
        deno eval "const config = JSON.parse(await Deno.readTextFile('deno.json')); config.version = '$latest_tag_version'; await Deno.writeTextFile('deno.json', JSON.stringify(config, null, 2).trimEnd() + '\n');"
        git add deno.json
        git commit -m "fix: update deno.json version to match latest tag ($latest_tag_version)"
        git push
        echo "\ndenon.json updated to $latest_tag_version and pushed. This will make version-check succeed.\n"
        exit 0
    fi
    # If deno.json matches the tag, bump patch
    if [ "$current_version" = "$latest_tag_version" ]; then
        IFS='.' read -r major minor patch <<< "$current_version"
        new_patch=$((patch + 1))
        new_version="$major.$minor.$new_patch"
        echo "deno.json version ($current_version) matches latest tag. Bumping to $new_version."
    else
        echo "Warning: deno.json version ($current_version) is ahead of latest tag ($latest_tag_version). No version bump needed."
        exit 0
    fi
else
    echo "Latest version: $latest_jsr_version"
    new_version="$latest_jsr_version"
fi

echo "New version: $new_version"

# Update only the version in deno.json
deno eval "const config = JSON.parse(await Deno.readTextFile('deno.json')); config.version = '$new_version'; await Deno.writeTextFile('deno.json', JSON.stringify(config, null, 2).trimEnd() + '\n');"

git add deno.json
git commit -m "chore: bump version to $new_version"
git push

echo "\nVersion bumped to $new_version and committed.\n"
echo "Please wait for GitHub Actions (test.yml and version-check.yml) to pass, then tag the release with:"
echo "  git tag v$new_version && git push origin v$new_version" 