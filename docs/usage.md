# Breakdown Usage Guide

This document outlines the various use cases and command patterns for using the Breakdown tool.

## Installation

### System-wide Installation

```bash
deno install --name=breakdown https://deno.land/x/breakdown.ts
```

### Project-specific Installation

```bash
deno install --root ./tools --name=breakdown https://deno.land/x/breakdown.ts
```

### Manual Execution (without installation)

```bash
deno run --allow-read --allow-net https://deno.land/x/breakdown.ts
```

## Basic Commands

### Initialize Working Directory

```bash
breakdown init
```
This command creates the necessary working directory structure as specified in your configuration.

### Convert Markdown to JSON

**Create Project Overview**
```bash
breakdown to project <written_project_summary.md> -o <project-dir>
```

**Create Issues**
```bash
breakdown to issue <project_summary.json|written_issue.md> -o <issue-dir>
```

**Create Tasks**
```bash
breakdown to task <issue.json|written_task.md> -o <tasks-dir>
```

### Generate Markdown Summaries

**Project Summary**
```bash
echo "<summary>" | breakdown summary project -o <project_summary.md>
```

**Issue Summary**
```bash
echo "<issue summary>" | breakdown summary issue -o <issue_summary.md>
```

**Task Summary**
```bash
echo "<task summary>" | breakdown summary task -o <task_summary.md>
```

### Generate Markdown from Existing Documents

**Generate Issues from Project**
```bash
breakdown summary issue --from-project <project_summary.md> -o <issue_markdown_dir>
```

**Generate Tasks from Issue**
```bash
breakdown summary task --from-issue <issue_summary.md> -o <task_markdown_dir>
```

### Handle Defects and Errors

**Project Defect Analysis**
```bash
tail -100 "<error_log_file>" | breakdown defect project -o <project_defect.md>
```

**Issue Defect Analysis**
```bash
tail -100 "<error_log_file>" | breakdown defect issue -o <issue_defect.md>
```

**Task Defect Analysis**
```bash
tail -100 "<error_log_file>" | breakdown defect task -o <task_defect.md>
```

**Generate Issue Fixes from Project Defects**
```bash
breakdown defect issue --from-project <project_defect.md> -o <issue_defect_dir>
```

**Generate Task Fixes from Issue Defects**
```bash
breakdown defect task --from-issue <issue_defect.md> -o <task_defect_dir>
```

## Common Use Case Patterns

### 1. Project Overview to Complete Implementation

Write a project overview and let AI handle the rest:

```bash
# Create project summary
echo "<summary>" | breakdown summary project -o <project_summary.md>

# Convert to JSON format
breakdown to project <project_summary.md> -o <project-dir>

# Generate issues from project
breakdown to issue <project_summary.json> -o <issue-dir>

# Generate tasks from issues
breakdown to task <issue.json> -o <tasks-dir>
```

### 2. Detailed Issue Creation from Project

Create detailed issues from a project overview, then generate tasks:

```bash
# Create project summary
echo "<summary>" | breakdown summary project -o <project_summary.md>

# Generate issue markdowns from project
breakdown summary issue <project_summary.md> -o <issue_markdown_dir>

# Edit multiple Issue Markdowns manually

# Convert each issue to JSON
breakdown to issue <written_issue_1.md> -o <issue-dir>
breakdown to issue <written_issue_2.md> -o <issue-dir>

# Generate tasks from each issue
breakdown to task <issue_1.json> -o <tasks-dir>
breakdown to task <issue_2.json> -o <tasks-dir>
```

### 3. Process Detailed Tasks from Test Results

Generate tasks from issues based on test results:

```bash
# Capture test output and create issue defect
deno test --allow-read --allow-write --allow-run | breakdown defect issue -o <issue_defect.md>

# Convert defect to JSON issue
breakdown to issue <issue_defect.md> -o <issue-dir>

# Generate tasks from issue
breakdown to task <issue.json> -o <tasks-dir>
```

### 4. Create Fix Proposals for Execution Errors

Set up issues to fix based on Terminal error information:

```bash
# Capture error logs and create project defect
tail -100 "<error_log_file>" | breakdown defect project -o <project_defect.md>

# Generate issue defects from project defect
breakdown defect issue --from-project <project_defect.md> -o <issue_defect_dir>

# Convert issue defects to JSON
breakdown to issue <issue_defect.md> -o <issue-dir>

# Generate tasks from issues
breakdown to task <issue.json> -o <tasks-dir>
```

## Command Options Reference

### Global Options

- `--from` or `-f`: Specify input file
- `--destination` or `-o`: Specify output file or directory
- `--input` or `-i`: Specify input layer type

### Path Auto-completion

The tool automatically completes paths based on your configuration:

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

The tool reads configuration from `/breakdown/config/config.ts` which includes:
- Working directory settings
- Prompt file locations
- Schema file locations

Initialize your working directory with:

```bash
breakdown init
```

This creates the necessary directory structure based on your configuration. 