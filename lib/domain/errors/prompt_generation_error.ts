/**
 * @fileoverview Prompt Generation Domain Errors
 * 
 * Errors related to the final prompt generation process,
 * including template processing, variable substitution, and output generation.
 * 
 * @module domain/errors/prompt_generation_error
 */

import { BaseBreakdownError } from "./breakdown_error.ts";

/**
 * Prompt generation error types
 */
export type PromptGenerationErrorKind =
  | "template-processing-failed"
  | "variable-substitution-failed"
  | "template-syntax-error"
  | "output-generation-failed"
  | "schema-embedding-failed"
  | "template-validation-failed"
  | "circular-reference-detected"
  | "max-depth-exceeded";

/**
 * Prompt Generation Error
 * Thrown when prompt generation fails
 */
export class PromptGenerationError extends BaseBreakdownError {
  readonly domain = "prompt-generation" as const;
  readonly kind: PromptGenerationErrorKind;

  constructor(
    kind: PromptGenerationErrorKind,
    message: string,
    options?: {
      cause?: Error;
      context?: {
        templatePath?: string;
        variableName?: string;
        lineNumber?: number;
        columnNumber?: number;
        templateSnippet?: string;
        outputPath?: string;
        schemaPath?: string;
        circularPath?: string[];
        currentDepth?: number;
        maxDepth?: number;
      };
    }
  ) {
    super(message, options);
    this.kind = kind;
  }

  /**
   * Create error for template processing failure
   */
  static processingFailed(
    templatePath: string,
    reason: string,
    cause?: Error
  ): PromptGenerationError {
    return new PromptGenerationError(
      "template-processing-failed",
      `Failed to process template '${templatePath}': ${reason}`,
      {
        cause,
        context: { templatePath }
      }
    );
  }

  /**
   * Create error for variable substitution failure
   */
  static substitutionFailed(
    variableName: string,
    templatePath: string,
    reason: string,
    lineNumber?: number
  ): PromptGenerationError {
    const location = lineNumber ? ` at line ${lineNumber}` : '';
    return new PromptGenerationError(
      "variable-substitution-failed",
      `Failed to substitute variable '{{${variableName}}}' in template${location}: ${reason}`,
      {
        context: { variableName, templatePath, lineNumber }
      }
    );
  }

  /**
   * Create error for template syntax errors
   */
  static syntaxError(
    templatePath: string,
    error: string,
    lineNumber?: number,
    columnNumber?: number,
    snippet?: string
  ): PromptGenerationError {
    const location = lineNumber ? ` at line ${lineNumber}` : '';
    const column = columnNumber ? `:${columnNumber}` : '';
    
    return new PromptGenerationError(
      "template-syntax-error",
      `Template syntax error in '${templatePath}'${location}${column}: ${error}`,
      {
        context: { 
          templatePath, 
          lineNumber, 
          columnNumber,
          templateSnippet: snippet 
        }
      }
    );
  }

  /**
   * Create error for output generation failure
   */
  static outputGenerationFailed(
    outputPath: string,
    reason: string,
    cause?: Error
  ): PromptGenerationError {
    return new PromptGenerationError(
      "output-generation-failed",
      `Failed to generate output at '${outputPath}': ${reason}`,
      {
        cause,
        context: { outputPath }
      }
    );
  }

  /**
   * Create error for schema embedding failure
   */
  static schemaEmbeddingFailed(
    schemaPath: string,
    templatePath: string,
    reason: string,
    cause?: Error
  ): PromptGenerationError {
    return new PromptGenerationError(
      "schema-embedding-failed",
      `Failed to embed schema '${schemaPath}' in template: ${reason}`,
      {
        cause,
        context: { schemaPath, templatePath }
      }
    );
  }

  /**
   * Create error for template validation failure
   */
  static validationFailed(
    templatePath: string,
    validationErrors: string[]
  ): PromptGenerationError {
    const errors = validationErrors.join(', ');
    return new PromptGenerationError(
      "template-validation-failed",
      `Template validation failed for '${templatePath}': ${errors}`,
      {
        context: { templatePath }
      }
    );
  }

  /**
   * Create error for circular reference detection
   */
  static circularReference(
    variableName: string,
    circularPath: string[]
  ): PromptGenerationError {
    const path = circularPath.join(' → ');
    return new PromptGenerationError(
      "circular-reference-detected",
      `Circular reference detected in variable '${variableName}': ${path}`,
      {
        context: { variableName, circularPath }
      }
    );
  }

  /**
   * Create error for max depth exceeded
   */
  static maxDepthExceeded(
    currentDepth: number,
    maxDepth: number,
    templatePath: string
  ): PromptGenerationError {
    return new PromptGenerationError(
      "max-depth-exceeded",
      `Maximum template nesting depth (${maxDepth}) exceeded at depth ${currentDepth}`,
      {
        context: { currentDepth, maxDepth, templatePath }
      }
    );
  }

  /**
   * Get user-friendly error message
   */
  override getUserMessage(): string {
    const base = super.getUserMessage();
    
    // Add helpful context for common errors
    switch (this.kind) {
      case "template-syntax-error":
        if (this.context?.templateSnippet) {
          return `${base}\n\n${this.context.templateSnippet}`;
        }
        return `${base}\n\nCheck template syntax for unclosed brackets or invalid placeholders`;
      case "variable-substitution-failed":
        return `${base}\n\nEnsure the variable is defined in your input data`;
      case "circular-reference-detected":
        return `${base}\n\nRemove circular dependencies between variables`;
      case "schema-embedding-failed":
        return `${base}\n\nCheck that the schema file exists and is readable`;
      default:
        return base;
    }
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(): boolean {
    switch (this.kind) {
      case "template-syntax-error":
        // Syntax errors require template fixes
        return false;
      case "variable-substitution-failed":
        // Can be fixed by providing missing variables
        return true;
      case "circular-reference-detected":
        // Requires template redesign
        return false;
      case "max-depth-exceeded":
        // Configuration issue
        return true;
      default:
        return true;
    }
  }

  /**
   * Get specific recovery suggestions
   */
  getRecoverySuggestions(): string[] {
    const suggestions: string[] = [];

    switch (this.kind) {
      case "template-processing-failed":
        suggestions.push("Check template file permissions");
        suggestions.push("Ensure template file is valid UTF-8");
        suggestions.push("Verify template exists at the specified path");
        break;
      case "variable-substitution-failed":
        suggestions.push(`Define variable '${this.context?.variableName}' in your input`);
        suggestions.push("Check for typos in variable names");
        suggestions.push("Use --debug to see available variables");
        break;
      case "template-syntax-error":
        suggestions.push("Check for:");
        suggestions.push("  - Unclosed variable brackets: {{variable}}");
        suggestions.push("  - Invalid nesting of conditionals");
        suggestions.push("  - Proper escaping of special characters");
        if (this.context?.lineNumber) {
          suggestions.push(`  - Error at line ${this.context.lineNumber}`);
        }
        break;
      case "output-generation-failed":
        suggestions.push("Check output directory permissions");
        suggestions.push("Ensure output path is writable");
        suggestions.push("Try a different output location");
        break;
      case "schema-embedding-failed":
        suggestions.push("Verify schema file exists");
        suggestions.push("Check schema file format");
        suggestions.push("Ensure schema path is correct");
        break;
      case "circular-reference-detected":
        if (this.context?.circularPath && Array.isArray(this.context.circularPath)) {
          suggestions.push("Break the circular dependency:");
          suggestions.push(`  ${this.context.circularPath.join(' → ')}`);
        }
        suggestions.push("Restructure your variables to avoid circular references");
        break;
      case "max-depth-exceeded":
        suggestions.push("Reduce template nesting depth");
        suggestions.push("Increase max depth limit in configuration");
        suggestions.push("Simplify template structure");
        break;
    }

    return suggestions;
  }

  /**
   * Get template debugging info
   */
  getTemplateDebugInfo(): string | undefined {
    if (this.kind === "template-syntax-error" && this.context?.lineNumber) {
      const lines: string[] = [];
      lines.push(`Template: ${this.context.templatePath}`);
      lines.push(`Line: ${this.context.lineNumber}`);
      if (this.context.columnNumber) {
        lines.push(`Column: ${this.context.columnNumber}`);
      }
      if (this.context.templateSnippet) {
        lines.push(`\nContext:\n${this.context.templateSnippet}`);
      }
      return lines.join('\n');
    }
    return undefined;
  }

  /**
   * Get example fix for the error
   */
  getExampleFix(): string | undefined {
    switch (this.kind) {
      case "variable-substitution-failed":
        return `# Add missing variable to input:
{
  "${this.context?.variableName}": "value"
}`;
      case "template-syntax-error":
        return `# Correct syntax:
{{variableName}}           # Variable reference
{{#if condition}}...{{/if}} # Conditional block
{{#each items}}...{{/each}} # Loop block`;
      case "circular-reference-detected":
        return `# Avoid circular references:
# BAD:  varA: "{{varB}}", varB: "{{varA}}"
# GOOD: varA: "value", varB: "{{varA}}_suffix"`;
    }
    return undefined;
  }
}