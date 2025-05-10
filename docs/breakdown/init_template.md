# Breakdown Initialization Copy Process Specification

## 1. Overview

This document defines the specifications for the function that copies prompt and schema template files to the appropriate directories during Breakdown initialization. This function must work correctly even when installed via JSR, providing standard system templates while ensuring user customizability. The implementation adopts the Facade pattern to simplify the initialization process, the Strategy pattern for flexible deployment methods, and the Builder pattern to control the deployment process.

## 2. Architecture Design

### 2.1 Core Components

#### Workspace (Facade)
The central class for initialization. It provides a single interface for a complex initialization process, hiding internal implementation details. The `initialize()` method creates the directory structure and deploys templates. Directory operations are performed via the `WorkspaceStructure` interface, and configuration is managed using `WorkspaceConfigManager`.

#### TemplateManager (Strategy)
Responsible for managing templates. Implements switchable deployment strategies, controlling template loading, deployment, and updates. The `initializeTemplates()` method performs initial template deployment, and `getTemplate()` provides template retrieval. Uses `WorkspacePathResolver` for path resolution.

#### TemplateExpander (Builder)
Handles template deployment. Gradually builds a complex deployment process, managing file system writes and overwrite rules. The `expandTemplates()` method performs actual file deployment, and `isInExcludedDir()` and `shouldSkipFile()` apply deployment rules.

### 2.2 Auxiliary Components

#### TemplateFactory (Factory)
Responsible for generating templates. Provides appropriate generation methods according to template type, ensuring extensibility and testability. Works with `PromptVariablesFactory` to manage template variables.

#### TemplateValidator (Proxy)
Handles template validation and access control. Controls access to templates and prevents invalid templates from being deployed. Uses `WorkspaceConfigManager` to validate configuration.

## 3. Processing Flow

### 3.1 Initialization Process

1. Workspace Initialization (Facade)
   - Create directory structure via `WorkspaceStructure.ensureDirectories()`
   - Generate configuration file (app.yml) via `WorkspaceConfigManager`
   - Prepare for template deployment

2. Template Deployment (Strategy)
   - Path resolution via `WorkspacePathResolver`
   - Variable generation via `PromptVariablesFactory`
   - Execute file deployment

3. Apply Deployment Rules (Builder)
   - Protect user configuration directories
   - Control overwriting of existing files
   - Error handling

### 3.2 Template Management Process

1. Template Retrieval (Strategy)
   - Path resolution via `WorkspacePathResolver`
   - Prioritize custom templates
   - Fallback to default templates

2. Template Update (Factory)
   - Update system templates
   - Protect custom templates
   - Manage update history

## 4. Implementation Notes

### 4.1 Packaging

To ensure template files are available when installed via JSR, templates must be embedded in TypeScript files. During build, Markdown files are converted to TypeScript and deployed to the file system as needed at runtime. This implementation combines the Factory and Builder patterns.

### 4.2 Customizability

Files in user-specified base directories must be protected from being overwritten during system updates. Custom templates are prioritized over system templates. This implementation combines the Strategy and Proxy patterns.

### 4.3 Error Handling

Properly handle errors that may occur during template deployment and provide user-friendly error messages. Also, validate templates to prevent invalid templates from being deployed. This implementation combines the Proxy and Builder patterns.

## 5. Test Requirements

### 5.1 Unit Tests

- Template loading and deployment (Strategy)
- Application of overwrite rules (Builder)
- Error handling (Proxy)
- Prioritization of custom templates (Strategy)

### 5.2 Integration Tests

- Entire initialization process (Facade)
- Packaging and deployment (Builder)
- Reflection of user settings (Strategy)
- Behavior on error (Proxy) 