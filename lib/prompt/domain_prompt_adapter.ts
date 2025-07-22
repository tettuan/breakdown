/**
 * @fileoverview Domain-Driven PromptAdapter Implementation
 *
 * This module provides a clean PromptAdapter implementation that follows
 * DDD principles with clear domain boundaries and explicit dependencies.
 *
 * @module prompt/domain_prompt_adapter
 */

import type { Result } from "../types/result.ts";
import type { PromptError, PromptResult } from "../types/prompt_types.ts";
import type {
  PromptGenerationContext,
  PromptGenerationService,
  PromptValidationContext,
} from "./prompt_generation_service.ts";
import { PromptGenerationServiceFactories } from "./prompt_generation_service_factory.ts";

/**
 * Domain-driven PromptAdapter
 *
 * This adapter provides a clean interface for prompt generation
 * with clear separation of concerns and domain boundaries.
 *
 * Key improvements over the original PromptAdapterImpl:
 * 1. Uses domain services instead of direct infrastructure dependencies
 * 2. Clear separation between validation and generation logic
 * 3. Type-safe context objects instead of broad interfaces
 * 4. Follows DDD principles with explicit domain boundaries
 */
export class DomainPromptAdapter {
  private readonly promptService: PromptGenerationService;

  constructor(promptService?: PromptGenerationService) {
    this.promptService = promptService ?? PromptGenerationServiceFactories.createService();
  }

  /**
   * Validate prompt generation context
   *
   * @param context - The prompt generation context
   * @param validationContext - Additional validation context
   * @returns Result indicating validation success or errors
   */
  async validatePaths(
    context: PromptGenerationContext,
    validationContext: PromptValidationContext,
  ): Promise<Result<void, PromptError>> {
    return await this.promptService.validateContext(context, validationContext);
  }

  /**
   * Generate prompt from context
   *
   * @param context - The prompt generation context
   * @returns Result containing generated prompt or error
   */
  async generatePrompt(
    context: PromptGenerationContext,
  ): Promise<Result<PromptResult, PromptError>> {
    return await this.promptService.generatePrompt(context);
  }

  /**
   * Validate and generate prompt in one operation
   *
   * @param context - The prompt generation context
   * @param validationContext - Additional validation context
   * @returns Result containing generated prompt or error
   */
  async validateAndGenerate(
    context: PromptGenerationContext,
    validationContext: PromptValidationContext,
  ): Promise<Result<PromptResult, PromptError>> {
    return await this.promptService.validateAndGenerate(context, validationContext);
  }
}

/**
 * Adapter factory for creating DomainPromptAdapter instances
 */
export class DomainPromptAdapterFactory {
  /**
   * @deprecated createDefault() は廃止予定
   * BreakdownParams統合により設定ファイルベース実装に移行。
   * 通常のコンストラクタを使用してください。
   *
   * Create a new DomainPromptAdapter with default service
   */
  static createDefault(): DomainPromptAdapter {
    return new DomainPromptAdapter();
  }

  /**
   * Create a new DomainPromptAdapter with custom service
   */
  static createWithService(service: PromptGenerationService): DomainPromptAdapter {
    return new DomainPromptAdapter(service);
  }
}

/**
 * Helper function to convert from legacy PromptVariablesProvider to context
 */
export interface LegacyPromptVariablesProvider {
  getAllParams(): {
    promptFilePath: string;
    inputFilePath: string;
    outputFilePath: string;
    schemaFilePath: string;
    customVariables?: Record<string, string>;
  };
  getOptions(): { input_text?: string };
  hasValidBaseDir(): boolean;
  getBaseDirError(): Result<void, string>;
  get customVariables(): Record<string, string>;
}

/**
 * Convert legacy provider to new context objects
 */
export function convertLegacyProvider(
  provider: LegacyPromptVariablesProvider,
): {
  context: PromptGenerationContext;
  validationContext: PromptValidationContext;
} {
  const params = provider.getAllParams();
  const options = provider.getOptions();

  const context: PromptGenerationContext = {
    promptFilePath: params.promptFilePath,
    inputFilePath: params.inputFilePath,
    outputFilePath: params.outputFilePath,
    schemaFilePath: params.schemaFilePath,
    customVariables: provider.customVariables,
    inputText: options.input_text,
  };

  const baseDirResult = provider.getBaseDirError();
  const validationContext: PromptValidationContext = {
    hasValidBaseDir: provider.hasValidBaseDir(),
    baseDirError: baseDirResult && !baseDirResult.ok ? baseDirResult.error : undefined,
  };

  return { context, validationContext };
}
