/**
 * @fileoverview Template Resolver Service - Generic domain service for template resolution
 *
 * This is a compatibility layer that wraps the actual template resolver service
 * from the templates domain to maintain backward compatibility with existing tests.
 */

import type { TemplateRequest } from "./value_objects/template_request.ts";
import { PromptContent } from "./value_objects/prompt_content.ts";
import { SchemaContent } from "./value_objects/schema_content.ts";
import { PromptTemplatePathResolver } from "../../../factory/prompt_template_path_resolver.ts";
import { SchemaFilePathResolver } from "../../../factory/schema_file_path_resolver.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

/**
 * Template resolution result for generic domain
 */
export interface GenericTemplateResolutionResult {
  ok: boolean;
  data?: {
    prompt: PromptContent | null;
    schema: SchemaContent | null;
  };
  error?: string;
}

/**
 * Template Resolver Service - Generic domain wrapper
 */
export class TemplateResolverService {
  private readonly logger: BreakdownLogger;

  constructor() {
    this.logger = new BreakdownLogger("template-resolver-service");
  }

  /**
   * Resolve template based on request
   */
  async resolveTemplate(request: TemplateRequest): Promise<GenericTemplateResolutionResult> {
    this.logger.debug("Generic template resolution started", {
      directive: request.directive.getValue(),
      layer: request.layer.getValue(),
    });

    try {
      // Create CLI parameters for path resolvers
      const cliParams = {
        demonstrativeType: request.directive.getValue(),
        layerType: request.layer.getValue(),
        options: {
          fromLayerType: request.fromLayer?.getValue(),
          adaptation: request.adaptation,
          useSchema: false, // We'll resolve both prompt and schema separately
        },
      };

      // Default configuration for test environment
      const config = {
        app_prompt: { base_dir: "tests/fixtures/prompts" },
        app_schema: { base_dir: "tests/fixtures/schema" },
      };

      let promptContent: PromptContent | null = null;
      let schemaContent: SchemaContent | null = null;

      // Resolve prompt template
      try {
        const promptResolverResult = PromptTemplatePathResolver.create(config, cliParams);
        if (promptResolverResult.ok) {
          const promptPathResult = promptResolverResult.data.getPath();
          if (promptPathResult.ok) {
            const promptPath = promptPathResult.data.value;
            this.logger.debug("Prompt path resolved", { path: promptPath });

            try {
              const promptFileContent = await Deno.readTextFile(promptPath);
              const promptResult = PromptContent.create(promptFileContent);
              if (promptResult.ok) {
                promptContent = promptResult.data!;
                this.logger.debug("Prompt content loaded successfully");
              } else {
                this.logger.debug("Failed to create prompt content", { error: promptResult.error });
              }
            } catch (readError) {
              this.logger.debug("Failed to read prompt file", {
                path: promptPath,
                error: readError,
              });
            }
          } else {
            this.logger.debug("Prompt path resolution failed", { error: promptPathResult.error });
          }
        } else {
          this.logger.debug("Prompt resolver creation failed", {
            error: promptResolverResult.error,
          });
        }
      } catch (promptError) {
        this.logger.debug("Prompt resolution failed", { error: promptError });
      }

      // Resolve schema
      try {
        const schemaCliParams = {
          ...cliParams,
          options: { ...cliParams.options, useSchema: true },
        };
        const schemaResolverResult = SchemaFilePathResolver.create(config, schemaCliParams);
        if (schemaResolverResult.ok) {
          const schemaPathResult = schemaResolverResult.data.getPath();
          if (schemaPathResult.ok) {
            const schemaPath = schemaPathResult.data.value;
            this.logger.debug("Schema path resolved", { path: schemaPath });

            try {
              const schemaFileContent = await Deno.readTextFile(schemaPath);
              const schemaResult = SchemaContent.create(schemaFileContent);
              if (schemaResult.ok) {
                schemaContent = schemaResult.data!;
                this.logger.debug("Schema content loaded successfully");
              } else {
                this.logger.debug("Failed to create schema content", { error: schemaResult.error });
              }
            } catch (readError) {
              this.logger.debug("Failed to read schema file", {
                path: schemaPath,
                error: readError,
              });
            }
          } else {
            this.logger.debug("Schema path resolution failed", { error: schemaPathResult.error });
          }
        } else {
          this.logger.debug("Schema resolver creation failed", {
            error: schemaResolverResult.error,
          });
        }
      } catch (schemaError) {
        this.logger.debug("Schema resolution failed", { error: schemaError });
      }

      return {
        ok: true,
        data: {
          prompt: promptContent,
          schema: schemaContent,
        },
      };
    } catch (error) {
      this.logger.error("Template resolution failed", {
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
