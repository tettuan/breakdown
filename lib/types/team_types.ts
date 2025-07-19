/**
 * @fileoverview Team-specific type definitions for Breakdown
 *
 * This module defines types for team development workflows, custom variables,
 * and team-specific configurations following Domain-Driven Design principles.
 *
 * These types support:
 * - Team-specific configuration management
 * - Custom variable resolution and substitution
 * - Team-specific path resolution
 * - Contextual variables for team workflows
 *
 * @module types/team_types
 */

/**
 * Team member information
 */
export interface TeamMember {
  name: string;
  role: string;
  email?: string;
}

/**
 * Team information structure
 */
export interface TeamInfo {
  name: string;
  lead: string;
  members: (string | TeamMember)[];
  methodology: string;
  contact?: string;
}

/**
 * Prompt configuration for teams
 */
export interface TeamPromptConfig {
  default_template_dir: string;
  default_schema_dir: string;
  custom_variables: CustomVariable[];
}

/**
 * Output configuration for teams
 */
export interface TeamOutputConfig {
  format: string;
  include_metadata: boolean;
  metadata_fields?: string[];
}

/**
 * Integration settings for teams
 */
export interface TeamIntegration {
  jira?: {
    enabled: boolean;
    board_id: string;
    project_key: string;
  };
  github?: {
    enabled: boolean;
    org: string;
    repo: string;
  };
  slack?: {
    enabled: boolean;
    channel?: string;
    webhook_url?: string;
  };
}

/**
 * Team configuration structure
 * Represents complete team-specific configuration including
 * metadata, team info, prompts, output settings, and integrations
 */
export interface TeamConfig {
  app_name: string;
  version: string;
  profile: string;
  team: TeamInfo;
  prompts: TeamPromptConfig;
  output: TeamOutputConfig;
  integrations?: TeamIntegration;
}

/**
 * Custom variable definition
 * Represents a single custom variable with name, value, and optional metadata
 */
export interface CustomVariable {
  name: string;
  value?: string;
  default?: string;
  description?: string;
  required?: boolean;
  pattern?: string;
}

/**
 * Team-specific path resolution result
 * Contains resolved paths for prompts, schemas, and outputs
 */
export interface TeamPaths {
  promptPath: string;
  schemaPath: string;
  outputPath: string;
  baseDir?: string;
  outputDir?: string;
}

/**
 * Team contextual variables
 * Dynamic variables generated based on team context, workflow, and current state
 */
export interface TeamContextualVariables {
  teamName: string;
  context: string;
  workflow: string;
  timestamp: string;
  environment: string;
  sprint?: string;
  deadline?: string;
  priority?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

/**
 * Type guard for TeamConfig
 */
export function isTeamConfig(value: unknown): value is TeamConfig {
  if (!value || typeof value !== "object") {
    return false;
  }

  const config = value as Record<string, unknown>;
  return (
    typeof config.app_name === "string" &&
    typeof config.version === "string" &&
    typeof config.profile === "string" &&
    isTeamInfo(config.team) &&
    isTeamPromptConfig(config.prompts) &&
    isTeamOutputConfig(config.output)
  );
}

/**
 * Type guard for TeamInfo
 */
export function isTeamInfo(value: unknown): value is TeamInfo {
  if (!value || typeof value !== "object") {
    return false;
  }

  const info = value as Record<string, unknown>;
  return (
    typeof info.name === "string" &&
    typeof info.lead === "string" &&
    Array.isArray(info.members) &&
    typeof info.methodology === "string"
  );
}

/**
 * Type guard for TeamPromptConfig
 */
export function isTeamPromptConfig(value: unknown): value is TeamPromptConfig {
  if (!value || typeof value !== "object") {
    return false;
  }

  const config = value as Record<string, unknown>;
  return (
    typeof config.default_template_dir === "string" &&
    typeof config.default_schema_dir === "string" &&
    Array.isArray(config.custom_variables)
  );
}

/**
 * Type guard for TeamOutputConfig
 */
export function isTeamOutputConfig(value: unknown): value is TeamOutputConfig {
  if (!value || typeof value !== "object") {
    return false;
  }

  const config = value as Record<string, unknown>;
  return (
    typeof config.format === "string" &&
    typeof config.include_metadata === "boolean"
  );
}

/**
 * Type guard for CustomVariable
 */
export function isCustomVariable(value: unknown): value is CustomVariable {
  if (!value || typeof value !== "object") {
    return false;
  }

  const variable = value as Record<string, unknown>;
  return typeof variable.name === "string";
}

/**
 * Type guard for TeamPaths
 */
export function isTeamPaths(value: unknown): value is TeamPaths {
  if (!value || typeof value !== "object") {
    return false;
  }

  const paths = value as Record<string, unknown>;
  return (
    typeof paths.promptPath === "string" &&
    typeof paths.schemaPath === "string" &&
    typeof paths.outputPath === "string"
  );
}

/**
 * Type guard for TeamContextualVariables
 */
export function isTeamContextualVariables(value: unknown): value is TeamContextualVariables {
  if (!value || typeof value !== "object") {
    return false;
  }

  const vars = value as Record<string, unknown>;
  return (
    typeof vars.teamName === "string" &&
    typeof vars.context === "string" &&
    typeof vars.workflow === "string" &&
    typeof vars.timestamp === "string" &&
    typeof vars.environment === "string"
  );
}
