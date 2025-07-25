/**
 * @fileoverview Type Adapters - Adapters for DirectiveType and LayerType integration
 *
 * This module provides adapters and utilities for integrating the new DDD implementation
 * with existing DirectiveType and LayerType APIs, ensuring backward compatibility.
 *
 * @module domain/templates/type_adapters
 */

import type { DirectiveType, LayerType } from "../../types/mod.ts";
import { TemplatePath, TemplateVariables } from "./prompt_generation_aggregate.ts";
import { SchemaPath } from "./schema_management_aggregate.ts";
import { SchemaId, TemplateId } from "./template_value_objects.ts";

/**
 * Type factory for creating template paths from types
 */
export class TypedTemplatePathFactory {
  /**
   * Create template path from directive and layer types
   */
  static createTemplatePath(
    directive: DirectiveType,
    layer: LayerType,
    filename?: string,
  ): TemplatePath {
    const actualFilename = filename || `f_${layer.value}.md`;
    const result = TemplatePath.create(directive, layer, actualFilename);
    if (!result.ok) {
      throw new Error(`Failed to create template path: ${result.error}`);
    }
    return result.data;
  }

  /**
   * Create schema path from directive and layer types
   */
  static createSchemaPath(
    directive: DirectiveType,
    layer: LayerType,
    filename?: string,
  ): SchemaPath {
    const actualFilename = filename || `f_${layer.value}.json`;
    const result = SchemaPath.create(directive, layer, actualFilename);
    if (!result.ok) {
      throw new Error(`Failed to create schema path: ${result.error}`);
    }
    return result.data;
  }

  /**
   * Create template ID from types
   */
  static createTemplateId(
    directive: DirectiveType,
    layer: LayerType,
    filename?: string,
  ): TemplateId {
    const actualFilename = filename || `f_${layer.value}.md`;
    return TemplateId.create(directive, layer, actualFilename);
  }

  /**
   * Create schema ID from types
   */
  static createSchemaId(
    directive: DirectiveType,
    layer: LayerType,
    filename?: string,
  ): SchemaId {
    const actualFilename = filename || `f_${layer.value}.json`;
    return SchemaId.create(directive, layer, actualFilename);
  }
}

/**
 * Variable factory for creating template variables from typed parameters
 */
export class TypedVariableFactory {
  /**
   * Create template variables from CLI parameters
   */
  static fromCliParams(params: {
    fromFile?: string;
    destinationFile?: string;
    adaptation?: string;
    inputText?: string;
    [key: string]: string | undefined;
  }): TemplateVariables {
    const variables: Record<string, string> = {};

    // Map CLI parameters to template variables
    if (params.fromFile !== undefined) {
      variables.input_text_file = params.fromFile;
    }

    if (params.destinationFile !== undefined) {
      variables.destination_path = params.destinationFile;
    }

    if (params.adaptation !== undefined) {
      variables.adaptation = params.adaptation;
    }

    if (params.inputText !== undefined) {
      variables.input_text = params.inputText;
    }

    // Include any additional parameters
    for (const [key, value] of Object.entries(params)) {
      if (
        value !== undefined &&
        !["fromFile", "destinationFile", "adaptation", "inputText"].includes(key)
      ) {
        variables[key] = value;
      }
    }

    return TemplateVariables.create(variables);
  }

  /**
   * Create template variables with standard defaults
   */
  static withDefaults(
    base: Record<string, string> = {},
    directive?: DirectiveType,
    layer?: LayerType,
  ): TemplateVariables {
    const variables: Record<string, string> = {
      input_text: "",
      input_text_file: "",
      destination_path: "",
      schema_file: "",
      adaptation: "",
      ...base,
    };

    // Add type-specific defaults
    if (directive && layer) {
      variables.directive_type = directive.value;
      variables.layer_type = layer.value;

      // Add schema file path if not provided
      if (!variables.schema_file) {
        variables.schema_file = `schema/${directive.value}/${layer.value}/f_${layer.value}.json`;
      }
    }

    return TemplateVariables.create(variables);
  }
}

/**
 * Configuration for path resolution
 */
export interface PathResolverConfig {
  baseDirectory?: string;
  promptBaseDir?: string;
  schemaBaseDir?: string;
}

/**
 * Path resolver for template and schema paths
 */
export class TypedPathResolver {
  private readonly baseDirectory: string;
  private readonly promptBaseDir: string;
  private readonly schemaBaseDir: string;

  constructor(
    config: PathResolverConfig = {},
  ) {
    this.baseDirectory = config.baseDirectory || Deno.cwd();
    this.promptBaseDir = config.promptBaseDir || "prompts";
    this.schemaBaseDir = config.schemaBaseDir || "schema";
  }

  /**
   * Resolve absolute template path
   */
  resolveTemplatePath(path: TemplatePath): string {
    return `${this.baseDirectory}/${this.promptBaseDir}/${path.getPath()}`;
  }

  /**
   * Resolve absolute schema path
   */
  resolveSchemaPath(path: SchemaPath): string {
    return `${this.baseDirectory}/${this.schemaBaseDir}/${path.getPath()}`;
  }

  /**
   * Resolve input file path
   */
  resolveInputPath(inputFile: string): string {
    if (inputFile === "-") return "stdin";
    if (inputFile.startsWith("/")) return inputFile;
    return `${this.baseDirectory}/${inputFile}`;
  }

  /**
   * Resolve output file path
   */
  resolveOutputPath(outputFile: string): string {
    if (outputFile.startsWith("/")) return outputFile;
    return `${this.baseDirectory}/${outputFile}`;
  }

  /**
   * Get relative path from base directory
   */
  getRelativePath(absolutePath: string): string {
    if (absolutePath.startsWith(this.baseDirectory)) {
      return absolutePath.substring(this.baseDirectory.length + 1);
    }
    return absolutePath;
  }
}

/**
 * Type validation utilities
 */
export class TypeValidator {
  /**
   * Validate that directive and layer are compatible
   */
  static validateCompatibility(
    directive: DirectiveType,
    layer: LayerType,
  ): { valid: boolean; reason?: string } {
    const directiveValue = directive.value;
    const layerValue = layer.value;

    // Define compatibility rules
    const incompatibleCombinations: Array<[string, string]> = [
      // Add any known incompatible combinations here
    ];

    for (const [invalidDirective, invalidLayer] of incompatibleCombinations) {
      if (directiveValue === invalidDirective && layerValue === invalidLayer) {
        return {
          valid: false,
          reason: `Directive '${directiveValue}' is not compatible with layer '${layerValue}'`,
        };
      }
    }

    return { valid: true };
  }

  /**
   * Validate template path format
   */
  static validateTemplatePath(path: string): { valid: boolean; reason?: string } {
    const parts = path.split("/");

    if (parts.length < 3) {
      return {
        valid: false,
        reason: "Template path must have at least 3 parts: directive/layer/filename",
      };
    }

    const filename = parts[parts.length - 1];
    if (!filename.endsWith(".md")) {
      return {
        valid: false,
        reason: "Template filename must end with .md",
      };
    }

    return { valid: true };
  }

  /**
   * Validate schema path format
   */
  static validateSchemaPath(path: string): { valid: boolean; reason?: string } {
    const parts = path.split("/");

    if (parts.length < 3) {
      return {
        valid: false,
        reason: "Schema path must have at least 3 parts: directive/layer/filename",
      };
    }

    const filename = parts[parts.length - 1];
    if (!filename.endsWith(".json")) {
      return {
        valid: false,
        reason: "Schema filename must end with .json",
      };
    }

    return { valid: true };
  }
}

/**
 * Utility functions for type integration
 */
export class TypeIntegrationUtils {
  /**
   * Extract directive and layer from path string
   */
  static extractTypesFromPath(path: string): {
    directive: string;
    layer: string;
    filename: string;
  } | null {
    const parts = path.split("/");
    if (parts.length < 3) return null;

    return {
      directive: parts[0],
      layer: parts[1],
      filename: parts[parts.length - 1],
    };
  }

  /**
   * Create type-safe path string
   */
  static createPathString(
    directive: DirectiveType,
    layer: LayerType,
    filename: string,
  ): string {
    return `${directive.value}/${layer.value}/${filename}`;
  }

  /**
   * Normalize path for consistent comparison
   */
  static normalizePath(path: string): string {
    return path.replace(/\/+/g, "/").replace(/^\/|\/$/g, "");
  }

  /**
   * Check if two paths are equivalent
   */
  static pathsEqual(path1: string, path2: string): boolean {
    return TypeIntegrationUtils.normalizePath(path1) ===
      TypeIntegrationUtils.normalizePath(path2);
  }
}
