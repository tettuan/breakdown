---
name: create-feature-branch
description: Create a new feature branch following Git Flow strategy. Use when starting new feature development, creating a branch for an issue, or when user says "create branch", "new feature", "start working on issue".
allowed-tools: Bash, Read
---

# Create Feature Branch

release/* ブランチから作業ブランチを作成する（branch-management 規約に準拠）。

## Branch Naming Convention

| Prefix      | Purpose            | Example                     |
| ----------- | ------------------ | --------------------------- |
| `feat/`     | New feature        | `feat/issue-88-return-mode` |
| `fix/`      | Bug fix            | `fix/stdout-encoding`       |
| `refactor/` | Refactoring        | `refactor/output-processor` |
| `update/`   | Dependency updates | `update/jsr-packages`       |
| `remove/`   | Feature removal    | `remove/deprecated-api`     |
| `docs/`     | Documentation      | `docs/update-readme`        |

## Workflow

### 1. Ensure clean working directory

```bash
git status
```

If there are uncommitted changes, ask user how to handle them.

### 2. Find active release branch

```bash
git branch -a | grep 'release/'
```

If no release branch exists, create one from develop first (see `/release-procedure`).

### 3. Update release branch

```bash
git checkout release/vX.Y.Z
git pull origin release/vX.Y.Z
```

### 4. Create work branch from release

```bash
git checkout -b feat/issue-{NUMBER}-{DESCRIPTION}
```

### 5. Confirm creation

```bash
git branch --show-current
```

## Checklist

- [ ] Working directory is clean
- [ ] Active release branch identified
- [ ] Release branch is up to date
- [ ] Branch name follows convention
- [ ] Branch is created from release/* (NOT from develop or main)

## Notes

- **Always branch from `release/*`**, not `develop` or `main` (branch-management 規約)
- Include issue number in branch name for traceability
- Use lowercase with hyphens for descriptions
- If no release branch exists, ask user to create one first
