# Breakdown Usage Guide

This document outlines the various use cases and command patterns for using the Breakdown tool.

## Installation

### Install to System

```
deno add @tettuan/breakdown
```

### Install Only to AI Development Repository

```
deno add --root ./tools @tettuan/breakdown
```

If you want to use it without installation:

```
deno run --allow-read --allow-net jsr:@tettuan/breakdown
```

## Basic Commands

### Initialize Working Directory

```bash
breakdown init
```

This command creates the necessary working directory structure as specified in your configuration.

### Markdown Processing Commands

The following combinations are available:

| Command \ Layer | Command Description | Project | Issue | Task |
| --------------- | ------------------ | ------- | ----- | ---- |
| to | Command to convert input Markdown to next layer format | Break down into project<br>breakdown to project <written_project_summary.md> -o <project_dir> | Break down project into issues<br>breakdown to issue <project_summary.md\|written_issue.md> -o <issue_dir> | Break down issues into tasks<br>breakdown to task <issue.md\|written_task.md> -o <tasks_dir> |
| summary | Command to generate new Markdown or generate Markdown for specified layer | Generate project summary in Markdown format<br>echo "<messy_something>" \| breakdown summary project -o <project_summary.md> | Generate issue summary in Markdown format<br>breakdown summary issue --from <aggregated_tasks.md> --input task -o <issue_markdown_dir> | Generate task summary in Markdown format<br>breakdown summary task --from <unorganized_tasks.md> -o <task_markdown_dir> |
| defect | Command to generate fixes from error logs or defect information | Generate project information from defect info<br>tail -100 "<error_log_file>" \| breakdown defect project -o <project_defect.md> | Generate issues from defect info<br>breakdown defect issue --from <bug_report.md> -o <issue_defect_dir> | Generate tasks from defect info<br>breakdown defect task --from <improvement_request.md> -o <task_defect_dir> |

### Breaking Down into Projects

```bash
breakdown to project <written_project_summary.md> -o <project_dir>
```

### Breaking Down into Issues

```bash
breakdown to issue <project_summary.md|written_issue.md> -o <issue_dir>
```

### Breaking Down into Tasks

```bash
breakdown to task <issue.md|written_task.md> -o <tasks_dir>
```

### Generating Markdown Summaries

**Project Summary** Generate project overview from unorganized information:

```bash
echo "<messy_something>" | breakdown summary project -o <project_summary.md>
```

**Issue Summary** Generate issues from a collection of tasks:

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
