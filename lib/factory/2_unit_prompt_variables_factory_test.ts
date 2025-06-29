/**
 * Unit tests for PromptVariablesFactory with Totality type migration support
 * 
 * Tests both legacy and new Totality-compliant interfaces during migration period.
 * This ensures backward compatibility while providing new type-safe interfaces.
 */

import { assertEquals, assertExists, assertInstanceOf } from "@std/assert";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

// Legacy imports (deprecated but still supported)
import { PromptVariablesFactory, type PromptCliParams } from "./prompt_variables_factory.ts";
import type { DemonstrativeType, LayerType } from "../types/mod.ts";

// New Totality-compliant imports
import { 
  TypeFactory, 
  type TypePatternProvider,
  type TypeCreationResult,
  DirectiveType,
  NewLayerType as LayerTypeClass,
  TwoParamsDirectivePattern,
  TwoParamsLayerTypePattern
} from "../types/mod.ts";

const logger = new BreakdownLogger("factory-test");

// Mock TypePatternProvider for testing
class MockTypePatternProvider implements TypePatternProvider {
  constructor(
    private directivePattern: string = "to|summary|defect|init|find",
    private layerPattern: string = "project|issue|task|bugs|temp"
  ) {}

  getDirectivePattern(): TwoParamsDirectivePattern | null {
    return TwoParamsDirectivePattern.create(this.directivePattern);
  }

  getLayerTypePattern(): TwoParamsLayerTypePattern | null {
    return TwoParamsLayerTypePattern.create(this.layerPattern);
  }
}

describe("PromptVariablesFactory - Legacy Interface Tests", () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    testDir = await Deno.makeTempDir();
    originalCwd = Deno.cwd();
    Deno.chdir(testDir);

    // Setup test configuration
    const configDir = `${testDir}/.agent/breakdown/config`;
    await Deno.mkdir(configDir, { recursive: true });
    
    await Deno.writeTextFile(
      `${configDir}/default-app.yml`,
      `working_dir: .\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`
    );

    // Create minimal prompt and schema structure
    await Deno.mkdir(`${testDir}/prompts/to/issue`, { recursive: true });
    await Deno.mkdir(`${testDir}/schema/to/issue`, { recursive: true });
    
    await Deno.writeTextFile(
      `${testDir}/prompts/to/issue/f_project.md`,
      "# Test Prompt\nDestination: {destination_path}"
    );
    
    await Deno.writeTextFile(
      `${testDir}/schema/to/issue/base.schema.md`,
      '{"type": "object", "properties": {"content": {"type": "string"}}}'
    );
  });

  afterEach(async () => {
    Deno.chdir(originalCwd);
    await Deno.remove(testDir, { recursive: true });
  });

  it("should create factory with legacy PromptCliParams", async () => {
    logger.debug("Testing legacy PromptCliParams interface");
    
    const legacyParams: PromptCliParams = {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "issue" as LayerType,
      options: {
        fromFile: "input.md",
        destinationFile: "output.md"
      }
    };

    const factory = await PromptVariablesFactory.create(legacyParams);
    
    assertExists(factory);
    assertEquals(factory.promptFilePath.includes("prompts/to/issue/f_project.md"), true);
    assertEquals(factory.schemaFilePath.includes("schema/to/issue/base.schema.md"), true);
  });

  it("should validate all legacy parameters", async () => {
    const legacyParams: PromptCliParams = {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "issue" as LayerType,
      options: {
        fromFile: "test.md",
        destinationFile: "out.md"
      }
    };

    const factory = await PromptVariablesFactory.create(legacyParams);
    
    // Should not throw during validation
    factory.validateAll();
    
    // Verify required paths are resolved
    assertExists(factory.promptFilePath);
    assertExists(factory.schemaFilePath);
  });
});

describe("PromptVariablesFactory - Totality Interface Tests", () => {
  let testDir: string;
  let originalCwd: string;
  let typeFactory: TypeFactory;
  let patternProvider: MockTypePatternProvider;

  beforeEach(async () => {
    testDir = await Deno.makeTempDir();
    originalCwd = Deno.cwd();
    Deno.chdir(testDir);

    // Setup pattern provider and type factory
    patternProvider = new MockTypePatternProvider();
    typeFactory = new TypeFactory(patternProvider);

    // Setup test configuration
    const configDir = `${testDir}/.agent/breakdown/config`;
    await Deno.mkdir(configDir, { recursive: true });
    
    await Deno.writeTextFile(
      `${configDir}/default-app.yml`,
      `working_dir: .\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`
    );

    // Create test files
    await Deno.mkdir(`${testDir}/prompts/summary/project`, { recursive: true });
    await Deno.mkdir(`${testDir}/schema/summary/project`, { recursive: true });
    
    await Deno.writeTextFile(
      `${testDir}/prompts/summary/project/f_project.md`,
      "# Summary Prompt\nOutput: {destination_path}"
    );
    
    await Deno.writeTextFile(
      `${testDir}/schema/summary/project/base.schema.md`,
      '{"type": "object", "properties": {"summary": {"type": "string"}}}'
    );
  });

  afterEach(async () => {
    Deno.chdir(originalCwd);
    await Deno.remove(testDir, { recursive: true });
  });

  it("should create validated DirectiveType through TypeFactory", () => {
    logger.debug("Testing DirectiveType creation with validation");
    
    const result = typeFactory.createDirectiveType("summary");
    
    assertEquals(result.ok, true);
    if (result.ok) {
      assertInstanceOf(result.data, DirectiveType);
      assertEquals(result.data.getValue(), "summary");
    }
  });

  it("should create validated LayerType through TypeFactory", () => {
    logger.debug("Testing LayerType creation with validation");
    
    const result = typeFactory.createLayerType("project");
    
    assertEquals(result.ok, true);
    if (result.ok) {
      assertInstanceOf(result.data, LayerTypeClass);
      assertEquals(result.data.getValue(), "project");
    }
  });

  it("should fail validation for invalid DirectiveType", () => {
    logger.debug("Testing invalid DirectiveType validation failure");
    
    const result = typeFactory.createDirectiveType("invalid_directive");
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "ValidationFailed");
    }
  });

  it("should fail validation for invalid LayerType", () => {
    logger.debug("Testing invalid LayerType validation failure");
    
    const result = typeFactory.createLayerType("invalid_layer");
    
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "ValidationFailed");
    }
  });

  it("should create both types simultaneously with validation", () => {
    logger.debug("Testing simultaneous type creation");
    
    const result = typeFactory.createBothTypes("summary", "project");
    
    assertEquals(result.ok, true);
    if (result.ok) {
      assertInstanceOf(result.data.directive, DirectiveType);
      assertInstanceOf(result.data.layer, LayerTypeClass);
      assertEquals(result.data.directive.getValue(), "summary");
      assertEquals(result.data.layer.getValue(), "project");
    }
  });

  it("should fail both types creation if either is invalid", () => {
    logger.debug("Testing both types creation failure scenarios");
    
    // Invalid directive, valid layer
    const result1 = typeFactory.createBothTypes("invalid", "project");
    assertEquals(result1.ok, false);
    
    // Valid directive, invalid layer
    const result2 = typeFactory.createBothTypes("summary", "invalid");
    assertEquals(result2.ok, false);
    
    // Both invalid
    const result3 = typeFactory.createBothTypes("invalid1", "invalid2");
    assertEquals(result3.ok, false);
  });
});

describe("TypeFactory - Pattern Provider Integration Tests", () => {
  it("should handle missing directive pattern gracefully", () => {
    logger.debug("Testing missing directive pattern handling");
    
    const invalidProvider = new MockTypePatternProvider("", "project|issue|task");
    const factory = new TypeFactory(invalidProvider);
    
    const result = factory.createDirectiveType("to");
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "PatternNotFound");
    }
  });

  it("should handle missing layer pattern gracefully", () => {
    logger.debug("Testing missing layer pattern handling");
    
    const invalidProvider = new MockTypePatternProvider("to|summary|defect", "");
    const factory = new TypeFactory(invalidProvider);
    
    const result = factory.createLayerType("project");
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "PatternNotFound");
    }
  });

  it("should validate values without creating instances", () => {
    logger.debug("Testing validation-only functionality");
    
    const provider = new MockTypePatternProvider();
    const factory = new TypeFactory(provider);
    
    // Valid values
    assertEquals(factory.validateBothValues("to", "project"), true);
    assertEquals(factory.validateBothValues("summary", "issue"), true);
    
    // Invalid values
    assertEquals(factory.validateBothValues("invalid", "project"), false);
    assertEquals(factory.validateBothValues("to", "invalid"), false);
    assertEquals(factory.validateBothValues("invalid1", "invalid2"), false);
  });

  it("should report pattern availability correctly", () => {
    logger.debug("Testing pattern availability reporting");
    
    const provider = new MockTypePatternProvider();
    const factory = new TypeFactory(provider);
    
    const availability = factory.getPatternAvailability();
    
    assertEquals(availability.directive, true);
    assertEquals(availability.layer, true);
    assertEquals(availability.both, true);
  });

  it("should provide debug information", () => {
    logger.debug("Testing debug information provision");
    
    const provider = new MockTypePatternProvider();
    const factory = new TypeFactory(provider);
    
    const debugInfo = factory.debug();
    
    assertEquals(debugInfo.patternProvider, "MockTypePatternProvider");
    assertEquals(debugInfo.availability.both, true);
  });
});

describe("Migration Support - Parallel Testing", () => {
  let testDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    testDir = await Deno.makeTempDir();
    originalCwd = Deno.cwd();
    Deno.chdir(testDir);

    // Setup for both legacy and new interfaces
    const configDir = `${testDir}/.agent/breakdown/config`;
    await Deno.mkdir(configDir, { recursive: true });
    
    await Deno.writeTextFile(
      `${configDir}/default-app.yml`,
      `working_dir: .\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schema\n`
    );

    await Deno.mkdir(`${testDir}/prompts/defect/task`, { recursive: true });
    await Deno.mkdir(`${testDir}/schema/defect/task`, { recursive: true });
    
    await Deno.writeTextFile(
      `${testDir}/prompts/defect/task/f_task.md`,
      "# Defect Analysis\nTarget: {destination_path}"
    );
    
    await Deno.writeTextFile(
      `${testDir}/schema/defect/task/base.schema.md`,
      '{"type": "object", "properties": {"defects": {"type": "array"}}}'
    );
  });

  afterEach(async () => {
    Deno.chdir(originalCwd);
    await Deno.remove(testDir, { recursive: true });
  });

  it("should demonstrate equivalent behavior between legacy and new interfaces", async () => {
    logger.debug("Testing equivalent behavior across interfaces");
    
    // Legacy approach
    const legacyParams: PromptCliParams = {
      demonstrativeType: "defect" as DemonstrativeType,
      layerType: "task" as LayerType,
      options: {
        fromFile: "input.md",
        destinationFile: "output.md"
      }
    };

    const legacyFactory = await PromptVariablesFactory.create(legacyParams);
    
    // New approach (when fully implemented)
    const patternProvider = new MockTypePatternProvider();
    const typeFactory = new TypeFactory(patternProvider);
    
    const typesResult = typeFactory.createBothTypes("defect", "task");
    assertEquals(typesResult.ok, true);
    
    if (typesResult.ok) {
      // Verify both approaches would produce equivalent results
      assertEquals(typesResult.data.directive.getValue(), "defect");
      assertEquals(typesResult.data.layer.getValue(), "task");
      
      // Verify legacy factory resolves same paths
      assertEquals(legacyFactory.promptFilePath.includes("defect/task"), true);
      assertEquals(legacyFactory.schemaFilePath.includes("defect/task"), true);
    }
  });

  it("should support gradual migration with feature flags", async () => {
    logger.debug("Testing gradual migration support");
    
    // This test demonstrates how we can support both interfaces
    // during the migration period with feature flags or environment variables
    
    const legacySupported = true; // Would be controlled by feature flag
    const totalitySupported = true; // Would be controlled by feature flag
    
    if (legacySupported) {
      const legacyParams: PromptCliParams = {
        demonstrativeType: "defect" as DemonstrativeType,
        layerType: "task" as LayerType,
        options: {}
      };
      
      const factory = await PromptVariablesFactory.create(legacyParams);
      assertExists(factory);
    }
    
    if (totalitySupported) {
      const provider = new MockTypePatternProvider();
      const typeFactory = new TypeFactory(provider);
      
      const result = typeFactory.createBothTypes("defect", "task");
      assertEquals(result.ok, true);
    }
  });
});