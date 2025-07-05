/**
 * @fileoverview Template Resolver Service - Domain service for template resolution
 *
 * This service handles the complex logic of resolving templates and schemas
 * based on various criteria, including fallback strategies and compatibility checking.
 *
 * @module domain/templates/template_resolver_service
 */

import type { DirectiveType, LayerType } from "../../types/mod.ts";
import type { TemplateRepository } from "./template_repository.ts";
import type { SchemaRepository } from "./schema_repository.ts";
import { PromptTemplate, TemplatePath } from "./prompt_generation_aggregate.ts";
import { Schema, SchemaPath } from "./schema_management_aggregate.ts";
import { SchemaId, TemplateId, TemplateVersion } from "./template_value_objects.ts";
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
 * Resolution result
 */
export interface TemplateResolutionResult {
  success: boolean;
  template?: PromptTemplate;
  schema?: Schema;
  resolvedPath?: TemplatePath;
  schemaPath?: SchemaPath;
  fallbackUsed?: boolean;
  warnings?: string[];
  error?: {
    type: ResolutionErrorType;
    message: string;
    details?: unknown;
  };
}

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
        return {
          success: false,
          error: {
            type: "invalid_path",
            message: `Invalid custom path format: ${customPath}`,
          },
        };
      }

      const filename = parts[parts.length - 1];
      const templatePath = TemplatePath.create(request.directive, request.layer, filename);

      // Check if template exists
      const exists = await templateRepo.exists(templatePath);
      if (!exists) {
        return {
          success: false,
          error: {
            type: "template_not_found",
            message: `Template not found at custom path: ${customPath}`,
          },
        };
      }

      // Load template
      const template = await templateRepo.loadTemplate(templatePath);

      // Try to load associated schema
      let schema: Schema | undefined;
      try {
        const schemaFilename = filename.replace(".md", ".json");
        const schemaPath = SchemaPath.create(request.directive, request.layer, schemaFilename);
        const schemaExists = await schemaRepo.exists(schemaPath);
        if (schemaExists) {
          schema = await schemaRepo.loadSchema(schemaPath);
        }
      } catch {
        // Schema loading is optional for custom paths
      }

      return {
        success: true,
        template,
        schema,
        resolvedPath: templatePath,
        schemaPath: schema?.getPath(),
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: "validation_failed",
          message: `Failed to resolve custom path: ${
            error instanceof Error ? error.message : String(error)
          }`,
          details: error,
        },
      };
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
      const templatePath = TemplatePath.create(request.directive, request.layer, filename);

      // Check if template exists
      const exists = await templateRepo.exists(templatePath);
      if (!exists) {
        return {
          success: false,
          error: {
            type: "template_not_found",
            message: `Standard template not found: ${templatePath.getPath()}`,
          },
        };
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
        schemaPath = SchemaPath.create(request.directive, request.layer, schemaFilename);
        const schemaExists = await schemaRepo.exists(schemaPath);
        if (schemaExists) {
          schema = await schemaRepo.loadSchema(schemaPath);
        } else if (request.options.strict) {
          return {
            success: false,
            error: {
              type: "schema_not_found",
              message: `Required schema not found: ${schemaPath.getPath()}`,
            },
          };
        }
      } catch (error) {
        if (request.options.strict) {
          return {
            success: false,
            error: {
              type: "schema_not_found",
              message: `Failed to load schema: ${
                error instanceof Error ? error.message : String(error)
              }`,
              details: error,
            },
          };
        }
        warnings.push(
          `Schema loading failed: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      return {
        success: true,
        template,
        schema,
        resolvedPath: templatePath,
        schemaPath,
        warnings: warnings.length > 0 ? warnings : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: "validation_failed",
          message: `Standard resolution failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
          details: error,
        },
      };
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
      return {
        success: false,
        error: {
          type: "template_not_found",
          message: `No fallback mapping found for: ${key}`,
        },
      };
    }

    try {
      const templatePath = TemplatePath.create(request.directive, request.layer, fallbackFilename);

      // Check if fallback template exists
      const exists = await templateRepo.exists(templatePath);
      if (!exists) {
        return {
          success: false,
          error: {
            type: "template_not_found",
            message: `Fallback template not found: ${templatePath.getPath()}`,
          },
        };
      }

      // Load template
      const template = await templateRepo.loadTemplate(templatePath);

      // Try to load schema (optional for fallback)
      let schema: Schema | undefined;
      let schemaPath: SchemaPath | undefined;
      try {
        const schemaFilename = fallbackFilename.replace(".md", ".json");
        schemaPath = SchemaPath.create(request.directive, request.layer, schemaFilename);
        const schemaExists = await schemaRepo.exists(schemaPath);
        if (schemaExists) {
          schema = await schemaRepo.loadSchema(schemaPath);
        }
      } catch {
        // Ignore schema loading errors for fallback
      }

      return {
        success: true,
        template,
        schema,
        resolvedPath: templatePath,
        schemaPath,
        fallbackUsed: true,
        warnings: [`Used fallback template: ${fallbackFilename}`],
      };
    } catch (error) {
      return {
        success: false,
        error: {
          type: "validation_failed",
          message: `Fallback resolution failed: ${
            error instanceof Error ? error.message : String(error)
          }`,
          details: error,
        },
      };
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

        if (result.success) {
          this.logger.info("Template resolved successfully", {
            strategy: strategy.constructor.name,
            templatePath: result.resolvedPath?.getPath(),
            schemaPath: result.schemaPath?.getPath(),
            fallbackUsed: result.fallbackUsed,
          });
          return result;
        } else {
          errors.push(`${strategy.constructor.name}: ${result.error?.message}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${strategy.constructor.name}: ${errorMessage}`);
        this.logger.error("Strategy failed", {
          strategy: strategy.constructor.name,
          error: errorMessage,
        });
      }
    }

    // All strategies failed
    this.logger.error("All resolution strategies failed", { errors });
    return {
      success: false,
      error: {
        type: "template_not_found",
        message: `Failed to resolve template: ${errors.join("; ")}`,
        details: errors,
      },
    };
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
        const templatePath = TemplatePath.create(directive, layer, filename);
        return await this.templateRepo.exists(templatePath);
      } else {
        const filename = `f_${layer.getValue()}.md`;
        const templatePath = TemplatePath.create(directive, layer, filename);
        return await this.templateRepo.exists(templatePath);
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
  removeStrategy(strategyClass: new (...args: any[]) => ResolutionStrategy): void {
    const index = this.strategies.findIndex((s) => s instanceof strategyClass);
    if (index >= 0) {
      this.strategies.splice(index, 1);
    }
  }
}
