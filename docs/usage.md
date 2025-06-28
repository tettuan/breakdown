# Breakdown Usage Guide

This document explains various use cases and command patterns for the Breakdown tool.

## Installation

### Recommended: Install as CLI

Breakdown is primarily intended for use as a CLI tool.  
You can install it using the **official Deno/JSR standard method** with the following command:

```bash
deno install -A -f --global breakdown jsr:@tettuan/breakdown
```
- `-A` : Allow all permissions (recommended)
- `-f` : Overwrite existing command
- `--global` : Global installation
- `breakdown` : Command name

> **Note:**  
> The CLI module must be specified as `jsr:@tettuan/breakdown`.  
> This is based on the `exports` configuration in `deno.json`.

---

### Updates

When a new version is published, you can overwrite the installation with the same command:

```bash
deno install -A -f --global breakdown jsr:@tettuan/breakdown
```

---

### Using as a Library

When importing directly from TypeScript/JavaScript,  
you can add it as a dependency with `deno add`:

```bash
deno add @tettuan/breakdown
```

---

### Notes

- The breakdown command automatically uses `cli/breakdown.ts` as the entry point through the `bin` configuration in `deno.json`.
- Deno 1.40 or later is recommended.
- See the "Usage" section below for detailed usage information.

### Local Installation to Project Directory

If you want to use the breakdown command only within a specific project, you can install it to `.deno/bin` using the `--root` option:

```bash
deno install -A -f --global --root .deno -n breakdown jsr:@tettuan/breakdown
```

After installation, add the bin directory to your PATH:

```bash
export PATH="$(pwd)/.deno/bin:$PATH"
```

To make this setting permanent, add it to your shell configuration file (e.g., `~/.zshrc` or `~/.bashrc`).

### Troubleshooting

If the command is not responding, try the following steps:

1. Verify installation:
```bash
which breakdown
```

2. Test with direct execution:
```bash
deno run --allow-all jsr:@tettuan/breakdown
```

3. Compile as binary:
```bash
deno compile -A -o ~/.deno/bin/breakdown jsr:@tettuan/breakdown
```

4. Check path:
```bash
echo $PATH
```

## Basic Commands

### Initialize Working Directory

```bash
breakdown init
```

This command creates the necessary working directory structure specified in the configuration.

### Markdown Processing Commands

The following combinations are available:

| Command \ Layer | Command Description                                                  | Project                                                                                                                 | Issue                                                                                                                         | Task                                                                                                          |
| --------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| to              | Converts input Markdown to the next layer format                    | Decompose to project<br>breakdown to project <written_project_summary.md> -o=<project_dir>                              | Decompose from project to issues<br>breakdown to issue <project_summary.md\|written_issue.md> -o=<issue_dir>                 | Decompose from issue to tasks<br>breakdown to task <issue.md\|written_task.md> -o=<tasks_dir>                |
| summary         | Generates new Markdown or specified layer Markdown                  | Generate project summary in Markdown format<br>echo "<messy_something>" \| breakdown summary project -o=<project_summary.md> | Generate issue summary in Markdown format<br>breakdown summary issue --from=<aggregated_tasks.md> --input=task -o=<issue_markdown_dir> | Generate task summary in Markdown format<br>breakdown summary task --from=<unorganized_tasks.md> -o=<task_markdown_dir> |
| defect          | Generates fixes from error logs or defect information               | Generate project info from defect info<br>tail -100 "<error_log_file>" \| breakdown defect project -o=<project_defect.md> | Generate issues from defect info<br>breakdown defect issue --from=<bug_report.md> -o=<issue_defect_dir>                      | Generate tasks from defect info<br>breakdown defect task --from=<improvement_request.md> -o=<task_defect_dir> |

### Decomposition to Project

```bash
breakdown to project <written_project_summary.md> -o=<project_dir>
```

### Decomposition to Issues

```bash
breakdown to issue <project_summary.md|written_issue.md> -o=<issue_dir>
```

### Decomposition to Tasks

```bash
breakdown to task <issue.md|written_task.md> -o=<tasks_dir>
```

### Generate Markdown Summary

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