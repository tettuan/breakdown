/**
 * @fileoverview BreakdownParams統合対応 TypePatternProvider
 *
 * 設定ファイルベース実装により動的パターン読み込みを実現。
 * ハードコードされたパターン定義は完全に排除されました。
 *
 * **BreakdownParams統合**: createCustomConfigFromProfile() を使用して
 * 設定ファイルから動的にパターンを読み込む実装に移行。
 *
 * @module types/defaults/default_type_pattern_provider
 */

import { TwoParamsDirectivePattern } from "../../domain/core/value_objects/directive_type.ts";
// Note: TwoParamsLayerTypePattern has been removed (@deprecated)
import type { TypePatternProvider } from "../type_factory.ts";
import { ConfigPatternProvider } from "../../config/pattern_provider.ts";

/**
 * Default implementation of TypePatternProvider
 *
 * Uses patterns from configuration files via ConfigPatternProvider
 * for DirectiveType and LayerType validation. This enables TypeFactory
 * to work with configuration-driven patterns instead of hardcoded values.
 *
 * **Configuration-Driven**: This implementation uses ConfigPatternProvider
 * to read patterns from user configuration files, eliminating hardcoded
 * patterns and supporting dynamic pattern configuration.
 *
 * @example Basic usage
 * ```typescript
 * const _provider = new DefaultTypePatternProvider();
 * await provider.initialize(); // Load patterns from config
 * const factory = new TypeFactory(provider);
 *
 * // These will work with configured patterns from user.yml:
 * // DirectiveType and LayerType patterns are read from configuration
 * const directiveResult = factory.createDirectiveType("to");
 * const layerResult = factory.createLayerType("project");
 * ```
 *
 * @example Default patterns
 * ```typescript
 * // DirectiveType pattern: "^(to|summary|defect)$"
 * // Accepts: "to", "summary", "defect"
 * // Rejects: "invalid", "TO", "summary2", etc.
 *
 * // LayerType pattern: "^(project|issue|task)$"
 * // Accepts: "project", "issue", "task"
 * // Rejects: "invalid", "PROJECT", "task1", etc.
 * ```
 */
export class DefaultTypePatternProvider implements TypePatternProvider {
  private configProvider: ConfigPatternProvider | null = null;
  private initialized = false;

  /**
   * Initialize the provider with configuration
   * This method must be called before using the provider
   */
  async initialize(
    configSetName: string = "default",
    workspacePath: string = Deno.cwd(),
  ): Promise<void> {
    const result = await ConfigPatternProvider.create(configSetName, workspacePath);
    if (result.ok) {
      this.configProvider = result.data;
      this.initialized = true;
    } else {
      console.warn(
        "Failed to initialize ConfigPatternProvider, patterns will not be available:",
        result.error,
      );
      this.configProvider = null;
      this.initialized = true;
    }
  }

  /**
   * Get DirectiveType validation pattern from configuration
   *
   * Uses ConfigPatternProvider to read patterns from configuration files
   * instead of hardcoded values.
   *
   * @returns Pattern object for validating DirectiveType values
   */
  getDirectivePattern(): { test(value: string): boolean; getPattern(): string } | null {
    if (!this.initialized) {
      console.warn("DefaultTypePatternProvider not initialized. Call initialize() first.");
      return null;
    }

    if (!this.configProvider) {
      return null;
    }

    return this.configProvider.getDirectivePattern();
  }

  /**
   * Get DirectiveType validation pattern from configuration (internal method)
   *
   * @returns TwoParamsDirectivePattern for validating DirectiveType values
   * @throws Error if pattern creation fails or provider not initialized
   */
  getDirectivePatternObject(): TwoParamsDirectivePattern {
    const pattern = this.getDirectivePattern();
    if (!pattern) {
      throw new Error(
        "No directive pattern available. Ensure configuration is properly set up and initialize() was called.",
      );
    }
    return pattern as TwoParamsDirectivePattern;
  }

  /**
   * Get LayerType validation pattern from configuration
   *
   * Uses ConfigPatternProvider to read patterns from configuration files
   * instead of hardcoded values.
   *
   * @returns Pattern object for validating LayerType values
   */
  getLayerTypePattern(): { test(value: string): boolean; getPattern(): string } | null {
    if (!this.initialized) {
      console.warn("DefaultTypePatternProvider not initialized. Call initialize() first.");
      return null;
    }

    if (!this.configProvider) {
      return null;
    }

    return this.configProvider.getLayerTypePattern();
  }

  /**
   * Get the current configuration patterns
   *
   * @returns The current configuration patterns from ConfigPatternProvider
   */
  getDefaultConfig(): {
    params: {
      two: {
        directiveType: { pattern: string };
        layerType: { pattern: string };
      };
    };
  } {
    if (!this.initialized || !this.configProvider) {
      // Return empty patterns if not initialized
      return {
        params: {
          two: {
            directiveType: { pattern: "" },
            layerType: { pattern: "" },
          },
        },
      };
    }

    const directivePattern = this.configProvider.getDirectivePattern();
    const layerPattern = this.configProvider.getLayerTypePattern();

    return {
      params: {
        two: {
          directiveType: { pattern: directivePattern?.getPattern() || "" },
          layerType: { pattern: layerPattern?.getPattern() || "" },
        },
      },
    };
  }

  /**
   * Validate DirectiveType value against the pattern
   *
   * @param value The value to validate
   * @returns true if the value matches the pattern
   */
  validateDirectiveType(value: string): boolean {
    if (!this.initialized || !this.configProvider) {
      console.warn("DefaultTypePatternProvider not initialized. Call initialize() first.");
      return false;
    }

    return this.configProvider.validateDirectiveType(value);
  }

  /**
   * Validate LayerType value against the pattern
   *
   * Note: Pattern validation is now handled directly by LayerType.create() method.
   *
   * @param value The value to validate
   * @returns true if the value passes LayerType validation
   */
  validateLayerType(value: string): boolean {
    if (!this.initialized || !this.configProvider) {
      console.warn("DefaultTypePatternProvider not initialized. Call initialize() first.");
      return false;
    }

    return this.configProvider.validateLayerType(value);
  }

  /**
   * Get available DirectiveType values (interface compliance)
   *
   * @returns Readonly array of valid DirectiveType string values
   */
  getValidDirectiveTypes(): readonly string[] {
    return this.getValidDirectiveValues();
  }

  /**
   * Get available LayerType values (interface compliance)
   *
   * @returns Readonly array of valid LayerType string values
   */
  getValidLayerTypes(): readonly string[] {
    return this.getValidLayerValues();
  }

  /**
   * Get available DirectiveType values from the pattern
   *
   * @returns Array of valid DirectiveType string values
   */
  getValidDirectiveValues(): string[] {
    // Use configuration instead of hardcoded patterns
    if (!this.initialized) {
      console.warn("DefaultTypePatternProvider not initialized. Call initialize() first.");
      return [];
    }

    if (!this.configProvider) {
      return [];
    }

    return Array.from(this.configProvider.getValidDirectiveTypes());
  }

  /**
   * Get available LayerType values from the pattern
   *
   * @returns Array of valid LayerType string values
   */
  getValidLayerValues(): string[] {
    // Use configuration instead of hardcoded patterns
    if (!this.initialized) {
      console.warn("DefaultTypePatternProvider not initialized. Call initialize() first.");
      return [];
    }

    if (!this.configProvider) {
      return [];
    }

    return Array.from(this.configProvider.getValidLayerTypes());
  }

  /**
   * Get LayerType values (legacy compatibility method)
   *
   * @returns Array of valid LayerType string values
   */
  getLayerTypes(): string[] {
    return this.getValidLayerValues();
  }

  /**
   * Get DirectiveType values (legacy compatibility method)
   *
   * @returns Array of valid DirectiveType string values
   */
  getDirectiveTypes(): string[] {
    return this.getValidDirectiveValues();
  }

  /**
   * Debug information about the provider
   *
   * @returns Debug information object
   */
  debug(): {
    providerType: string;
    directivePattern: string;
    layerPattern: string;
    validDirectives: string[];
    validLayers: string[];
  } {
    const directivePattern = this.getDirectivePattern();
    const layerPattern = this.getLayerTypePattern();

    return {
      providerType: "DefaultTypePatternProvider",
      directivePattern: directivePattern?.getPattern() || "",
      layerPattern: layerPattern?.getPattern() || "",
      validDirectives: this.getValidDirectiveValues(),
      validLayers: this.getValidLayerValues(),
    };
  }
}
