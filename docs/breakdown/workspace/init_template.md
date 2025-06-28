# Breakdown Initialization Copy Process Specification

## 1. Overview

This specification defines the functionality for copying prompt and schema template files to appropriate directories during Breakdown's initialization process. This feature must work correctly even when installed via JSR, and provides system standard templates while ensuring user customizability. The implementation adopts the Facade pattern for simplifying the initialization process, the Strategy pattern for deployment method flexibility, and the Builder pattern for controlling the deployment process.

## 2. Architecture Design

### 2.1 Core Components

#### Workspace (Facade)
The central class for initialization processing. Provides a complex initialization process through a single interface and hides internal implementation details. Executes directory structure creation and template deployment through the `initialize()` method. Performs directory operations through the `WorkspaceStructure` interface and manages configuration using `WorkspaceConfigManager`.

#### TemplateManager (Strategy)
Class responsible for managing templates. Implements switchable deployment strategies and controls template loading, deployment, and updates. Performs initial template deployment with the `initializeTemplates()` method and provides template retrieval with the `getTemplate()` method. Uses `WorkspacePathResolver` for path resolution.

#### TemplateExpander (Builder)
Class responsible for template expansion processing. Builds complex expansion processes step by step and manages file system writing and overwrite rule application. Performs actual file expansion with the `expandTemplates()` method and applies expansion rules with the `isInExcludedDir()` and `shouldSkipFile()` methods.

### 2.2 Supporting Components

#### TemplateFactory (Factory)
Class responsible for template generation. Provides appropriate generation methods according to template types and ensures extensibility and testability. Works with `PromptVariablesFactory` to manage template variables.

#### TemplateValidator (Proxy)
Class responsible for template validation and access control. Controls access to templates and prevents invalid templates from being deployed. Performs configuration validation using `WorkspaceConfigManager`.

## 3. Processing Flow

### 3.1 Initialization Process

1. Workspace Initialization (Facade)
   - Directory structure creation through `WorkspaceStructure.ensureDirectories()`
   - Configuration file (app.yml) generation through `WorkspaceConfigManager`
   - Template deployment preparation

2. Template Deployment (Strategy)
   - Path resolution through `WorkspacePathResolver`
   - Variable generation through `PromptVariablesFactory`
   - File deployment execution

3. Deployment Rule Application (Builder)
   - User configuration directory protection
   - Existing file overwrite control
   - Error handling

### 3.2 Template Management Process

1. Template Retrieval (Strategy)
   - Path resolution through `WorkspacePathResolver`
   - Custom template prioritization
   - Default template fallback

2. Template Update (Factory)
   - System template update
   - Custom template protection
   - Update history management

## 4. Implementation Considerations

### 4.1 Packaging

To ensure template files are available when installed via JSR, templates need to be embedded in TypeScript files. Convert Markdown files to TypeScript during build time and deploy to the file system as needed at runtime. This implementation uses a combination of Factory and Builder patterns.

### 4.2 Customizability

Files within the user-specified base directory must be protected from being overwritten during system updates. Also, custom templates are used preferentially over system templates. This implementation uses a combination of Strategy and Proxy patterns.

### 4.3 Error Handling

Properly handle errors that may occur during template deployment and provide user-friendly error messages. Also, validate templates to prevent invalid templates from being deployed. This implementation uses a combination of Proxy and Builder patterns.

## 5. Test Requirements

### 5.1 Unit Tests

- Template loading and deployment (Strategy)
- Overwrite rule application (Builder)
- Error handling (Proxy)
- Custom template prioritization (Strategy)

### 5.2 Integration Tests

- Overall initialization process (Facade)
- Packaging and deployment (Builder)
- User configuration reflection (Strategy)
- Error behavior (Proxy)