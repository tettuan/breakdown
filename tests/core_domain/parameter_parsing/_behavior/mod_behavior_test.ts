/**
 * @fileoverview Unit tests for types module (mod.ts)
 *
 * Tests functionality and behavior:
 * - Type creation and validation
 * - Result type operations
 * - Variable type functionality
 * - Error handling scenarios
 * - Integration between types
 *
 * @module types/mod_unit_test
 */

import { assertEquals, assertExists, assertThrows } from "../../../lib/deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Import all exports for comprehensive testing
import {
  all,
  chain,
  // Config types
  ConfigError,
  ConfigProfileName,
  createPromptParams,
  // Legacy types
  DemonstrativeType,
  DemonstrativeTypeFactory,
  DemonstrativeTypeGuards,
  // Totality types
  DirectiveType,
  error,
  FilePathVariable,
  FilePathVariableName,
  getOrElse,
  isError,
  isOk,
  LayerType,
  LegacyLayerType,
  LegacyLayerTypeFactory,
  LegacyLayerTypeGuards,
  map,
  ok,
  ParamsCustomConfig,
  PromptVariable,
  PromptVariables,
  Result,
  // Result types
  ResultStatus,
  // PromptVariables
  StandardVariable,
  StandardVariableName,
  StdinVariable,
  StdinVariableName,
  toPromptParamsVariables,
  TwoParamsDirectivePattern,
  TwoParamsLayerTypePattern,
  TypeCreationError,
  TypeCreationResult,
  TypeFactory,
  TypePatternProvider,
  UserVariable,
} from "../../../lib/deps.ts";

const logger = new BreakdownLogger("types-mod-unit");

describe("Unit: Totality type creation", () => {
  it("should create valid DirectiveType instances", () => {
    logger.debug("Testing DirectiveType creation");

    const validResult = {
      type: "two" as const,
      demonstrativeType: "to",
      layerType: "project",
      params: ["param1", "param2"],
      options: {},
    };

    const directive = DirectiveType.create(validResult);
    assertExists(directive, "Should create DirectiveType");
    assertEquals(directive.value, "to", "Should have correct value");
    assertEquals(directive.getValue(), "to", "getValue() should work");
    assertEquals(directive.toString(), "DirectiveType(to)", "toString() should format correctly");

    logger.debug("DirectiveType creation verified");
  });

  it("should create valid LayerType instances", () => {
    logger.debug("Testing LayerType creation");

    const validResult = {
      type: "two" as const,
      demonstrativeType: "to",
      layerType: "project",
      params: ["param1", "param2"],
      options: {},
    };

    const layer = LayerType.create(validResult);
    assertExists(layer, "Should create LayerType");
    assertEquals(layer.value, "project", "Should have correct value");
    assertEquals(layer.getValue(), "project", "getValue() should work");
    assertEquals(layer.getHierarchyLevel(), 1, "Should return correct hierarchy level");
    assertEquals(layer.isStandardHierarchy(), true, "Should identify standard hierarchy");

    logger.debug("LayerType creation verified");
  });

  it("should create valid ConfigProfileName instances", () => {
    logger.debug("Testing ConfigProfileName creation");

    // Valid profile names
    const valid = ConfigProfileName.create("production");
    assertExists(valid, "Should create ConfigProfileName");
    assertEquals(valid.value, "production", "Should have correct value");

    // Invalid profile names
    const invalid = ConfigProfileName.create("INVALID");
    assertExists(invalid, "Should create ConfigProfileName even for invalid input");
    assertEquals(invalid.value, null, "Invalid input should result in null value");

    // Empty string
    const empty = ConfigProfileName.create("");
    assertEquals(empty.value, null, "Empty string should result in null value");

    // Null input
    const nullInput = ConfigProfileName.create(null);
    assertEquals(nullInput.value, null, "Null input should result in null value");

    logger.debug("ConfigProfileName creation verified");
  });
});

describe("Unit: TypeFactory functionality", () => {
  it("should create types through TypeFactory", () => {
    logger.debug("Testing TypeFactory");

    const patternProvider: TypePatternProvider = {
      getDirectivePattern: () => TwoParamsDirectivePattern.create("to|summary|defect|init|find"),
      getLayerTypePattern: () => TwoParamsLayerTypePattern.create("project|issue|task|bugs|temp"),
    };

    const factory = new TypeFactory(patternProvider);

    // Create DirectiveType
    const directiveResult = factory.createDirectiveType("to");
    assertEquals(directiveResult.ok, true, "Should create valid directive");
    if (directiveResult.ok) {
      assertEquals(directiveResult.data.value, "to", "Should have correct value");
    }

    // Create LayerType
    const layerResult = factory.createLayerType("project");
    assertEquals(layerResult.ok, true, "Should create valid layer");
    if (layerResult.ok) {
      assertEquals(layerResult.data.value, "project", "Should have correct value");
    }

    // Create both types
    const bothResult = factory.createBothTypes("summary", "issue");
    assertEquals(bothResult.ok, true, "Should create both types");
    if (bothResult.ok) {
      assertEquals(bothResult.data.directive.value, "summary");
      assertEquals(bothResult.data.layer.value, "issue");
    }

    logger.debug("TypeFactory verified");
  });

  it("should handle invalid inputs in TypeFactory", () => {
    logger.debug("Testing TypeFactory error handling");

    const patternProvider: TypePatternProvider = {
      getDirectivePattern: () => TwoParamsDirectivePattern.create("to|summary"),
      getLayerTypePattern: () => TwoParamsLayerTypePattern.create("project|issue"),
    };

    const factory = new TypeFactory(patternProvider);

    // Invalid directive
    const invalidDirective = factory.createDirectiveType("invalid");
    assertEquals(invalidDirective.ok, false, "Should fail for invalid directive");
    if (!invalidDirective.ok) {
      assertExists(invalidDirective.error);
      // The error structure may vary, just ensure there's an error
    }

    // Invalid layer
    const invalidLayer = factory.createLayerType("invalid");
    assertEquals(invalidLayer.ok, false, "Should fail for invalid layer");

    // Invalid both
    const invalidBoth = factory.createBothTypes("invalid", "invalid");
    assertEquals(invalidBoth.ok, false, "Should fail for invalid inputs");

    logger.debug("TypeFactory error handling verified");
  });
});

describe("Unit: PromptVariable types", () => {
  it("should create and use StandardVariable", () => {
    logger.debug("Testing StandardVariable");

    const result = StandardVariable.create(
      "destination_path",
      "/output/file.md",
    );

    assertEquals(result.ok, true, "Should create valid StandardVariable");
    if (result.ok) {
      const variable = result.data;
      assertEquals(variable.name.getValue(), "destination_path");
      assertEquals(variable.value, "/output/file.md");

      const record = variable.toRecord();
      assertEquals(record.destination_path, "/output/file.md");
    }

    logger.debug("StandardVariable verified");
  });

  it("should create and use FilePathVariable", () => {
    logger.debug("Testing FilePathVariable");

    const result = FilePathVariable.create(
      "schema_file",
      "/path/to/schema.json",
    );

    assertEquals(result.ok, true, "Should create valid FilePathVariable");
    if (result.ok) {
      const variable = result.data;
      assertEquals(variable.name.getValue(), "schema_file");
      assertEquals(variable.value, "/path/to/schema.json");

      const record = variable.toRecord();
      assertEquals(record.schema_file, "/path/to/schema.json");
    }

    logger.debug("FilePathVariable verified");
  });

  it("should create and use StdinVariable", () => {
    logger.debug("Testing StdinVariable");

    const result = StdinVariable.create(
      "input_text",
      "Content from stdin",
    );

    assertEquals(result.ok, true, "Should create valid StdinVariable");
    if (result.ok) {
      const variable = result.data;
      assertEquals(variable.name.getValue(), "input_text");
      assertEquals(variable.value, "Content from stdin");

      const record = variable.toRecord();
      assertEquals(record.input_text, "Content from stdin");
    }

    logger.debug("StdinVariable verified");
  });

  it("should create and use UserVariable", () => {
    logger.debug("Testing UserVariable");

    const result = UserVariable.create("custom-key", "custom-value");

    assertEquals(result.ok, true, "Should create valid UserVariable");
    if (result.ok) {
      const variable = result.data;
      assertEquals(variable.name, "custom-key");
      assertEquals(variable.value, "custom-value");

      const record = variable.toRecord();
      assertEquals(record["custom-key"], "custom-value");
    }

    logger.debug("UserVariable verified");
  });
});

describe("Unit: Result type operations", () => {
  it("should create and manipulate Result types", () => {
    logger.debug("Testing Result operations");

    // Create success Result
    const success = ok(42);
    assertEquals(isOk(success), true);
    assertEquals(isError(success), false);
    assertEquals(success.ok, true);
    if (success.ok) {
      assertEquals(success.data, 42);
    }

    // Create error Result
    const failure = error("Something went wrong");
    assertEquals(isOk(failure), false);
    assertEquals(isError(failure), true);
    assertEquals(failure.ok, false);
    if (!failure.ok) {
      assertEquals(failure.error, "Something went wrong");
    }

    logger.debug("Result creation verified");
  });

  it("should map over Result values", () => {
    logger.debug("Testing Result map");

    const success = ok(10);
    const mapped = map(success, (x) => x * 2);

    assertEquals(isOk(mapped), true);
    if (mapped.ok) {
      assertEquals(mapped.data, 20);
    }

    const failure = error("error");
    const mappedError = map(failure, (x) => x * 2);

    assertEquals(isError(mappedError), true);
    if (!mappedError.ok) {
      assertEquals(mappedError.error, "error");
    }

    logger.debug("Result map verified");
  });

  it("should chain Result operations", () => {
    logger.debug("Testing Result chain");

    const success = ok(10);
    const chained = chain(success, (x) => ok(x + 5));

    assertEquals(isOk(chained), true);
    if (chained.ok) {
      assertEquals(chained.data, 15);
    }

    const chainedError = chain(success, (x) => error(`Cannot process ${x}`));
    assertEquals(isError(chainedError), true);

    logger.debug("Result chain verified");
  });

  it("should provide default values with getOrElse", () => {
    logger.debug("Testing Result getOrElse");

    const success = ok(42);
    const value = getOrElse(success, 0);
    assertEquals(value, 42);

    const failure = error("error");
    const defaultValue = getOrElse(failure, 0);
    assertEquals(defaultValue, 0);

    logger.debug("Result getOrElse verified");
  });

  it("should combine multiple Results with all", () => {
    logger.debug("Testing Result all");

    const allSuccess = all([ok(1), ok(2), ok(3)]);
    assertEquals(isOk(allSuccess), true);
    if (allSuccess.ok) {
      assertEquals(allSuccess.data, [1, 2, 3]);
    }

    const withError = all([ok(1), error("fail"), ok(3)]);
    assertEquals(isError(withError), true);
    if (!withError.ok) {
      assertEquals(withError.error, "fail");
    }

    logger.debug("Result all verified");
  });
});

describe("Unit: Configuration types", () => {
  it("should handle ConfigError", () => {
    logger.debug("Testing ConfigError");

    const configError = new ConfigError("Missing required field", "MISSING_FIELD");
    assertExists(configError);
    assertEquals(configError.message, "Missing required field");
    assertEquals(configError.code, "MISSING_FIELD");
    assertEquals(configError.name, "ConfigError");

    logger.debug("ConfigError verified");
  });

  it("should create ParamsCustomConfig", () => {
    logger.debug("Testing ParamsCustomConfig");

    const userConfig = {
      breakdown: {
        params: {
          two: {
            demonstrativeType: {
              pattern: "to|summary|defect",
              errorMessage: "Invalid demonstrative type",
            },
            layerType: {
              pattern: "project|issue|task",
              errorMessage: "Invalid layer type",
            },
          },
        },
      },
    };

    // ParamsCustomConfig has a static create method
    const result = ParamsCustomConfig.create(userConfig);
    assertExists(result);

    // Check if creation was successful
    assertEquals(result.status, ResultStatus.SUCCESS);
    if (result.status === ResultStatus.SUCCESS && result.data !== undefined) {
      // Verify the merged config structure
      assertExists(result.data.params);
      assertExists(result.data.params.two);
      assertExists(result.data.params.two.demonstrativeType);
      assertExists(result.data.params.two.layerType);
      assertEquals(result.data.params.two.demonstrativeType.pattern, "to|summary|defect");
      assertEquals(result.data.params.two.layerType.pattern, "project|issue|task");
    }

    logger.debug("ParamsCustomConfig verified");
  });
});

describe("Unit: Legacy type compatibility", () => {
  it("should maintain legacy type guards", () => {
    logger.debug("Testing legacy type guards");

    // DemonstrativeType guards expect objects with kind and value
    const toType = { kind: "to" as const, value: "to" as const };
    const summaryType = { kind: "summary" as const, value: "summary" as const };
    const defectType = { kind: "defect" as const, value: "defect" as const };
    const initType = { kind: "init" as const, value: "init" as const };
    const findType = { kind: "find" as const, value: "find" as const };
    const invalidDemo = { kind: "invalid", value: "invalid" } as any;

    assertEquals(DemonstrativeTypeGuards.isTo(toType), true);
    assertEquals(DemonstrativeTypeGuards.isSummary(summaryType), true);
    assertEquals(DemonstrativeTypeGuards.isDefect(defectType), true);
    assertEquals(DemonstrativeTypeGuards.isInit(initType), true);
    assertEquals(DemonstrativeTypeGuards.isFind(findType), true);
    assertEquals(DemonstrativeTypeGuards.isTo(invalidDemo), false);

    // LayerType guards
    const projectType = { kind: "project" as const, value: "project" as const };
    const issueType = { kind: "issue" as const, value: "issue" as const };
    const taskType = { kind: "task" as const, value: "task" as const };
    const bugsType = { kind: "bugs" as const, value: "bugs" as const };
    const tempType = { kind: "temp" as const, value: "temp" as const };
    const invalidLayer = { kind: "invalid", value: "invalid" } as any;

    assertEquals(LegacyLayerTypeGuards.isProject(projectType), true);
    assertEquals(LegacyLayerTypeGuards.isIssue(issueType), true);
    assertEquals(LegacyLayerTypeGuards.isTask(taskType), true);
    assertEquals(LegacyLayerTypeGuards.isBugs(bugsType), true);
    assertEquals(LegacyLayerTypeGuards.isTemp(tempType), true);
    assertEquals(LegacyLayerTypeGuards.isProject(invalidLayer), false);

    logger.debug("Legacy type guards verified");
  });

  it("should maintain legacy factories", () => {
    logger.debug("Testing legacy factories");

    // DemonstrativeTypeFactory creates type objects
    const toType = DemonstrativeTypeFactory.to();
    assertEquals(toType.kind, "to");
    assertEquals(toType.value, "to");

    const summaryType = DemonstrativeTypeFactory.summary();
    assertEquals(summaryType.kind, "summary");
    assertEquals(summaryType.value, "summary");

    // Test fromString method
    const fromString = DemonstrativeTypeFactory.fromString("defect");
    assertExists(fromString);
    assertEquals(fromString?.kind, "defect");
    assertEquals(fromString?.value, "defect");

    const invalidFromString = DemonstrativeTypeFactory.fromString("invalid");
    assertEquals(invalidFromString, null);

    // LegacyLayerTypeFactory
    const projectType = LegacyLayerTypeFactory.project();
    assertEquals(projectType.kind, "project");
    assertEquals(projectType.value, "project");

    const fromStringLayer = LegacyLayerTypeFactory.fromString("issue");
    assertExists(fromStringLayer);
    assertEquals(fromStringLayer?.kind, "issue");
    assertEquals(fromStringLayer?.value, "issue");

    logger.debug("Legacy factories verified");
  });
});

describe("Unit: Integration between types", () => {
  it("should convert variables to prompt params", () => {
    logger.debug("Testing variable to prompt params conversion");

    // Create variables using the factory methods
    const standardResult = StandardVariable.create("destination_path", "output.md");
    const filePathResult = FilePathVariable.create("schema_file", "schema.json");
    const stdinResult = StdinVariable.create("input_text", "stdin content");
    const userResult = UserVariable.create("project", "my-project");

    // Ensure all are created successfully
    assertEquals(standardResult.ok, true);
    assertEquals(filePathResult.ok, true);
    assertEquals(stdinResult.ok, true);
    assertEquals(userResult.ok, true);

    if (standardResult.ok && filePathResult.ok && stdinResult.ok && userResult.ok) {
      const variables: PromptVariable[] = [
        standardResult.data,
        filePathResult.data,
        stdinResult.data,
        userResult.data,
      ];

      const promptVars = toPromptParamsVariables(variables);
      assertExists(promptVars);

      // toPromptParamsVariables returns a flat Record<string, string>
      assertEquals(promptVars.destination_path, "output.md");
      assertEquals(promptVars.schema_file, "schema.json");
      assertEquals(promptVars.input_text, "stdin content");
      assertEquals(promptVars.project, "my-project");
    }

    logger.debug("Variable conversion verified");
  });

  it("should create prompt params from components", () => {
    logger.debug("Testing prompt params creation");

    // createPromptParams takes templateFile and variables array
    const standardResult = StandardVariable.create("destination_path", "output.md");
    const filePathResult = FilePathVariable.create("schema_file", "schema.json");
    const stdinResult = StdinVariable.create("input_text", "content");
    const userResult1 = UserVariable.create("project", "test-project");
    const userResult2 = UserVariable.create("version", "1.0.0");

    if (
      standardResult.ok && filePathResult.ok && stdinResult.ok && userResult1.ok && userResult2.ok
    ) {
      const variables: PromptVariable[] = [
        standardResult.data,
        filePathResult.data,
        stdinResult.data,
        userResult1.data,
        userResult2.data,
      ];

      const params = createPromptParams("template.md", variables);

      assertExists(params);
      assertEquals(params.template_file, "template.md");
      assertExists(params.variables);

      // Verify all variables are in the flat structure
      assertEquals(params.variables.destination_path, "output.md");
      assertEquals(params.variables.schema_file, "schema.json");
      assertEquals(params.variables.input_text, "content");
      assertEquals(params.variables.project, "test-project");
      assertEquals(params.variables.version, "1.0.0");
    }

    logger.debug("Prompt params creation verified");
  });
});
