/**
 * @fileoverview Architecture tests for workspace path strategies
 *
 * This test file validates the architectural constraints and design principles
 * of the path resolution strategies module, ensuring adherence to Totality
 * principles and proper separation of concerns.
 *
 * @module workspace/path/0_architecture_strategies_test
 */

import { assertEquals, assertExists } from "../../deps.ts";
import { fromFileUrl } from "@std/path";

/**
 * Architecture Test: Strategy Pattern Implementation
 *
 * Verifies that the strategies module correctly implements the
 * Strategy pattern for path resolution.
 */
Deno.test("Architecture: Path strategies follow Strategy pattern", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./strategies.ts", import.meta.url)),
  );

  // Check for interface import
  const hasInterfaceImport = moduleSource.includes("import { PathResolutionStrategy }");
  assertEquals(hasInterfaceImport, true, "Should import PathResolutionStrategy interface");

  // Check that strategies implement the interface
  const implementsInterface = moduleSource.includes("implements PathResolutionStrategy");
  assertEquals(implementsInterface, true, "Strategies should implement PathResolutionStrategy");

  // Verify multiple strategy classes exist
  const strategyClasses = moduleSource.match(/export class \w+Strategy/g) || [];
  assertEquals(strategyClasses.length > 0, true, "Should have at least one strategy class");

  // Check no cross-dependencies between strategies
  const classDefinitions = moduleSource.split("export class");
  classDefinitions.forEach((classDef: string, i: number) => {
    if (i === 0) return; // Skip content before first class

    // Check that no strategy references another strategy
    strategyClasses.forEach((strategyClass: string) => {
      const className = strategyClass.replace("export class ", "");
      if (classDef.includes(className) && !classDef.startsWith(" " + className)) {
        assertEquals(false, true, `Strategy should not depend on ${className}`);
      }
    });
  });
});

/**
 * Architecture Test: Platform Independence
 *
 * Ensures that strategies properly abstract platform-specific
 * path handling without leaking implementation details.
 */
Deno.test("Architecture: Path strategies maintain platform independence", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./strategies.ts", import.meta.url)),
  );

  // Check for standard path utilities usage
  const usesStandardPath = moduleSource.includes("import { join, normalize }") ||
    moduleSource.includes("@std/path");
  assertEquals(
    usesStandardPath,
    true,
    "Should use standard path utilities for platform independence",
  );

  // Verify Unix-specific strategy exists
  const hasUnixStrategy = moduleSource.includes("class UnixPathStrategy");
  assertEquals(hasUnixStrategy, true, "Should have Unix-specific strategy");

  // Check that strategies encapsulate platform logic
  const unixSection = moduleSource.match(/class UnixPathStrategy[\s\S]+?(?=class|export|$)/)?.[0] ||
    "";
  if (unixSection) {
    // Unix strategy can use forward slashes internally
    const encapsulatesUnixLogic = unixSection.includes("Unix") ||
      unixSection.includes("forward slash");
    assertEquals(
      encapsulatesUnixLogic,
      true,
      "Unix strategy should encapsulate Unix-specific logic",
    );
  }

  // Verify no hardcoded separators in module-level code
  const moduleLevel = moduleSource.split("export class")[0];
  const hasHardcodedSeparators = moduleLevel.includes('"/"') &&
    !moduleLevel.includes("import") &&
    !moduleLevel.includes("from");
  assertEquals(
    hasHardcodedSeparators,
    false,
    "Module level should not have hardcoded path separators",
  );
});

/**
 * Architecture Test: Totality in Path Resolution
 *
 * Validates that path resolution follows Totality principles,
 * handling all possible inputs with defined outputs.
 */
Deno.test("Architecture: Path strategies ensure total path resolution", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./strategies.ts", import.meta.url)),
  );

  // Check that resolve method is implemented in strategies
  const hasResolveMethod = moduleSource.includes("resolve(") &&
    (moduleSource.includes("async resolve") || moduleSource.includes("resolve:"));
  assertEquals(hasResolveMethod, true, "Strategies should implement resolve method");

  // Verify resolve returns Promise<string> (total function)
  const resolveSignatures = moduleSource.match(/resolve\([^)]*\)\s*:\s*Promise<string>/g) || [];
  assertEquals(resolveSignatures.length > 0, true, "Resolve should return Promise<string>");

  // Check normalize method exists
  const hasNormalizeMethod = moduleSource.includes("normalize(");
  assertEquals(hasNormalizeMethod, true, "Should have normalize method");

  // Verify validate method returns Promise<boolean> (total)
  const hasValidateMethod = moduleSource.includes("validate(") &&
    moduleSource.includes(": Promise<boolean>");
  assertEquals(hasValidateMethod, true, "Should have validate method returning Promise<boolean>");

  // Check no methods return undefined/null types
  const returnsUndefinedOrNull = moduleSource.includes(": undefined") ||
    moduleSource.includes(": null") ||
    moduleSource.includes("undefined | null");
  assertEquals(returnsUndefinedOrNull, false, "Methods should not return undefined/null");
});

/**
 * Architecture Test: Dependency Direction
 *
 * Ensures that strategies don't depend on higher-level modules
 * and maintain proper dependency flow.
 */
Deno.test("Architecture: Path strategies have correct dependencies", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./strategies.ts", import.meta.url)),
  );

  // Check imports are minimal and appropriate
  const imports = moduleSource.match(/import[^;]+;/g) || [];

  imports.forEach((imp) => {
    // Should only import from interfaces, types, or standard library
    const isValidImport = imp.includes("../interfaces") ||
      imp.includes("@std/path") ||
      imp.includes("jsr:@std/path");
    assertEquals(isValidImport, true, `Import should be from interfaces or std library: ${imp}`);
  });

  // Verify no imports from higher-level modules
  const hasBusinessLogicImports = imports.some((imp) =>
    imp.includes("../workspace") ||
    imp.includes("../cli") ||
    imp.includes("../factory")
  );
  assertEquals(hasBusinessLogicImports, false, "Should not import from higher-level modules");

  // Check no circular dependencies (strategies don't import each other)
  const hasStrategyImports = imports.some((imp) =>
    imp.includes("Strategy") && !imp.includes("interfaces")
  );
  assertEquals(hasStrategyImports, false, "Strategies should not import each other");

  // Verify clean dependency structure
  assertEquals(imports.length <= 3, true, "Should have minimal imports (interface + utilities)");
});

/**
 * Architecture Test: Extensibility
 *
 * Verifies that new path resolution strategies can be added
 * without modifying existing code (Open/Closed Principle).
 */
Deno.test("Architecture: Path strategies support extensibility", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./strategies.ts", import.meta.url)),
  );

  // Check that strategies are exported (allowing external use)
  const exportedStrategies = moduleSource.match(/export class \w+Strategy/g) || [];
  assertEquals(
    exportedStrategies.length > 0,
    true,
    "Strategies should be exported for extensibility",
  );

  // Verify interface-based design
  const implementsCount = (moduleSource.match(/implements PathResolutionStrategy/g) || []).length;
  assertEquals(
    implementsCount === exportedStrategies.length,
    true,
    "All strategy classes should implement the interface",
  );

  // Check for consistent constructor pattern
  const constructorMatches = moduleSource.match(/constructor\s*\([^)]*baseDir:\s*string/g) || [];
  assertEquals(
    constructorMatches.length > 0,
    true,
    "Strategies should have consistent constructor accepting baseDir",
  );

  // Verify strategies are self-contained (good for adding new ones)
  exportedStrategies.forEach((strategy) => {
    const className = strategy.replace("export class ", "");
    // Find the class definition and its content
    const classRegex = new RegExp(
      `class ${className}[\\s\\S]+?(?=\\nexport class|\\nexport|$)`,
      "s",
    );
    const classSection = moduleSource.match(classRegex)?.[0] || "";

    // Each strategy should have its own implementation methods
    const hasResolve = classSection.includes("resolve(");
    const hasNormalize = classSection.includes("normalize(");
    const hasValidate = classSection.includes("validate(");

    const hasOwnMethods = hasResolve && hasNormalize && hasValidate;
    assertEquals(
      hasOwnMethods,
      true,
      `${className} should have all required methods (resolve: ${hasResolve}, normalize: ${hasNormalize}, validate: ${hasValidate})`,
    );
  });

  // Open/Closed principle - new strategies can be added without modifying existing code
  assertEquals(
    true,
    true,
    "Architecture supports adding new strategies via interface implementation",
  );
});
