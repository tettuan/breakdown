# Breakdown CLI Latest Usage Guide (Deno Support)

> This specification defines installation, execution, and operation methods for Breakdown CLI in Deno environment for developers.

## CLI Installation and Usage Methods

Breakdown CLI supports Deno 1.44 and later specifications with the following usage methods.

### 1. Compile as Binary for Use (Recommended)

Generate a standalone binary using Deno's `deno compile` feature for local project use.

```bash
mkdir -p .deno/bin
# Generate binary
deno compile -A -o .deno/bin/breakdown jsr:@tettuan/breakdown
# Example execution
./.deno/bin/breakdown --help
```

### 2. Use as JSR Package with deno task

Add a task to `deno.json` to invoke the CLI via JSR.

```jsonc
{
  "tasks": {
    "breakdown": "run -A jsr:@tettuan/breakdown"
  }
}
```

Example execution:
```bash
deno task breakdown --help
deno task breakdown to project <input.md> -o <output_dir>
```

### 3. Global Installation (System-wide Use)

```bash
deno install -A -f --global -n breakdown jsr:@tettuan/breakdown
# Example execution
breakdown --help
```

### 4. Direct Execution with deno run

```bash
deno run -A jsr:@tettuan/breakdown --help
deno run -A jsr:@tettuan/breakdown to project <input.md> -o <output_dir>
```

---

## CLI Command Examples

### Project Initialization
```bash
./.deno/bin/breakdown init
# or
deno task breakdown init
```

### Project Breakdown
```bash
./.deno/bin/breakdown to project -f <project_summary.md> -o <project_dir>
# or
deno task breakdown to project -f <project_summary.md> -o <project_dir>
```

### Issue Breakdown
```bash
./.deno/bin/breakdown to issue -f <project.md> -o <issue_dir>
```

### Task Breakdown
```bash
./.deno/bin/breakdown to task -f <issue.md> -o <tasks_dir>
```

---

## Notes
- Deno 1.44 and later does not support permission granting with `deno install --root` for local installations.
- For local project use, "binary compilation" or "deno task" is recommended.
- Generated binaries can be cleaned up with scripts like `10_clean.sh`.
- Refer to `examples/README.md` for detailed usage examples.