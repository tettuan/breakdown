/**
 * @fileoverview Variable Generation Domain Errors
 * 
 * Errors related to prompt variable generation and transformation.
 * Covers input validation, variable merging, and data transformation issues.
 * 
 * @module domain/errors/variable_generation_error
 */

import { BaseBreakdownError } from "./breakdown_error.ts";

/**
 * Variable generation error types
 */
export type VariableGenerationErrorKind =
  | "variable-missing-required"
  | "variable-invalid-type"
  | "variable-validation-failed"
  | "variable-transformation-failed"
  | "variable-merge-conflict"
  | "variable-source-invalid"
  | "variable-schema-mismatch"
  | "variable-reference-error";

/**
 * Variable Generation Error
 * Thrown when prompt variable generation fails
 */
export class VariableGenerationError extends BaseBreakdownError {
  readonly domain = "variable-generation" as const;
  readonly kind: VariableGenerationErrorKind;

  constructor(
    kind: VariableGenerationErrorKind,
    message: string,
    options?: {
      cause?: Error;
      context?: {
        variableName?: string;
        variableValue?: unknown;
        sourceType?: "cli" | "config" | "stdin" | "default";
        expected?: string;
        actual?: string;
        missingVariables?: string[];
        conflictingVariables?: Array<{ name: string; sources: string[] }>;
        schemaPath?: string;
        transformationStep?: string;
      };
    }
  ) {
    super(message, options);
    this.kind = kind;
  }

  /**
   * Create error for missing required variables
   */
  static missingRequired(
    missingVariables: string[],
    sourceType?: string
  ): VariableGenerationError {
    const source = sourceType ? ` from ${sourceType}` : '';
    const vars = missingVariables.join(', ');
    
    return new VariableGenerationError(
      "variable-missing-required",
      `Missing required variables${source}: ${vars}`,
      {
        context: { missingVariables, sourceType: sourceType as any }
      }
    );
  }

  /**
   * Create error for invalid variable type
   */
  static invalidType(
    variableName: string,
    expected: string,
    actual: string,
    value?: unknown
  ): VariableGenerationError {
    return new VariableGenerationError(
      "variable-invalid-type",
      `Variable '${variableName}' has invalid type: expected ${expected}, got ${actual}`,
      {
        context: { variableName, expected, actual, variableValue: value }
      }
    );
  }

  /**
   * Create error for validation failure
   */
  static validationFailed(
    variableName: string,
    reason: string,
    value?: unknown
  ): VariableGenerationError {
    return new VariableGenerationError(
      "variable-validation-failed",
      `Variable '${variableName}' validation failed: ${reason}`,
      {
        context: { variableName, variableValue: value, expected: reason }
      }
    );
  }

  /**
   * Create error for transformation failure
   */
  static transformationFailed(
    variableName: string,
    transformationStep: string,
    reason: string,
    cause?: Error
  ): VariableGenerationError {
    return new VariableGenerationError(
      "variable-transformation-failed",
      `Failed to transform variable '${variableName}' during ${transformationStep}: ${reason}`,
      {
        cause,
        context: { variableName, transformationStep, expected: reason }
      }
    );
  }

  /**
   * Create error for merge conflicts
   */
  static mergeConflict(
    conflictingVariables: Array<{ name: string; sources: string[] }>
  ): VariableGenerationError {
    const conflicts = conflictingVariables
      .map(c => `${c.name} (from: ${c.sources.join(', ')})`)
      .join(', ');

    return new VariableGenerationError(
      "variable-merge-conflict",
      `Variable merge conflict detected: ${conflicts}`,
      {
        context: { conflictingVariables }
      }
    );
  }

  /**
   * Create error for invalid source
   */
  static sourceInvalid(
    sourceType: string,
    reason: string,
    cause?: Error
  ): VariableGenerationError {
    return new VariableGenerationError(
      "variable-source-invalid",
      `Invalid variable source '${sourceType}': ${reason}`,
      {
        cause,
        context: { sourceType: sourceType as any, expected: reason }
      }
    );
  }

  /**
   * Create error for schema mismatch
   */
  static schemaMismatch(
    variableName: string,
    schemaPath: string,
    mismatchDetails: string
  ): VariableGenerationError {
    return new VariableGenerationError(
      "variable-schema-mismatch",
      `Variable '${variableName}' does not match schema: ${mismatchDetails}`,
      {
        context: { variableName, schemaPath, expected: mismatchDetails }
      }
    );
  }

  /**
   * Create error for reference errors
   */
  static referenceError(
    variableName: string,
    referencedVariable: string,
    reason: string
  ): VariableGenerationError {
    return new VariableGenerationError(
      "variable-reference-error",
      `Variable reference error in '${variableName}': cannot resolve '${referencedVariable}' - ${reason}`,
      {
        context: { 
          variableName, 
          variableValue: `{{${referencedVariable}}}`,
          expected: reason 
        }
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
      case "variable-missing-required":
        return `${base}\n\nProvide missing variables via --input, stdin, or configuration file`;
      case "variable-invalid-type":
        return `${base}\n\nCheck your input data format and ensure correct types`;
      case "variable-schema-mismatch":
        return `${base}\n\nRefer to schema at: ${this.context?.schemaPath}`;
      case "variable-merge-conflict":
        return `${base}\n\nSpecify priority or remove conflicting sources`;
      default:
        return base;
    }
  }

  /**
   * Check if error is recoverable
   */
  isRecoverable(): boolean {
    switch (this.kind) {
      case "variable-missing-required":
      case "variable-invalid-type":
      case "variable-validation-failed":
        // Can be recovered by providing correct data
        return true;
      case "variable-transformation-failed":
        // Depends on the specific transformation error
        return this.cause ? false : true;
      case "variable-merge-conflict":
        // Can be resolved by user intervention
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
      case "variable-missing-required":
        if (this.context?.missingVariables && Array.isArray(this.context.missingVariables)) {
          suggestions.push("Provide missing variables using one of:");
          suggestions.push("  - Command line: --var name=value");
          suggestions.push("  - Input file: --input data.json");
          suggestions.push("  - Configuration file");
          suggestions.push(`Missing: ${this.context.missingVariables.join(', ')}`);
        }
        break;
      case "variable-invalid-type":
        suggestions.push(`Convert '${this.context?.variableName}' to ${this.context?.expected}`);
        if (this.context?.expected === "array") {
          suggestions.push("Example: [\"item1\", \"item2\", \"item3\"]");
        } else if (this.context?.expected === "object") {
          suggestions.push('Example: {"key": "value"}');
        }
        break;
      case "variable-validation-failed":
        suggestions.push(`Check the value of '${this.context?.variableName}'`);
        suggestions.push("Ensure it meets validation requirements");
        break;
      case "variable-transformation-failed":
        suggestions.push("Check the transformation pipeline");
        suggestions.push(`Failed at step: ${this.context?.transformationStep}`);
        break;
      case "variable-merge-conflict":
        if (this.context?.conflictingVariables) {
          suggestions.push("Resolve conflicts by:");
          suggestions.push("  - Using explicit priority: CLI > stdin > config");
          suggestions.push("  - Removing duplicate sources");
          suggestions.push("  - Using different variable names");
        }
        break;
      case "variable-schema-mismatch":
        suggestions.push("Validate your data against the schema");
        suggestions.push(`Schema location: ${this.context?.schemaPath}`);
        break;
      case "variable-reference-error":
        suggestions.push(`Define the referenced variable: ${this.context?.variableValue}`);
        suggestions.push("Check for circular references");
        break;
    }

    return suggestions;
  }

  /**
   * Get example for fixing the error
   */
  getExample(): string | undefined {
    switch (this.kind) {
      case "variable-missing-required":
        if (this.context?.missingVariables && Array.isArray(this.context.missingVariables) && this.context.missingVariables.includes("projectName")) {
          return `breakdown to project --var projectName="MyProject"`;
        }
        break;
      case "variable-invalid-type":
        if (this.context?.expected === "array" && this.context?.variableName === "tasks") {
          return `{
  "tasks": ["task1", "task2", "task3"]
}`;
        }
        break;
      case "variable-merge-conflict":
        return `# Use explicit source priority
breakdown to project --input cli-data.json  # CLI takes precedence`;
    }
    return undefined;
  }
}