/**
 * @fileoverview Prompt Generation Service - Application service for prompt generation
 *
 * This service orchestrates the prompt generation process, coordinating between
 * domain models, repositories, and external interfaces.
 *
 * @module application/templates/prompt_generation_service
 */

import type { CommandResult } from "../../commands/mod.ts";
import type { DirectiveType, LayerType } from "../../types/mod.ts";
import {
  PromptGenerationAggregate,
  PromptTemplate,
  TemplatePath,
  TemplateVariables,
  type GeneratedPrompt,
} from "../../domain/templates/prompt_generation_aggregate.ts";
import type { TemplateRepository } from "../../domain/templates/template_repository.ts";
import type {
  GenerationPolicy,
  ResolutionContext,
  SelectionContext,
} from "../../domain/templates/generation_policy.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import type { Result } from "../../types/result.ts";
import {
  PromptGenerationServiceErrors,
  PromptGenerationServiceErrorFactory,
} from "../../types/prompt_generation_service_error.ts";

/**
 * Generation result for internal use
 */
interface GenerationResult {
  success: boolean;
  prompt?: GeneratedPrompt;
  error?: Error;
  attempts: number;
}

/**
 * Prompt generation request
 */
export interface PromptGenerationRequest {
  directive: DirectiveType;
  layer: LayerType;
  variables: Record<string, string>;
  options: {
    fromFile?: string;
    toFile?: string;
    adaptation?: string;
    inputText?: string;
    force?: boolean;
  };
}

/**
 * Prompt generation response
 */
export interface PromptGenerationResponse {
  success: boolean;
  content?: string;
  templatePath?: string;
  appliedVariables?: Record<string, string>;
  error?: {
    kind?: string; // Future unified support
    type: string; // Legacy support  
    message: string;
    details?: unknown;
  };
}

/**
 * Service dependencies
 */
export interface PromptGenerationDependencies {
  repository: TemplateRepository;
  policy: GenerationPolicy;
  logger?: BreakdownLogger;
}

/**
 * Prompt generation application service
 */
export class PromptGenerationService {
  private readonly logger: BreakdownLogger;
  private readonly aggregates: Map<string, PromptGenerationAggregate>;

  private constructor(
    private readonly deps: PromptGenerationDependencies,
  ) {
    this.logger = deps.logger || new BreakdownLogger("prompt-generation-service");
    this.aggregates = new Map();
  }

  /**
   * Smart Constructor for creating PromptGenerationService with validation
   * 
   * Following Totality principle:
   * - Private constructor enforces creation through smart constructor
   * - Comprehensive validation of all dependencies
   * - Result type for explicit error handling
   * - No exceptions, all errors are represented as Result.error
   */
  static create(
    deps: PromptGenerationDependencies,
  ): Result<PromptGenerationService, PromptGenerationServiceErrors> {
    // Validate dependencies presence and type
    if (!deps || typeof deps !== "object" || Array.isArray(deps)) {
      return {
        ok: false,
        error: PromptGenerationServiceErrorFactory.serviceConfigurationError(
          "Dependencies must be a non-null object"
        ),
      };
    }

    // Validate required dependencies
    if (!deps.repository) {
      return {
        ok: false,
        error: PromptGenerationServiceErrorFactory.serviceConfigurationError(
          "Template repository is required"
        ),
      };
    }

    if (!deps.policy) {
      return {
        ok: false,
        error: PromptGenerationServiceErrorFactory.serviceConfigurationError(
          "Generation policy is required"
        ),
      };
    }

    // Create instance with validated dependencies
    const service = new PromptGenerationService(deps);
    return { ok: true, data: service };
  }

  /**
   * Generate prompt from template
   */
  async generatePrompt(request: PromptGenerationRequest): Promise<PromptGenerationResponse> {
    try {
      this.logger.debug("Starting prompt generation", {
        directive: request.directive.getValue(),
        layer: request.layer.getValue(),
      });

      // 1. Select appropriate template
      const templatePath = this.selectTemplate(request);

      // 2. Load template from repository
      const template = await this.deps.repository.loadTemplate(templatePath);

      // 3. Prepare variables
      const variables = await this.prepareVariables(request, template);

      // 4. Create or retrieve aggregate
      const aggregate = this.getOrCreateAggregate(templatePath, template);

      // 5. Generate prompt
      const result = aggregate.generatePrompt(variables);

      // 6. Convert Result to GenerationResult and handle
      const generationResult: GenerationResult = result.ok 
        ? { success: true, prompt: result.data, attempts: aggregate.getState().attempts }
        : { success: false, error: result.error, attempts: aggregate.getState().attempts };
      
      return this.handleGenerationResult(generationResult, templatePath);
    } catch (error) {
      this.logger.error("Prompt generation failed", { error });
      return this.createErrorResponse(error as Error);
    }
  }

  /**
   * Validate template exists and is accessible
   */
  async validateTemplate(
    directive: DirectiveType,
    layer: LayerType,
  ): Promise<{ valid: boolean; errors?: string[] }> {
    try {
      const context: SelectionContext = {
        fallbackEnabled: false,
      };

      const templatePathResult = this.deps.policy.selectTemplate(directive, layer, context);
      if (!templatePathResult.ok) {
        return {
          valid: false,
          errors: [`Template selection failed: ${templatePathResult.error}`],
        };
      }
      const templatePath = templatePathResult.data;
      const exists = await this.deps.repository.exists(templatePath);

      if (!exists) {
        return {
          valid: false,
          errors: [`Template not found: ${templatePath.getPath()}`],
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        errors: [(error as Error).message],
      };
    }
  }

  /**
   * List available templates
   */
  async listAvailableTemplates() {
    return await this.deps.repository.listAvailable();
  }

  /**
   * Refresh template cache
   */
  async refreshTemplates(): Promise<void> {
    await this.deps.repository.refresh();
    this.aggregates.clear(); // Clear aggregate cache
  }

  /**
   * Convert to legacy CommandResult format
   */
  toCommandResult(response: PromptGenerationResponse): CommandResult {
    if (response.success) {
      return {
        success: true,
        output: response.content || "",
        error: null,
      };
    } else {
      return {
        success: false,
        output: "",
        error: {
          kind: response.error?.kind || "Unknown",
          type: response.error?.type || "Unknown", // Legacy support
          message: response.error?.message || "Unknown error",
        },
      };
    }
  }

  private selectTemplate(request: PromptGenerationRequest): TemplatePath {
    const context: SelectionContext = {
      customPath: request.options.adaptation,
      fallbackEnabled: true,
    };

    const result = this.deps.policy.selectTemplate(
      request.directive,
      request.layer,
      context,
    );
    
    if (!result.ok) {
      throw new Error(`Failed to select template: ${result.error}`);
    }
    
    return result.data;
  }

  private async prepareVariables(
    request: PromptGenerationRequest,
    template: PromptTemplate,
  ): Promise<TemplateVariables> {
    // Base variables from request
    const baseVariables: Record<string, string> = {
      ...request.variables,
      input_text: request.options.inputText || "",
      input_text_file: request.options.fromFile || "",
      destination_path: request.options.toFile || "",
    };

    const provided = TemplateVariables.create(baseVariables);

    // Validate provided variables
    const validation = this.deps.policy.validateVariables(provided);
    if (!validation.isValid) {
      // Legacy behavior: still throw for now, but add Result-based alternative
      throw new Error(
        `Variable validation failed: ${validation.errors.map((e) => e.message).join(", ")}`,
      );
    }

    // Resolve missing variables
    const required = template.getContent().getRequiredVariables();
    const context: ResolutionContext = {
      providedVariables: baseVariables,
      directive: request.directive,
      layer: request.layer,
      workingDirectory: Deno.cwd(),
    };

    const resolved = await this.deps.policy.resolveMissingVariables(
      provided,
      required,
      context,
    );

    // Transform variables according to policy
    return this.deps.policy.transformVariables(resolved);
  }

  /**
   * Prepare variables safely using Result type
   * @param request - The prompt generation request
   * @param template - The template to prepare variables for
   * @returns Result<TemplateVariables, PromptGenerationServiceErrors>
   */
  private async prepareVariablesSafe(
    request: PromptGenerationRequest,
    template: PromptTemplate,
  ): Promise<Result<TemplateVariables, PromptGenerationServiceErrors>> {
    try {
      // Base variables from request
      const baseVariables: Record<string, string> = {
        ...request.variables,
        input_text: request.options.inputText || "",
        input_text_file: request.options.fromFile || "",
        destination_path: request.options.toFile || "",
      };

      const provided = TemplateVariables.create(baseVariables);

      // Validate provided variables
      const validation = this.deps.policy.validateVariables(provided);
      if (!validation.isValid) {
        return {
          ok: false,
          error: PromptGenerationServiceErrorFactory.variableValidationFailed(validation.errors),
        };
      }

      // Resolve missing variables
      const required = template.getContent().getRequiredVariables();
      const context: ResolutionContext = {
        providedVariables: baseVariables,
        directive: request.directive,
        layer: request.layer,
        workingDirectory: Deno.cwd(),
      };

      const resolved = await this.deps.policy.resolveMissingVariables(
        provided,
        required,
        context,
      );

      // Transform variables according to policy
      const transformed = this.deps.policy.transformVariables(resolved);
      return { ok: true, data: transformed };
    } catch (error) {
      return {
        ok: false,
        error: PromptGenerationServiceErrorFactory.promptGenerationFailed(
          error instanceof Error ? error.message : String(error)
        ),
      };
    }
  }

  private getOrCreateAggregate(
    path: TemplatePath,
    template: PromptTemplate,
  ): PromptGenerationAggregate {
    const aggregateId = path.getPath();

    let aggregate = this.aggregates.get(aggregateId);
    if (!aggregate) {
      const aggregateResult = PromptGenerationAggregate.create(aggregateId, template);
      if (!aggregateResult.ok) {
        throw new Error(`Failed to create aggregate: ${aggregateResult.error}`);
      }
      aggregate = aggregateResult.data;
      this.aggregates.set(aggregateId, aggregate);
    }

    return aggregate;
  }

  private handleGenerationResult(
    result: GenerationResult,
    templatePath: TemplatePath,
  ): PromptGenerationResponse {
    if (result.success && result.prompt) {
      return {
        success: true,
        content: result.prompt.getContent(),
        templatePath: templatePath.getPath(),
        appliedVariables: result.prompt.getAppliedVariables().toObject(),
      };
    } else {
      const fallbackAction = this.deps.policy.handleFailure(
        result.error || new Error("Unknown generation error"),
      );

      if (fallbackAction?.type === "useDefault") {
        return {
          success: true,
          content: fallbackAction.defaultValue,
          templatePath: templatePath.getPath(),
        };
      }

      return this.createErrorResponse(
        result.error || new Error("Generation failed"),
      );
    }
  }

  private createErrorResponse(error: Error): PromptGenerationResponse {
    return {
      success: false,
      error: {
        kind: error.name || "UnknownError",
        type: error.name || "UnknownError",
        message: error.message,
        details: error.stack,
      },
    };
  }
}
