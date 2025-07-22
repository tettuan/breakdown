/**
 * @fileoverview Factory for Prompt Generation Domain Service
 *
 * This module provides factory implementations for creating
 * PromptGenerationService instances following DDD patterns.
 *
 * @module prompt/prompt_generation_service_factory
 */

import { PromptManager } from "@tettuan/breakdownprompt";
import type {
  PromptGenerationService,
  PromptGenerationServiceFactory,
} from "./prompt_generation_service.ts";
import { PromptGenerationServiceImpl } from "./prompt_generation_service_impl.ts";

/**
 * Default factory implementation for PromptGenerationService
 *
 * This factory creates instances of PromptGenerationServiceImpl
 * with sensible defaults.
 */
export class DefaultPromptGenerationServiceFactory implements PromptGenerationServiceFactory {
  private readonly promptManager?: PromptManager;

  constructor(promptManager?: PromptManager) {
    this.promptManager = promptManager;
  }

  /**
   * Create a new PromptGenerationService instance
   */
  create(): PromptGenerationService {
    return new PromptGenerationServiceImpl(this.promptManager);
  }
}

/**
 * Static factory methods for convenience
 */
export class PromptGenerationServiceFactories {
  /**
   * @deprecated createDefault() は廃止予定
   * BreakdownParams統合により設定ファイルベース実装に移行。
   * DefaultPromptGenerationServiceFactory コンストラクタを直接使用してください。
   *
   * Create a factory with default configuration
   */
  static createDefault(): PromptGenerationServiceFactory {
    return new DefaultPromptGenerationServiceFactory();
  }

  /**
   * Create a factory with custom PromptManager
   */
  static createWithManager(promptManager: PromptManager): PromptGenerationServiceFactory {
    return new DefaultPromptGenerationServiceFactory(promptManager);
  }

  /**
   * Create a service instance directly (convenience method)
   */
  static createService(): PromptGenerationService {
    return new DefaultPromptGenerationServiceFactory().create();
  }
}
