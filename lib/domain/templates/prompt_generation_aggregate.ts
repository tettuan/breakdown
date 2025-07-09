/**
 * @fileoverview Prompt Generation Aggregate - Core domain model for prompt generation
 *
 * This aggregate encapsulates the business logic for generating prompts from templates.
 * It ensures all invariants are maintained during the prompt generation process.
 *
 * @module domain/templates/prompt_generation_aggregate
 */

import type { DirectiveType, LayerType } from "../../types/mod.ts";
import type { Result } from "../../types/result.ts";
import { ok, error } from "../../types/result.ts";

/**
 * Template path value object
 */
export class TemplatePath {
  private constructor(
    private readonly directive: DirectiveType,
    private readonly layer: LayerType,
    private readonly filename: string,
  ) {}

  static create(directive: DirectiveType, layer: LayerType, filename: string): Result<TemplatePath, string> {
    if (!filename.endsWith(".md")) {
      return error(`Invalid template filename: ${filename}. Must end with .md`);
    }
    return ok(new TemplatePath(directive, layer, filename));
  }

  getPath(): string {
    return `${this.directive.getValue()}/${this.layer.getValue()}/${this.filename}`;
  }

  getDirective(): DirectiveType {
    return this.directive;
  }

  getLayer(): LayerType {
    return this.layer;
  }

  getFilename(): string {
    return this.filename;
  }
}

/**
 * Template content value object
 */
export class TemplateContent {
  private constructor(
    private readonly content: string,
    private readonly variables: Set<string>,
  ) {}

  static create(content: string): TemplateContent {
    const variables = TemplateContent.extractVariables(content);
    return new TemplateContent(content, variables);
  }

  private static extractVariables(content: string): Set<string> {
    const pattern = /\{([^}]+)\}/g;
    const variables = new Set<string>();
    let match;
    while ((match = pattern.exec(content)) !== null) {
      variables.add(match[1]);
    }
    return variables;
  }

  getContent(): string {
    return this.content;
  }

  getRequiredVariables(): string[] {
    return Array.from(this.variables);
  }

  hasVariable(name: string): boolean {
    return this.variables.has(name);
  }
}

/**
 * Template variables value object
 */
export class TemplateVariables {
  private constructor(
    private readonly variables: Map<string, string>,
  ) {}

  static create(variables: Record<string, string>): TemplateVariables {
    return new TemplateVariables(new Map(Object.entries(variables)));
  }

  get(key: string): string | undefined {
    return this.variables.get(key);
  }

  has(key: string): boolean {
    return this.variables.has(key);
  }

  toObject(): Record<string, string> {
    return Object.fromEntries(this.variables);
  }

  merge(other: TemplateVariables): TemplateVariables {
    const merged = new Map(this.variables);
    for (const [key, value] of other.variables) {
      merged.set(key, value);
    }
    return new TemplateVariables(merged);
  }
}

/**
 * Prompt template entity
 */
export class PromptTemplate {
  private constructor(
    private readonly path: TemplatePath,
    private readonly content: TemplateContent,
    private readonly metadata: TemplateMetadata,
  ) {}

  static create(
    path: TemplatePath,
    content: string,
    metadata?: Partial<TemplateMetadata>,
  ): Result<PromptTemplate, string> {
    if (!content || content.trim() === "") {
      return error("Template content cannot be empty");
    }
    
    const templateContent = TemplateContent.create(content);
    const fullMetadata: TemplateMetadata = {
      version: metadata?.version || "1.0.0",
      description: metadata?.description || "",
      author: metadata?.author || "system",
      createdAt: metadata?.createdAt || new Date(),
      updatedAt: metadata?.updatedAt || new Date(),
    };
    return ok(new PromptTemplate(path, templateContent, fullMetadata));
  }

  getPath(): TemplatePath {
    return this.path;
  }

  getContent(): TemplateContent {
    return this.content;
  }

  getMetadata(): TemplateMetadata {
    return { ...this.metadata };
  }

  /**
   * Generate prompt by applying variables to template
   */
  generate(variables: TemplateVariables): Result<GeneratedPrompt, PromptGenerationError> {
    const requiredVars = this.content.getRequiredVariables();
    const missingVars = requiredVars.filter((v) => !variables.has(v));

    if (missingVars.length > 0) {
      return error(new PromptGenerationError(
        `Missing required variables: ${missingVars.join(", ")}`,
        this.path,
        missingVars,
      ));
    }

    let result = this.content.getContent();
    for (const varName of requiredVars) {
      const value = variables.get(varName) || "";
      result = result.replace(new RegExp(`\\{${varName}\\}`, "g"), value);
    }

    return ok(GeneratedPrompt.create(this, result, variables));
  }
}

/**
 * Generated prompt value object
 */
export class GeneratedPrompt {
  private constructor(
    private readonly template: PromptTemplate,
    private readonly content: string,
    private readonly appliedVariables: TemplateVariables,
    private readonly generatedAt: Date,
  ) {}

  static create(
    template: PromptTemplate,
    content: string,
    variables: TemplateVariables,
  ): GeneratedPrompt {
    return new GeneratedPrompt(template, content, variables, new Date());
  }

  getContent(): string {
    return this.content;
  }

  getTemplate(): PromptTemplate {
    return this.template;
  }

  getAppliedVariables(): TemplateVariables {
    return this.appliedVariables;
  }

  getGeneratedAt(): Date {
    return this.generatedAt;
  }
}

/**
 * Prompt generation aggregate root
 */
export class PromptGenerationAggregate {
  private constructor(
    private readonly id: string,
    private readonly template: PromptTemplate,
    private state: GenerationState,
  ) {}

  static create(id: string, template: PromptTemplate): Result<PromptGenerationAggregate, string> {
    if (!id || id.trim() === "") {
      return error("Aggregate ID cannot be empty");
    }
    return ok(new PromptGenerationAggregate(id, template, {
      status: "initialized",
      attempts: 0,
      errors: [],
    }));
  }

  getId(): string {
    return this.id;
  }

  getTemplate(): PromptTemplate {
    return this.template;
  }

  getState(): GenerationState {
    return { ...this.state };
  }

  /**
   * Generate prompt with validation and state management
   */
  generatePrompt(variables: TemplateVariables): Result<GeneratedPrompt, PromptGenerationError> {
    this.state = {
      ...this.state,
      status: "generating",
      attempts: this.state.attempts + 1,
    };

    const generateResult = this.template.generate(variables);

    if (!generateResult.ok) {
      this.state = {
        ...this.state,
        status: "failed",
        errors: [...this.state.errors, generateResult.error],
      };
      return error(generateResult.error);
    }

    const prompt = generateResult.data;
    this.state = {
      ...this.state,
      status: "completed",
      lastGenerated: prompt,
    };

    return ok(prompt);
  }

  canRetry(): boolean {
    return this.state.status === "failed" && this.state.attempts < 3;
  }
}

/**
 * Template metadata
 */
interface TemplateMetadata {
  version: string;
  description: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Generation state
 */
interface GenerationState {
  status: "initialized" | "generating" | "completed" | "failed";
  attempts: number;
  errors: (Error | PromptGenerationError)[];
  lastGenerated?: GeneratedPrompt;
}


/**
 * Prompt generation error
 */
export class PromptGenerationError extends Error {
  constructor(
    message: string,
    public readonly templatePath: TemplatePath,
    public readonly missingVariables?: string[],
  ) {
    super(message);
    this.name = "PromptGenerationError";
  }
}
