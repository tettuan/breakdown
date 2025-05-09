# Breakdown Usage Guide

This document explains various use cases and command patterns for the Breakdown tool.

## Installation

### Recommended: Install as CLI

Breakdown is primarily intended to be used as a CLI tool.  
You can install it using **Deno official/JSR standard method** with the following command:

```bash
deno install -A -f --global breakdown jsr:@tettuan/breakdown/cli
```
- `-A` : Allow all permissions (recommended)
- `-f` : Overwrite existing command
- `--global` : Global installation
- `breakdown` : Command name

> **Note:**  
> The main module for Breakdown CLI is `jsr:@tettuan/breakdown/cli`.  
> Make sure to specify the `/cli` subpath.

---

### Update

When a new version is released, you can overwrite install using the same command:

```bash
deno install -A -f --global breakdown jsr:@tettuan/breakdown/cli
```

---

### Using as a Library

When importing directly from TypeScript/JavaScript,  
you can add it as a dependency using `deno add`.

```bash
deno add @tettuan/breakdown
```

---

### Notes

- The breakdown command automatically uses `cli/breakdown.ts` as the entry point through the `bin` setting in `deno.json`.
- Deno 1.40 or later is recommended.
- For detailed usage, refer to the "Usage" section below.

## Basic Commands

### Initialize Working Directory

```bash
breakdown init
```

This command creates the necessary working directory structure as specified in the configuration.

### Markdown Processing Commands

The following combinations are available:

| Command \ Layer | Command Description | Project | Issue | Task |
| --------------- | ------------------- | ------- | ----- | ---- |
| to | Command to convert input Markdown to the next layer format | Decompose to project<br>breakdown to project <written_project_summary.md> -o <project_dir> | Decompose project to issues<br>breakdown to issue <project_summary.md\|written_issue.md> -o <issue_dir> | Decompose issue to tasks<br>breakdown to task <issue.md\|written_task.md> -o <tasks_dir> |
| summary | Command to generate new Markdown or generate Markdown for specified layer | Generate project overview in Markdown format<br>echo "<messy_something>" \| breakdown summary project -o <project_summary.md> | Generate issue overview in Markdown format<br>breakdown summary issue --from <aggregated_tasks.md> --input task -o <issue_markdown_dir> | Generate task overview in Markdown format<br>breakdown summary task --from <unorganized_tasks.md> -o <task_markdown_dir> |
| defect | Command to generate fixes from error logs and defect information | Generate project information from defects<br>tail -100 "<error_log_file>" \| breakdown defect project -o <project_defect.md> | Generate issues from defect information<br>breakdown defect issue --from <bug_report.md> -o <issue_defect_dir> | Generate tasks from defect information<br>breakdown defect task --from <improvement_request.md> -o <task_defect_dir> |

### Decompose to Project

```bash
breakdown to project <written_project_summary.md> -o <project_dir>
```

### Decompose to Issues

```bash
breakdown to issue <project_summary.md|written_issue.md> -o <issue_dir>
```

### Decompose to Tasks

```bash
breakdown to task <issue.md|written_task.md> -o <tasks_dir>
```

### Generate Markdown Summary

**Project Summary** Generate project overview from unorganized information:

```bash
echo "<messy_something>" | breakdown summary project -o <project_summary.md>
```

**Issue Summary** Generate issues from task groups:

```bash
breakdown summary issue --from <aggregated_tasks.md> --input task -o <issue_markdown_dir>
```

**Task Summary** Generate organized tasks from unorganized task information:

```bash
breakdown summary task --from <unorganized_tasks.md> -o <task_markdown_dir>
```

### Generating Fixes from Defect Information

**Project Level Defect Analysis**

```bash
tail -100 "<error_log_file>" | breakdown defect project -o <project_defect.md>
```

**Issue Level Defect Analysis**

```bash
breakdown defect issue --from <bug_report.md> -o <issue_defect_dir>
```

**Task Level Defect Analysis**

```bash
breakdown defect task --from <improvement_request.md> -o <task_defect_dir>
```

## Common Use Case Patterns

### 1. Flow from Unorganized Information to Project Implementation

Build a project from unorganized information and break it down into issues and tasks:

```bash
# Generate project summary from unorganized information
echo "<messy_something>" | breakdown summary project -o <project_summary.md>

# Break down into project
breakdown to project <project_summary.md> -o <project_dir>

# Break down into issues
breakdown to issue <project_summary.md> -o <issue_dir>

# Break down into tasks
breakdown to task <issue.md> -o <tasks_dir>
```

### 2. Creating Issues from Task Collections

Generate issues from multiple unorganized tasks and break them down into tasks again:

```bash
# Generate issues from task collection
breakdown summary issue --from <aggregated_tasks.md> --input task -o <issue_markdown_dir>

# Edit generated issues (if necessary)

# Generate tasks from issues
breakdown to task <issue.md> -o <tasks_dir>
```

### 3. Generating Fix Tasks from Defect Information

Generate fix tasks from error logs or defect reports:

```bash
# Generate defect information from error logs
tail -100 "<error_log_file>" | breakdown defect project -o <project_defect.md>

# Generate issues from defect information
breakdown defect issue --from <project_defect.md> -o <issue_defect_dir>

# Generate fix tasks from issues
breakdown defect task --from <issue_defect.md> -o <task_defect_dir>
```

### 4. Creating Fix Proposals from Improvement Requests

Generate task-level fixes directly from improvement requests:

```bash
# Generate fix tasks from improvement requests
breakdown defect task --from <improvement_request.md> -o <task_defect_dir>
```

## Command Options Reference

### Global Options

- `--from` or `-f`: Specify input file
- `--destination` or `-o`: Specify output file or directory
- `--input` or `-i`: Specify input layer type
- `--adaptation` or `-a`: Specify prompt type (e.g., strict, a)

### Prompt Types

Prompt types can be specified using the `--adaptation` option:

```bash
# Example: Generate tasks in strict mode
breakdown to task issue.md -o tasks_dir -a strict

# Example: Generate task summary in 'a' mode
breakdown summary task --from unorganized_tasks.md -o task_markdown_dir -a a
```

### Path Auto-completion

The tool automatically completes paths based on configuration:

- If a path is provided, it's used as-is
- If only a filename is provided, it's completed using:
  - Working directory from configuration
  - Command type (to/summary/defect)
  - Layer type (project/issue/task)

### Automatic Filename Generation

When output is specified without a filename:

- A filename is generated in the format: `<yyyymmdd>_<random_hash>.md`
- Example: `20250211_e81d0bd.md`

## Configuration

Configuration is loaded from `./agent/breakdown/config/app.yml` which includes:

- Working directory settings
- Prompt file locations
- Schema file locations

To initialize your working directory:

```bash
breakdown init
```

This creates the necessary directory structure based on your configuration.
