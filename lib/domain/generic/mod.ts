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

import type { DirectiveType, LayerType } from "../../types/mod.ts";

// Template Management (Generic/Technical aspects)
// Note: This is the technical implementation of template management
// The domain-specific aspects should eventually be moved to domain/supporting
export { PromptContent } from "./template_management/value_objects/prompt_content.ts";
export { PromptPath } from "./template_management/value_objects/prompt_path.ts";
export { SchemaContent } from "./template_management/value_objects/schema_content.ts";
export { SchemaPath as GenericSchemaPath } from "./template_management/value_objects/schema_path.ts";
export { TemplateRequest } from "./template_management/value_objects/template_request.ts";

/**
 * Generic Domain Factory for common creation patterns
 */
export class GenericDomainFactory {
  /**
   * Create template management value objects
   */
  static get templateManagement() {
    return {
      async createPromptContent(content: string) {
        const { PromptContent } = await import(
          "./template_management/value_objects/prompt_content.ts"
        );
        return PromptContent.create(content);
      },

      async createPromptPath(directive: unknown, layer: unknown, filename: string) {
        const { PromptPath } = await import("./template_management/value_objects/prompt_path.ts");
        return PromptPath.create(directive as DirectiveType, layer as LayerType, filename);
      },

      async createSchemaContent(content: string) {
        const { SchemaContent } = await import(
          "./template_management/value_objects/schema_content.ts"
        );
        return SchemaContent.create(content);
      },

      async createSchemaPath(directive: unknown, layer: unknown, filename: string) {
        const { SchemaPath } = await import("./template_management/value_objects/schema_path.ts");
        return SchemaPath.create(directive as DirectiveType, layer as LayerType, filename);
      },

      async createTemplateRequest(
        directive: unknown,
        layer: unknown,
        adaptation?: string,
        fromLayer?: unknown,
      ) {
        const { TemplateRequest } = await import(
          "./template_management/value_objects/template_request.ts"
        );
        return TemplateRequest.create({
          directive: directive as DirectiveType,
          layer: layer as LayerType,
          adaptation,
          fromLayer: fromLayer as LayerType,
        });
      },
    };
  }
}

/**
 * Generic Domain Guards for type checking
 */
export class GenericDomainGuards {
  /**
   * Type guards for template management value objects
   */
  static get templateManagement() {
    return {
      async isPromptContent(value: unknown) {
        const { PromptContent } = await import(
          "./template_management/value_objects/prompt_content.ts"
        );
        return value instanceof PromptContent;
      },

      async isPromptPath(value: unknown) {
        const { PromptPath } = await import("./template_management/value_objects/prompt_path.ts");
        return value instanceof PromptPath;
      },

      async isSchemaContent(value: unknown) {
        const { SchemaContent } = await import(
          "./template_management/value_objects/schema_content.ts"
        );
        return value instanceof SchemaContent;
      },

      async isSchemaPath(value: unknown) {
        const { SchemaPath } = await import("./template_management/value_objects/schema_path.ts");
        return value instanceof SchemaPath;
      },

      async isTemplateRequest(value: unknown) {
        const { TemplateRequest } = await import(
          "./template_management/value_objects/template_request.ts"
        );
        return value instanceof TemplateRequest;
      },
    };
  }
}

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
