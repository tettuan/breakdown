/**
 * @fileoverview Template Resolver Service - Domain service for template resolution
 *
 * This service handles the complex logic of resolving templates and schemas
 * based on various criteria, including fallback strategies and compatibility checking.
 *
 * @module domain/templates/template_resolver_service
 */

import type { DirectiveType, LayerType } from "../../types/mod.ts";
import type { Result } from "../../types/result.ts";
import { ok, error } from "../../types/result.ts";
import type { TemplateRepository } from "./template_repository.ts";
import type { SchemaRepository } from "./schema_repository.ts";
import { PromptTemplate, TemplatePath } from "./prompt_generation_aggregate.ts";
import { Schema, SchemaPath } from "./schema_management_aggregate.ts";
import { SchemaId as _SchemaId, TemplateId as _TemplateId, TemplateVersion } from "./template_value_objects.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

/**
 * Resolution request
 */
export interface TemplateResolutionRequest {
  directive: DirectiveType;
  layer: LayerType;
  options: {
    version?: string;
    language?: string;
    customPath?: string;
    fallbackEnabled?: boolean;
    strict?: boolean;
  };
}

/**
 * Resolution success result
 */
export interface TemplateResolutionSuccess {
  template: PromptTemplate;
  schema?: Schema;
  resolvedPath: TemplatePath;
  schemaPath?: SchemaPath;
  fallbackUsed?: boolean;
  warnings?: string[];
}

/**
 * Resolution error
 */
export interface TemplateResolutionError {
  type: ResolutionErrorType;
  message: string;
  details?: unknown;
}

/**
 * Resolution result using Result type for Totality principle
 */
export type TemplateResolutionResult = Result<TemplateResolutionSuccess, TemplateResolutionError>;

/**
 * Resolution error types
 */
export type ResolutionErrorType =
  | "template_not_found"
  | "schema_not_found"
  | "version_conflict"
  | "invalid_path"
  | "dependency_error"
  | "validation_failed";

/**
 * Resolution strategy interface
 */
export interface ResolutionStrategy {
  /**
   * Priority of this strategy (higher = tried first)
   */
  getPriority(): number;

  /**
   * Check if this strategy can handle the request
   */
  canHandle(request: TemplateResolutionRequest): boolean;

  /**
   * Resolve template using this strategy
   */
  resolve(
    request: TemplateResolutionRequest,
    templateRepo: TemplateRepository,
    schemaRepo: SchemaRepository,
  ): Promise<TemplateResolutionResult>;
}

/**
 * Exact path resolution strategy
 */
export class ExactPathStrategy implements ResolutionStrategy {
  getPriority(): number {
    return 100; // Highest priority
  }

  canHandle(request: TemplateResolutionRequest): boolean {
    return !!request.options.customPath;
  }

  async resolve(
    request: TemplateResolutionRequest,
    templateRepo: TemplateRepository,
    schemaRepo: SchemaRepository,
  ): Promise<TemplateResolutionResult> {
    const customPath = request.options.customPath!;

    try {
      // Parse custom path
      const parts = customPath.split("/");
      if (parts.length < 3) {
        return error({
          type: "invalid_path",
          message: `Invalid custom path format: ${customPath}`,
        });
      }

      const filename = parts[parts.length - 1];
      const templatePathResult = TemplatePath.create(request.directive, request.layer, filename);
      if (!templatePathResult.ok) {
        return error({
          type: "invalid_path",
          message: `Failed to create template path: ${templatePathResult.error}`,
        });
      }

      const templatePath = templatePathResult.data;
      // Check if template exists
      const exists = await templateRepo.exists(templatePath);
      if (!exists) {
        return error({
          type: "template_not_found",
          message: `Template not found at custom path: ${customPath}`,
        });
      }

      // Load template
      const template = await templateRepo.loadTemplate(templatePath);

      // Try to load associated schema
      let schema: Schema | undefined;
      try {
        const schemaFilename = filename.replace(".md", ".json");
        const schemaPathResult = SchemaPath.create(request.directive, request.layer, schemaFilename);
        if (schemaPathResult.ok) {
          const schemaPath = schemaPathResult.data;
          const schemaExists = await schemaRepo.exists(schemaPath);
          if (schemaExists) {
            schema = await schemaRepo.loadSchema(schemaPath);
          }
        }
      } catch {
        // Schema loading is optional for custom paths
      }

      return ok({
        template,
        schema,
        resolvedPath: templatePath,
        schemaPath: schema?.getPath(),
      });
    } catch (catchError) {
      return error({
        type: "validation_failed",
        message: `Failed to resolve custom path: ${
          catchError instanceof Error ? catchError.message : String(catchError)
        }`,
        details: catchError,
      });
    }
  }
}

/**
 * Standard naming convention strategy
 */
export class StandardNamingStrategy implements ResolutionStrategy {
  private readonly defaultPrefix: string;

  constructor(defaultPrefix = "f_") {
    this.defaultPrefix = defaultPrefix;
  }

  getPriority(): number {
    return 80; // High priority
  }

  canHandle(_request: TemplateResolutionRequest): boolean {
    return true; // Can always handle standard naming
  }

  async resolve(
    request: TemplateResolutionRequest,
    templateRepo: TemplateRepository,
    schemaRepo: SchemaRepository,
  ): Promise<TemplateResolutionResult> {
    const warnings: string[] = [];

    try {
      // Build standard filename
      const filename = `${this.defaultPrefix}${request.layer.getValue()}.md`;
      const templatePathResult = TemplatePath.create(request.directive, request.layer, filename);
      if (!templatePathResult.ok) {
        return error({
          type: "invalid_path",
          message: `Failed to create template path: ${templatePathResult.error}`,
        });
      }

      const templatePath = templatePathResult.data;
      // Check if template exists
      const exists = await templateRepo.exists(templatePath);
      if (!exists) {
        return error({
          type: "template_not_found",
          message: `Standard template not found: ${templatePath.getPath()}`,
        });
      }

      // Load template
      const template = await templateRepo.loadTemplate(templatePath);

      // Check version compatibility if requested
      if (request.options.version) {
        const requestedVersion = TemplateVersion.create(request.options.version);
        const templateVersion = TemplateVersion.create(
          template.getMetadata().version || "1.0.0",
        );

        if (!templateVersion.isCompatibleWith(requestedVersion)) {
          warnings.push(
            `Version mismatch: requested ${requestedVersion}, found ${templateVersion}`,
          );
        }
      }

      // Load associated schema
      let schema: Schema | undefined;
      let schemaPath: SchemaPath | undefined;
      try {
        const schemaFilename = filename.replace(".md", ".json");
        const schemaPathResult = SchemaPath.create(request.directive, request.layer, schemaFilename);
        if (schemaPathResult.ok) {
          schemaPath = schemaPathResult.data;
          const schemaExists = await schemaRepo.exists(schemaPath);
          if (schemaExists) {
            schema = await schemaRepo.loadSchema(schemaPath);
          } else if (request.options.strict) {
            return error({
              type: "schema_not_found",
              message: `Required schema not found: ${schemaPath.getPath()}`,
            });
          }
        } else if (request.options.strict) {
          return error({
            type: "schema_not_found",
            message: `Failed to create schema path: ${schemaPathResult.error}`,
          });
        }
      } catch (schemaError) {
        if (request.options.strict) {
          return error({
            type: "schema_not_found",
            message: `Failed to load schema: ${
              schemaError instanceof Error ? schemaError.message : String(schemaError)
            }`,
            details: schemaError,
          });
        }
        warnings.push(
          `Schema loading failed: ${schemaError instanceof Error ? schemaError.message : String(schemaError)}`,
        );
      }

      return ok({
        template,
        schema,
        resolvedPath: templatePath,
        schemaPath,
        warnings: warnings.length > 0 ? warnings : undefined,
      });
    } catch (catchError) {
      return error({
        type: "validation_failed",
        message: `Standard resolution failed: ${
          catchError instanceof Error ? catchError.message : String(catchError)
        }`,
        details: catchError,
      });
    }
  }
}

/**
 * Fallback resolution strategy
 */
export class FallbackStrategy implements ResolutionStrategy {
  private readonly fallbackMappings: Map<string, string>;

  constructor(fallbackMappings?: Map<string, string>) {
    this.fallbackMappings = fallbackMappings || this.createDefaultMappings();
  }

  private createDefaultMappings(): Map<string, string> {
    return new Map([
      ["defect/project", "f_project.md"],
      ["defect/issue", "f_issue.md"],
      ["defect/task", "f_task.md"],
      ["summary/project", "f_project.md"],
      ["summary/issue", "f_issue.md"],
      ["summary/task", "f_task.md"],
      ["to/project", "f_project.md"],
      ["to/issue", "f_issue.md"],
      ["to/task", "f_task.md"],
      ["find/bugs", "f_bugs.md"],
    ]);
  }

  getPriority(): number {
    return 50; // Medium priority
  }

  canHandle(request: TemplateResolutionRequest): boolean {
    return request.options.fallbackEnabled ?? true;
  }

  async resolve(
    request: TemplateResolutionRequest,
    templateRepo: TemplateRepository,
    schemaRepo: SchemaRepository,
  ): Promise<TemplateResolutionResult> {
    const key = `${request.directive.getValue()}/${request.layer.getValue()}`;
    const fallbackFilename = this.fallbackMappings.get(key);

    if (!fallbackFilename) {
      return error({
        type: "template_not_found",
        message: `No fallback mapping found for: ${key}`,
      });
    }

    try {
      const templatePathResult = TemplatePath.create(request.directive, request.layer, fallbackFilename);
      if (!templatePathResult.ok) {
        return error({
          type: "invalid_path",
          message: `Failed to create template path: ${templatePathResult.error}`,
        });
      }

      const templatePath = templatePathResult.data;

      // Check if fallback template exists
      const exists = await templateRepo.exists(templatePath);
      if (!exists) {
        return error({
          type: "template_not_found",
          message: `Fallback template not found: ${templatePath.getPath()}`,
        });
      }

      // Load template
      const template = await templateRepo.loadTemplate(templatePath);

      // Try to load schema (optional for fallback)
      let schema: Schema | undefined;
      let schemaPath: SchemaPath | undefined;
      try {
        const schemaFilename = fallbackFilename.replace(".md", ".json");
        const schemaPathResult = SchemaPath.create(request.directive, request.layer, schemaFilename);
        if (schemaPathResult.ok) {
          schemaPath = schemaPathResult.data;
          const schemaExists = await schemaRepo.exists(schemaPath);
          if (schemaExists) {
            schema = await schemaRepo.loadSchema(schemaPath);
          }
        }
      } catch {
        // Ignore schema loading errors for fallback
      }

      return ok({
        template,
        schema,
        resolvedPath: templatePath,
        schemaPath,
        fallbackUsed: true,
        warnings: [`Used fallback template: ${fallbackFilename}`],
      });
    } catch (catchError) {
      return error({
        type: "validation_failed",
        message: `Fallback resolution failed: ${
          catchError instanceof Error ? catchError.message : String(catchError)
        }`,
        details: catchError,
      });
    }
  }
}

/**
 * Template resolver service
 */
export class TemplateResolverService {
  private readonly strategies: ResolutionStrategy[];
  private readonly logger: BreakdownLogger;

  constructor(
    private readonly templateRepo: TemplateRepository,
    private readonly schemaRepo: SchemaRepository,
    strategies?: ResolutionStrategy[],
  ) {
    this.logger = new BreakdownLogger("template-resolver-service");
    this.strategies = strategies || this.createDefaultStrategies();

    // Sort strategies by priority (highest first)
    this.strategies.sort((a, b) => b.getPriority() - a.getPriority());
  }

  private createDefaultStrategies(): ResolutionStrategy[] {
    return [
      new ExactPathStrategy(),
      new StandardNamingStrategy(),
      new FallbackStrategy(),
    ];
  }

  /**
   * Resolve template and schema for given request
   */
  async resolve(request: TemplateResolutionRequest): Promise<TemplateResolutionResult> {
    this.logger.debug("Starting template resolution", {
      directive: request.directive.getValue(),
      layer: request.layer.getValue(),
      options: request.options,
    });

    const errors: string[] = [];

    // Try each strategy in order of priority
    for (const strategy of this.strategies) {
      if (!strategy.canHandle(request)) {
        continue;
      }

      try {
        this.logger.debug("Trying resolution strategy", {
          strategy: strategy.constructor.name,
          priority: strategy.getPriority(),
        });

        const result = await strategy.resolve(request, this.templateRepo, this.schemaRepo);

        if (result.ok) {
          this.logger.info("Template resolved successfully", {
            strategy: strategy.constructor.name,
            templatePath: result.data.resolvedPath.getPath(),
            schemaPath: result.data.schemaPath?.getPath(),
            fallbackUsed: result.data.fallbackUsed,
          });
          return result;
        } else {
          errors.push(`${strategy.constructor.name}: ${result.error.message}`);
        }
      } catch (catchError) {
        const errorMessage = catchError instanceof Error ? catchError.message : String(catchError);
        errors.push(`${strategy.constructor.name}: ${errorMessage}`);
        this.logger.error("Strategy failed", {
          strategy: strategy.constructor.name,
          error: errorMessage,
        });
      }
    }

    // All strategies failed
    this.logger.error("All resolution strategies failed", { errors });
    return error({
      type: "template_not_found",
      message: `Failed to resolve template: ${errors.join("; ")}`,
      details: errors,
    });
  }

  /**
   * Check if template exists without loading it
   */
  async exists(
    directive: DirectiveType,
    layer: LayerType,
    options: { customPath?: string } = {},
  ): Promise<boolean> {
    try {
      if (options.customPath) {
        const parts = options.customPath.split("/");
        const filename = parts[parts.length - 1];
        const templatePathResult = TemplatePath.create(directive, layer, filename);
        if (!templatePathResult.ok) return false;
        return await this.templateRepo.exists(templatePathResult.data);
      } else {
        const filename = `f_${layer.getValue()}.md`;
        const templatePathResult = TemplatePath.create(directive, layer, filename);
        if (!templatePathResult.ok) return false;
        return await this.templateRepo.exists(templatePathResult.data);
      }
    } catch {
      return false;
    }
  }

  /**
   * List available templates for directive/layer combination
   */
  async listAvailable(directive?: DirectiveType, layer?: LayerType) {
    const templateManifest = await this.templateRepo.listAvailable({
      directive,
      layer,
    });

    const schemaManifest = await this.schemaRepo.listAvailable({
      directive,
      layer,
    });

    return {
      templates: templateManifest,
      schemas: schemaManifest,
    };
  }

  /**
   * Add custom resolution strategy
   */
  addStrategy(strategy: ResolutionStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => b.getPriority() - a.getPriority());
  }

  /**
   * Remove resolution strategy
   */
  removeStrategy(strategyClass: new (...args: unknown[]) => ResolutionStrategy): void {
    const index = this.strategies.findIndex((s) => s instanceof strategyClass);
    if (index >= 0) {
      this.strategies.splice(index, 1);
    }
  }
}
