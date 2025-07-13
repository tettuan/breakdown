/**
 * @fileoverview Template Value Objects - Domain value objects for template management
 *
 * This module contains value objects that encapsulate template-related concepts
 * with proper validation and immutability guarantees.
 *
 * @module domain/templates/template_value_objects
 */

import type { DirectiveType, LayerType } from "../../types/mod.ts";

/**
 * Template identifier value object
 */
export class TemplateId {
  private constructor(
    private readonly value: string,
  ) {}

  static create(directive: DirectiveType, layer: LayerType, filename: string): TemplateId {
    const id = `${directive.value}/${layer.value}/${filename}`;
    TemplateId.validate(id);
    return new TemplateId(id);
  }

  static fromString(value: string): TemplateId {
    TemplateId.validate(value);
    return new TemplateId(value);
  }

  private static validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error("Template ID cannot be empty");
    }

    const parts = value.split("/");
    if (parts.length < 3) {
      throw new Error("Template ID must have format: directive/layer/filename");
    }

    const filename = parts[parts.length - 1];
    if (!filename.endsWith(".md")) {
      throw new Error("Template filename must end with .md");
    }
  }

  getValue(): string {
    return this.value;
  }

  getDirectivePart(): string {
    return this.value.split("/")[0];
  }

  getLayerPart(): string {
    return this.value.split("/")[1];
  }

  getFilenamePart(): string {
    const parts = this.value.split("/");
    return parts[parts.length - 1];
  }

  equals(other: TemplateId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * Schema identifier value object
 */
export class SchemaId {
  private constructor(
    private readonly value: string,
  ) {}

  static create(directive: DirectiveType, layer: LayerType, filename: string): SchemaId {
    const id = `${directive.value}/${layer.value}/${filename}`;
    SchemaId.validate(id);
    return new SchemaId(id);
  }

  static fromString(value: string): SchemaId {
    SchemaId.validate(value);
    return new SchemaId(value);
  }

  private static validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error("Schema ID cannot be empty");
    }

    const parts = value.split("/");
    if (parts.length < 3) {
      throw new Error("Schema ID must have format: directive/layer/filename");
    }

    const filename = parts[parts.length - 1];
    if (!filename.endsWith(".json")) {
      throw new Error("Schema filename must end with .json");
    }
  }

  getValue(): string {
    return this.value;
  }

  getDirectivePart(): string {
    return this.value.split("/")[0];
  }

  getLayerPart(): string {
    return this.value.split("/")[1];
  }

  getFilenamePart(): string {
    const parts = this.value.split("/");
    return parts[parts.length - 1];
  }

  equals(other: SchemaId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * Template content value object with enhanced validation
 */
export class TemplateContent {
  private constructor(
    private readonly rawContent: string,
    private readonly variables: Set<string>,
    private readonly metadata: ContentMetadata,
  ) {}

  static create(content: string, metadata?: Partial<ContentMetadata>): TemplateContent {
    TemplateContent.validate(content);

    const variables = TemplateContent.extractVariables(content);
    const fullMetadata: ContentMetadata = {
      encoding: metadata?.encoding || "utf-8",
      language: metadata?.language || "markdown",
      lineEnding: metadata?.lineEnding || "lf",
      size: content.length,
      lastModified: metadata?.lastModified || new Date(),
    };

    return new TemplateContent(content, variables, fullMetadata);
  }

  private static validate(content: string): void {
    if (typeof content !== "string") {
      throw new Error("Template content must be a string");
    }

    if (content.length === 0) {
      throw new Error("Template content cannot be empty");
    }

    // Check for suspicious content patterns
    if (content.includes("{{") && !content.includes("}}")) {
      throw new Error("Template contains malformed variable syntax");
    }
  }

  private static extractVariables(content: string): Set<string> {
    const variables = new Set<string>();

    // Extract {variable} patterns
    const curlyBracePattern = /\{([^}]+)\}/g;
    let match;
    while ((match = curlyBracePattern.exec(content)) !== null) {
      const variable = match[1].trim();
      if (variable.length > 0) {
        variables.add(variable);
      }
    }

    // Extract {{variable}} patterns (if supported)
    const doubleCurlyPattern = /\{\{([^}]+)\}\}/g;
    while ((match = doubleCurlyPattern.exec(content)) !== null) {
      const variable = match[1].trim();
      if (variable.length > 0) {
        variables.add(variable);
      }
    }

    return variables;
  }

  getContent(): string {
    return this.rawContent;
  }

  getVariables(): string[] {
    return Array.from(this.variables).sort();
  }

  hasVariable(name: string): boolean {
    return this.variables.has(name);
  }

  getMetadata(): ContentMetadata {
    return { ...this.metadata };
  }

  getWordCount(): number {
    return this.rawContent.split(/\s+/).filter((word) => word.length > 0).length;
  }

  getLineCount(): number {
    return this.rawContent.split(/\r?\n/).length;
  }

  isEmpty(): boolean {
    return this.rawContent.trim().length === 0;
  }

  equals(other: TemplateContent): boolean {
    return this.rawContent === other.rawContent;
  }
}

/**
 * Content metadata interface
 */
export interface ContentMetadata {
  encoding: string;
  language: string;
  lineEnding: "lf" | "crlf" | "cr";
  size: number;
  lastModified: Date;
}

/**
 * Variable substitution value object
 */
export class VariableSubstitution {
  private constructor(
    private readonly variables: Map<string, string>,
    private readonly strategy: SubstitutionStrategy,
  ) {}

  static create(
    variables: Record<string, unknown>,
    strategy: SubstitutionStrategy = "strict",
  ): VariableSubstitution {
    const variableMap = new Map<string, string>();

    for (const [key, value] of Object.entries(variables)) {
      VariableSubstitution.validateVariable(key, value);
      variableMap.set(key.trim(), value as string);
    }

    return new VariableSubstitution(variableMap, strategy);
  }

  private static validateVariable(key: string, value: unknown): void {
    if (!key || key.trim().length === 0) {
      throw new Error("Variable name cannot be empty");
    }

    if (typeof value !== "string") {
      throw new Error(`Variable value for '${key}' must be a string`);
    }

    // Check for invalid variable names
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key.trim())) {
      throw new Error(
        `Invalid variable name: '${key}'. Must start with letter or underscore, contain only alphanumeric characters and underscores`,
      );
    }
  }

  get(name: string): string | undefined {
    return this.variables.get(name);
  }

  has(name: string): boolean {
    return this.variables.has(name);
  }

  getAll(): Record<string, string> {
    return Object.fromEntries(this.variables);
  }

  getStrategy(): SubstitutionStrategy {
    return this.strategy;
  }

  apply(content: TemplateContent): string {
    let result = content.getContent();
    const requiredVars = content.getVariables();
    const missingVars = requiredVars.filter((v) => !this.has(v));

    if (this.strategy === "strict" && missingVars.length > 0) {
      throw new Error(`Missing required variables: ${missingVars.join(", ")}`);
    }

    // Apply substitutions
    for (const [name, value] of this.variables) {
      const pattern = new RegExp(`\\{${this.escapeRegex(name)}\\}`, "g");
      result = result.replace(pattern, value);
    }

    // Handle missing variables based on strategy
    if (this.strategy === "ignore") {
      // Leave unreplaced variables as-is
    } else if (this.strategy === "empty") {
      // Replace with empty string
      for (const varName of missingVars) {
        const pattern = new RegExp(`\\{${this.escapeRegex(varName)}\\}`, "g");
        result = result.replace(pattern, "");
      }
    }

    return result;
  }

  private escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  merge(other: VariableSubstitution): VariableSubstitution {
    const merged = new Map(this.variables);
    for (const [key, value] of other.variables) {
      merged.set(key, value);
    }
    return new VariableSubstitution(merged, this.strategy);
  }

  equals(other: VariableSubstitution): boolean {
    if (this.variables.size !== other.variables.size) return false;
    if (this.strategy !== other.strategy) return false;

    for (const [key, value] of this.variables) {
      if (other.get(key) !== value) return false;
    }

    return true;
  }
}

/**
 * Substitution strategy
 */
export type SubstitutionStrategy = "strict" | "ignore" | "empty";

/**
 * Template version value object
 */
export class TemplateVersion {
  private constructor(
    private readonly major: number,
    private readonly minor: number,
    private readonly patch: number,
    private readonly prerelease?: string,
  ) {}

  static create(version: string): TemplateVersion {
    const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
    if (!match) {
      throw new Error(
        `Invalid version format: ${version}. Expected format: major.minor.patch[-prerelease]`,
      );
    }

    const major = parseInt(match[1], 10);
    const minor = parseInt(match[2], 10);
    const patch = parseInt(match[3], 10);
    const prerelease = match[4];

    return new TemplateVersion(major, minor, patch, prerelease);
  }

  static initial(): TemplateVersion {
    return new TemplateVersion(1, 0, 0);
  }

  toString(): string {
    const base = `${this.major}.${this.minor}.${this.patch}`;
    return this.prerelease ? `${base}-${this.prerelease}` : base;
  }

  getMajor(): number {
    return this.major;
  }

  getMinor(): number {
    return this.minor;
  }

  getPatch(): number {
    return this.patch;
  }

  getPrerelease(): string | undefined {
    return this.prerelease;
  }

  incrementMajor(): TemplateVersion {
    return new TemplateVersion(this.major + 1, 0, 0);
  }

  incrementMinor(): TemplateVersion {
    return new TemplateVersion(this.major, this.minor + 1, 0);
  }

  incrementPatch(): TemplateVersion {
    return new TemplateVersion(this.major, this.minor, this.patch + 1);
  }

  isCompatibleWith(other: TemplateVersion): boolean {
    return this.major === other.major;
  }

  isNewerThan(other: TemplateVersion): boolean {
    if (this.major !== other.major) return this.major > other.major;
    if (this.minor !== other.minor) return this.minor > other.minor;
    if (this.patch !== other.patch) return this.patch > other.patch;

    // Handle prerelease comparison
    if (this.prerelease && !other.prerelease) return false;
    if (!this.prerelease && other.prerelease) return true;
    if (this.prerelease && other.prerelease) {
      return this.prerelease > other.prerelease;
    }

    return false;
  }

  equals(other: TemplateVersion): boolean {
    return this.toString() === other.toString();
  }
}

/**
 * Template checksum value object for integrity verification
 */
export class TemplateChecksum {
  private constructor(
    private readonly value: string,
    private readonly algorithm: ChecksumAlgorithm,
  ) {}

  static async create(
    content: string,
    algorithm: ChecksumAlgorithm = "sha256",
  ): Promise<TemplateChecksum> {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);

    let hashBuffer: ArrayBuffer;
    switch (algorithm) {
      case "sha256":
        hashBuffer = await crypto.subtle.digest("SHA-256", data);
        break;
      case "sha1":
        hashBuffer = await crypto.subtle.digest("SHA-1", data);
        break;
      case "md5":
        // Note: MD5 is not available in Web Crypto API
        // This would need a separate implementation
        throw new Error("MD5 not supported in this environment");
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }

    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    return new TemplateChecksum(hashHex, algorithm);
  }

  getValue(): string {
    return this.value;
  }

  getAlgorithm(): ChecksumAlgorithm {
    return this.algorithm;
  }

  async verify(content: string): Promise<boolean> {
    const newChecksum = await TemplateChecksum.create(content, this.algorithm);
    return this.value === newChecksum.value;
  }

  equals(other: TemplateChecksum): boolean {
    return this.value === other.value && this.algorithm === other.algorithm;
  }

  toString(): string {
    return `${this.algorithm}:${this.value}`;
  }
}

/**
 * Supported checksum algorithms
 */
export type ChecksumAlgorithm = "sha256" | "sha1" | "md5";
