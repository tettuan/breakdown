/**
 * @fileoverview Generation Policy - Domain service for prompt generation policies
 *
 * This service encapsulates the business rules and policies for prompt generation,
 * including validation, variable resolution, and template selection strategies.
 *
 * @module domain/templates/generation_policy
 */

import type { DirectiveType, LayerType } from "../../types/mod.ts";
import type { TemplatePath } from "./prompt_generation_aggregate.ts";
import { TemplateVariables } from "./prompt_generation_aggregate.ts";
import type { Result } from "../../types/result.ts";

/**
 * Variable resolution strategy
 */
export interface VariableResolutionStrategy {
  /**
   * Resolve variable value from various sources
   */
  resolve(variableName: string, context: ResolutionContext): Promise<string | undefined>;

  /**
   * Get priority of this strategy (higher = tried first)
   */
  getPriority(): number;
}

/**
 * Resolution context
 */
export interface ResolutionContext {
  providedVariables: Record<string, string>;
  directive: DirectiveType;
  layer: LayerType;
  workingDirectory: string;
  environmentVariables?: Record<string, string>;
}

/**
 * Template selection strategy
 */
export interface TemplateSelectionStrategy {
  /**
   * Select appropriate template based on context
   */
  selectTemplate(
    directive: DirectiveType,
    layer: LayerType,
    context: SelectionContext,
  ): Result<TemplatePath, string>;
}

/**
 * Selection context
 */
export interface SelectionContext {
  preferredLanguage?: string;
  templateVersion?: string;
  customPath?: string;
  fallbackEnabled: boolean;
}

/**
 * Fallback action type - simple string version
 */
export type FallbackActionType = "retry" | "skip" | "abort" | "useDefault";

/**
 * Fallback action with additional options
 */
export interface FallbackAction {
  type: FallbackActionType;
  defaultValue?: string;
  retryCount?: number;
  condition?: (error: unknown) => boolean;
}

/**
 * Generation policy configuration
 */
export interface GenerationPolicyConfig {
  requiredVariables: string[];
  optionalVariables: string[];
  variableValidation: Record<string, VariableValidationRule>;
  maxRetries: number;
  timeoutMs: number;
  fallbackStrategies?: FallbackActionType[];
}

/**
 * Variable validation rule
 */
export interface VariableValidationRule {
  pattern?: RegExp;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
  transform?: (value: string) => string;
}

/**
 * Generation policy domain service
 */
export class GenerationPolicy {
  private constructor(
    private readonly config: GenerationPolicyConfig,
    private readonly variableStrategies: VariableResolutionStrategy[],
    private readonly selectionStrategy: TemplateSelectionStrategy,
  ) {
    // Sort strategies by priority
    this.variableStrategies.sort((a, b) => b.getPriority() - a.getPriority());
  }

  static create(
    config: GenerationPolicyConfig,
    variableStrategies: VariableResolutionStrategy[],
    selectionStrategy: TemplateSelectionStrategy,
  ): Result<GenerationPolicy, { kind: "InvalidConfiguration"; message: string }> {
    // Validate inputs
    if (!config) {
      return {
        ok: false,
        error: { kind: "InvalidConfiguration", message: "Configuration is required" },
      };
    }

    if (!selectionStrategy) {
      return {
        ok: false,
        error: { kind: "InvalidConfiguration", message: "Template selection strategy is required" },
      };
    }

    if (!Array.isArray(variableStrategies)) {
      return {
        ok: false,
        error: { kind: "InvalidConfiguration", message: "Variable strategies must be an array" },
      };
    }

    return { ok: true, data: new GenerationPolicy(config, variableStrategies, selectionStrategy) };
  }

  /**
   * Validate variables against policy rules
   */
  validateVariables(variables: TemplateVariables): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required variables
    for (const required of this.config.requiredVariables) {
      if (!variables.has(required)) {
        errors.push({
          field: required,
          message: `Required variable '${required}' is missing`,
          code: "REQUIRED_MISSING",
        });
      }
    }

    // Validate each variable
    for (const [name, value] of Object.entries(variables.toObject())) {
      const rule = this.config.variableValidation[name];
      if (!rule) continue;

      if (rule.pattern && !rule.pattern.test(value)) {
        errors.push({
          field: name,
          message: `Variable '${name}' does not match required pattern`,
          code: "PATTERN_MISMATCH",
        });
      }

      if (rule.minLength && value.length < rule.minLength) {
        errors.push({
          field: name,
          message: `Variable '${name}' is too short (min: ${rule.minLength})`,
          code: "TOO_SHORT",
        });
      }

      if (rule.maxLength && value.length > rule.maxLength) {
        warnings.push({
          field: name,
          message: `Variable '${name}' exceeds recommended length (max: ${rule.maxLength})`,
          code: "TOO_LONG",
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Resolve missing variables using strategies
   */
  async resolveMissingVariables(
    provided: TemplateVariables,
    required: string[],
    context: ResolutionContext,
  ): Promise<TemplateVariables> {
    const resolved = new Map<string, string>();

    // Copy provided variables
    for (const [key, value] of Object.entries(provided.toObject())) {
      resolved.set(key, value);
    }

    // Resolve missing required variables
    for (const varName of required) {
      if (resolved.has(varName)) continue;

      for (const strategy of this.variableStrategies) {
        const value = await strategy.resolve(varName, context);
        if (value !== undefined) {
          resolved.set(varName, value);
          break;
        }
      }
    }

    return TemplateVariables.create(Object.fromEntries(resolved));
  }

  /**
   * Apply transformation rules to variables
   */
  transformVariables(variables: TemplateVariables): TemplateVariables {
    const transformed = new Map<string, string>();

    for (const [name, value] of Object.entries(variables.toObject())) {
      const rule = this.config.variableValidation[name];
      const transformedValue = rule?.transform ? rule.transform(value) : value;
      transformed.set(name, transformedValue);
    }

    return TemplateVariables.create(Object.fromEntries(transformed));
  }

  /**
   * Select template using configured strategy
   */
  selectTemplate(
    directive: DirectiveType,
    layer: LayerType,
    context: SelectionContext,
  ): Result<TemplatePath, string> {
    return this.selectionStrategy.selectTemplate(directive, layer, context);
  }

  /**
   * Handle generation failure and determine fallback action
   */
  handleFailure(error: unknown): FallbackAction {
    const strategies = this.config.fallbackStrategies || ["retry", "abort"];

    // Type-safe error handling with error guards
    const errorCode = this.extractErrorCode(error);

    if (errorCode === "TEMPLATE_NOT_FOUND" && strategies.includes("useDefault")) {
      return {
        type: "useDefault",
        defaultValue: "Default template content",
      };
    }

    if (errorCode === "VALIDATION_ERROR" && strategies.includes("skip")) {
      return {
        type: "skip",
      };
    }

    // Default fallback
    const actionType = strategies[0] || "abort";
    return {
      type: actionType,
      retryCount: actionType === "retry" ? this.config.maxRetries : undefined,
    };
  }

  /**
   * Extract error code from unknown error type safely
   */
  private extractErrorCode(error: unknown): string | undefined {
    if (typeof error === "object" && error !== null && "code" in error) {
      const code = (error as Record<string, unknown>).code;
      return typeof code === "string" ? code : undefined;
    }
    return undefined;
  }

  /**
   * Get policy configuration
   */
  getConfig(): Readonly<GenerationPolicyConfig> {
    return { ...this.config };
  }
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}
