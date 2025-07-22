/**
 * @fileoverview Templates Domain Module - Unified exports for template management
 *
 * This module provides a unified interface for all template-related domain functionality,
 * including aggregates, repositories, services, and value objects.
 *
 * @module domain/templates
 */

// Core Aggregates
export {
  GeneratedPrompt,
  PromptGenerationAggregate,
  PromptGenerationError,
  PromptTemplate,
  TemplateContent,
  TemplatePath,
  TemplateVariables,
} from "./prompt_generation_aggregate.ts";

export {
  type DependencyValidationResult,
  type ImportResult,
  Schema,
  SchemaContent,
  SchemaManagementAggregate,
  type SchemaMetadata,
  SchemaPath,
  SchemaRegistry,
  type ValidationResult,
} from "./schema_management_aggregate.ts";

// Repository Interfaces
export type {
  TemplateManifest,
  TemplateManifestEntry,
  TemplateQueryOptions,
  TemplateRepository,
} from "./template_repository.ts";

export { TemplateNotFoundError, TemplateValidationError } from "./template_repository.ts";

export type {
  SchemaBatchResult,
  SchemaManifest,
  SchemaManifestEntry,
  SchemaQueryOptions,
  SchemaRepository,
} from "./schema_repository.ts";

export {
  SchemaDependencyError,
  SchemaNotFoundError,
  SchemaValidationError,
} from "./schema_repository.ts";

// Domain Services
export {
  type FallbackAction,
  GenerationPolicy,
  type GenerationPolicyConfig,
  type ResolutionContext,
  type SelectionContext,
  type TemplateSelectionStrategy,
  type ValidationError as PolicyValidationError,
  type ValidationResult as PolicyValidationResult,
  type ValidationWarning as PolicyValidationWarning,
  type VariableResolutionStrategy,
  type VariableValidationRule,
} from "./generation_policy.ts";

export {
  ExactPathStrategy,
  type ResolutionErrorType,
  type ResolutionStrategy,
  StandardNamingStrategy,
  type TemplateResolutionRequest,
  type TemplateResolutionResult,
  TemplateResolverService,
} from "./template_resolver_service.ts";

// Template Management Context
export {
  type InitializationOptions,
  type InitializationResult,
  InitializationService,
  TemplateManagementContext,
  TemplateRegistry,
  type TemplateRegistryEntry,
  type TemplateValidationResult,
  type ValidationError as ContextValidationError,
  ValidationPolicy,
  type ValidationWarning as ContextValidationWarning,
} from "./template_management_context.ts";

// Value Objects
export {
  type ChecksumAlgorithm,
  type ContentMetadata,
  SchemaId,
  type SubstitutionStrategy,
  TemplateChecksum,
  TemplateContent as ValueObjectTemplateContent,
  TemplateId,
  TemplateVersion,
  VariableSubstitution,
} from "./template_value_objects.ts";

// Type Adapters
export {
  TypedPathResolver,
  TypedTemplatePathFactory,
  TypedVariableFactory,
  TypeIntegrationUtils,
  TypeValidator,
} from "./type_adapters.ts";

// Schema Reader Service
export {
  createTemplateSchemaReader,
  type SchemaBatchReadResult,
  type SchemaReadOptions,
  type SchemaReadResult,
  TemplateSchemaReader,
} from "./template_schema_reader.ts";

/**
 * Factory function to create a complete template management setup
 */
export async function createTemplateManagement(config: {
  baseDirectory?: string;
  cacheEnabled?: boolean;
  templateRepository?: unknown; // TODO: Fix proper type reference
  schemaRepository?: unknown; // TODO: Fix proper type reference
}) {
  // This would create and wire up all the dependencies
  // Implementation depends on the specific infrastructure choices

  const baseDir = config.baseDirectory || Deno.cwd();

  // Create repositories if not provided
  const templateRepo = config.templateRepository ||
    new (await import("../../infrastructure/templates/file_template_repository.ts"))
      .FileTemplateRepository({
      baseDirectory: baseDir,
      cacheEnabled: config.cacheEnabled ?? true,
    });

  const schemaRepo = config.schemaRepository ||
    new (await import("../../infrastructure/templates/file_schema_repository.ts"))
      .FileSchemaRepository({
      baseDirectory: baseDir,
      cacheEnabled: config.cacheEnabled ?? true,
    });

  // Create template management context
  // TODO: Fix after proper type imports are available
  const context = null; // TemplateManagementContext.create(templateRepo, schemaRepo);

  // Create resolver service
  // TODO: Fix after proper type imports are available
  const resolver = null; // new TemplateResolverService(templateRepo, schemaRepo);

  return {
    context,
    resolver,
    templateRepository: templateRepo,
    schemaRepository: schemaRepo,
  };
}
