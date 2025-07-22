/**
 * @fileoverview Prompt Helper Prototype - Experimental prompt processing utilities
 *
 * This module provides experimental features for advanced prompt processing,
 * template enhancement, and dynamic content generation. These features are
 * prototypes for potential inclusion in the main framework.
 *
 * @module helpers/prompt_helper_prototype
 */

import { BreakdownLogger } from "@tettuan/breakdownlogger";
import type { DirectiveType, LayerType } from "../types/mod.ts";
import type {
  PromptTemplate,
  TemplateVariables,
} from "../domain/templates/prompt_generation_aggregate.ts";
import { BreakdownConfig } from "@tettuan/breakdownconfig";

/**
 * Experimental prompt enhancement options
 */
export interface PromptEnhancementOptions {
  /** Enable automatic variable detection and suggestion */
  autoDetectVariables?: boolean;
  /** Enable template validation and correction */
  validateTemplate?: boolean;
  /** Enable dynamic content injection */
  enableDynamicContent?: boolean;
  /** Language preference for generated content */
  language?: "ja" | "en";
  /** Debug mode for detailed logging */
  debug?: boolean;
}

/**
 * Variable detection result
 */
export interface VariableDetectionResult {
  /** Detected variable names */
  detectedVariables: string[];
  /** Missing variable names */
  missingVariables: string[];
  /** Suggested default values */
  suggestedDefaults: Map<string, string>;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Template enhancement result
 */
export interface TemplateEnhancementResult {
  /** Enhanced template content */
  enhancedContent: string;
  /** Applied enhancements */
  appliedEnhancements: string[];
  /** Detected issues */
  issues: string[];
  /** Success status */
  success: boolean;
}

/**
 * Dynamic content injection result
 */
export interface DynamicContentResult {
  /** Generated dynamic content */
  dynamicContent: Map<string, string>;
  /** Injection points */
  injectionPoints: string[];
  /** Generation metadata */
  metadata: {
    generatedAt: Date;
    directive: string;
    layer: string;
    language: string;
  };
}

/**
 * Prototype error class for experimental features
 */
export class PromptPrototypeError extends Error {
  constructor(
    message: string,
    public readonly feature: string,
    public readonly details?: string,
  ) {
    super(message);
    this.name = "PromptPrototypeError";
  }
}

/**
 * Experimental prompt helper class
 */
export class PromptHelperPrototype {
  private readonly logger: BreakdownLogger;
  private readonly options: Required<PromptEnhancementOptions>;

  constructor(options: PromptEnhancementOptions = {}) {
    this.logger = new BreakdownLogger("prompt-helper-prototype");
    this.options = {
      autoDetectVariables: true,
      validateTemplate: true,
      enableDynamicContent: false,
      language: "ja",
      debug: false,
      ...options,
    };

    if (this.options.debug) {
      this.logger.debug("PromptHelperPrototype initialized", { options: this.options });
    }
  }

  /**
   * Detect variables in template content
   */
  async detectVariables(
    template: PromptTemplate,
    providedVariables?: TemplateVariables,
  ): Promise<VariableDetectionResult> {
    if (!this.options.autoDetectVariables) {
      throw new PromptPrototypeError(
        "Variable detection is disabled",
        "detectVariables",
        "Enable autoDetectVariables option",
      );
    }

    const content = template.getContent().getContent();
    const requiredVars = template.getContent().getRequiredVariables();
    const providedVars = providedVariables ? Object.keys(providedVariables.toObject()) : [];

    // Detect additional variables through pattern matching for {{variable}} format
    const additionalVarsPattern = /\{\{([^}]+)\}\}/g;
    const additionalVars: string[] = [];
    let match;
    while ((match = additionalVarsPattern.exec(content)) !== null) {
      const varName = match[1].trim();
      if (!requiredVars.includes(varName) && !additionalVars.includes(varName)) {
        additionalVars.push(varName);
      }
    }

    const allDetected = [...requiredVars, ...additionalVars];
    const missing = allDetected.filter((v) => !providedVars.includes(v));

    // Generate suggested defaults based on variable names
    const suggestedDefaults = new Map<string, string>();
    for (const varName of missing) {
      const defaultValue = await this.generateDefaultValue(varName);
      suggestedDefaults.set(varName, defaultValue);
    }

    // Calculate confidence score
    const confidence = allDetected.length === 0 ? 1 : providedVars.length / allDetected.length;

    const result: VariableDetectionResult = {
      detectedVariables: allDetected,
      missingVariables: missing,
      suggestedDefaults,
      confidence,
    };

    if (this.options.debug) {
      this.logger.debug("Variable detection completed", { result });
    }

    return result;
  }

  /**
   * Enhance template with experimental features
   */
  async enhanceTemplate(
    template: PromptTemplate,
    directive: DirectiveType,
    layer: LayerType,
  ): Promise<TemplateEnhancementResult> {
    if (!this.options.validateTemplate) {
      return Promise.reject(
        new PromptPrototypeError(
          "Template enhancement is disabled",
          "enhanceTemplate",
          "Enable validateTemplate option",
        ),
      );
    }

    const content = template.getContent().getContent();
    const appliedEnhancements: string[] = [];
    const issues: string[] = [];
    let enhancedContent = content;

    try {
      // Enhancement 1: Add context header
      if (!content.includes("## Context")) {
        const contextHeader = this.generateContextHeader(directive, layer);
        enhancedContent = `${contextHeader}\n\n${enhancedContent}`;
        appliedEnhancements.push("context_header");
      }

      // Enhancement 2: Validate variable syntax
      const invalidVarPattern = /\{[^}]*\{|\}[^{]*\}/g;
      if (invalidVarPattern.test(content)) {
        issues.push("Invalid variable syntax detected");
      } else {
        appliedEnhancements.push("variable_syntax_validated");
      }

      // Enhancement 3: Add output format instructions
      if (!content.includes("## Output") && !content.includes("## Format")) {
        const outputFormat = await this.generateOutputFormat(directive, layer);
        enhancedContent = `${enhancedContent}\n\n${outputFormat}`;
        appliedEnhancements.push("output_format");
      }

      // Enhancement 4: Language-specific improvements
      if (this.options.language === "ja") {
        enhancedContent = await this.applyJapaneseEnhancements(enhancedContent);
        appliedEnhancements.push("japanese_enhancements");
      }

      if (this.options.debug) {
        this.logger.debug("Template enhancement completed", {
          appliedEnhancements,
          issues,
        });
      }

      return Promise.resolve({
        enhancedContent,
        appliedEnhancements,
        issues,
        success: true,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return Promise.resolve({
        enhancedContent: content,
        appliedEnhancements,
        issues: [...issues, `Enhancement failed: ${errorMessage}`],
        success: false,
      });
    }
  }

  /**
   * Generate dynamic content for templates
   */
  generateDynamicContent(
    directive: DirectiveType,
    layer: LayerType,
    context?: Record<string, unknown>,
  ): DynamicContentResult {
    if (!this.options.enableDynamicContent) {
      throw new PromptPrototypeError(
        "Dynamic content generation is disabled",
        "generateDynamicContent",
        "Enable enableDynamicContent option",
      );
    }

    const dynamicContent = new Map<string, string>();
    const injectionPoints: string[] = [];

    try {
      // Generate context-aware content
      const directiveValue = directive.value;
      const layerValue = layer.value;

      // Dynamic instruction generation
      const instruction = this.generateDynamicInstruction(directiveValue, layerValue, context);
      dynamicContent.set("dynamic_instruction", instruction);
      injectionPoints.push("{{dynamic_instruction}}");

      // Dynamic example generation
      const example = this.generateDynamicExample(directiveValue, layerValue);
      dynamicContent.set("dynamic_example", example);
      injectionPoints.push("{{dynamic_example}}");

      // Dynamic constraints
      const constraints = this.generateDynamicConstraints(directiveValue, layerValue);
      dynamicContent.set("dynamic_constraints", constraints);
      injectionPoints.push("{{dynamic_constraints}}");

      const metadata = {
        generatedAt: new Date(),
        directive: directiveValue,
        layer: layerValue,
        language: this.options.language,
      };

      if (this.options.debug) {
        this.logger.debug("Dynamic content generated", {
          contentCount: dynamicContent.size,
          injectionPoints,
          metadata,
        });
      }

      return {
        dynamicContent,
        injectionPoints,
        metadata,
      };
    } catch (error) {
      throw new PromptPrototypeError(
        `Dynamic content generation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        "generateDynamicContent",
        directive.value + "/" + layer.value,
      );
    }
  }

  /**
   * Validate prototype feature availability
   */
  validateFeatureAvailability(): { available: string[]; disabled: string[] } {
    const available: string[] = [];
    const disabled: string[] = [];

    if (this.options.autoDetectVariables) {
      available.push("variable_detection");
    } else {
      disabled.push("variable_detection");
    }

    if (this.options.validateTemplate) {
      available.push("template_enhancement");
    } else {
      disabled.push("template_enhancement");
    }

    if (this.options.enableDynamicContent) {
      available.push("dynamic_content");
    } else {
      disabled.push("dynamic_content");
    }

    return { available, disabled };
  }

  /**
   * Get prototype feature status
   */
  getFeatureStatus(): {
    version: string;
    features: Record<string, boolean>;
    options: PromptEnhancementOptions;
  } {
    return {
      version: "0.1.0-prototype",
      features: {
        autoDetectVariables: this.options.autoDetectVariables,
        validateTemplate: this.options.validateTemplate,
        enableDynamicContent: this.options.enableDynamicContent,
        debug: this.options.debug,
      },
      options: { ...this.options },
    };
  }

  // Private helper methods

  private async generateDefaultValue(varName: string): Promise<string> {
    try {
      const configResult = await BreakdownConfig.create("default", Deno.cwd());
      if (!configResult.success) {
        return `{${varName} value}`;
      }
      await configResult.data.loadConfig();
      const mergedConfig = await configResult.data.getConfig();
      const variableDefaults = mergedConfig.variableDefaults || {};
      const language = this.options.language || "en";

      // Check for specific variable default
      if (typeof variableDefaults !== "object" || variableDefaults === null) {
        return `{${varName} value}`;
      }
      const varDefault = (variableDefaults as Record<string, unknown>)[varName.toLowerCase()] as
        | Record<string, string>
        | undefined;
      if (varDefault && typeof varDefault === "object" && varDefault[language]) {
        let value = varDefault[language];
        // Handle special {date} placeholder
        if (value === "{date}") {
          value = new Date().toISOString().split("T")[0];
        }
        return value;
      }

      // Use default template
      const defaultTemplate = (variableDefaults as Record<string, unknown>).default as
        | Record<string, string>
        | undefined;
      if (defaultTemplate && typeof defaultTemplate === "object" && defaultTemplate[language]) {
        return defaultTemplate[language].replace("{varName}", varName);
      }

      // Ultimate fallback
      return `{${varName.toLowerCase()} value}`;
    } catch (error) {
      this.logger.warn("Failed to load variable defaults", {
        varName,
        error: String(error),
      });
      return `{${varName} value}`;
    }
  }

  private generateContextHeader(directive: DirectiveType, layer: LayerType): string {
    const directiveValue = directive.value;
    const layerValue = layer.value;

    if (this.options.language === "ja") {
      return `## Context\nDirective: ${directiveValue}\nLayer: ${layerValue}\nGenerated: ${
        new Date().toLocaleString("ja-JP")
      }`;
    } else {
      return `## Context\nDirective: ${directiveValue}\nLayer: ${layerValue}\nGenerated: ${
        new Date().toISOString()
      }`;
    }
  }

  private async generateOutputFormat(directive: DirectiveType, _layer: LayerType): Promise<string> {
    const directiveValue = directive.value;
    const language = this.options.language || "en";

    try {
      // Load configuration-based output formats instead of hardcoded switch statements
      const configResult = await BreakdownConfig.create("default", Deno.cwd());
      if (!configResult.success) {
        throw new Error(`Config creation failed: ${configResult.error}`);
      }
      await configResult.data.loadConfig();
      const mergedConfig = await configResult.data.getConfig();

      // Access outputFormats from config (added to default-app.yml)
      const outputFormats = mergedConfig.outputFormats || {};

      // Get format for this directive and language
      if (typeof outputFormats !== "object" || outputFormats === null) {
        return "## Output Format\nProvide output in the specified format.";
      }
      const directiveFormat = (outputFormats as Record<string, unknown>)[directiveValue] as
        | Record<string, string>
        | undefined;
      if (directiveFormat && typeof directiveFormat === "object" && directiveFormat[language]) {
        return directiveFormat[language];
      }

      // Fallback to default format
      const defaultFormat = (outputFormats as Record<string, unknown>).default as
        | Record<string, string>
        | undefined;
      if (defaultFormat && typeof defaultFormat === "object" && defaultFormat[language]) {
        return defaultFormat[language];
      }

      // Ultimate fallback
      return "## Output Format\nProvide output in the specified format.";
    } catch (error) {
      // Fallback on configuration error
      this.logger.warn("Failed to load output format configuration", {
        directive: directiveValue,
        language,
        error: String(error),
      });
      return "## Output Format\nProvide output in the specified format.";
    }
  }

  private async applyJapaneseEnhancements(content: string): Promise<string> {
    try {
      const configResult = await BreakdownConfig.create("default", Deno.cwd());
      if (!configResult.success) {
        return content;
      }
      await configResult.data.loadConfig();
      const mergedConfig = await configResult.data.getConfig();
      const textEnhancements = mergedConfig.textEnhancements || {};
      const language = this.options.language || "en";
      if (typeof textEnhancements !== "object" || textEnhancements === null) {
        return content;
      }
      const langEnhancements = (textEnhancements as Record<string, unknown>)[language] as
        | Record<string, unknown>
        | undefined;

      if (!langEnhancements) {
        return content;
      }

      let enhanced = content;

      // Apply replacements from config
      if (
        langEnhancements && typeof langEnhancements === "object" &&
        "replacements" in langEnhancements && Array.isArray(langEnhancements.replacements)
      ) {
        for (
          const replacement of langEnhancements.replacements as Array<
            { from: string; to: string; flags?: string }
          >
        ) {
          const regex = new RegExp(replacement.from, replacement.flags || "g");
          enhanced = enhanced.replace(regex, replacement.to);
        }
      }

      // Apply formatting from config
      if (
        langEnhancements && typeof langEnhancements === "object" &&
        "formatting" in langEnhancements && typeof langEnhancements.formatting === "object" &&
        langEnhancements.formatting !== null
      ) {
        const formatting = langEnhancements.formatting as { sectionSeparator?: string };
        const { sectionSeparator } = formatting;
        if (sectionSeparator) {
          enhanced = enhanced.replace(/\n\n/g, sectionSeparator);
        }
      }

      return enhanced;
    } catch (error) {
      this.logger.warn("Failed to apply language enhancements", {
        language: this.options.language,
        error: String(error),
      });
      return content;
    }
  }

  private generateDynamicInstruction(
    directive: string,
    layer: string,
    context?: Record<string, unknown>,
  ): string {
    const contextInfo = context ? ` (Context: ${Object.keys(context).join(", ")})` : "";

    if (this.options.language === "ja") {
      return `Execute ${directive} processing at ${layer} level${contextInfo}.`;
    } else {
      return `Execute ${directive} processing at ${layer} level${contextInfo}.`;
    }
  }

  private generateDynamicExample(directive: string, layer: string): string {
    if (this.options.language === "ja") {
      return `Example: ${directive} processing example at ${layer} level:`;
    } else {
      return `Example: ${directive} processing example at ${layer} level:`;
    }
  }

  private generateDynamicConstraints(directive: string, layer: string): string {
    if (this.options.language === "ja") {
      return `Constraints: ${directive} processing must follow ${layer} level constraints.`;
    } else {
      return `Constraints: ${directive} processing must follow ${layer} level constraints.`;
    }
  }
}

/**
 * Factory function for creating PromptHelperPrototype instances
 */
export function createPromptHelperPrototype(
  options: PromptEnhancementOptions = {},
): PromptHelperPrototype {
  return new PromptHelperPrototype(options);
}

/**
 * Utility function to check if a feature is experimental
 */
export function isExperimentalFeature(featureName: string): boolean {
  const experimentalFeatures = [
    "variable_detection",
    "template_enhancement",
    "dynamic_content",
    "japanese_enhancements",
  ];
  return experimentalFeatures.includes(featureName);
}

/**
 * Get list of all available experimental features
 */
export function getExperimentalFeatures(): string[] {
  return [
    "variable_detection",
    "template_enhancement",
    "dynamic_content",
    "japanese_enhancements",
    "auto_context_generation",
    "smart_defaults",
  ];
}
