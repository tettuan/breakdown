/**
 * @fileoverview Generic Domain Module - Unified exports for generic/technical domain components
 *
 * This module provides centralized exports for all generic domain components
 * following Domain-Driven Design principles. The generic domain contains
 * technical utilities and infrastructure-like components that are not specific
 * to the core business domain.
 *
 * @module domain/generic
 */

// Template Management (Generic/Technical aspects)
// Note: This is the technical implementation of template management
// The domain-specific aspects should eventually be moved to domain/supporting
export { PromptContent } from "./template_management/value_objects/prompt_content.ts";
export { PromptPath } from "./template_management/value_objects/prompt_path.ts";
export { SchemaContent } from "./template_management/value_objects/schema_content.ts";
export { SchemaPath as GenericSchemaPath } from "./template_management/value_objects/schema_path.ts";
export { TemplateRequest } from "./template_management/value_objects/template_request.ts";

/**
 * Re-export commonly used types and interfaces
 */
export type { PromptContentResult } from "./template_management/value_objects/prompt_content.ts";

export type { PromptPathResult } from "./template_management/value_objects/prompt_path.ts";

export type { SchemaContentResult } from "./template_management/value_objects/schema_content.ts";

export type { SchemaPathResult } from "./template_management/value_objects/schema_path.ts";

export type {
  TemplateRequestResult,
} from "./template_management/value_objects/template_request.ts";
