/**
 * Template Error Handler Module
 *
 * テンプレート不足時のエラーハンドリング強化
 *
 * @module
 */

/**
 * Template error types
 */
export enum TemplateErrorType {
  TEMPLATE_NOT_FOUND = "TEMPLATE_NOT_FOUND",
  TEMPLATE_INVALID = "TEMPLATE_INVALID",
  TEMPLATE_PERMISSION_DENIED = "TEMPLATE_PERMISSION_DENIED",
  TEMPLATE_GENERATION_FAILED = "TEMPLATE_GENERATION_FAILED",
  CONFIG_INVALID = "CONFIG_INVALID",
}

/**
 * Enhanced template error class
 */
export class TemplateError extends Error {
  public readonly errorType: TemplateErrorType;
  public readonly templatePath?: string;
  public readonly suggestions: string[];
  public readonly canAutoResolve: boolean;

  constructor(
    message: string,
    errorType: TemplateErrorType,
    options?: {
      templatePath?: string;
      suggestions?: string[];
      canAutoResolve?: boolean;
      cause?: Error;
    },
  ) {
    super(message);
    this.name = "TemplateError";
    this.errorType = errorType;
    this.templatePath = options?.templatePath;
    this.suggestions = options?.suggestions || [];
    this.canAutoResolve = options?.canAutoResolve || false;

    if (options?.cause) {
      this.cause = options.cause;
    }
  }

  /**
   * Get user-friendly error message with suggestions
   */
  getDetailedMessage(): string {
    let message = `❌ ${this.message}`;

    if (this.templatePath) {
      message += `\n   Template: ${this.templatePath}`;
    }

    if (this.suggestions.length > 0) {
      message += "\n\n💡 Suggestions:";
      for (const suggestion of this.suggestions) {
        message += `\n   - ${suggestion}`;
      }
    }

    if (this.canAutoResolve) {
      message += "\n\n🔧 Auto-resolution available: Run template generator script";
    }

    return message;
  }

  /**
   * Get recovery commands
   */
  getRecoveryCommands(): string[] {
    const commands: string[] = [];

    switch (this.errorType) {
      case TemplateErrorType.TEMPLATE_NOT_FOUND:
        commands.push("bash scripts/template_generator.sh generate");
        commands.push("bash examples/00_template_check.sh full");
        break;

      case TemplateErrorType.TEMPLATE_GENERATION_FAILED:
        commands.push("bash scripts/template_generator.sh check");
        commands.push("deno run --allow-read --allow-write lib/helpers/template_validator.ts");
        break;

      case TemplateErrorType.CONFIG_INVALID:
        commands.push("deno run -A cli/breakdown.ts init");
        commands.push("bash examples/00_template_check.sh full");
        break;

      default:
        commands.push("bash examples/00_template_check.sh check");
        break;
    }

    return commands;
  }
}

/**
 * Template error detector and handler
 */
export class TemplateErrorHandler {
  /**
   * Detect and classify template-related errors
   */
  static detectTemplateError(error: Error, context?: {
    templatePath?: string;
    operation?: string;
  }): TemplateError | null {
    const message = error.message.toLowerCase();
    const templatePath = context?.templatePath;

    // File not found errors
    if (
      message.includes("no such file") || message.includes("enoent") ||
      message.includes("not found")
    ) {
      return new TemplateError(
        `Template file not found: ${templatePath || "unknown"}`,
        TemplateErrorType.TEMPLATE_NOT_FOUND,
        {
          templatePath,
          suggestions: [
            "Run template generator to create missing templates",
            "Check if you're in the correct directory",
            "Verify template path configuration",
          ],
          canAutoResolve: true,
          cause: error,
        },
      );
    }

    // Permission errors
    if (message.includes("permission denied") || message.includes("eacces")) {
      return new TemplateError(
        `Permission denied accessing template: ${templatePath || "unknown"}`,
        TemplateErrorType.TEMPLATE_PERMISSION_DENIED,
        {
          templatePath,
          suggestions: [
            "Check file permissions",
            "Run with appropriate privileges",
            "Verify directory ownership",
          ],
          canAutoResolve: false,
          cause: error,
        },
      );
    }

    // Template validation errors
    if (
      message.includes("invalid template") || message.includes("malformed") ||
      message.includes("template validation") || message.includes("invalid syntax")
    ) {
      return new TemplateError(
        `Invalid template format: ${templatePath || "unknown"}`,
        TemplateErrorType.TEMPLATE_INVALID,
        {
          templatePath,
          suggestions: [
            "Check template syntax",
            "Regenerate template from source",
            "Validate template structure",
          ],
          canAutoResolve: true,
          cause: error,
        },
      );
    }

    return null;
  }

  /**
   * Handle template error with auto-resolution attempt
   */
  static async handleTemplateError(
    error: TemplateError,
    options?: {
      autoResolve?: boolean;
      projectRoot?: string;
    },
  ): Promise<{
    resolved: boolean;
    message: string;
    commands?: string[];
  }> {
    const { autoResolve = false, projectRoot = Deno.cwd() } = options || {};

    // Error information is passed through the error object itself
    // No logging needed in production

    if (!autoResolve || !error.canAutoResolve) {
      return {
        resolved: false,
        message: "Manual intervention required",
        commands: error.getRecoveryCommands(),
      };
    }

    // Attempt auto-resolution
    try {
      switch (error.errorType) {
        case TemplateErrorType.TEMPLATE_NOT_FOUND:
          return await this.autoGenerateTemplates(projectRoot);

        case TemplateErrorType.TEMPLATE_GENERATION_FAILED:
          return await this.validateAndFixTemplates(projectRoot);

        default:
          return {
            resolved: false,
            message: "Auto-resolution not implemented for this error type",
            commands: error.getRecoveryCommands(),
          };
      }
    } catch (resolutionError) {
      return {
        resolved: false,
        message: `Auto-resolution failed: ${
          resolutionError instanceof Error ? resolutionError.message : String(resolutionError)
        }`,
        commands: error.getRecoveryCommands(),
      };
    }
  }

  /**
   * Auto-generate missing templates
   */
  private static async autoGenerateTemplates(projectRoot: string): Promise<{
    resolved: boolean;
    message: string;
  }> {
    // Auto-generation status will be returned in the result

    const process = new Deno.Command("bash", {
      args: ["scripts/template_generator.sh", "generate"],
      cwd: projectRoot,
    });

    const result = await process.output();

    if (result.success) {
      return {
        resolved: true,
        message: "✅ Templates generated successfully",
      };
    } else {
      return {
        resolved: false,
        message: "❌ Template generation failed",
      };
    }
  }

  /**
   * Validate and fix template issues
   */
  private static async validateAndFixTemplates(projectRoot: string): Promise<{
    resolved: boolean;
    message: string;
  }> {
    // Validation status will be returned in the result

    const process = new Deno.Command("bash", {
      args: ["examples/00_template_check.sh", "full"],
      cwd: projectRoot,
    });

    const result = await process.output();

    if (result.success) {
      return {
        resolved: true,
        message: "✅ Template validation and fixes completed",
      };
    } else {
      return {
        resolved: false,
        message: "❌ Template validation failed",
      };
    }
  }
}

/**
 * Wrapper function for graceful template error handling
 */
export async function withTemplateErrorHandling<T>(
  operation: () => Promise<T>,
  context?: {
    templatePath?: string;
    operation?: string;
    autoResolve?: boolean;
  },
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    // Detect if this is a template-related error
    const templateError = TemplateErrorHandler.detectTemplateError(error, context);

    if (templateError) {
      // Handle template error with potential auto-resolution
      const result = await TemplateErrorHandler.handleTemplateError(templateError, {
        autoResolve: context?.autoResolve,
      });

      if (result.resolved) {
        // Recovery result is returned to caller
        // Retry the operation after resolution
        return await operation();
      } else {
        // Recovery commands are included in the thrown error
        // No logging needed in production
        throw templateError;
      }
    } else {
      // Not a template error, re-throw original
      throw error;
    }
  }
}
