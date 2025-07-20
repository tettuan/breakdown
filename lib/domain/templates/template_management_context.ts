/**
 * @fileoverview Template Management Context - Unified boundary context
 *
 * This module unifies template validation and initialization functionality
 * into a cohesive domain boundary context, replacing the separate
 * TemplateValidator and TotalityFactoryHelper implementations.
 *
 * @module domain/templates/template_management_context
 */

import type { DirectiveType as _DirectiveType, LayerType as _LayerType } from "../../types/mod.ts";
import type { Result } from "../../types/result.ts";
import { error, ok } from "../../types/result.ts";
import type { TemplateRepository } from "./template_repository.ts";
import type { SchemaRepository } from "./schema_repository.ts";
import {
  PromptGenerationAggregate,
  PromptTemplate as _PromptTemplate,
  TemplatePath,
} from "./prompt_generation_aggregate.ts";
import {
  Schema as _Schema,
  SchemaManagementAggregate,
  SchemaPath,
} from "./schema_management_aggregate.ts";
// BreakdownLogger は非テストファイルで使用禁止 (CLAUDE.md参照)

/**
 * Template registry entry
 */
export interface TemplateRegistryEntry {
  templatePath: TemplatePath;
  schemaPath?: SchemaPath;
  required: boolean;
  description?: string;
}

/**
 * Validation result with proper Result type integration
 */
export interface TemplateValidationSummary {
  readonly totalChecked: number;
  readonly missingTemplates: number;
  readonly missingSchemas: number;
  readonly invalidTemplates: number;
  readonly dependencyErrors: number;
}

/**
 * Validation result for templates
 */
export interface TemplateValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: TemplateValidationSummary;
}

/**
 * Totality-compliant validation result
 */
export type TotalityValidationResult = Result<
  {
    readonly warnings: readonly TemplateManagementWarning[];
    readonly summary: TemplateValidationSummary;
  },
  TemplateManagementError
>;

/**
 * Comprehensive validation error types following Totality principle
 */
export type TemplateManagementError =
  // Template errors
  | { readonly kind: "MissingTemplate"; readonly path: string; readonly required: boolean }
  | { readonly kind: "InvalidTemplate"; readonly path: string; readonly details: string }
  | { readonly kind: "TemplateLoadError"; readonly path: string; readonly cause: string }
  // Schema errors
  | { readonly kind: "MissingSchema"; readonly path: string; readonly required: boolean }
  | { readonly kind: "InvalidSchema"; readonly path: string; readonly details: string }
  | { readonly kind: "SchemaLoadError"; readonly path: string; readonly cause: string }
  // Dependency errors
  | { readonly kind: "DependencyError"; readonly path: string; readonly dependency: string }
  | {
    readonly kind: "CircularDependency";
    readonly path: string;
    readonly cycle: readonly string[];
  }
  // System errors
  | { readonly kind: "RepositoryError"; readonly operation: string; readonly cause: string }
  | { readonly kind: "InitializationError"; readonly component: string; readonly cause: string };

/**
 * Validation warning types
 */
export type TemplateManagementWarning =
  | { readonly kind: "OptionalMissing"; readonly path: string; readonly description?: string }
  | {
    readonly kind: "VersionMismatch";
    readonly path: string;
    readonly expected: string;
    readonly actual: string;
  }
  | { readonly kind: "Deprecated"; readonly path: string; readonly replacement?: string }
  | { readonly kind: "PerformanceWarning"; readonly path: string; readonly issue: string };

/**
 * Legacy compatibility types (for gradual migration)
 */
export interface ValidationError {
  type: "missing_template" | "missing_schema" | "invalid_template" | "dependency_error";
  path: string;
  message: string;
}

export interface ValidationWarning {
  type: "optional_missing" | "version_mismatch" | "deprecated";
  path: string;
  message: string;
}

/**
 * Initialization options
 */
export interface InitializationOptions {
  validateOnly?: boolean;
  copyMissing?: boolean;
  updateExisting?: boolean;
  sourcePath?: string;
}

/**
 * Initialization result with proper error typing
 */
export interface InitializationSummary {
  readonly templates: readonly string[];
  readonly schemas: readonly string[];
}

export interface InitializationFailures {
  readonly templates: readonly { readonly path: string; readonly error: TemplateManagementError }[];
  readonly schemas: readonly { readonly path: string; readonly error: TemplateManagementError }[];
}

/**
 * Legacy initialization result (for gradual migration)
 */
export interface InitializationResult {
  success: boolean;
  initialized: {
    templates: string[];
    schemas: string[];
  };
  failed: {
    templates: Array<{ path: string; error: string }>;
    schemas: Array<{ path: string; error: string }>;
  };
  validation: TemplateValidationResult;
}

/**
 * Totality-compliant initialization result
 */
export type TotalityInitializationResult = Result<
  {
    readonly initialized: InitializationSummary;
    readonly warnings: readonly TemplateManagementWarning[];
    readonly validation: TotalityValidationResult;
  },
  {
    readonly failed: InitializationFailures;
    readonly validationErrors: readonly TemplateManagementError[];
  }
>;

/**
 * Template registry - manages template and schema relationships
 */
export class TemplateRegistry {
  private readonly entries: Map<string, TemplateRegistryEntry>;
  // loggerはテストファイルでのみ使用可能 (CLAUDE.md参照)

  constructor() {
    this.entries = new Map();
    // BreakdownLoggerの初期化を削除
  }

  /**
   * Register a template with optional schema
   */
  register(entry: TemplateRegistryEntry): void {
    const key = entry.templatePath.getPath();
    this.entries.set(key, entry);
    // テンプレート登録ログは削除
  }

  /**
   * Get all entries
   */
  getEntries(): TemplateRegistryEntry[] {
    return Array.from(this.entries.values());
  }

  /**
   * Get required entries
   */
  getRequiredEntries(): TemplateRegistryEntry[] {
    return this.getEntries().filter((e) => e.required);
  }

  /**
   * Find entry by template path
   */
  findByTemplate(path: TemplatePath): TemplateRegistryEntry | undefined {
    return this.entries.get(path.getPath());
  }

  /**
   * Load default registry with proper error handling
   */
  static createDefault(): Result<TemplateRegistry, TemplateManagementError> {
    try {
      const registry = new TemplateRegistry();

      // Register default templates with proper type safety
      const defaults = [
        { directive: "summary", layer: "issue", filename: "f_issue.md", required: true },
        { directive: "summary", layer: "project", filename: "f_project.md", required: true },
        { directive: "defect", layer: "issue", filename: "f_issue.md", required: true },
        { directive: "find", layer: "bugs", filename: "f_bugs.md", required: true },
        { directive: "to", layer: "task", filename: "f_task.md", required: true },
        { directive: "to", layer: "issue", filename: "f_issue.md", required: true },
        { directive: "to", layer: "project", filename: "f_project.md", required: true },
      ];

      // Register each template with proper error handling
      // Note: In a full implementation, would need to properly construct DirectiveType and LayerType
      // For now, using string-based registration until type factory is available
      for (const item of defaults) {
        // Simplified path creation without DirectiveType/LayerType validation
        // TODO: Integrate with TypeFactory for proper type construction
        const pathString = `templates/${item.directive}/${item.layer}/${item.filename}`;

        // For now, create a simplified entry without full type validation
        // This would be replaced with proper DirectiveType/LayerType construction
        registry.register({
          templatePath: { getPath: () => pathString } as TemplatePath,
          required: item.required,
          description: `Default ${item.directive} template for ${item.layer} layer`,
        });
      }

      return ok(registry);
    } catch (caught) {
      const errorMessage = caught instanceof Error ? caught.message : String(caught);
      return error({
        kind: "InitializationError",
        component: "TemplateRegistry",
        cause: errorMessage,
      });
    }
  }
}

/**
 * Validation policy domain service
 */
export class ValidationPolicy {
  constructor(
    private readonly templateRepo: TemplateRepository,
    private readonly schemaRepo: SchemaRepository,
    // loggerパラメータを削除
  ) {}

  /**
   * Extract error message with type safety
   */
  private extractErrorMessage(caught: unknown): string {
    if (caught instanceof Error) {
      return caught.message;
    }
    if (typeof caught === "string") {
      return caught;
    }
    if (caught && typeof caught === "object" && "message" in caught) {
      return String((caught as { message: unknown }).message);
    }
    return "Unknown error occurred";
  }

  /**
   * Create standardized template management error
   */
  private createTemplateError(
    kind: TemplateManagementError["kind"],
    path: string,
    details: string,
  ): TemplateManagementError {
    switch (kind) {
      case "MissingTemplate":
        return { kind: "MissingTemplate", path, required: true };
      case "InvalidTemplate":
        return { kind: "InvalidTemplate", path, details };
      case "TemplateLoadError":
        return { kind: "TemplateLoadError", path, cause: details };
      case "MissingSchema":
        return { kind: "MissingSchema", path, required: true };
      case "InvalidSchema":
        return { kind: "InvalidSchema", path, details };
      case "SchemaLoadError":
        return { kind: "SchemaLoadError", path, cause: details };
      default:
        return { kind: "RepositoryError", operation: "unknown", cause: details };
    }
  }

  /**
   * Validate templates against registry
   */
  async validateTemplates(registry: TemplateRegistry): Promise<TemplateValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const summary = {
      totalChecked: 0,
      missingTemplates: 0,
      missingSchemas: 0,
      invalidTemplates: 0,
      dependencyErrors: 0,
    };

    for (const entry of registry.getEntries()) {
      summary.totalChecked++;

      // Check template exists
      const templateExists = await this.templateRepo.exists(entry.templatePath);
      if (!templateExists) {
        if (entry.required) {
          errors.push({
            type: "missing_template",
            path: entry.templatePath.getPath(),
            message: `Required template not found: ${entry.templatePath.getPath()}`,
          });
          summary.missingTemplates++;
        } else {
          warnings.push({
            type: "optional_missing",
            path: entry.templatePath.getPath(),
            message: `Optional template not found: ${entry.templatePath.getPath()}`,
          });
        }
      } else {
        // Validate template content
        try {
          const _template = await this.templateRepo.loadTemplate(entry.templatePath);
          // Additional validation logic here
        } catch (caught) {
          const errorMessage = this.extractErrorMessage(caught);
          errors.push({
            type: "invalid_template",
            path: entry.templatePath.getPath(),
            message: `Invalid template: ${errorMessage}`,
          });
          summary.invalidTemplates++;
        }
      }

      // Check associated schema if defined
      if (entry.schemaPath) {
        const schemaExists = await this.schemaRepo.exists(entry.schemaPath);
        if (!schemaExists && entry.required) {
          errors.push({
            type: "missing_schema",
            path: entry.schemaPath.getPath(),
            message: `Required schema not found: ${entry.schemaPath.getPath()}`,
          });
          summary.missingSchemas++;
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary,
    };
  }

  /**
   * Validate dependencies between templates and schemas
   */
  async validateDependencies(): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    // Check schema dependencies
    const schemaManifest = await this.schemaRepo.listAvailable();
    for (const schemaEntry of schemaManifest.schemas) {
      if (schemaEntry.dependencies) {
        for (const dep of schemaEntry.dependencies) {
          // Check if dependency exists
          // Simplified - would need proper path parsing in real implementation
          const exists = schemaManifest.schemas.some((s) => s.path === dep);
          if (!exists) {
            errors.push({
              type: "dependency_error",
              path: schemaEntry.path,
              message: `Schema dependency not found: ${dep}`,
            });
          }
        }
      }
    }

    return errors;
  }
}

/**
 * Initialization service
 */
export class InitializationService {
  constructor(
    private readonly templateRepo: TemplateRepository,
    private readonly schemaRepo: SchemaRepository,
    private readonly validationPolicy: ValidationPolicy,
    // loggerパラメータを削除
  ) {}

  /**
   * Extract error message with type safety
   */
  private extractErrorMessage(caught: unknown): string {
    if (caught instanceof Error) {
      return caught.message;
    }
    if (typeof caught === "string") {
      return caught;
    }
    if (caught && typeof caught === "object" && "message" in caught) {
      return String((caught as { message: unknown }).message);
    }
    return "Unknown error occurred";
  }

  /**
   * Initialize templates and schemas
   */
  async initialize(
    registry: TemplateRegistry,
    options: InitializationOptions = {},
  ): Promise<InitializationResult> {
    const result: InitializationResult = {
      success: false,
      initialized: { templates: [], schemas: [] },
      failed: { templates: [], schemas: [] },
      validation: await this.validationPolicy.validateTemplates(registry),
    };

    if (options.validateOnly) {
      result.success = result.validation.valid;
      return result;
    }

    // Copy missing templates if requested
    if (options.copyMissing && options.sourcePath) {
      await this.copyMissingTemplates(registry, options.sourcePath, result);
    }

    // Re-validate after copying
    result.validation = await this.validationPolicy.validateTemplates(registry);
    result.success = result.validation.valid;

    return result;
  }

  private async copyMissingTemplates(
    registry: TemplateRegistry,
    _sourcePath: string,
    result: InitializationResult,
  ): Promise<void> {
    for (const entry of registry.getRequiredEntries()) {
      try {
        const exists = await this.templateRepo.exists(entry.templatePath);
        if (!exists) {
          // Copy from source
          // Implementation would load from source and save to repository
          // テンプレートコピーログは削除
          result.initialized.templates.push(entry.templatePath.getPath());
        }
      } catch (caught) {
        const errorMessage = this.extractErrorMessage(caught);
        result.failed.templates.push({
          path: entry.templatePath.getPath(),
          error: errorMessage,
        });
      }
    }
  }
}

/**
 * Template management context - unified boundary
 */
export class TemplateManagementContext {
  private readonly promptAggregates: Map<string, PromptGenerationAggregate>;
  private readonly schemaAggregate: SchemaManagementAggregate;

  constructor(
    private readonly templateRepo: TemplateRepository,
    private readonly schemaRepo: SchemaRepository,
    private readonly registry: TemplateRegistry,
    // loggerパラメータを削除
  ) {
    this.promptAggregates = new Map();
    const schemaAggregateResult = SchemaManagementAggregate.create("schema-management");
    if (!schemaAggregateResult.ok) {
      throw new Error(`Failed to create schema aggregate: ${schemaAggregateResult.error}`);
    }
    this.schemaAggregate = schemaAggregateResult.data;
  }

  /**
   * Create default context with proper error handling
   */
  static create(
    templateRepo: TemplateRepository,
    schemaRepo: SchemaRepository,
  ): Result<TemplateManagementContext, TemplateManagementError> {
    try {
      // BreakdownLoggerの初期化を削除
      const registryResult = TemplateRegistry.createDefault();

      if (!registryResult.ok) {
        return error(registryResult.error);
      }

      const context = new TemplateManagementContext(
        templateRepo,
        schemaRepo,
        registryResult.data,
        // loggerパラメータを削除
      );

      return ok(context);
    } catch (caught) {
      const errorMessage = caught instanceof Error ? caught.message : String(caught);
      return error({
        kind: "InitializationError",
        component: "TemplateManagementContext",
        cause: errorMessage,
      });
    }
  }

  /**
   * Get validation policy
   */
  getValidationPolicy(): ValidationPolicy {
    return new ValidationPolicy(this.templateRepo, this.schemaRepo);
  }

  /**
   * Get initialization service
   */
  getInitializationService(): InitializationService {
    return new InitializationService(
      this.templateRepo,
      this.schemaRepo,
      this.getValidationPolicy(),
      // loggerパラメータを削除
    );
  }

  /**
   * Get template registry
   */
  getRegistry(): TemplateRegistry {
    return this.registry;
  }

  /**
   * Pre-flight check for template availability
   */
  async preflightCheck(): Promise<{
    ready: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    const validation = await this.getValidationPolicy().validateTemplates(this.registry);

    if (!validation.valid) {
      issues.push(`Found ${validation.errors.length} validation errors`);
      for (const error of validation.errors) {
        issues.push(`  - ${error.message}`);
      }

      if (validation.summary.missingTemplates > 0) {
        recommendations.push("Initialize missing templates with initialization service");
      }
    }

    if (validation.warnings.length > 0) {
      for (const warning of validation.warnings) {
        recommendations.push(`Warning: ${warning.message}`);
      }
    }

    const dependencyErrors = await this.getValidationPolicy().validateDependencies();
    if (dependencyErrors.length > 0) {
      issues.push(`Found ${dependencyErrors.length} dependency errors`);
      recommendations.push("Resolve schema dependencies before proceeding");
    }

    return {
      ready: issues.length === 0,
      issues,
      recommendations,
    };
  }
}
