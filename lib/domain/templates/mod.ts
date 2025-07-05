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
  type GenerationResult,
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
  type FallbackStrategy,
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
  FallbackStrategy as ResolverFallbackStrategy,
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
  LegacyTemplateAdapter,
  TypedPathResolver,
  TypedTemplatePathFactory,
  TypedVariableFactory,
  TypeIntegrationUtils,
  TypeValidator,
} from "./type_adapters.ts";

/**
 * Factory function to create a complete template management setup
 */
export function createTemplateManagement(config: {
  baseDirectory?: string;
  cacheEnabled?: boolean;
  templateRepository?: TemplateRepository;
  schemaRepository?: SchemaRepository;
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
  const context = TemplateManagementContext.create(templateRepo, schemaRepo);

  // Create resolver service
  const resolver = new TemplateResolverService(templateRepo, schemaRepo);

  return {
    context,
    resolver,
    templateRepository: templateRepo,
    schemaRepository: schemaRepo,
  };
}

/**
 * Convenience function for legacy compatibility
 */
export async function createLegacyCompatibleGenerator() {
  const management = await createTemplateManagement({});

  // Import the DDD adapter
  const { PromptFileGeneratorDDD } = await import("../../commands/prompt_file_generator_ddd.ts");

  return new PromptFileGeneratorDDD();
}
