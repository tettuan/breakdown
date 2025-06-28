# Workspace Specification

## Overview

Workspace is a core module of the Breakdown tool that provides workspace management functionality. It implements features such as directory structure management, configuration file handling, and path resolution.

## Key Features

### 1. Directory Structure Management
- Manages the project's base directory structure
- Automatic creation of necessary directories
- Directory existence checking, creation, and deletion functions

### 2. Configuration Management
- Configuration file (app.yml) management
- Configuration validation functionality
- Configuration value retrieval functionality

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

- `WorkspaceError`: Base error for workspace-related issues
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

1. Always use `BreakdownConfig` for accessing configuration files
2. Direct reading of YAML or JSON files is prohibited
3. Use `WorkspacePathResolver` for path resolution
4. Perform directory operations through the `WorkspaceStructure` interface

## Component Relationships

### Relationship with CLI
- CLI uses `breakdown.ts` as the entry point to parse command-line arguments and execute appropriate commands
- The `init` command calls the `initWorkspace` function to execute Workspace initialization
- CLI configuration options (`ConfigOptions`) affect the Workspace configuration

### Relationship with BreakdownParams
- `BreakdownParams` is responsible for parsing and validating CLI parameters
- Parameter parsing results are reflected in Workspace configuration through `PromptVariablesFactory`
- Provides variables used for path resolution and template selection (`demonstrativeType`, `layerType`, etc.)
- **v1.0.1 New Feature**: Parsing and management of custom variables (--uv-*)
- **v1.0.1 New Feature**: Support for extended parameters (--extended, --custom-validation, --error-format)

### Relationship with init Process
1. `breakdown init` command is executed
2. `initWorkspace` function is called
3. Workspace instance is created and initialized
4. Necessary directory structure and configuration file (`app.yml`) are created
5. Template files are copied to appropriate directories

### Relationship with App Factory
- `PromptVariablesFactory` integrates Workspace configuration with CLI parameters
- Manages the following variables:
  - `inputFilePath`: Input file path
  - `outputFilePath`: Output file path
  - `promptFilePath`: Prompt template path
  - `schemaFilePath`: Schema file path
  - **v1.0.1 New Feature**: `customVariables`: Map of user-defined variables (--uv-*)
- Uses Workspace's path resolution functionality to properly resolve these paths
- **v1.0.1 New Feature**: Custom variables can be referenced in templates as `{uv.variableName}`

### Configuration Flow
1. CLI parameter parsing (`BreakdownParams`)
   - **v1.0.1 New Feature**: Loading default values from .breakdownrc.json
   - **v1.0.1 New Feature**: Applying environment-specific settings
2. Loading configuration file (`app.yml`) (`BreakdownConfig`)
3. Workspace initialization and configuration application
4. Variable generation by `PromptVariablesFactory`
   - **v1.0.1 New Feature**: Integration of custom variables
5. Use of configuration in each component

### BreakdownParams v1.0.1 Support

#### Configuration File Support

In v1.0.1, configuration management via `.breakdownrc.json` is now possible. Workspace utilizes the following settings:

```json
{
  "defaultOptions": {
    "adaptation": "strict",
    "errorFormat": "detailed"
  },
  "environments": {
    "production": {
      "customValidation": {
        "strictMode": true
      }
    }
  }
}
```

#### Custom Variable Management

Workspace manages user-defined custom variables (--uv-*) and passes them to template processing:

```typescript
// Example of custom variables
const customVariables = {
  projectName: "MyProject",    // --uv-projectName=MyProject
  author: "Taro",              // --uv-author=Taro
  version: "1.0.0"            // --uv-version=1.0.0
};
```

### Important Notes
1. Always use `BreakdownConfig` for accessing configuration files
2. Perform path resolution through `WorkspacePathResolver`
3. Use the `WorkspaceStructure` interface for directory operations
4. Workspace is responsible for managing template files
5. **v1.0.1 New Feature**: Custom variables are managed via `PromptVariablesFactory`
6. **v1.0.1 New Feature**: Environment-specific settings can be switched using the `BREAKDOWN_ENV` environment variable