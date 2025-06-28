# Command Line Arguments Specification

## Basic Syntax

```bash
breakdown [demonstrative] [layer] [options]
```

### demonstrative (required)

Specifies the type of conversion or summary:

- `to`: Convert from Markdown to structured JSON
- `summary`: Generate Markdown summary from structured JSON
- `defect`: Analyze problems from error logs
- `init`: Initialize working directory

### layer (not required when demonstrative is init)

Specifies the target layer:

- `project`: Project overview level
- `issue`: Issue level
- `task`: Task level

## Options

### Input Source Specification

- `--from=<file>`, `-f=<file>`: Specify input file

### Output Destination Specification

- `--destination=<path>`, `-o=<path>`: Specify output destination
  - Directory: Automatically generates filename
  - File: Outputs with specified filename
  
  > destinationPath is a value for template embedding and does not necessarily involve file output.

### Prompt Control

- `--adaptation=<type>`, `-a=<type>`: Specify prompt type
  - Example: `strict`, `a` etc.
  - Affects prompt filename: `f_{fromLayerType}_{adaptation}.md`

### Custom Variables

- `--uv-<variable_name>=<value>`: Define custom variables usable in templates
  - Example: `--uv-userName=Taro`
  - Referenced as `{uv.userName}` in templates
  - Multiple variables can be defined

## Usage Examples

### Execution Examples with Custom Variables

```bash
# Generate task with user information
breakdown to task -f=requirements.md \
  --uv-userName=Taro \
  --uv-teamName=Development Team \
  --uv-deadline=2024-12-31

# Generate issue with project information
breakdown to issue -f=spec.md -o=issues/ \
  --uv-projectName=EC Site Renewal \
  --uv-version=2.0.0 \
  --uv-priority=high \
  --uv-assignee=Yamada Hanako

# Generate multi-language document
breakdown summary project -f=project.json \
  --uv-language=Japanese \
  --uv-audience=Engineers \
  --uv-format=Detailed
```

## Standard Input/Output

### Reading from Standard Input

```bash
echo "<content>" | breakdown <demonstrative> <layer> -o=<output>
tail -100 "<log_file>" | breakdown defect <layer> -o=<output>

# Usage combined with custom variables
cat error.log | breakdown defect task \
  --uv-severity=critical \
  --uv-module=Authentication System
```

### Output to Standard Output

Results are output to standard output.

## Path Resolution

### Working Directory

- Based on working directory initialized with `init` command
- Error if not initialized
- See [Workspace Specification](./workspace.md) for detailed implementation
- See [PromptVariablesFactory](./app_factory.md) for path resolution implementation details

### Path Resolution Implementation

Workspace and PromptVariablesFactory work together as follows:

1. Workspace
   - Manages working directory
   - Loads configuration file (app.yml)
   - Provides basic path resolution functionality

2. PromptVariablesFactory
   - Integrates Workspace configuration and CLI parameters
   - Generates paths for prompts, schemas, and input/output files
   - Ensures centralized and consistent path resolution

### Automatic Path Completion

1. Full path: Use as is
2. Filename only:
   - Working directory
   - Command type (to/summary/defect)
   - Layer type (project/issue/task) based completion

### Automatic Filename Generation

When output destination is a directory:

```
<yyyymmdd>_<random_hash>.md
```

## Error Handling

### Mandatory Checks

1. demonstrative specification
2. layer specification (except init)
3. Input source specification

### Pre-execution Checks

1. Working directory existence check
2. Input file existence check
3. Output destination write permission check

### Error Messages

- Output in English
- Clearly indicate cause and solution