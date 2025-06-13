# Workspace Specification

## Overview

Workspace is a module that provides core functionality for the Breakdown tool. It implements features such as directory structure management, configuration file handling, and path resolution.

## Main Features

### 1. Directory Structure Management
- Manages project's basic directory structure
- Automatic creation of necessary directories
- Directory existence checking, creation, and deletion features

### 2. Configuration Management
- Management of configuration file (app.yml)
- Configuration validation features
- Configuration value retrieval features

### 3. Path Resolution
- Path resolution for prompts, schemas, and output files
- Path normalization and validation

## Directory Structure

The default directory structure is as follows:

```
.agent/breakdown/
├── projects/    # Project-related files
├── issues/      # Issue-related files
├── tasks/       # Task-related files
├── temp/        # Temporary files
├── config/      # Configuration files
├── prompts/     # Prompt templates
└── schemas/     # Schema files
```

## Configuration File (app.yml)

The configuration file has the following structure:

```yaml
working_dir: ".agent/breakdown"
app_prompt:
  base_dir: "prompts"
app_schema:
  base_dir: "schemas"
```

## Main Interfaces

### Workspace
- `initialize()`: Initialize workspace
- `resolvePath(path)`: Resolve path
- `createDirectory(path)`: Create directory
- `removeDirectory(path)`: Remove directory
- `exists(path?)`: Check path existence

### WorkspaceStructure
- `getPromptBaseDir()`: Get prompt base directory
- `getSchemaBaseDir()`: Get schema base directory
- `getWorkingDir()`: Get working directory
- `initialize()`: Initialize
- `ensureDirectories()`: Create necessary directories

### WorkspaceConfigManager
- `getConfig()`: Get configuration
- `validateConfig()`: Validate configuration

## Error Handling

The following custom error classes are defined:

- `WorkspaceError`: Basic workspace-related error
- `WorkspaceInitError`: Initialization error
- `WorkspaceConfigError`: Configuration error
- `WorkspacePathError`: Path resolution error
- `WorkspaceDirectoryError`: Directory operation error

## Usage Example

```typescript
import { Workspace } from "@tettuan/breakdown/lib/workspace/workspace.ts";

const workspace = new Workspace({
  workingDir: ".",
  promptBaseDir: "prompts",
  schemaBaseDir: "schemas"
});

await workspace.initialize();
```

## Important Notes

1. Always use `BreakdownConfig` for configuration file access
2. Direct loading of YAML or JSON files is prohibited
3. Use `WorkspacePathResolver` for path resolution
4. Perform directory operations through `WorkspaceStructure` interface

## Component Relationships

### Relationship with CLI
- CLI uses `breakdown.ts` as entry point to parse command-line arguments and execute appropriate commands
- `init` command calls `initWorkspace` function to execute Workspace initialization
- CLI configuration options (`ConfigOptions`) affect Workspace configuration

### Relationship with BreakdownParams
- `BreakdownParams` handles CLI parameter parsing and validation
- Parameter parsing results are reflected in Workspace configuration through `PromptVariablesFactory`
- Provides variables (`demonstrativeType`, `layerType`, etc.) used for path resolution and template selection

### Relationship with init Process
1. `breakdown init` command is executed
2. `initWorkspace` function is called
3. Workspace instance is created and initialized
4. Necessary directory structure and configuration file (`app.yml`) are created
5. Template files are copied to appropriate directories

### Relationship with App Factory
- `PromptVariablesFactory` integrates Workspace configuration and CLI parameters
- Manages the following variables:
  - `inputFilePath`: Input file path
  - `outputFilePath`: Output file path
  - `promptFilePath`: Prompt template path
  - `schemaFilePath`: Schema file path
- Uses Workspace path resolution features to properly resolve these paths

### Configuration Flow
1. CLI parameter parsing (`BreakdownParams`)
2. Configuration file (`app.yml`) loading (`BreakdownConfig`)
3. Workspace initialization and configuration application
4. Variable generation by `PromptVariablesFactory`
5. Configuration usage in each component

### Important Notes
1. Always use `BreakdownConfig` for configuration file access
2. Perform path resolution through `WorkspacePathResolver`
3. Use `WorkspaceStructure` interface for directory operations
4. Workspace handles template file management