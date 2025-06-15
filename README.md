# Breakdown

A tool for creating development instructions for AI-assisted development using TypeScript and JSON Schema.

## Overview

BreakDown is a tool & schema set that uses TypeScript and Deno with AI composer to convert Markdown documents, making them easier for AI systems to interpret.

When executed, development requirements written in Markdown are presented as prompts for conversion. These prompts include predefined JSON schemas that serve as structured definitions for the conversion. As a result, the prompts convert requirements into structured information. The output format can be specified in the prompt, allowing for various formats such as Markdown/JSON/YAML.

By reading the BreakdownSchema syntax as documentation, AI systems are expected to interpret these JSON structures and appropriately understand development requirements and specifications. As a result, we expect to simplify the content of instructions and enable concise direction.

This library is designed to work with AI development agents like Cursor. This design is specifically optimized for Cursor, as it is the primary tool used by the author. The underlying AI model is assumed to be Claude-3.7-sonnet. The syntax and structure are designed to be easily interpreted by other AI models as well.

## Main Features

- Optimized Markdown conversion prompts
- JSON schema syntax for AI systems
- Comprehensive [glossary](./docs/breakdown/glossary.md) for domain-specific terminology

## Purpose

To bridge the gap between human-written specifications and AI-interpretable instructions by providing a standardized way to express development requirements.

## Process Overview

This tool itself does not generate documents based on rules. It supports AI document generation by providing structured formats along with prompts that are easy for AI to interpret and work with.

## Usage

Breakdown tool has the following main commands:

| Command | Description                                                               | Project                              | Issue                      | Task                       |
| ------- | ------------------------------------------------------------------------- | ------------------------------------ | -------------------------- | -------------------------- |
| to      | Command to convert input Markdown to next layer format                    | Breakdown to project                 | Breakdown from project to issues | Breakdown from issues to tasks  |
| summary | Command to generate new Markdown or generate Markdown for specified layer | Generate project overview            | Generate issue overview    | Generate task overview     |
| defect  | Command to generate fixes from error logs and defect information          | Generate project information from defect info | Generate issues from defect info   | Generate tasks from defect info |

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

### Fix Generation from Defect Information

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

## Use Case Patterns

### 1. From Unorganized Information to Project Implementation

```bash
echo "<messy_something>" | breakdown summary project -o <project_summary.md>
breakdown to project <project_summary.md> -o <project_dir>
breakdown to issue <project_summary.md> -o <issue_dir>
breakdown to task <issue.md> -o <tasks_dir>
```

### 2. Creating Issues from Task Groups

```bash
breakdown summary issue --from <aggregated_tasks.md> --input task -o <issue_markdown_dir>
# Edit generated issues if needed
breakdown to task <issue.md> -o <tasks_dir>
```

### 3. Fix Task Generation from Defect Information

```bash
tail -100 "<error_log_file>" | breakdown defect project -o <project_defect.md>
breakdown defect issue --from <project_defect.md> -o <issue_defect_dir>
breakdown defect task --from <issue_defect.md> -o <task_defect_dir>
```

### 4. Creating Fix Proposals from Improvement Requests

```bash
breakdown defect task --from <improvement_request.md> -o <task_defect_dir>
```

# Setup

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
> You do not need to specify subpaths like `jsr:@tettuan/breakdown`.  
> Thanks to the JSR `bin` setting, `jsr:@tettuan/breakdown` alone works as a CLI.

---

### Update

To update to the latest version, simply run the same install command again:

```bash
deno install -A -f --global breakdown jsr:@tettuan/breakdown
```

---

### Uninstall

#### For global installation

```bash
deno uninstall breakdown
```

#### For local (project) installation

```bash
deno uninstall --root .deno breakdown
```
- Use `--root .deno` to uninstall from the `.deno/bin` directory in your project.

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

---

### Compile and Install CLI via JSR (Local Binary)

You can also compile the Breakdown CLI as a standalone binary using JSR and place it in your project directory (e.g., ./.deno/bin/breakdown):

```bash
mkdir -p .deno/bin
# Compile the CLI from JSR and output to .deno/bin/breakdown

deno compile -A -o .deno/bin/breakdown jsr:@tettuan/breakdown
```
- The resulting binary will be available at `./.deno/bin/breakdown`.
- You can run it with:
  ```bash
  ./.deno/bin/breakdown --help
  ```
- This binary does not require Deno to be installed on the target environment.

> **Note:**
> If you want to always generate the binary from your local source, use the local path (e.g., `cli/breakdown.ts`) instead of the JSR URL.

---

# Documentation

https://tettuan.github.io/breakdown/

JSR: https://jsr.io/@tettuan/breakdown

---

[English](README.md) | [日本語](README.ja.md)
