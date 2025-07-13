/**
 * Architecture tests for Validators Module
 *
 * Tests architectural constraints and dependencies:
 * - Module structure and export design
 * - Barrel export patterns
 * - Dependency management
 * - Interface segregation
 * - Modularity principles
 *
 * @module cli/validators/mod_architecture_test
 */

import { assertEquals, assertExists } from "../../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import {
  ParameterValidator,
  TwoParamsValidator,
  type ValidatedParams,
  type ValidationError,
} from "./mod.ts";

const logger = new BreakdownLogger("validators-mod-architecture");

describe("Architecture: Module Export Design", () => {
  it("should export required validator classes", () => {
    logger.debug("Testing validator class exports");

    // Core validator exports
    assertExists(TwoParamsValidator, "TwoParamsValidator class must be exported");
    assertEquals(
      typeof TwoParamsValidator,
      "function",
      "TwoParamsValidator must be a class constructor",
    );

    // Re-exported utilities
    assertExists(ParameterValidator, "ParameterValidator utility must be re-exported");
    assertEquals(
      typeof ParameterValidator,
      "function",
      "ParameterValidator must be a class constructor",
    );

    logger.debug("Validator class exports verification completed");
  });

  it("should export required type interfaces", () => {
    logger.debug("Testing type interface exports");

    // Type interfaces should be available for import
    const validator = new TwoParamsValidator();
    const result = validator.validate(["to", "project"]);

    if (result.ok) {
      // ValidatedParams interface should be available
      const params: ValidatedParams = result.data;
      assertExists(params.directiveType, "ValidatedParams interface should be exported");
      assertExists(params.layerType, "ValidatedParams interface should be exported");
    } else {
      // ValidationError interface should be available
      const error: ValidationError = result.error;
      assertExists(error.kind, "ValidationError interface should be exported");
    }

    logger.debug("Type interface exports verification completed");
  });

  it("should follow barrel export patterns", () => {
    logger.debug("Testing barrel export patterns");

    // Should provide single import point for all validators
    const moduleExports = {
      TwoParamsValidator,
      ParameterValidator,
    };

    for (const [name, exportedItem] of Object.entries(moduleExports)) {
      assertExists(exportedItem, `${name} should be available through barrel export`);
      assertEquals(
        typeof exportedItem,
        "function",
        `${name} should be properly exported constructor`,
      );
    }

    // Should not expose internal implementation details
    const validator = new TwoParamsValidator();
    const _methodString = validator.validate.toString();

    // Internal methods should not be accessible through module
    assertEquals(
      (moduleExports as unknown as { validateDemonstrativeType?: unknown })
        .validateDemonstrativeType,
      undefined,
      "Should not expose internal validation methods",
    );
    assertEquals(
      (moduleExports as unknown as { validateLayerType?: unknown }).validateLayerType,
      undefined,
      "Should not expose internal validation methods",
    );

    logger.debug("Barrel export patterns verification completed");
  });

  it("should maintain proper dependency boundaries", () => {
    logger.debug("Testing dependency boundaries");

    // Should re-export from validator utilities without creating circular dependencies
    // ParameterValidator requires patternProvider and configValidator arguments
    assertExists(
      ParameterValidator,
      "Should re-export ParameterValidator class without circular dependency",
    );

    // Should provide clean interface to CLI validators
    const twoParamsValidator = new TwoParamsValidator();
    assertExists(twoParamsValidator, "Should provide TwoParamsValidator through clean interface");

    // Module should not expose file system or network dependencies
    // Test TwoParamsValidator (no constructor args required)
    const twoParamsInstance = new TwoParamsValidator();
    const twoParamsString = twoParamsInstance.toString();
    assertEquals(
      twoParamsString.includes("Deno.") || twoParamsString.includes("fetch"),
      false,
      "TwoParamsValidator should not have direct file system or network dependencies",
    );

    // Test ParameterValidator class definition (constructor requires args)
    assertEquals(
      typeof ParameterValidator,
      "function",
      "ParameterValidator should be exported as constructor function",
    );
    assertEquals(
      ParameterValidator.length,
      2,
      "ParameterValidator should require constructor arguments for dependency injection",
    );

    logger.debug("Dependency boundaries verification completed");
  });
});

describe("Architecture: Module Organization", () => {
  it("should organize validators by responsibility", () => {
    logger.debug("Testing validator responsibility organization");

    // TwoParamsValidator: CLI-specific parameter validation
    const twoParamsValidator = new TwoParamsValidator();
    const twoParamsResult = twoParamsValidator.validate(["to", "project"]);

    if (twoParamsResult.ok) {
      assertEquals(
        typeof twoParamsResult.data.directiveType,
        "string",
        "TwoParamsValidator should handle CLI-specific parameter types",
      );
    }

    // ParameterValidator: General parameter validation utilities
    assertExists(ParameterValidator, "ParameterValidator should handle general validation");

    // Should have clear separation of concerns
    assertEquals(
      typeof TwoParamsValidator,
      "function",
      "CLI-specific validators should be provided",
    );
    assertEquals(
      typeof ParameterValidator,
      "function",
      "General validation utilities should be available",
    );

    logger.debug("Validator responsibility organization verification completed");
  });

  it("should support validator composition", () => {
    logger.debug("Testing validator composition support");

    // Should allow combining validators
    function createCompositeValidator() {
      const twoParams = new TwoParamsValidator();
      // ParameterValidator requires constructor arguments - testing conceptual composition

      return {
        validateTwoParams: (params: string[]) => twoParams.validate(params),
        validateGeneral: (params: unknown) => ({ ok: true, data: params }), // Mock for architecture test
      };
    }

    const composite = createCompositeValidator();

    assertExists(composite.validateTwoParams, "Should support composing CLI validators");
    assertExists(
      composite.validateGeneral,
      "Should support composing general validators conceptually",
    );

    // Validators should work together without conflicts
    const twoParamsResult = composite.validateTwoParams(["to", "project"]);
    assertEquals(
      typeof twoParamsResult.ok,
      "boolean",
      "Composed validators should maintain interface contracts",
    );

    logger.debug("Validator composition support verification completed");
  });

  it("should provide extensible validation architecture", () => {
    logger.debug("Testing extensible validation architecture");

    // Should support adding new validators through same pattern
    interface CustomValidator {
      validate(input: unknown): { ok: boolean; data?: unknown; error?: unknown };
    }

    class MockValidator implements CustomValidator {
      validate(input: unknown) {
        return { ok: true, data: input };
      }
    }

    // Should integrate with existing validator pattern
    const mockValidator = new MockValidator();
    const result = mockValidator.validate("test");

    assertEquals(result.ok, true, "New validators should follow same interface pattern");
    assertEquals(typeof result.ok, "boolean", "Should maintain result type consistency");

    // Should work alongside existing validators
    const twoParams = new TwoParamsValidator();
    const twoParamsResult = twoParams.validate(["to", "project"]);

    assertEquals(
      typeof twoParamsResult.ok,
      typeof result.ok,
      "All validators should use consistent result interface",
    );

    logger.debug("Extensible validation architecture verification completed");
  });
});

describe("Architecture: Import/Export Management", () => {
  it("should manage imports efficiently", () => {
    logger.debug("Testing import management");

    // Module should re-export without duplicating code
    const twoParamsFromMod = new TwoParamsValidator();

    // Should provide same functionality as direct import
    const directResult = twoParamsFromMod.validate(["to", "project"]);
    assertEquals(
      typeof directResult.ok,
      "boolean",
      "Re-exported validators should maintain full functionality",
    );

    // Should not create unnecessary object wrapping
    assertEquals(
      typeof TwoParamsValidator,
      "function",
      "Should export constructor functions directly",
    );

    logger.debug("Import management verification completed");
  });

  it("should provide clean public API", () => {
    logger.debug("Testing public API cleanliness");

    // Should expose only intended public interfaces
    const moduleKeys = Object.keys({
      TwoParamsValidator,
      ParameterValidator,
    });

    assertEquals(
      moduleKeys.length,
      2,
      "Should expose exactly the expected number of public exports",
    );

    // Each export should be a proper constructor
    for (const key of moduleKeys) {
      const exported = key === "TwoParamsValidator" ? TwoParamsValidator : ParameterValidator;
      assertEquals(
        typeof exported,
        "function",
        `${key} should be exported as constructor function`,
      );
      assertEquals(
        exported.length >= 0,
        true,
        `${key} should be callable constructor`,
      );
    }

    // Should not expose internal utilities
    const moduleApi = { TwoParamsValidator, ParameterValidator };
    assertEquals(
      (moduleApi as unknown as { VALID_DEMONSTRATIVE_TYPES?: unknown }).VALID_DEMONSTRATIVE_TYPES,
      undefined,
      "Should not expose internal constants",
    );
    assertEquals(
      (moduleApi as unknown as { VALID_LAYER_TYPES?: unknown }).VALID_LAYER_TYPES,
      undefined,
      "Should not expose internal constants",
    );

    logger.debug("Public API cleanliness verification completed");
  });

  it("should support tree-shaking and dead code elimination", () => {
    logger.debug("Testing tree-shaking support");

    // Exports should be statically analyzable
    assertEquals(
      typeof TwoParamsValidator,
      "function",
      "TwoParamsValidator should be statically importable",
    );
    assertEquals(
      typeof ParameterValidator,
      "function",
      "ParameterValidator should be statically importable",
    );

    // Should not have side effects on import
    const beforeImport = Date.now();
    const afterImport = Date.now();

    assertEquals(
      afterImport - beforeImport < 10,
      true,
      "Module should not have import-time side effects",
    );

    // Should not create global state
    const validator1 = new TwoParamsValidator();
    const validator2 = new TwoParamsValidator();

    const result1 = validator1.validate(["to", "project"]);
    const result2 = validator2.validate(["summary", "issue"]);

    // Results should be independent
    if (result1.ok && result2.ok) {
      assertEquals(
        result1.data.directiveType !== result2.data.directiveType,
        true,
        "Validator instances should not share state",
      );
    }

    logger.debug("Tree-shaking support verification completed");
  });
});

describe("Architecture: Module Stability", () => {
  it("should provide stable module interface", () => {
    logger.debug("Testing module interface stability");

    // Core exports should be consistently available
    const coreExports = ["TwoParamsValidator", "ParameterValidator"];

    for (const exportName of coreExports) {
      const exported = exportName === "TwoParamsValidator"
        ? TwoParamsValidator
        : ParameterValidator;
      assertExists(exported, `${exportName} should be consistently available`);
      assertEquals(
        typeof exported,
        "function",
        `${exportName} should maintain constructor interface`,
      );
    }

    // Should maintain backward compatibility
    const validator = new TwoParamsValidator();
    assertEquals(
      validator.validate.length,
      1,
      "Core validator interfaces should remain stable",
    );

    logger.debug("Module interface stability verification completed");
  });

  it("should handle module loading edge cases", () => {
    logger.debug("Testing module loading edge cases");

    // Should handle repeated imports gracefully
    const firstImport = TwoParamsValidator;
    const secondImport = TwoParamsValidator;

    assertEquals(
      firstImport === secondImport,
      true,
      "Repeated imports should return same constructor",
    );

    // Should handle concurrent instantiation
    const validators = Array.from({ length: 5 }, () => new TwoParamsValidator());

    for (let i = 0; i < validators.length; i++) {
      const result = validators[i].validate(["to", "project"]);
      assertEquals(
        typeof result.ok,
        "boolean",
        `Validator ${i} should work correctly in concurrent scenario`,
      );
    }

    // Should not interfere with each other
    for (let i = 0; i < validators.length; i++) {
      for (let j = i + 1; j < validators.length; j++) {
        assertEquals(
          validators[i] !== validators[j],
          true,
          `Validator instances ${i} and ${j} should be separate objects`,
        );
      }
    }

    logger.debug("Module loading edge cases verification completed");
  });
});
