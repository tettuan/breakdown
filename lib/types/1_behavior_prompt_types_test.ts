/**
 * @fileoverview Behavior tests for Prompt Types
 * Testing runtime behavior and error handling patterns
 *
 * Behavior tests verify:
 * - Smart Constructor validation behavior
 * - PromptVariables interface implementation behavior
 * - Error type guard functionality
 * - Error formatting correctness
 */

import { assertEquals, assertExists } from "@std/assert";
import {
  formatPromptError,
  InvalidPathError,
  isInvalidVariablesError,
  isTemplateNotFoundError,
  PromptError,
  PromptPath,
  PromptResult,
  PromptVariables,
} from "./prompt_types.ts";

Deno.test("1_behavior: PromptPath.create validates paths correctly", () => {
  // Valid path creation
  const validPaths = [
    "/templates/summary.md",
    "relative/path/prompt.txt",
    "/absolute/path/with-dashes_and_underscores.json",
    "simple.md",
    "/path/with spaces in name.txt",
    "/path/with/numbers/123/file.md",
  ];

  for (const path of validPaths) {
    const result = PromptPath.create(path);
    assertEquals(result.ok, true, `Path should be valid: ${path}`);

    if (result.ok) {
      assertEquals(result.data.toString(), path.trim());
    }
  }

  // Invalid path rejection
  const invalidPaths = [
    ["", "empty string should be rejected"],
    ["   ", "whitespace-only should be rejected"],
    ["\t\n", "whitespace characters should be rejected"],
    ["/path/../other", "path traversal should be rejected"],
    ["../relative/traversal", "relative traversal should be rejected"],
    ["/path/./sub/../other", "complex traversal should be rejected"],
  ];

  for (const [path, description] of invalidPaths) {
    const result = PromptPath.create(path);
    assertEquals(result.ok, false, description);

    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidPath");
      assertExists(result.error.message);
    }
  }
});

Deno.test("1_behavior: PromptPath trims whitespace correctly", () => {
  const pathsWithWhitespace = [
    ["  /path/to/file.md  ", "/path/to/file.md"],
    ["\t/templates/prompt.txt\n", "/templates/prompt.txt"],
    ["   relative/path.json   ", "relative/path.json"],
  ];

  for (const [input, expected] of pathsWithWhitespace) {
    const result = PromptPath.create(input);
    assertEquals(result.ok, true, `Should handle whitespace: ${input}`);

    if (result.ok) {
      assertEquals(result.data.toString(), expected);
    }
  }
});

Deno.test("1_behavior: PromptPath equality comparison works correctly", () => {
  const path1Result = PromptPath.create("/test/path.md");
  const path2Result = PromptPath.create("/test/path.md");
  const path3Result = PromptPath.create("/different/path.md");
  const path4Result = PromptPath.create("  /test/path.md  "); // With whitespace

  assertEquals(path1Result.ok, true);
  assertEquals(path2Result.ok, true);
  assertEquals(path3Result.ok, true);
  assertEquals(path4Result.ok, true);

  if (path1Result.ok && path2Result.ok && path3Result.ok && path4Result.ok) {
    // Same paths should be equal
    assertEquals(path1Result.data.equals(path2Result.data), true);

    // Trimmed paths should be equal
    assertEquals(path1Result.data.equals(path4Result.data), true);

    // Different paths should not be equal
    assertEquals(path1Result.data.equals(path3Result.data), false);

    // Reflexive equality
    assertEquals(path1Result.data.equals(path1Result.data), true);
  }
});

Deno.test("1_behavior: PromptVariables interface implementations work correctly", () => {
  // Simple object implementation
  class SimpleVariables implements PromptVariables {
    constructor(private data: Record<string, string>) {}

    toRecord(): Record<string, string> {
      return { ...this.data };
    }
  }

  const simple = new SimpleVariables({
    name: "test",
    value: "example",
    description: "A test implementation",
  });

  const simpleRecord = simple.toRecord();
  assertEquals(simpleRecord.name, "test");
  assertEquals(simpleRecord.value, "example");
  assertEquals(simpleRecord.description, "A test implementation");

  // Complex implementation with computed values
  class ComputedVariables implements PromptVariables {
    constructor(
      private baseData: Record<string, string>,
      private computedFields: string[],
    ) {}

    toRecord(): Record<string, string> {
      const result = { ...this.baseData };

      for (const field of this.computedFields) {
        if (field === "timestamp") {
          result.timestamp = new Date().toISOString();
        } else if (field === "hash") {
          result.hash = `hash_${this.baseData.name || "unknown"}`;
        }
      }

      return result;
    }
  }

  const computed = new ComputedVariables(
    { name: "test_prompt", type: "summary" },
    ["timestamp", "hash"],
  );

  const computedRecord = computed.toRecord();
  assertEquals(computedRecord.name, "test_prompt");
  assertEquals(computedRecord.type, "summary");
  assertExists(computedRecord.timestamp);
  assertEquals(computedRecord.hash, "hash_test_prompt");

  // Immutable implementation
  class ImmutableVariables implements PromptVariables {
    constructor(private readonly frozen: Record<string, string>) {
      Object.freeze(this.frozen);
    }

    toRecord(): Record<string, string> {
      // Return a copy to maintain immutability
      return Object.freeze({ ...this.frozen });
    }
  }

  const immutable = new ImmutableVariables({
    constant: "value",
    readonly: "data",
  });

  const immutableRecord = immutable.toRecord();
  assertEquals(immutableRecord.constant, "value");
  assertEquals(immutableRecord.readonly, "data");

  // Verify immutability - should not throw but should not affect original
  try {
    (immutableRecord as Record<string, unknown>).newField = "should not work";
  } catch {
    // Ignore frozen object errors in strict mode
  }

  const secondRecord = immutable.toRecord();
  assertEquals(secondRecord.constant, "value");
  assertEquals(secondRecord.readonly, "data");
});

Deno.test("1_behavior: PromptResult structure handling", () => {
  // Minimal result
  const minimal: PromptResult = {
    content: "This is a generated prompt content.",
  };

  assertEquals(minimal.content, "This is a generated prompt content.");
  assertEquals(minimal.metadata, undefined);

  // Result with partial metadata
  const withTemplate: PromptResult = {
    content: "Generated from template",
    metadata: {
      template: "/templates/summary.md",
      variables: { type: "summary", target: "project" },
    },
  };

  assertEquals(withTemplate.content, "Generated from template");
  assertExists(withTemplate.metadata);
  assertEquals(withTemplate.metadata.template, "/templates/summary.md");
  assertExists(withTemplate.metadata.variables);
  assertEquals(withTemplate.metadata.variables.type, "summary");
  assertEquals(withTemplate.metadata.timestamp, undefined);

  // Full result with all metadata
  const timestamp = new Date();
  const full: PromptResult = {
    content: "Complete prompt with full metadata",
    metadata: {
      template: "/templates/detailed.md",
      variables: {
        input: "test_input.md",
        output: "test_output.json",
        schema: "output_schema.json",
      },
      timestamp,
    },
  };

  assertEquals(full.content, "Complete prompt with full metadata");
  assertExists(full.metadata);
  assertEquals(full.metadata.template, "/templates/detailed.md");
  assertEquals(full.metadata.variables.input, "test_input.md");
  assertEquals(full.metadata.timestamp, timestamp);
});

Deno.test("1_behavior: Error type guards work correctly", () => {
  // Create different error types
  const templateNotFound: PromptError = {
    kind: "TemplateNotFound",
    path: "/missing/template.md",
  };

  const invalidVariables: PromptError = {
    kind: "InvalidVariables",
    details: ["Missing variable 'name'", "Invalid format for 'date'"],
  };

  const schemaError: PromptError = {
    kind: "SchemaError",
    schema: "output.schema.json",
    error: "Invalid JSON syntax",
  };

  const invalidPath: PromptError = {
    kind: "InvalidPath",
    message: "Path contains invalid characters",
  };

  const templateParseError: PromptError = {
    kind: "TemplateParseError",
    template: "broken.md",
    error: "Unclosed template tag",
  };

  const configError: PromptError = {
    kind: "ConfigurationError",
    message: "Missing configuration file",
  };

  // Test isTemplateNotFoundError
  assertEquals(isTemplateNotFoundError(templateNotFound), true);
  assertEquals(isTemplateNotFoundError(invalidVariables), false);
  assertEquals(isTemplateNotFoundError(schemaError), false);
  assertEquals(isTemplateNotFoundError(invalidPath), false);
  assertEquals(isTemplateNotFoundError(templateParseError), false);
  assertEquals(isTemplateNotFoundError(configError), false);

  // Test isInvalidVariablesError
  assertEquals(isInvalidVariablesError(invalidVariables), true);
  assertEquals(isInvalidVariablesError(templateNotFound), false);
  assertEquals(isInvalidVariablesError(schemaError), false);
  assertEquals(isInvalidVariablesError(invalidPath), false);
  assertEquals(isInvalidVariablesError(templateParseError), false);
  assertEquals(isInvalidVariablesError(configError), false);

  // Test type narrowing
  if (isTemplateNotFoundError(templateNotFound)) {
    assertEquals(templateNotFound.path, "/missing/template.md");
  }

  if (isInvalidVariablesError(invalidVariables)) {
    assertEquals(invalidVariables.details.length, 2);
    assertEquals(invalidVariables.details[0], "Missing variable 'name'");
  }
});

Deno.test("1_behavior: formatPromptError produces correct messages", () => {
  // Test all error type formatting
  const errorTests: Array<[PromptError, string]> = [
    [
      { kind: "TemplateNotFound", path: "/missing/template.md" },
      "TemplateNotFound: Template not found: /missing/template.md",
    ],
    [
      {
        kind: "InvalidVariables",
        details: ["Missing 'name'", "Invalid 'date'"],
      },
      "InvalidVariables: Invalid variables: Missing 'name', Invalid 'date'",
    ],
    [
      {
        kind: "SchemaError",
        schema: "output.schema.json",
        error: "Invalid JSON",
      },
      "SchemaError: Schema error in output.schema.json: Invalid JSON",
    ],
    [
      {
        kind: "InvalidPath",
        message: "Contains null character",
      },
      "InvalidPath: Invalid path: Contains null character",
    ],
    [
      {
        kind: "TemplateParseError",
        template: "broken.md",
        error: "Unclosed tag",
      },
      "TemplateParseError: Failed to parse template broken.md: Unclosed tag",
    ],
    [
      {
        kind: "ConfigurationError",
        message: "Missing config file",
      },
      "ConfigurationError: Configuration error: Missing config file",
    ],
  ];

  for (const [error, expected] of errorTests) {
    const formatted = formatPromptError(error);
    assertEquals(formatted, expected);
  }
});

Deno.test("1_behavior: formatPromptError handles edge cases", () => {
  // Empty details array
  const emptyDetails: PromptError = {
    kind: "InvalidVariables",
    details: [],
  };

  const emptyMessage = formatPromptError(emptyDetails);
  assertEquals(emptyMessage, "InvalidVariables: Invalid variables: ");

  // Single detail
  const singleDetail: PromptError = {
    kind: "InvalidVariables",
    details: ["Single error"],
  };

  const singleMessage = formatPromptError(singleDetail);
  assertEquals(singleMessage, "InvalidVariables: Invalid variables: Single error");

  // Very long paths and messages
  const longPath = "/very/long/path/that/goes/on/and/on/template.md";
  const longError: PromptError = {
    kind: "TemplateNotFound",
    path: longPath,
  };

  const longMessage = formatPromptError(longError);
  assertEquals(longMessage, `TemplateNotFound: Template not found: ${longPath}`);

  // Special characters in messages
  const specialChars: PromptError = {
    kind: "ConfigurationError",
    message: "Error with 特殊文字 and emoji 🚀",
  };

  const specialMessage = formatPromptError(specialChars);
  assertEquals(
    specialMessage,
    "ConfigurationError: Configuration error: Error with 特殊文字 and emoji 🚀",
  );
});

Deno.test("1_behavior: Error creation with realistic scenarios", () => {
  // Scenario: Template file not found during generation
  const templateMissing: PromptError = {
    kind: "TemplateNotFound",
    path: "/usr/local/breakdown/templates/project_summary.md",
  };

  assertEquals(templateMissing.kind, "TemplateNotFound");
  assertEquals(templateMissing.path, "/usr/local/breakdown/templates/project_summary.md");

  // Scenario: Missing required variables in template
  const missingVars: PromptError = {
    kind: "InvalidVariables",
    details: [
      "Variable 'project_name' is required but not provided",
      "Variable 'output_format' must be 'json' or 'yaml'",
      "Variable 'input_file' path does not exist",
    ],
  };

  assertEquals(missingVars.kind, "InvalidVariables");
  assertEquals(missingVars.details.length, 3);

  // Scenario: JSON schema validation error
  const schemaBroken: PromptError = {
    kind: "SchemaError",
    schema: "/schemas/project_breakdown.schema.json",
    error: "Unexpected token '}' at line 15, column 3",
  };

  assertEquals(schemaBroken.kind, "SchemaError");
  assertEquals(schemaBroken.schema, "/schemas/project_breakdown.schema.json");

  // Scenario: Template parsing failed
  const templateBroken: PromptError = {
    kind: "TemplateParseError",
    template: "summary_template.md",
    error: "Unclosed variable substitution '{{project_name' at line 42",
  };

  assertEquals(templateBroken.kind, "TemplateParseError");
  assertEquals(templateBroken.template, "summary_template.md");

  // Scenario: Configuration missing or invalid
  const configMissing: PromptError = {
    kind: "ConfigurationError",
    message: "Application configuration file 'app.yml' not found in working directory",
  };

  assertEquals(configMissing.kind, "ConfigurationError");
  assertEquals(configMissing.message.includes("app.yml"), true);
});

Deno.test("1_behavior: InvalidPathError specific behavior", () => {
  // InvalidPathError used by PromptPath
  const error: InvalidPathError = {
    kind: "InvalidPath",
    message: "Path cannot contain '..' for security reasons",
  };

  assertEquals(error.kind, "InvalidPath");
  assertEquals(error.message, "Path cannot contain '..' for security reasons");

  // Multiple InvalidPathError instances
  const errors: InvalidPathError[] = [
    { kind: "InvalidPath", message: "Path cannot be empty" },
    { kind: "InvalidPath", message: "Path contains null character" },
    { kind: "InvalidPath", message: "Path too long (exceeds 4096 characters)" },
  ];

  for (const err of errors) {
    assertEquals(err.kind, "InvalidPath");
    assertExists(err.message);
    assertEquals(typeof err.message, "string");
    assertEquals(err.message.length > 0, true);
  }
});

Deno.test("1_behavior: Prompt processing workflow simulation", () => {
  // Simulate a complete prompt processing workflow

  // Step 1: Create prompt path
  const pathResult = PromptPath.create("/templates/project/summary.md");
  assertEquals(pathResult.ok, true);

  if (!pathResult.ok) return; // Type guard for the rest

  // Step 2: Create variables
  class WorkflowVariables implements PromptVariables {
    constructor(
      private projectName: string,
      private inputFile: string,
      private outputFormat: string,
    ) {}

    toRecord(): Record<string, string> {
      return {
        project_name: this.projectName,
        input_file: this.inputFile,
        output_format: this.outputFormat,
        timestamp: new Date().toISOString(),
      };
    }
  }

  const variables = new WorkflowVariables(
    "breakdown-cli",
    "/input/project_structure.md",
    "json",
  );

  const variableRecord = variables.toRecord();
  assertEquals(variableRecord.project_name, "breakdown-cli");
  assertEquals(variableRecord.input_file, "/input/project_structure.md");
  assertEquals(variableRecord.output_format, "json");
  assertExists(variableRecord.timestamp);

  // Step 3: Create successful result
  const result: PromptResult = {
    content: `Generate a project breakdown for ${variableRecord.project_name}...`,
    metadata: {
      template: pathResult.data.toString(),
      variables: variableRecord,
      timestamp: new Date(),
    },
  };

  assertEquals(result.content.includes("breakdown-cli"), true);
  assertExists(result.metadata);
  assertEquals(result.metadata.template, "/templates/project/summary.md");
  assertEquals(result.metadata.variables.project_name, "breakdown-cli");

  // Step 4: Simulate error scenarios
  const possibleErrors: PromptError[] = [
    {
      kind: "TemplateNotFound",
      path: pathResult.data.toString(),
    },
    {
      kind: "InvalidVariables",
      details: ["Missing required variable 'project_name'"],
    },
    {
      kind: "SchemaError",
      schema: "/schemas/output.schema.json",
      error: "Schema file is malformed",
    },
  ];

  for (const error of possibleErrors) {
    const message = formatPromptError(error);
    assertExists(message);
    assertEquals(message.length > 0, true);
  }
});
