/**
 * @fileoverview Schema file path resolution for Breakdown CLI operations.
 *
 * This module provides the SchemaFilePathResolver class that handles the
 * resolution of JSON schema file paths based on CLI parameters and configuration.
 * It supports the hierarchical schema organization used by Breakdown's
 * 3-layer architecture (demonstrative type → layer type → schema files).
 *
 * The resolver follows Breakdown's schema conventions and ensures consistent
 * schema file discovery across different execution contexts and configurations.
 *
 * @module factory/schema_file_path_resolver
 */

import { isAbsolute, join, resolve } from "@std/path";
import type { PromptCliParams } from "./prompt_variables_factory.ts";
import type { TwoParams_Result } from "../deps.ts";

// Legacy type alias for backward compatibility during migration
type DoubleParams_Result = PromptCliParams;

/**
 * TypeCreation_Result - Unified error handling for type creation operations
 * Follows Totality principle by explicitly representing success/failure states
 */
export type TypeCreation_Result<T> =
  | { success: true; data: T }
  | { success: false; error: string; errorType: "validation" | "missing" | "config" };

/**
 * Schema file path resolver for Breakdown CLI operations.
 *
 * The SchemaFilePathResolver class handles the resolution of JSON schema file
 * paths according to Breakdown's hierarchical organization structure. It resolves
 * schema files based on demonstrative type and layer type, following the pattern:
 * {schema_base_dir}/{demonstrativeType}/{layerType}/base.schema.md
 *
 * Schema File Organization:
 * - Base directory: from configuration or default ".agent/breakdown/schema"
 * - Demonstrative type: "to", "summary", etc.
 * - Layer type: "project", "issue", "task"
 * - Standard filename: "base.schema.md"
 *
 * @example
 * ```typescript
 * const resolver = new SchemaFilePathResolver(config, cliParams);
 *
 * // Schema path for "to project" command
 * const projectSchema = resolver.getPath(); // "/schema/to/project/base.schema.md"
 *
 * // Schema path for "summary issue" command
 * const issueSchema = resolver.getPath(); // "/schema/summary/issue/base.schema.md"
 * ```
 */
export class SchemaFilePathResolver {
  /**
   * Creates a new SchemaFilePathResolver instance with configuration and CLI parameters.
   *
   * @param config - The configuration object containing schema base directory settings
   * @param cliParams - The parsed CLI parameters containing demonstrative and layer types
   *
   * @example
   * ```typescript
   * const config = {
   *   app_schema: { base_dir: "lib/breakdown/schema" }
   * };
   * const cliParams = {
   *   demonstrativeType: "to",
   *   layerType: "project",
   *   options: {}
   * };
   * const resolver = new SchemaFilePathResolver(config, cliParams);
   * ```
   */
  constructor(
    private _config: { app_schema?: { base_dir?: string } } & Record<string, unknown>,
    private _cliParams: DoubleParams_Result | TwoParams_Result,
  ) {
    // Deep copy to ensure immutability
    this._config = this.deepCopyConfig(_config);
    this._cliParams = this.deepCopyCliParams(_cliParams);
  }

  /**
   * Deep copy configuration object manually to avoid JSON.parse
   * @param config - The configuration object to copy
   * @returns Deep copy of the configuration
   */
  private deepCopyConfig(
    config: { app_schema?: { base_dir?: string } } & Record<string, unknown>,
  ): { app_schema?: { base_dir?: string } } & Record<string, unknown> {
    const copy: any = {};

    // Copy app_schema
    if (config.app_schema) {
      copy.app_schema = {};
      if (config.app_schema.base_dir !== undefined) {
        copy.app_schema.base_dir = config.app_schema.base_dir;
      }
    }

    // Copy other properties shallowly (should be primitive or immutable)
    for (const [key, value] of Object.entries(config)) {
      if (key !== "app_schema") {
        copy[key] = value;
      }
    }

    return copy;
  }

  /**
   * Deep copy CLI parameters manually to avoid JSON.parse
   * @param cliParams - The CLI parameters to copy
   * @returns Deep copy of the CLI parameters
   */
  private deepCopyCliParams(
    cliParams: DoubleParams_Result | TwoParams_Result,
  ): DoubleParams_Result | TwoParams_Result {
    if ("type" in cliParams && cliParams.type === "two") {
      // TwoParams_Result from breakdownparams
      const twoParams = cliParams as TwoParams_Result;
      const copy: TwoParams_Result = {
        type: "two",
        params: twoParams.params || [],
        demonstrativeType: twoParams.params?.[0] || "",
        layerType: twoParams.params?.[1] || "",
        options: {}
      };
      return copy;
    } else {
      // DoubleParams_Result (PromptCliParams)
      const doubleParams = cliParams as DoubleParams_Result;
      const copy: any = {
        demonstrativeType: doubleParams.demonstrativeType,
        layerType: doubleParams.layerType,
      };

      if (doubleParams.options) {
        copy.options = { ...doubleParams.options };
      }

      return copy;
    }
  }

  /**
   * Resolves the complete schema file path according to CLI parameters and configuration.
   *
   * This method implements the schema path resolution strategy by combining
   * the base directory, demonstrative type, layer type, and standard filename
   * to construct the full path to the appropriate schema file.
   *
   * @returns string - The resolved absolute schema file path
   *
   * @throws {Error} When configuration is invalid or path resolution fails
   *
   * @example
   * ```typescript
   * const resolver = new SchemaFilePathResolver(config, cliParams);
   *
   * // For "to project" command
   * const projectSchema = resolver.getPath();
   * // Returns: "/absolute/path/to/schema/to/project/base.schema.md"
   *
   * // For "summary issue" command
   * const issueSchema = resolver.getPath();
   * // Returns: "/absolute/path/to/schema/summary/issue/base.schema.md"
   * ```
   *
   * @see {@link https://docs.breakdown.com/schema} for schema organization documentation
   */
  public getPath(): string {
    const baseDir = this.resolveBaseDir();
    const fileName = this.buildFileName();
    return this.buildSchemaPath(baseDir, fileName);
  }

  /**
   * Resolves the base directory for schema files from configuration.
   *
   * This method determines the schema base directory by checking the configuration
   * for an explicit base_dir setting, falling back to a default path if not specified.
   * Relative paths are resolved against the current working directory.
   *
   * @returns string - The resolved absolute base directory path for schema files
   *
   * @example
   * ```typescript
   * // With explicit configuration
   * const baseDir1 = this.resolveBaseDir(); // "/custom/schema/path"
   *
   * // With default configuration
   * const baseDir2 = this.resolveBaseDir(); // "/cwd/.agent/breakdown/schema"
   * ```
   */
  public resolveBaseDir(): string {
    let baseDir = this._config.app_schema?.base_dir || ".agent/breakdown/schema";
    if (!isAbsolute(baseDir)) {
      baseDir = resolve(Deno.cwd(), baseDir);
    }
    return baseDir;
  }

  /**
   * Builds the standard filename for schema files.
   *
   * This method returns the standardized filename used for all schema files
   * in the Breakdown system. The filename follows the convention of using
   * "base.schema.md" for all schema definitions.
   *
   * @returns string - The standard schema filename "base.schema.md"
   *
   * @example
   * ```typescript
   * const filename = this.buildFileName(); // "base.schema.md"
   * ```
   */
  public buildFileName(): string {
    return "base.schema.md";
  }

  /**
   * Builds the complete schema file path from components.
   *
   * This method constructs the full path to a schema file by combining the
   * base directory, demonstrative type, layer type, and filename according
   * to Breakdown's hierarchical schema organization structure.
   *
   * @param baseDir - The resolved base directory for schema files
   * @param fileName - The schema filename (typically "base.schema.md")
   * @returns string - The complete path to the schema file
   *
   * @example
   * ```typescript
   * const baseDir = "/path/to/schema";
   * const fileName = "base.schema.md";
   *
   * // For "to project" command
   * const path1 = this.buildSchemaPath(baseDir, fileName);
   * // Returns: "/path/to/schema/to/project/base.schema.md"
   *
   * // For "summary issue" command
   * const path2 = this.buildSchemaPath(baseDir, fileName);
   * // Returns: "/path/to/schema/summary/issue/base.schema.md"
   * ```
   */
  public buildSchemaPath(baseDir: string, fileName: string): string {
    const demonstrativeType = this.getDemonstrativeType() || "";
    const layerType = this.getLayerType() || "";
    return join(baseDir, demonstrativeType, layerType, fileName);
  }

  /**
   * Gets the demonstrative type with compatibility handling
   * @returns string - The demonstrative type value
   */
  private getDemonstrativeType(): string {
    // Handle both legacy and new parameter structures
    if ("demonstrativeType" in this._cliParams) {
      return this._cliParams.demonstrativeType || "";
    }
    // For TwoParams_Result structure from breakdownparams
    const twoParams = this._cliParams as TwoParams_Result;
    if (twoParams.type === "two" && twoParams.params && twoParams.params.length > 0) {
      return twoParams.params[0] || "";
    }
    return "";
  }

  /**
   * Gets the layer type with compatibility handling
   * @returns string - The layer type value
   */
  private getLayerType(): string {
    // Handle both legacy and new parameter structures
    if ("layerType" in this._cliParams) {
      return this._cliParams.layerType || "";
    }
    // For TwoParams_Result structure from breakdownparams
    const twoParams = this._cliParams as TwoParams_Result;
    if (twoParams.type === "two" && twoParams.params && twoParams.params.length > 1) {
      return twoParams.params[1] || "";
    }
    return "";
  }
}
