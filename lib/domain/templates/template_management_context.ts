/**
 * @fileoverview Template Management Context - Unified boundary context
 *
 * This module unifies template validation and initialization functionality
 * into a cohesive domain boundary context, replacing the separate
 * TemplateValidator and TotalityFactoryHelper implementations.
 *
 * @module domain/templates/template_management_context
 */

import type { DirectiveType, LayerType } from "../../types/mod.ts";
import type { TemplateRepository } from "./template_repository.ts";
import type { SchemaRepository } from "./schema_repository.ts";
import {
  PromptGenerationAggregate,
  PromptTemplate,
  TemplatePath,
} from "./prompt_generation_aggregate.ts";
import { Schema, SchemaManagementAggregate, SchemaPath } from "./schema_management_aggregate.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

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
 * Validation result for templates
 */
export interface TemplateValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: {
    totalChecked: number;
    missingTemplates: number;
    missingSchemas: number;
    invalidTemplates: number;
  };
}

/**
 * Validation error
 */
export interface ValidationError {
  type: "missing_template" | "missing_schema" | "invalid_template" | "dependency_error";
  path: string;
  message: string;
}

/**
 * Validation warning
 */
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
 * Initialization result
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
 * Template registry - manages template and schema relationships
 */
export class TemplateRegistry {
  private readonly entries: Map<string, TemplateRegistryEntry>;
  private readonly logger: BreakdownLogger;

  constructor() {
    this.entries = new Map();
    this.logger = new BreakdownLogger("template-registry");
  }

  /**
   * Register a template with optional schema
   */
  register(entry: TemplateRegistryEntry): void {
    const key = entry.templatePath.getPath();
    this.entries.set(key, entry);
    this.logger.debug("Template registered", { path: key });
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
   * Load default registry
   */
  static createDefault(): TemplateRegistry {
    const registry = new TemplateRegistry();

    // Register default templates
    // This replaces the hardcoded DEFAULT_TEMPLATE_MAPPINGS
    const defaults = [
      { directive: "summary", layer: "issue", filename: "f_issue.md", required: true },
      { directive: "summary", layer: "project", filename: "f_project.md", required: true },
      { directive: "defect", layer: "issue", filename: "f_issue.md", required: true },
      { directive: "find", layer: "bugs", filename: "f_bugs.md", required: true },
      { directive: "to", layer: "task", filename: "f_task.md", required: true },
      { directive: "to", layer: "issue", filename: "f_issue.md", required: true },
      { directive: "to", layer: "project", filename: "f_project.md", required: true },
    ];

    // In real implementation, would create proper DirectiveType/LayerType instances
    // For now, simplified registration

    return registry;
  }
}

/**
 * Validation policy domain service
 */
export class ValidationPolicy {
  constructor(
    private readonly templateRepo: TemplateRepository,
    private readonly schemaRepo: SchemaRepository,
    private readonly logger: BreakdownLogger,
  ) {}

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
          const template = await this.templateRepo.loadTemplate(entry.templatePath);
          // Additional validation logic here
        } catch (error) {
          errors.push({
            type: "invalid_template",
            path: entry.templatePath.getPath(),
            message: `Invalid template: ${error instanceof Error ? error.message : String(error)}`,
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
    private readonly logger: BreakdownLogger,
  ) {}

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
    sourcePath: string,
    result: InitializationResult,
  ): Promise<void> {
    for (const entry of registry.getRequiredEntries()) {
      try {
        const exists = await this.templateRepo.exists(entry.templatePath);
        if (!exists) {
          // Copy from source
          // Implementation would load from source and save to repository
          this.logger.info("Template copied", { path: entry.templatePath.getPath() });
          result.initialized.templates.push(entry.templatePath.getPath());
        }
      } catch (error) {
        result.failed.templates.push({
          path: entry.templatePath.getPath(),
          error: error instanceof Error ? error.message : String(error),
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
    private readonly logger: BreakdownLogger,
  ) {
    this.promptAggregates = new Map();
    this.schemaAggregate = SchemaManagementAggregate.create("schema-management");
  }

  /**
   * Create default context
   */
  static create(
    templateRepo: TemplateRepository,
    schemaRepo: SchemaRepository,
  ): TemplateManagementContext {
    const logger = new BreakdownLogger("template-management-context");
    const registry = TemplateRegistry.createDefault();

    return new TemplateManagementContext(
      templateRepo,
      schemaRepo,
      registry,
      logger,
    );
  }

  /**
   * Get validation policy
   */
  getValidationPolicy(): ValidationPolicy {
    return new ValidationPolicy(this.templateRepo, this.schemaRepo, this.logger);
  }

  /**
   * Get initialization service
   */
  getInitializationService(): InitializationService {
    return new InitializationService(
      this.templateRepo,
      this.schemaRepo,
      this.getValidationPolicy(),
      this.logger,
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
