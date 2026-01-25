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
