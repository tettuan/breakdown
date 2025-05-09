# Command Line Arguments Specification

## Basic Syntax

```bash
breakdown <demonstrative> [layer] [options]
```

### demonstrative (Required)

Specifies the type of conversion or summarization:

- `to`: Conversion from Markdown to structured JSON
- `summary`: Generation of Markdown summary from structured JSON
- `defect`: Problem analysis from error logs
- `init`: Initialization of working directory

### layer (Not required if demonstrative is init)

Specifies the processing target layer:

- `project`: Project overview level
- `issue`: Issue level
- `task`: Task level

## Options

### Input Source Specification

- `--from <file>`, `-f <file>`: Specify input file

### Output Destination Specification

- `--destination <path>`, `-o <path>`: Specify output destination
  - For directories: Automatically generates filename
  - For files: Outputs with specified filename
  
  > destinationPath is a value for template embedding and does not necessarily involve file output.

### Prompt Control

- `--adaptation <type>`, `-a <type>`: Specify prompt type
  - Examples: `strict`, `a`, etc.
  - Affects prompt filename: `f_{fromLayerType}_{adaptation}.md`

## Standard Input/Output

### Reading from Standard Input

```bash
echo "<content>" | breakdown <demonstrative> <layer> -o <output>
tail -100 "<log_file>" | breakdown defect <layer> -o <output>
```

### Output to Standard Output

Results are output to standard output.

## Path Resolution

### Working Directory

- Based on working directory initialized with `init` command
- Error if not initialized

### Path Auto-completion

1. For absolute paths: Used as is
2. For filenames only:
   - Working directory
   - Command type (to/summary/defect)
   - Layer type (project/issue/task) based completion

### Automatic Filename Generation

When output destination is a directory:

```
<yyyymmdd>_<random_hash>.md
```

## Error Handling

### Required Checks

1. demonstrative specification
2. layer specification (except for init)
3. input source specification

### Pre-execution Checks

1. Working directory existence verification
2. Input file existence verification
3. Output destination write permission verification

### Error Messages

- Output in English
- Clearly indicates error cause and solution 