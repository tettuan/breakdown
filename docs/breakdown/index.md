# Breakdown Specification Index

This directory contains the specifications for the Breakdown tool. These specifications are based on human-curated use cases and requirements, separate from the development details.

## Purpose and Background

Breakdown is an OSS tool implemented in Deno that supports hierarchical task breakdown for project management through prompt generation. The tool generates appropriate prompts based on input and conditions, enabling AI systems to perform task breakdown using these prompts.

### Tool's Scope of Responsibility

1. Specialized in Prompt Generation
   - Selection of appropriate prompts based on input conditions
   - Variable substitution in prompts
   - Embedding JSON Schema reference information in prompts
   
2. Out of Scope
   - Markdown structure parsing
   - Actual task breakdown processing
   - JSON schema interpretation and validation
   - Input to output conversion (handled by AI)

### Process Flow

1. Input Parameter Processing
   - Command-line argument parsing
   - Option validation
   
2. File Identification
   - Prompt file selection
   - Identification of schema files referenced by prompts
   - Input/output path resolution
   
3. Prompt Generation
   - Prompt file loading
   - Variable substitution
   - JSON Schema reference information embedding (for AI reference during conversion)
   
4. Output Processing
   - Generated prompt output
   - Appropriate error handling

## JSR Packages Used

Breakdown is implemented using the following JSR packages:

1. [@tettuan/breakdownconfig](https://jsr.io/@tettuan/breakdownconfig) - Configuration Management
   - Application and user settings management
   - Working directory configuration
   - Prompt and schema directory settings

2. [@tettuan/breakdownparams](https://jsr.io/@tettuan/breakdownparams) - Parameter Processing
   - Command-line argument parsing
   - Option handling
   - Parameter validation

3. [@tettuan/breakdownprompt](https://jsr.io/@tettuan/breakdownprompt) - Prompt Processing
   - Prompt file loading
   - Variable substitution
   - Prompt generation

4. [@tettuan/breakdownlogger](https://jsr.io/@tettuan/breakdownlogger) - Logging Functionality
   - Debug information output
   - Error handling and logging

## Specification Overview

**Value Provided:**
The Breakdown tool generates prompts for three hierarchical levels: projects, issues, and tasks.
Through the Command Line Interface (CLI), it provides functionality for generating prompts corresponding to these levels,
generating summary prompts, and generating defect analysis prompts.

**Actual Processing:**

1. Parameter Processing
   - Identify processing content from command-line arguments
   - Resolve necessary file paths
   
2. Prompt Generation
   - Select and load prompt files
   - Generate dynamic content through variable substitution
   - Embed schema information
   
3. Output Processing
   - Output generated prompts
   - Appropriate feedback for errors

## Table of Contents

### Basic Specifications

0. [Basic Implementation](./breakdown.md) - Basic Command Execution Flow
   - JSR Package Usage and Initialization
   - Command-line Argument Parsing Flow
   - Configuration File Loading and Processing
   - Basic Error Handling Policy

1. [Application Configuration](./app_config.md) - Configuration File Loading and Working Directory Management
   - Usage of breakdownconfig Module
   - Hierarchical Structure of Application and User Settings
   - Working Directory and Prompt Directory Configuration
   - Schema Directory Structure Management

2. [Basic Commands and Arguments](./options.md) - Command-line Argument Specifications and Usage
   - breakdownparams Module Implementation
   - Processing of NoParamsResult, SingleParamResult, DoubleParamsResult
   - Command-line Argument Parsing
   - Help and Version Information Display

3. [Element Construction](./app_factory.md) - Schema and Prompt Element Construction Methods
   - PromptVariablesFactory Responsibilities and Implementation
   - Parameter Construction Rules
   - File Path and Directory Path Generation
   - Validation and Conversion Processing
   - Parameter Options and Reserved Variables Correspondence Table

> **For path resolution, parameter construction centralization, and design policies, please also refer to [app_factory.md](./app_factory.md).**

3-1. [Construction Rules](./path.md) - Prompt Argument Construction Rules Based on Settings and Parameters
   - Basic Path Hierarchy Structure
   - Input File Path Resolution Rules
   - Output File Path Generation Rules
   - Hash Value Generation Specifications and Filename Rules

3-2. [Schema Placement](./app_schema.md) - Basic Schema Placement Rules
   - Schema File Structure and Placement
   - Schema Naming Conventions
   - Command and Layer Combination Rules
   - JSON Schema Definition Methods

4. [Application Prompt](./app_prompt.md) - Prompt File Substitution Processing and Usage
   - breakdownprompt Module Usage
   - Prompt Manager Configuration and Initialization
   - Variable Substitution Specifications and Processing
   - Debug Mode Settings and Usage

5. [Test Configuration](./test/config.md) - Test Directory Persistence Specifications
   - Test Data Persistence Rules
   - Fixture Placement and Management
   - Test Environment Isolation Policy
   - Temporary File Handling

6. [Glossary](./glossary.md) - Domain-specific Terms and Concept Definitions
   - Directory Structure and Path-related Terms
   - Configuration and Initialization Terms
   - Testing and Debugging Terms
   - Input Processing and Prompt Processing Terms
   - Module Structure and Type Definition Terms
   - Error Handling and Command-line Option Terms

### Developer Documentation

7. [Module Structure](./module.md) - Project Structure and Module Design
   - Project Structure and Directory Organization
   - Dependency Management and JSR Package Usage
   - Interface Definitions and Error Handling
   - Coding Standards and Best Practices

8. [Import Policy](./import_policy.md) - Import Statement Writing and Dependency Management
   - Import Map Configuration and Usage
   - Version Management and Security
   - Web Standard API Priority Usage
   - Troubleshooting and Review Criteria

9. [Deno Best Practices](./deno.md) - Deno Application Development Guidelines
   - JSR Package Usage and Publication
   - Dependency Management
   - Testing and Debugging
   - Security and Performance

### Implementation Details

10. [CLI Interface](./cli.md) - Command-line Argument Detailed Specifications
    - Basic Syntax and Arguments
    - Options
    - Standard Input/Output Handling
    - Error Handling

11. [Logging](./logging.md) - Logging Function Specifications
    - Log Levels and Control
    - Output Format
    - Debugging Methods
    - Logging in Tests

12. [Testing Specifications](./testing.md) - Test Implementation Guidelines
    - Test Directory Structure
    - Test Execution Procedures
    - Coverage Requirements
    - Debugging and Error Handling

## CLI Interface Specifications

For detailed specifications of the CLI interface, please refer to the [CLI Interface Specifications](./cli.md).

These specifications are provided as reference materials for developers and users of the Breakdown tool to understand and appropriately utilize its functionality.

## Implementation Notes

### Regarding Markdown Parsing

The Breakdown tool does not require structural parsing of Markdown files. Implementation of a Markdown Parser is unnecessary for the following reasons:

1. File Processing Purpose
   - File reading is sufficient when treated as text content
   - Structural parsing is not included in functional requirements

2. Role of Existing Packages
   - `@tettuan/breakdownparams` - Handles only parameter processing
   - `@tettuan/breakdownprompt` - Handles prompt text processing
   - These packages provide sufficient functionality

3. Parsing Markdown files is never required. If needed, use `BreakdownPrompt`. This is the only way to parse md files.

---

[日本語](./index.ja.md) | [English](./index.md) 