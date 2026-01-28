/**
 * @fileoverview Base class for path resolvers implementing common patterns
 *
 * This module provides a base class that encapsulates common functionality
 * shared across all path resolvers:
 * - Smart Constructor pattern with Result type
 * - CLI parameter extraction and normalization
 * - Config normalization
 * - Result type handling utilities
 *
 * @module factory/path_resolver_base
 */

import { isAbsolute, resolve } from "jsr:@std/path@^1.0.9";
import type { Result } from "../types/result.ts";
import { error as resultError, ok as resultOk } from "../types/result.ts";
import type { PathResolutionError } from "../types/path_resolution_option.ts";
import type { TwoParams_Result } from "../deps.ts";

/**
 * Common CLI parameters interface used across resolvers
 * Uses generic options type to accommodate both PromptCliOptions and Record<string, unknown>
 */
export interface PromptCliParamsBase<TOptions = Record<string, unknown>> {
  directiveType: string;
  layerType: string;
  options: TOptions;
}

/**
 * Unified CLI parameters type for resolver operations
 * Accepts any object with directiveType, layerType, and options properties
 */
export type ResolverCliParams =
  | PromptCliParamsBase<Record<string, unknown>>
  | TwoParams_Result
  | { directiveType: string; layerType: string; options: unknown };

/**
 * Base configuration interface for all resolvers
 */
export interface BaseResolverConfig {
  workingDir: string;
}

/**
 * Abstract base class for path resolvers
 *
 * Provides common functionality for:
 * - CLI parameter extraction (directive type, layer type)
 * - Configuration normalization
 * - Result type utilities
 * - Validation patterns
 */
export abstract class PathResolverBase<TConfig extends BaseResolverConfig> {
  protected readonly config: TConfig;
  protected readonly cliParams: ResolverCliParams;
  protected readonly cwd: string;

  /**
   * Protected constructor - subclasses use Smart Constructor pattern
   */
  protected constructor(
    config: TConfig,
    cliParams: ResolverCliParams,
  ) {
    this.config = config;
    this.cliParams = this.deepCopyCliParams(cliParams);
    this.cwd = Deno.cwd();
  }

  /**
   * Validates base configuration presence and type
   */
  protected static validateBaseConfig(
    config: unknown,
  ): Result<Record<string, unknown>, PathResolutionError> {
    if (!config || typeof config !== "object" || Array.isArray(config)) {
      return resultError({
        kind: "InvalidConfiguration",
        details: "Configuration must be a non-null object",
      });
    }
    return resultOk(config as Record<string, unknown>);
  }

  /**
   * Validates CLI parameters presence and type
   */
  protected static validateCliParams(
    cliParams: unknown,
  ): Result<ResolverCliParams, PathResolutionError> {
    if (!cliParams || typeof cliParams !== "object" || Array.isArray(cliParams)) {
      return resultError({
        kind: "InvalidConfiguration",
        details: "CLI parameters must be a non-null object",
      });
    }
    return resultOk(cliParams as ResolverCliParams);
  }

  /**
   * Validates that directive and layer types are present and non-empty
   */
  protected static validateParameterTypes(
    cliParams: ResolverCliParams,
  ): Result<void, PathResolutionError> {
    const directiveType = PathResolverBase.extractDirectiveType(cliParams);
    const layerType = PathResolverBase.extractLayerType(cliParams);

    if (!directiveType || !layerType) {
      return resultError({
        kind: "InvalidParameterCombination",
        directiveType: directiveType || "(missing)",
        layerType: layerType || "(missing)",
      });
    }

    if (directiveType.trim() === "" || layerType.trim() === "") {
      return resultError({
        kind: "InvalidParameterCombination",
        directiveType: directiveType || "(empty)",
        layerType: layerType || "(empty)",
      });
    }

    return resultOk(undefined);
  }

  /**
   * Extract directive type from CLI parameters
   * Handles both legacy PromptCliParams and TwoParams_Result formats
   */
  protected static extractDirectiveType(cliParams: ResolverCliParams): string {
    if ("directiveType" in cliParams && cliParams.directiveType) {
      return cliParams.directiveType;
    }
    const twoParams = cliParams as TwoParams_Result;
    if (twoParams.type === "two" && twoParams.params && twoParams.params.length > 0) {
      return twoParams.params[0] || "";
    }
    return "";
  }

  /**
   * Extract layer type from CLI parameters
   * Handles both legacy PromptCliParams and TwoParams_Result formats
   */
  protected static extractLayerType(cliParams: ResolverCliParams): string {
    if ("layerType" in cliParams && cliParams.layerType) {
      return cliParams.layerType;
    }
    const twoParams = cliParams as TwoParams_Result;
    if (twoParams.type === "two" && twoParams.params && twoParams.params.length > 1) {
      return twoParams.params[1] || "";
    }
    return "";
  }

  /**
   * Get directive type from instance's CLI params
   */
  protected getDirectiveType(): string {
    return PathResolverBase.extractDirectiveType(this.cliParams);
  }

  /**
   * Get layer type from instance's CLI params
   */
  protected getLayerType(): string {
    return PathResolverBase.extractLayerType(this.cliParams);
  }

  /**
   * Get options from CLI params with type safety
   */
  protected getOptions<T = Record<string, unknown>>(): T {
    if ("options" in this.cliParams) {
      return (this.cliParams.options as T) || ({} as T);
    }
    const twoParams = this.cliParams as TwoParams_Result;
    return ((twoParams as unknown as { options?: T }).options || {}) as T;
  }

  /**
   * Resolve a path relative to working directory
   */
  protected resolveToWorkingDir(path: string, workingDir?: string): string {
    const baseDir = workingDir || this.config.workingDir || this.cwd;
    if (isAbsolute(path)) {
      return path;
    }
    return resolve(baseDir, path);
  }

  /**
   * Deep copy CLI parameters for immutability
   */
  protected deepCopyCliParams(cliParams: ResolverCliParams): ResolverCliParams {
    if ("type" in cliParams && cliParams.type === "two") {
      const twoParams = cliParams as TwoParams_Result;
      const copy: TwoParams_Result = {
        type: "two",
        params: twoParams.params ? [...twoParams.params] : [],
        directiveType: twoParams.directiveType || twoParams.params?.[0] || "",
        layerType: twoParams.params?.[1] || "",
        options: { ...twoParams.options },
      };
      return copy;
    } else {
      const promptParams = cliParams as PromptCliParamsBase;
      const copy: PromptCliParamsBase = {
        directiveType: promptParams.directiveType || "",
        layerType: promptParams.layerType || "",
        options: promptParams.options ? { ...promptParams.options } : {},
      };
      return copy;
    }
  }

  /**
   * Debug logging utility - only outputs when LOG_LEVEL=debug
   */
  protected debugLog(context: string, data: Record<string, unknown>): void {
    const isDebug = Deno.env.get("LOG_LEVEL") === "debug";
    if (isDebug) {
      console.log(`[${context}]`, JSON.stringify(data, null, 2));
    }
  }
}

/**
 * Utility functions for path resolution error handling
 */
export function createInvalidConfigError(details: string): PathResolutionError {
  return { kind: "InvalidConfiguration", details };
}

export function createBaseDirectoryNotFoundError(path: string): PathResolutionError {
  return { kind: "BaseDirectoryNotFound", path };
}

export function createTemplateNotFoundError(
  attempted: string[],
  fallback?: string,
): PathResolutionError {
  return { kind: "TemplateNotFound", attempted, fallback };
}

export function createInvalidParameterCombinationError(
  directiveType: string,
  layerType: string,
): PathResolutionError {
  return { kind: "InvalidParameterCombination", directiveType, layerType };
}
