# Breakdown Usage Guide

This document explains various use cases and command patterns for the Breakdown tool.

## Installation

### Recommended: Install as CLI

Breakdown is primarily intended for use as a CLI tool.  
You can install it using the official Deno/JSR method as follows:

```bash
deno install -A -f --global breakdown jsr:@tettuan/breakdown
```
- `-A`: Allow all permissions (recommended)
- `-f`: Overwrite existing command
- `--global`: Global installation
- `breakdown`: Command name

> **Note:**  
> The CLI module must be specified as `jsr:@tettuan/breakdown`.  
> This is based on the `exports` setting in `deno.json`.

---

### Update

To update to the latest version, simply run the same install command again:

```bash
deno install -A -f --global breakdown jsr:@tettuan/breakdown
```

---

### As a library

If you want to use it directly from TypeScript/JavaScript, add it as a dependency:

```bash
deno add @tettuan/breakdown
```

---

### Notes

- The breakdown command automatically uses `cli/breakdown.ts` as the entry point via the `bin` setting in `deno.json`.
- Deno 1.40 or later is recommended.
- See the "Usage" section below for details.

### Local Install in Project Directory

If you want to use the breakdown command only within a specific project, you can install it under `.deno/bin` using the `--root` option:

```bash
deno install -A -f --global --root .deno -n breakdown jsr:@tettuan/breakdown
```

After installation, add the bin directory to your PATH:

```bash
export PATH="$(pwd)/.deno/bin:$PATH"
```

To make this permanent, add it to your shell configuration file (e.g., `~/.zshrc` or `~/.bashrc`).

### Troubleshooting

If the command does not respond, try the following steps:

1. Check installation:
```bash
which breakdown
```

2. Test by running directly:
```bash
deno run --allow-all jsr:@tettuan/breakdown
```

3. Compile as a binary:
```bash
deno compile -A -o ~/.deno/bin/breakdown jsr:@tettuan/breakdown
```

4. Check your PATH:
```bash
echo $PATH
```

## Basic Commands

### Initialize Working Directory

```bash
breakdown init
```

This command creates the necessary working directory structure as specified in the configuration.

### Markdown Processing Commands

The following combinations are available:

| Command \ Layer | Description                                                       | Project                                                                                                                 | Issue                                                                                                                         | Task                                                                                                          |
| --------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| to              | Command to convert input Markdown to the next layer format         | Breakdown to project<br>breakdown to project <written_project_summary.md> -o <project_dir>                                | Breakdown from project to issues<br>breakdown to issue <project_summary.md\|written_issue.md> -o <issue_dir>                        | Breakdown from issues to tasks<br>breakdown to task <issue.md\|written_task.md> -o <tasks_dir>                          |
| summary         | Command to generate new Markdown or generate Markdown for a layer   | Generate project overview in Markdown<br>echo "<messy_something>" \| breakdown summary project -o=<project_summary.md>   | Generate issue overview in Markdown<br>breakdown summary issue --from=<aggregated_tasks.md> --input=task -o=<issue_markdown_dir> | Generate task overview in Markdown<br>breakdown summary task --from=<unorganized_tasks.md> -o=<task_markdown_dir> |
| defect          | Command to generate fixes from error logs and defect information    | Generate project information from defect info<br>tail -100 "<error_log_file>" \| breakdown defect project -o=<project_defect.md> | Generate issues from defect info<br>breakdown defect issue --from=<bug_report.md> -o=<issue_defect_dir>                               | Generate tasks from defect info<br>breakdown defect task --from=<improvement_request.md> -o=<task_defect_dir>      |

### Project Breakdown

```bash
breakdown to project <written_project_summary.md> -o <project_dir>
```

### Issue Breakdown

```bash
breakdown to issue <project_summary.md|written_issue.md> -o <issue_dir>
```

### Task Breakdown

```bash
breakdown to task <issue.md|written_task.md> -o <tasks_dir>
```

### Markdown Summary Generation

**Project Summary** Generate project overview from unorganized information:

```bash
echo "<messy_something>" | breakdown summary project -o=<project_summary.md>
```

**Issue Summary** Generate issues from task groups:

```bash
breakdown summary issue --from=<aggregated_tasks.md> --input=task -o=<issue_markdown_dir>
```

**Task Summary** Generate organized tasks from unorganized task information:

```bash
breakdown summary task --from=<unorganized_tasks.md> -o=<task_markdown_dir>
```

## Common Use Case Patterns

### 1. Flow from Unorganized Information to Project Implementation

Build a project from unorganized information and break it down into issues and tasks:

```bash
# Generate project summary from unorganized information
echo "<messy_something>" | breakdown summary project -o=<project_summary.md>

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
breakdown summary issue --from=<aggregated_tasks.md> --input=task -o=<issue_markdown_dir>

# Edit generated issues (if necessary)

# Generate tasks from issues
breakdown to task <issue.md> -o <tasks_dir>
```

### 3. Generating Fix Tasks from Defect Information

Generate fix tasks from error logs or defect reports:

```bash
# Generate defect information from error logs
tail -100 "<error_log_file>" | breakdown defect project -o=<project_defect.md>

# Generate issues from defect information
breakdown defect issue --from=<project_defect.md> -o=<issue_defect_dir>

# Generate fix tasks from issues
breakdown defect task --from=<issue_defect.md> -o=<task_defect_dir>
```

### 4. Creating Fix Proposals from Improvement Requests

Generate task-level fixes directly from improvement requests:

```bash
# Generate fix tasks from improvement requests
breakdown defect task --from=<improvement_request.md> -o=<task_defect_dir>
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
breakdown summary task --from=unorganized_tasks.md -o=task_markdown_dir -a=a
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
