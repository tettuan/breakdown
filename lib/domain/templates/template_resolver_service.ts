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
import { error, ok } from "../../types/result.ts";
import type { TemplateRepository } from "./template_repository.ts";
import type { SchemaRepository } from "./schema_repository.ts";
import { type PromptTemplate, TemplatePath } from "./prompt_generation_aggregate.ts";
import { type Schema, SchemaPath } from "./schema_management_aggregate.ts";
import {
  type SchemaId as _SchemaId,
  type TemplateId as _TemplateId,
  TemplateVersion,
} from "./template_value_objects.ts";
import type { BreakdownConfig } from "@tettuan/breakdownconfig";

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
        const schemaPathResult = SchemaPath.create(
          request.directive,
          request.layer,
          schemaFilename,
        );
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
  private readonly config?: BreakdownConfig;

  constructor(config?: BreakdownConfig) {
    this.config = config;
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
      const defaultPrefix = this.getDefaultPrefix();
      const filename = `${defaultPrefix}${request.layer.value}.md`;
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
        const schemaPathResult = SchemaPath.create(
          request.directive,
          request.layer,
          schemaFilename,
        );
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
          `Schema loading failed: ${
            schemaError instanceof Error ? schemaError.message : String(schemaError)
          }`,
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

  /**
   * Get default prefix from BreakdownConfig (for StandardNamingStrategy)
   */
  private getDefaultPrefix(): string {
    // Return default value directly (integration with config will be improved later)
    return "f_";
  }
}

/**
 * Template resolver service
 */
export class TemplateResolverService {
  private readonly strategies: ResolutionStrategy[];
  constructor(
    private readonly templateRepo: TemplateRepository,
    private readonly schemaRepo: SchemaRepository,
    private readonly config?: BreakdownConfig,
    strategies?: ResolutionStrategy[],
  ) {
    this.strategies = strategies || this.createDefaultStrategies();

    // Sort strategies by priority (highest first)
    this.strategies.sort((a, b) => b.getPriority() - a.getPriority());
  }

  private createDefaultStrategies(): ResolutionStrategy[] {
    return [
      new ExactPathStrategy(),
      new StandardNamingStrategy(this.config),
    ];
  }

  /**
   * Resolve template and schema for given request
   */
  async resolve(request: TemplateResolutionRequest): Promise<TemplateResolutionResult> {
    // Filter strategies that can handle this request, preserving priority order
    const applicableStrategies = this.strategies.filter((strategy) => strategy.canHandle(request));

    if (applicableStrategies.length === 0) {
      return error({
        type: "template_not_found",
        message: "No applicable resolution strategies found",
        details: [],
      });
    }

    // Execute all applicable strategies in parallel
    const resultsWithStrategy = await Promise.all(
      applicableStrategies.map(async (strategy) => {
        try {
          const result = await strategy.resolve(request, this.templateRepo, this.schemaRepo);
          return { strategy, result, error: null };
        } catch (catchError) {
          const errorMessage = catchError instanceof Error
            ? catchError.message
            : String(catchError);
          return { strategy, result: null, error: errorMessage };
        }
      }),
    );

    // Find the first successful result (maintaining priority order)
    for (const { result } of resultsWithStrategy) {
      if (result?.ok) {
        return result;
      }
    }

    // All strategies failed - collect error messages
    const errors = resultsWithStrategy.map(({ strategy, result, error: errorMsg }) => {
      if (errorMsg) {
        return `${strategy.constructor.name}: ${errorMsg}`;
      }
      if (result && !result.ok) {
        return `${strategy.constructor.name}: ${result.error.message}`;
      }
      return `${strategy.constructor.name}: Unknown error`;
    });

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
        const defaultPrefix = this.getDefaultPrefix();
        const filename = `${defaultPrefix}${layer.value}.md`;
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

  /**
   * Get default prefix from BreakdownConfig (for TemplateResolverService)
   */
  private getDefaultPrefix(): string {
    // Return default value directly (integration with config will be improved later)
    return "f_";
  }
}
