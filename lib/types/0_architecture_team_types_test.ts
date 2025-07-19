/**
 * @fileoverview Architecture test for team-specific type definitions
 *
 * Validates that team types are properly structured and follow
 * Domain-Driven Design principles for team development workflows.
 *
 * @module types/0_architecture_team_types_test
 */

import { assertEquals, assertExists } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  CustomVariable,
  isCustomVariable,
  isTeamConfig,
  isTeamContextualVariables,
  isTeamPaths,
  TeamConfig,
  TeamContextualVariables,
  TeamPaths,
} from "./team_types.ts";

const logger = new BreakdownLogger("architecture:team_types");

Deno.test("Team Types: TeamConfig structure validation", () => {
  logger.debug("Testing TeamConfig structure");

  const validConfig: TeamConfig = {
    app_name: "breakdown",
    version: "1.0.0",
    profile: "team_alpha",
    team: {
      name: "Alpha Development Team",
      lead: "Sarah Johnson",
      members: ["John Doe", "Jane Smith"],
      methodology: "Agile Scrum",
    },
    prompts: {
      default_template_dir: ".agent/prompts",
      default_schema_dir: ".agent/schemas",
      custom_variables: [
        { name: "team_name", default: "Alpha Team" },
        { name: "sprint_number", default: "Sprint 1" },
      ],
    },
    output: {
      format: "markdown",
      include_metadata: true,
    },
  };

  // Type guard validation
  assertEquals(isTeamConfig(validConfig), true, "Valid config should pass type guard");

  // Structure validation
  assertExists(validConfig.team.name);
  assertExists(validConfig.team.lead);
  assertEquals(Array.isArray(validConfig.team.members), true);
  assertEquals(validConfig.prompts.custom_variables.length, 2);

  // Invalid config tests
  assertEquals(isTeamConfig({}), false, "Empty object should fail");
  assertEquals(isTeamConfig(null), false, "Null should fail");
  assertEquals(
    isTeamConfig({ app_name: "test" }),
    false,
    "Incomplete config should fail",
  );
});

Deno.test("Team Types: CustomVariable structure validation", () => {
  logger.debug("Testing CustomVariable structure");

  const validVariable: CustomVariable = {
    name: "team_name",
    default: "Default Team",
    description: "The name of the development team",
    required: true,
  };

  const minimalVariable: CustomVariable = {
    name: "sprint_number",
  };

  // Type guard validation
  assertEquals(
    isCustomVariable(validVariable),
    true,
    "Valid variable should pass type guard",
  );
  assertEquals(
    isCustomVariable(minimalVariable),
    true,
    "Minimal variable should pass type guard",
  );

  // Invalid variable tests
  assertEquals(isCustomVariable({}), false, "Empty object should fail");
  assertEquals(isCustomVariable({ value: "test" }), false, "Missing name should fail");
});

Deno.test("Team Types: TeamPaths structure validation", () => {
  logger.debug("Testing TeamPaths structure");

  const validPaths: TeamPaths = {
    promptPath: ".agent/prompts/to/project/f_project.md",
    schemaPath: ".agent/schemas/to/project/f_project.json",
    outputPath: ".agent/output/project_breakdown.md",
    baseDir: ".agent",
    outputDir: ".agent/output",
  };

  const minimalPaths: TeamPaths = {
    promptPath: "prompts/template.md",
    schemaPath: "schemas/template.json",
    outputPath: "output/result.md",
  };

  // Type guard validation
  assertEquals(isTeamPaths(validPaths), true, "Valid paths should pass type guard");
  assertEquals(isTeamPaths(minimalPaths), true, "Minimal paths should pass type guard");

  // Invalid paths tests
  assertEquals(isTeamPaths({}), false, "Empty object should fail");
  assertEquals(
    isTeamPaths({ promptPath: "test.md" }),
    false,
    "Missing required paths should fail",
  );
});

Deno.test("Team Types: TeamContextualVariables structure validation", () => {
  logger.debug("Testing TeamContextualVariables structure");

  const validVariables: TeamContextualVariables = {
    teamName: "Alpha Development Team",
    context: "feature_development",
    workflow: "agile_scrum",
    timestamp: "2024-01-01T00:00:00Z",
    environment: "development",
    sprint: "Sprint 15",
    deadline: "2024-06-30",
    priority: "high",
    tags: ["frontend", "dashboard", "enhancement"],
    metadata: {
      jira_ticket: "PROJ-123",
      github_pr: "#456",
    },
  };

  const minimalVariables: TeamContextualVariables = {
    teamName: "Beta Team",
    context: "bug_fix",
    workflow: "kanban",
    timestamp: new Date().toISOString(),
    environment: "staging",
  };

  // Type guard validation
  assertEquals(
    isTeamContextualVariables(validVariables),
    true,
    "Valid variables should pass type guard",
  );
  assertEquals(
    isTeamContextualVariables(minimalVariables),
    true,
    "Minimal variables should pass type guard",
  );

  // Invalid variables tests
  assertEquals(isTeamContextualVariables({}), false, "Empty object should fail");
  assertEquals(
    isTeamContextualVariables({ teamName: "Test" }),
    false,
    "Missing required fields should fail",
  );
});

Deno.test("Team Types: Complex integration structure", () => {
  logger.debug("Testing complex team configuration with integrations");

  const complexConfig: TeamConfig = {
    app_name: "breakdown",
    version: "2.0.0",
    profile: "enterprise_team",
    team: {
      name: "Enterprise Development Team",
      lead: "Michael Chen",
      members: [
        { name: "Alice Brown", role: "Senior Developer", email: "alice@example.com" },
        { name: "Bob Wilson", role: "DevOps Engineer" },
        "Charlie Davis", // Can be string or TeamMember object
      ],
      methodology: "SAFe",
      contact: "team-enterprise@example.com",
    },
    prompts: {
      default_template_dir: "enterprise/prompts",
      default_schema_dir: "enterprise/schemas",
      custom_variables: [
        {
          name: "release_train",
          default: "RT-2024-Q1",
          description: "SAFe Release Train identifier",
          required: true,
          pattern: "^RT-\\d{4}-Q[1-4]$",
        },
      ],
    },
    output: {
      format: "json",
      include_metadata: true,
      metadata_fields: ["timestamp", "team", "release_train"],
    },
    integrations: {
      jira: {
        enabled: true,
        board_id: "ENTERPRISE-BOARD",
        project_key: "ENT",
      },
      github: {
        enabled: true,
        org: "enterprise-org",
        repo: "main-product",
      },
      slack: {
        enabled: false,
      },
    },
  };

  assertEquals(isTeamConfig(complexConfig), true, "Complex config should be valid");
  assertExists(complexConfig.integrations?.jira);
  assertEquals(complexConfig.integrations?.jira?.enabled, true);
  assertEquals(complexConfig.team.members.length, 3);
});
