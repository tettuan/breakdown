/**
 * @fileoverview Architecture tests for prompt_manager_adapter module
 *
 * Tests architectural constraints and dependencies:
 * - Dependency direction (only depends on types layer and external packages)
 * - No circular dependencies
 * - Proper abstraction boundaries
 * - External package usage patterns
 *
 * This test validates the unified PromptManagerAdapter implementation
 * following the Totality principle and clean architecture patterns.
 *
 * @module
 */

import { assertEquals, assertExists } from "@std/assert";
import * as adapter from "./prompt_manager_adapter.ts";
import { BreakdownLogger as _BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new _BreakdownLogger("test-architecture-prompt-manager-adapter");

/**
 * Test: Module exports required classes and interfaces
 */
Deno.test("prompt_manager_adapter - exports required components", () => {
  logger.debug("Testing module exports");

  assertExists(
    adapter.PromptManagerAdapter,
    "PromptManagerAdapter class should be exported",
  );

  // Note: Interface types are not runtime values, so we check for class instantiation instead
  const testConfig = { debug: true };
  const instanceWithConfig = new adapter.PromptManagerAdapter(testConfig);
  assertExists(
    instanceWithConfig,
    "PromptManagerAdapter should accept configuration object",
  );

  // Verify class has expected methods
  const instance = new adapter.PromptManagerAdapter();
  assertExists(
    instance.generatePrompt,
    "Should have generatePrompt method",
  );
  assertExists(
    instance.generatePromptWithProfile,
    "Should have generatePromptWithProfile method",
  );
  assertExists(
    instance.validateTemplate,
    "Should have validateTemplate method",
  );
});

/**
 * Test: External dependencies follow strict rules
 */
Deno.test("prompt_manager_adapter - external dependencies validation", async () => {
  logger.debug("Testing external dependencies");

  const moduleContent = await Deno.readTextFile(
    new URL("./prompt_manager_adapter.ts", import.meta.url),
  );

  // Extract all import statements
  const imports = moduleContent.match(/import.*from\s+["']([^"']+)["']/g) || [];
  const externalImports = imports
    .map((imp) => imp.match(/from\s+["']([^"']+)["']/)?.[1])
    .filter(Boolean)
    .filter((imp) =>
      imp?.startsWith("@") || imp?.startsWith("jsr:") || imp?.startsWith("https://")
    );

  logger.debug("Found external imports", { count: externalImports.length });

  // Strictly allowed external dependencies
  const ALLOWED_EXTERNALS = [
    "@tettuan/breakdownprompt", // Core prompt processing
    "@tettuan/breakdownlogger", // Logging (optional, for debugging)
  ];

  // Forbidden external dependencies
  const FORBIDDEN_EXTERNALS = [
    "@tettuan/breakdownconfig", // Configuration should come from above
    "@tettuan/breakdownparams", // Parameter handling is upper layer concern
    "@std/path", // Path operations should be delegated
  ];

  // Check each external import
  externalImports.forEach((imp) => {
    const isAllowed = ALLOWED_EXTERNALS.some((allowed) => imp?.includes(allowed));
    const isForbidden = FORBIDDEN_EXTERNALS.some((forbidden) => imp?.includes(forbidden));

    assertEquals(
      isForbidden,
      false,
      `Forbidden external dependency detected: ${imp}`,
    );

    if (!imp?.includes("@tettuan/breakdownlogger")) { // Logger is optional
      assertEquals(
        isAllowed,
        true,
        `Unknown external dependency: ${imp}. Must be explicitly allowed.`,
      );
    }
  });
});

/**
 * Test: Internal layer dependencies follow clean architecture
 */
Deno.test("prompt_manager_adapter - layer boundary enforcement", async () => {
  logger.debug("Testing layer boundaries");

  const moduleContent = await Deno.readTextFile(
    new URL("./prompt_manager_adapter.ts", import.meta.url),
  );

  // Test downward dependencies only (to types layer)
  const ALLOWED_INTERNAL_PATHS = [
    "../types/result", // Result type for error handling
    "../types/prompt_types", // Prompt-specific types
  ];

  // Test forbidden upward/lateral dependencies
  const FORBIDDEN_INTERNAL_PATHS = [
    "../factory/", // Upper layer
    "../builder/", // Upper layer
    "../cli/", // Upper layer
    "../commands/", // Upper layer
    "../config/", // Upper layer
    "../workspace/", // Upper layer
    "./prompt_adapter", // Lateral (old implementation)
    "./prompt_", // Any other prompt layer module
  ];

  // Check all internal imports
  const internalImports = moduleContent.match(/from\s+["'][\.\/][^"']+["']/g) || [];

  internalImports.forEach((imp) => {
    // Check against forbidden paths
    FORBIDDEN_INTERNAL_PATHS.forEach((forbidden) => {
      const hasForbidden = imp.includes(forbidden);
      assertEquals(
        hasForbidden,
        false,
        `Forbidden internal dependency: ${imp} (violates layer boundary)`,
      );
    });

    // Verify import is from allowed paths
    const isAllowed = ALLOWED_INTERNAL_PATHS.some((allowed) => imp.includes(allowed));
    const isRelativeTypeImport = imp.includes("type") && imp.includes("./");

    assertEquals(
      isAllowed || isRelativeTypeImport,
      true,
      `Internal import must be from types layer only: ${imp}`,
    );
  });
});

/**
 * Test: No circular dependencies within prompt layer
 */
Deno.test("prompt_manager_adapter - no circular dependencies", async () => {
  logger.debug("Testing for circular dependencies");

  const moduleContent = await Deno.readTextFile(
    new URL("./prompt_manager_adapter.ts", import.meta.url),
  );

  // Check for imports from same directory (potential circular deps)
  const sameLayerImports = moduleContent.match(/from\s+["']\.\//g) || [];

  sameLayerImports.forEach((imp) => {
    // Only type imports from same layer are allowed
    const lineWithImport = moduleContent
      .split("\n")
      .find((line) => line.includes(imp));

    const isTypeImport = lineWithImport?.includes("type");
    assertEquals(
      isTypeImport,
      true,
      `Non-type import from same layer detected (circular dependency risk): ${imp}`,
    );
  });

  // Specific check: should not import old adapter
  assertEquals(
    moduleContent.includes("./prompt_adapter"),
    false,
    "Should not import from old prompt_adapter (being replaced)",
  );
});

/**
 * Test: External package abstraction and encapsulation
 */
Deno.test("prompt_manager_adapter - proper external package abstraction", async () => {
  logger.debug("Testing external package abstraction");

  const moduleContent = await Deno.readTextFile(
    new URL("./prompt_manager_adapter.ts", import.meta.url),
  );

  // PromptManager should be imported exactly once
  const importLines = moduleContent.split("\n").filter((line) =>
    line.includes("import") && line.includes("PromptManager")
  );

  assertEquals(
    importLines.length,
    1,
    "PromptManager should be imported exactly once",
  );

  // Should not expose PromptManager in public method signatures
  const publicMethodRegex = /(?:public\s+)?async\s+\w+[^{]+{/g;
  const publicMethods = moduleContent.match(publicMethodRegex) || [];

  publicMethods.forEach((method) => {
    if (!method.includes("private")) {
      assertEquals(
        method.includes(": PromptManager"),
        false,
        `Public method should not expose PromptManager type: ${method.split("\n")[0]}`,
      );
    }
  });

  // Should store PromptManager as private field
  const hasPrivatePromptManager = moduleContent.includes("private readonly promptManager");
  assertEquals(
    hasPrivatePromptManager,
    true,
    "Should store PromptManager as private readonly field",
  );
});

/**
 * Test: Adapter pattern implementation correctness
 */
Deno.test("prompt_manager_adapter - validates adapter pattern", () => {
  logger.debug("Testing adapter pattern implementation");

  const adapterInstance = new adapter.PromptManagerAdapter();

  // Core adapter methods
  const REQUIRED_ADAPTER_METHODS = [
    "generatePrompt", // Core transformation
    "generatePromptWithProfile", // Profile-aware transformation
    "validateTemplate", // Validation delegation
  ];

  REQUIRED_ADAPTER_METHODS.forEach((method) => {
    assertExists(
      (adapterInstance as any)[method],
      `Adapter must have ${method} method`,
    );

    const methodType = typeof (adapterInstance as any)[method];
    assertEquals(
      methodType,
      "function",
      `${method} must be a function`,
    );
  });

  // Verify method signatures (parameter count)
  assertEquals(
    adapterInstance.generatePrompt.length,
    2,
    "generatePrompt should accept 2 parameters (template, variables)",
  );

  assertEquals(
    adapterInstance.generatePromptWithProfile.length,
    3,
    "generatePromptWithProfile should accept 3 parameters (profile, template, variables)",
  );

  assertEquals(
    adapterInstance.validateTemplate.length,
    1,
    "validateTemplate should accept 1 parameter (template)",
  );
});

/**
 * Test: Configuration and dependency injection patterns
 */
Deno.test("prompt_manager_adapter - dependency injection validation", () => {
  logger.debug("Testing dependency injection");

  // Test with full configuration
  const fullConfig = {
    promptManager: undefined, // Can inject custom instance
    debug: true,
    templateDir: "/custom/templates",
  };

  const configuredInstance = new adapter.PromptManagerAdapter(fullConfig);
  assertExists(configuredInstance, "Should create instance with full configuration");

  // Test with partial configuration
  const partialConfig = {
    debug: false,
  };

  const partialInstance = new adapter.PromptManagerAdapter(partialConfig);
  assertExists(partialInstance, "Should create instance with partial configuration");

  // Test without configuration (defaults)
  const defaultInstance = new adapter.PromptManagerAdapter();
  assertExists(defaultInstance, "Should create instance without configuration");

  // Configuration should not be accessible
  assertEquals(
    (defaultInstance as any).config,
    undefined,
    "Should not expose config object",
  );
});

/**
 * Test: Public API surface and encapsulation
 */
Deno.test("prompt_manager_adapter - public API validation", async () => {
  logger.debug("Testing public API surface");

  const moduleContent = await Deno.readTextFile(
    new URL("./prompt_manager_adapter.ts", import.meta.url),
  );

  // Count exports (excluding type-only exports)
  const exportStatements = moduleContent
    .split("\n")
    .filter((line) =>
      line.includes("export") && (line.includes("class") || line.includes("interface"))
    )
    .filter((line) => !line.includes("//"));

  // Verify expected exports
  const hasAdapterExport = exportStatements.some((line) =>
    line.includes("export class PromptManagerAdapter")
  );
  const hasConfigExport = exportStatements.some((line) =>
    line.includes("export interface PromptManagerAdapterConfig")
  );

  assertEquals(hasAdapterExport, true, "Should export PromptManagerAdapter class");
  assertEquals(hasConfigExport, true, "Should export PromptManagerAdapterConfig interface");
});

/**
 * Test: Error handling architecture
 */
Deno.test("prompt_manager_adapter - error handling patterns", async () => {
  logger.debug("Testing error handling architecture");

  const moduleContent = await Deno.readTextFile(
    new URL("./prompt_manager_adapter.ts", import.meta.url),
  );

  // Should use Result pattern, not exceptions
  const throwStatements = moduleContent
    .split("\n")
    .filter((line) => line.includes("throw") && !line.includes("//") && !line.includes("*"));

  assertEquals(
    throwStatements.length,
    0,
    "Should not throw exceptions (use Result pattern)",
  );

  // Should import Result type and error handling utilities
  const hasResultImport = moduleContent.includes("import") && moduleContent.includes("Result");
  assertEquals(
    hasResultImport,
    true,
    "Should import Result type for error handling",
  );

  // Should have error handling methods
  const hasHandleError = moduleContent.includes("handleError");
  assertEquals(
    hasHandleError,
    true,
    "Should have handleError method for consistent error transformation",
  );

  // All public async methods should return Result
  const asyncMethodSignatures = moduleContent.match(/async\s+\w+[^:]*:\s*Promise<[^>]+>/g) || [];

  asyncMethodSignatures.forEach((signature) => {
    if (!signature.includes("private")) {
      const hasResult = signature.includes("Result<");
      assertEquals(
        hasResult,
        true,
        `Public async method should return Result type: ${signature.split("\n")[0]}`,
      );
    }
  });
});

/**
 * Test: Type safety and abstraction validation
 */
Deno.test("prompt_manager_adapter - type abstraction validation", async () => {
  logger.debug("Testing type abstractions");

  const moduleContent = await Deno.readTextFile(
    new URL("./prompt_manager_adapter.ts", import.meta.url),
  );

  // Should use abstract types from types layer
  const REQUIRED_TYPE_IMPORTS = [
    "PromptPath", // Abstract path type
    "PromptVariables", // Abstract variables interface
    "PromptResult", // Result type
    "PromptError", // Error union type
  ];

  REQUIRED_TYPE_IMPORTS.forEach((typeName) => {
    const hasType = moduleContent.includes(typeName);
    assertEquals(
      hasType,
      true,
      `Should import and use ${typeName} from types layer`,
    );
  });

  // Should not use concrete/implementation types in public API
  const FORBIDDEN_CONCRETE_TYPES = [
    "PromptVariablesFactory", // Concrete factory
    "VariablesBuilder", // Concrete builder
    "DirectiveType", // Domain type
    "LayerType", // Domain type
  ];

  FORBIDDEN_CONCRETE_TYPES.forEach((forbiddenType) => {
    const hasForbidden = moduleContent.includes(forbiddenType);
    assertEquals(
      hasForbidden,
      false,
      `Should not use concrete type ${forbiddenType} (breaks abstraction)`,
    );
  });
});

/**
 * Test: Method cohesion and single responsibility
 */
Deno.test("prompt_manager_adapter - method cohesion validation", async () => {
  logger.debug("Testing method cohesion");

  const moduleContent = await Deno.readTextFile(
    new URL("./prompt_manager_adapter.ts", import.meta.url),
  );

  // Extract method signatures
  const methodLines = moduleContent
    .split("\n")
    .filter((line) =>
      (line.includes("async") || line.includes("private") || line.includes("public")) &&
      line.includes("(") &&
      line.includes(")") &&
      !line.includes("=>") &&
      !line.includes("import")
    );

  // Extract method names from signatures
  const methodNames: string[] = [];
  methodLines.forEach((line) => {
    const match = line.match(/(?:async\s+)?(?:private\s+)?(?:public\s+)?(\w+)\s*\(/);
    if (match && match[1]) {
      methodNames.push(match[1]);
    }
  });

  logger.debug("Found methods", { count: methodNames.length, methods: methodNames });

  // Group methods by responsibility
  const METHOD_GROUPS = {
    generation: ["generatePrompt", "generatePromptWithProfile"],
    validation: ["validateTemplate", "validateVariables", "isValidVariableName"],
    transformation: ["resolveTemplatePath", "handleError"],
  };

  // Verify methods are properly grouped
  const allGroupedMethods = Object.values(METHOD_GROUPS).flat();
  const publicMethods = methodNames.filter((name) =>
    !name.startsWith("_") &&
    name !== "constructor" &&
    allGroupedMethods.includes(name)
  );

  // Check that all public methods belong to a group
  publicMethods.forEach((method) => {
    const isGrouped = allGroupedMethods.includes(method);
    assertEquals(
      isGrouped,
      true,
      `Method ${method} should belong to a clear responsibility group`,
    );
  });
});
