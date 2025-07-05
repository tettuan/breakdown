/**
 * @fileoverview Default Generation Strategies - Infrastructure implementations
 *
 * This module provides default implementations of generation strategies
 * for variable resolution and template selection.
 *
 * @module infrastructure/templates/default_generation_strategies
 */

import type { DirectiveType, LayerType } from "../../types/mod.ts";
import { TemplatePath } from "../../domain/templates/prompt_generation_aggregate.ts";
import type {
  ResolutionContext,
  SelectionContext,
  TemplateSelectionStrategy,
  VariableResolutionStrategy,
} from "../../domain/templates/generation_policy.ts";
import { join } from "@std/path";
import { exists } from "@std/fs";

/**
 * Environment variable resolution strategy
 */
export class EnvironmentVariableStrategy implements VariableResolutionStrategy {
  constructor(private readonly prefix: string = "BREAKDOWN_") {}

  async resolve(variableName: string, context: ResolutionContext): Promise<string | undefined> {
    const envName = this.prefix + variableName.toUpperCase();
    return Deno.env.get(envName) || context.environmentVariables?.[envName];
  }

  getPriority(): number {
    return 10; // Low priority
  }
}

/**
 * File path resolution strategy
 */
export class FilePathResolutionStrategy implements VariableResolutionStrategy {
  async resolve(variableName: string, context: ResolutionContext): Promise<string | undefined> {
    // Special handling for file path variables
    if (variableName === "input_text_file" && context.providedVariables.fromFile) {
      const path = context.providedVariables.fromFile;
      if (path === "-") return "stdin";

      // Resolve relative paths
      const absolutePath = join(context.workingDirectory, path);
      if (await exists(absolutePath)) {
        return absolutePath;
      }
      return path; // Return as-is if not found
    }

    if (variableName === "destination_path" && context.providedVariables.destinationFile) {
      const path = context.providedVariables.destinationFile;
      return join(context.workingDirectory, path);
    }

    return undefined;
  }

  getPriority(): number {
    return 50; // Medium priority
  }
}

/**
 * Default value resolution strategy
 */
export class DefaultValueStrategy implements VariableResolutionStrategy {
  private readonly defaults: Map<string, string>;

  constructor(defaults: Record<string, string> = {}) {
    this.defaults = new Map(Object.entries({
      schema_file: "",
      adaptation: "",
      ...defaults,
    }));
  }

  async resolve(variableName: string): Promise<string | undefined> {
    return this.defaults.get(variableName);
  }

  getPriority(): number {
    return 1; // Lowest priority
  }
}

/**
 * Standard template selection strategy
 */
export class StandardTemplateSelectionStrategy implements TemplateSelectionStrategy {
  constructor(
    private readonly defaultFilename: string = "f_",
  ) {}

  selectTemplate(
    directive: DirectiveType,
    layer: LayerType,
    context: SelectionContext,
  ): TemplatePath {
    // Use custom path if provided
    if (context.customPath) {
      const parts = context.customPath.split("/");
      if (parts.length >= 3) {
        const filename = parts[parts.length - 1];
        return TemplatePath.create(directive, layer, filename);
      }
    }

    // Build standard filename
    const filename = `${this.defaultFilename}${layer.getValue()}.md`;
    return TemplatePath.create(directive, layer, filename);
  }
}

/**
 * Fallback template selection strategy
 */
export class FallbackTemplateSelectionStrategy implements TemplateSelectionStrategy {
  constructor(
    private readonly primary: TemplateSelectionStrategy,
    private readonly fallbackMappings: Map<string, string>,
  ) {}

  selectTemplate(
    directive: DirectiveType,
    layer: LayerType,
    context: SelectionContext,
  ): TemplatePath {
    const primaryPath = this.primary.selectTemplate(directive, layer, context);

    if (!context.fallbackEnabled) {
      return primaryPath;
    }

    // Check for fallback mapping
    const key = `${directive.getValue()}/${layer.getValue()}`;
    const fallbackFilename = this.fallbackMappings.get(key);

    if (fallbackFilename) {
      return TemplatePath.create(directive, layer, fallbackFilename);
    }

    return primaryPath;
  }
}

/**
 * Create default variable resolution strategies
 */
export function createDefaultVariableStrategies(): VariableResolutionStrategy[] {
  return [
    new FilePathResolutionStrategy(),
    new EnvironmentVariableStrategy(),
    new DefaultValueStrategy(),
  ];
}

/**
 * Create default template selection strategy
 */
export function createDefaultSelectionStrategy(): TemplateSelectionStrategy {
  const fallbackMappings = new Map([
    // Add any default fallback mappings here
    ["defect/project", "f_project.md"],
    ["defect/issue", "f_issue.md"],
    ["defect/task", "f_task.md"],
  ]);

  return new FallbackTemplateSelectionStrategy(
    new StandardTemplateSelectionStrategy(),
    fallbackMappings,
  );
}
