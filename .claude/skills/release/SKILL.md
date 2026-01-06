---
name: release
description: Create a release following Git Flow strategy. Use when preparing a release, bumping version, creating release branch, or when user says "release", "bump version", "prepare release", "ship version".
allowed-tools: Bash, Read, Edit
---

# Release Process

This skill guides the release process following Git Flow with automated CI/CD.

## Release Flow Overview

```
develop ──▶ release/v{X.Y.Z} ──PR──▶ main
                                      │
                                      ▼
                               (auto-release.yml)
                                      │
                                      ▼
                                 tag: v{X.Y.Z}
                                      │
                                      ▼
                               (publish.yml)
                                      │
                                      ▼
                                 JSR publish
```

## Workflow

### 1. Ensure develop is ready

```bash
git checkout develop
git pull origin develop
git status
```

Verify all features for this release are merged.

### 2. Run full CI locally

```bash
deno task ci
```

All tests must pass before proceeding.

### 3. Determine version number

Follow semantic versioning:
- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (0.X.0): New features, backward compatible
- **PATCH** (0.0.X): Bug fixes only

Check current version:

```bash
jq -r '.version' deno.json
```

### 4. Create release branch

```bash
git checkout -b release/v{NEW_VERSION}
```

### 5. Bump version

Use the project's bump script:

```bash
bash scripts/bump_version.sh
```

Or manually update `deno.json`:

```bash
# Edit deno.json version field
```

### 6. Update CHANGELOG.md

Add release notes under new version heading.

### 7. Commit version bump

```bash
git add deno.json CHANGELOG.md
git commit -m "chore: bump version to {NEW_VERSION}"
```

### 8. Push and create PR to develop

```bash
git push -u origin release/v{NEW_VERSION}
```

Create PR: `release/v{NEW_VERSION}` → `develop`

### 9. After develop merge, create PR to main

Create PR: `develop` → `main`

### 10. Merge triggers automation

When PR to main is merged:
1. `auto-release.yml` creates tag `v{NEW_VERSION}`
2. `publish.yml` publishes to JSR

## Checklist

- [ ] All features merged to develop
- [ ] `deno task ci` passes
- [ ] Version number determined (semver)
- [ ] Release branch created from develop
- [ ] Version bumped in `deno.json`
- [ ] CHANGELOG.md updated
- [ ] PR to develop created and merged
- [ ] PR to main created and merged
- [ ] Verify JSR publication

## Example: Release v1.8.0

```bash
# Prepare
git checkout develop
git pull origin develop
deno task ci

# Create release
git checkout -b release/v1.8.0
bash scripts/bump_version.sh
# Edit CHANGELOG.md
git add deno.json CHANGELOG.md
git commit -m "chore: bump version to 1.8.0"
git push -u origin release/v1.8.0

# Create PRs via GitHub
# release/v1.8.0 → develop
# develop → main (after first merge)
```

## Important Notes

- Never push directly to `main`
- Version in `deno.json` must match tag
- Auto-release only triggers on `release/*` branch merge to main
- JSR publish requires tag to be on main branch
