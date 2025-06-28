# Breakdown Specifications Index

This directory contains the specifications for the Breakdown tool. These specifications are human-written documents based on use cases and requirements, separate from the development implementation details.

## Purpose and Background

Breakdown is an OSS tool implemented in Deno that supports hierarchical task decomposition for project management through prompt generation. This tool generates appropriate prompts based on input and conditions, enabling AI systems to use those prompts to perform task decomposition.

### Tool's Scope of Responsibility

1. Specialized in prompt generation
   - Selecting appropriate prompts based on input conditions
   - Variable substitution processing within prompts
   - Embedding JSON Schema reference information within prompts
   
2. Out of scope processing
   - Markdown structure analysis (parsing)
   - Actual task decomposition processing
   - JSON schema interpretation and validation
   - Conversion processing from input values to output values (performed by AI)

### Processing Flow

1. Input parameter processing
   - Command line argument parsing
   - Option validation
   
2. Identifying required files
   - Prompt file selection
   - Identifying schema files referenced by prompts
   - Input/output path resolution
   
3. Prompt generation
   - Loading prompt files
   - Variable substitution processing
   - Embedding JSON Schema reference information (for AI reference during input/output conversion)
   
4. Result output
   - Output of generated prompts
   - Appropriate error handling

## JSR Packages Used

Breakdown is implemented using the following JSR packages:

1. [@tettuan/breakdownconfig](https://jsr.io/@tettuan/breakdownconfig) - Configuration management
   - Application and user settings management
   - Working directory settings
   - Prompt and schema directory settings

2. [@tettuan/breakdownparams](https://jsr.io/@tettuan/breakdownparams) - Parameter processing
   - Command line argument parsing
   - Option processing
   - Parameter validation

3. [@tettuan/breakdownprompt](https://jsr.io/@tettuan/breakdownprompt) - Prompt processing
   - Prompt file loading
   - Variable substitution
   - Prompt generation

4. [@tettuan/breakdownlogger](https://jsr.io/@tettuan/breakdownlogger) - Logging functionality
   - Debug information output
   - Error handling and logging

## Specification Overview

**Value Provided:**
The Breakdown tool generates prompts for three hierarchical levels: project, issue, and task.
Through a command line interface (CLI), it provides functionality for generating prompts corresponding to these levels, generating summary prompts,
and generating defect analysis prompts.

**Actual Processing Content:**

1. Parameter processing
   - Identifying processing content from command line arguments
   - Resolving necessary file paths
   
2. Prompt generation
   - Selecting and loading prompt files
   - Generating dynamic content through variable substitution
   - Embedding schema information
   
3. Output processing
   - Outputting generated prompts
   - Appropriate feedback during errors

## Table of Contents

### Basic Specifications

0. [Basic Implementation](./breakdown.md) - Basic flow of command execution
   - Usage and initialization of JSR packages
   - Command line argument parsing flow
   - Configuration file loading and processing
   - Basic error handling policy

1. [Application Configuration](./app_config.md) - Configuration file loading and working directory management
   - Usage of breakdownconfig module
   - Hierarchical structure of application and user settings
   - Working directory and prompt directory settings
   - Schema directory configuration management

2. [Basic Commands and Arguments](./options.md) - Command line argument specifications and usage
   - Implementation of breakdownparams module
   - Processing of NoParamsResult, SingleParamResult, DoubleParamsResult
   - Command line argument parsing
   - Help and version information display

3. [Element Construction](./app_factory.md) - Schema and prompt element construction methods
   - PromptVariablesFactory responsibilities and implementation
   - Parameter construction rules
   - File path and directory path generation
   - Validation and conversion processing
   - Also covers parameter options and reserved variable correspondence table

> **For centralization of path resolution, parameter construction, and design principles, see [app_factory.md](./app_factory.md).**

3-1. [Construction Rules](./path.md) - Prompt argument construction rules based on settings and parameters -
Basic structure of path hierarchy - Input file path resolution rules - Output file path generation rules -
Hash value generation specifications and file naming conventions

3-2. [Schema Placement](./app_schema.md) - Basic rules for schema placement - Structure and placement of schema files -
Schema naming conventions - Command and layer combination rules - JSON schema definition methods

4. [Application Prompts](./app_prompt.md) - Prompt file substitution processing and usage
   - Usage of breakdownprompt module
   - Prompt manager setup and initialization
   - Variable substitution specifications and processing
   - Debug mode settings and usage

5. [Workspace](./workspace.md) - Workspace management and settings
   - Directory structure management
   - Configuration file handling
   - Path resolution implementation
   - Component coordination

6. [Test Configuration](./test/config.md) - Test directory persistence specifications
   - Test data persistence rules
   - Fixture placement and management
   - Test environment isolation policy
   - Temporary file handling

7. [Glossary](./glossary.md) - Definitions of domain-specific terms and concepts
   - Directory structure and path-related terms
   - Configuration and initialization terms
   - Test and debug-related terms
   - Input processing and prompt processing terms
   - Module configuration and type definition terms
   - Error handling and command line option terms

### Developer Documentation

8. [Module Configuration](./module.md) - Project structure and module design
   - Project structure and directory configuration
   - Dependency management and JSR package usage
   - Interface definitions and error handling
   - Coding standards and best practices

9. [Import Policy](./import_policy.md) - Import statement writing and dependency management
   - Import map configuration and usage
   - Version management and security
   - Prioritizing Web standard APIs
   - Troubleshooting and review criteria

10. [Deno Best Practices](./deno.md) - Deno application development guidelines
   - JSR package usage and publishing
   - Dependency management
   - Testing and debugging
   - Security and performance

### Implementation Details

11. [CLI Interface](./cli.md) - Detailed command line argument specifications
   - Basic syntax and arguments
   - Options
   - Standard input/output handling
   - Error handling

12. [Logging](./logging.md) - Logging functionality specifications

- Log levels and control
- Output format
- Debugging methods
- Logging in tests

13. [Test Specifications](./testing.md) - Test implementation guidelines
    - Test directory structure
    - Test execution procedures
    - Coverage requirements
    - Debugging and error handling

## CLI Interface Specifications

For detailed CLI interface specifications, see [CLI Interface Specifications](./cli.md).

These specifications are provided as reference materials for developers and users of the Breakdown tool to understand and properly utilize its functionality.

## Implementation Notes

### About Markdown Parsing

The Breakdown tool does not need to structurally parse the content of Markdown files. Markdown Parser implementation is unnecessary for the following reasons:

1. Purpose of file processing
   - File reading can be sufficiently handled as text content
   - Structural parsing is not included in the functional requirements

2. Role of existing packages
   - `@tettuan/breakdownparams` - Handles parameter processing only
   - `@tettuan/breakdownprompt` - Handles prompt text processing
   - These packages provide sufficient functionality

3. parsing Markdown file is never required. If needed to so, use `BreakdownPrompt`. this is the only
   way to parsing md file.

---

[日本語](./index.ja.md) | [English](./index.md)