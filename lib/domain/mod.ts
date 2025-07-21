/**
 * @fileoverview Domain Module - Unified exports for all domain components
 *
 * This module provides centralized exports for all domain components
 * following Domain-Driven Design principles. It organizes domain components
 * into clear layers and boundaries.
 *
 * @module domain
 */

// Core Domain - The most important business logic
export * from "./core/mod.ts";

// Supporting Domain - Domain services that support core domain
export * from "./supporting/mod.ts";

// Generic Domain - Technical foundation and infrastructure
export * from "./generic/mod.ts";

// Error Domain - Unified error handling across the domain
export * from "./errors/mod.ts";

// Templates Domain - Template and schema management
// Note: Explicit exports to avoid naming conflicts
export {
  PromptTemplate,
  Schema,
  SchemaId,
  SchemaNotFoundError,
  SchemaValidationError,
  TemplateNotFoundError,
  TemplateResolverService,
  TemplateValidationError,
} from "./templates/mod.ts";

export type { SchemaRepository, TemplateRepository } from "./templates/mod.ts";

// Commonly used exports are already available through the module exports above

/**
 * Domain factories for common creation patterns
 */
export class DomainFactory {
  /**
   * Create core domain objects
   */
  static get core() {
    return {
      async createTwoParams(directive: string, layer: string, profile?: string) {
        const { TwoParams } = await import("./core/mod.ts");
        const { ConfigProfile } = await import("./core/mod.ts");
        const profileName = profile
          ? ConfigProfile.create(profile)
          : ConfigProfile.create("default");
        return TwoParams.create(directive, layer);
      },

      async createDirectiveType(value: string) {
        const { DirectiveType } = await import("./core/mod.ts");
        return DirectiveType.create(value);
      },

      async createLayerType(value: string) {
        const { LayerType } = await import("./core/mod.ts");
        return LayerType.create(value);
      },
    };
  }

  /**
   * Create error domain objects
   */
  static get errors() {
    return {
      async createCLIParsingError(message: string) {
        const { CLIParsingError } = await import("./errors/mod.ts");
        return CLIParsingError.invalidParameter("unknown", message);
      },

      async createConfigError(_message: string) {
        const { ConfigError } = await import("./errors/mod.ts");
        return ConfigError.profileNotFound("unknown", []);
      },
    };
  }

  /**
   * Create templates domain objects
   */
  static get templates() {
    return {
      async createPromptGenerationAggregate(id: string, template: unknown) {
        const { PromptGenerationAggregate, PromptTemplate } = await import("./templates/mod.ts");
        // Runtime type checking
        if (!(template instanceof PromptTemplate)) {
          throw new Error("Template must be a PromptTemplate instance");
        }
        return PromptGenerationAggregate.create(id, template);
      },
    };
  }
}

/**
 * Domain guards for type checking
 */
export class DomainGuards {
  /**
   * Type guards for core domain
   */
  static get core() {
    return {
      async isTwoParams(value: unknown) {
        const { TwoParams } = await import("./core/mod.ts");
        return value instanceof TwoParams;
      },
    };
  }

  /**
   * Type guards for error domain
   */
  static get errors() {
    return {
      async isBreakdownError(error: unknown) {
        const { isBreakdownError } = await import("./errors/mod.ts");
        return isBreakdownError(error);
      },
    };
  }
}
