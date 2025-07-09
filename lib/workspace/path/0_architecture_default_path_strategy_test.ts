/**
 * @fileoverview Architecture tests for DefaultPathStrategyTotality
 *
 * This test file validates the architectural constraints and design principles
 * of the DefaultPathStrategyTotality class, ensuring adherence to Totality
 * principles, proper platform abstraction, and interface compliance.
 *
 * @module workspace/path/0_architecture_default_path_strategy_test
 */

import { assertEquals, assertExists } from "../../deps.ts";
import { fromFileUrl } from "@std/path";

/**
 * Architecture Test: Implementation Contract Compliance
 *
 * Verifies that DefaultPathStrategyTotality correctly implements its
 * contract as a wrapper around PlatformAgnosticStrategyTotality.
 */
Deno.test("Architecture: DefaultPathStrategyTotality implementation contract", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./default_path_strategy.ts", import.meta.url)),
  );

  // Check correct import of PlatformAgnosticStrategyTotality
  const hasPlatformImport = moduleSource.includes(
    "import { PlatformAgnosticStrategyTotality }",
  );
  assertEquals(
    hasPlatformImport,
    true,
    "Should import PlatformAgnosticStrategyTotality",
  );

  // Verify DefaultPathStrategyTotality class exists
  const hasDefaultClass = moduleSource.includes("export class DefaultPathStrategyTotality");
  assertEquals(hasDefaultClass, true, "Should export DefaultPathStrategyTotality class");

  // Check private constructor pattern (Smart Constructor)
  const hasPrivateConstructor = moduleSource.includes("private constructor(");
  assertEquals(
    hasPrivateConstructor,
    true,
    "Should use private constructor for Smart Constructor pattern",
  );

  // Verify delegation to platform strategy
  const hasDelegation = moduleSource.includes("private strategy: PlatformAgnosticStrategyTotality");
  assertEquals(
    hasDelegation,
    true,
    "Should delegate to PlatformAgnosticStrategyTotality",
  );

  // Check static factory methods
  const hasCreateMethod = moduleSource.includes("static create(");
  const hasCreateForWorkspace = moduleSource.includes("static createForWorkspace(");
  assertEquals(hasCreateMethod, true, "Should have static create method");
  assertEquals(hasCreateForWorkspace, true, "Should have static createForWorkspace method");
});

/**
 * Architecture Test: Platform Abstraction Correctness
 *
 * Ensures that DefaultPathStrategyTotality properly abstracts platform
 * differences while maintaining platform independence.
 */
Deno.test("Architecture: DefaultPathStrategyTotality platform abstraction", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./default_path_strategy.ts", import.meta.url)),
  );

  // Check no platform-specific code in DefaultPathStrategyTotality
  const platformSpecificPatterns = [
    /Deno\.build\.os/,
    /process\.platform/,
    /\\\\/g, // Windows backslashes
    /\/\//g, // Unix forward slashes (when not in comments)
  ];

  platformSpecificPatterns.forEach((pattern, index) => {
    const matches = moduleSource.match(pattern);
    // Allow Windows backslashes only in string literals
    if (index === 2 && matches) {
      const inStringLiterals = matches.every((match) => {
        const beforeMatch = moduleSource.substring(0, moduleSource.indexOf(match));
        const lastQuote = Math.max(beforeMatch.lastIndexOf('"'), beforeMatch.lastIndexOf("'"));
        const afterQuote = moduleSource.substring(lastQuote);
        return afterQuote.includes(match) && afterQuote.indexOf(match) < afterQuote.indexOf('"');
      });
      assertEquals(
        inStringLiterals,
        true,
        "Platform-specific path separators should only appear in string literals",
      );
    } else if (index === 3) {
      // Allow // in comments and string literals
      const nonCommentMatches = moduleSource
        .split("\n")
        .filter((line) => !line.trim().startsWith("*") && !line.trim().startsWith("//"))
        .join("\n")
        .match(pattern);

      if (nonCommentMatches) {
        // Check if they're in string literals
        const inStringLiterals = nonCommentMatches.every((match) => {
          const beforeMatch = moduleSource.substring(0, moduleSource.indexOf(match));
          const lastQuote = Math.max(
            beforeMatch.lastIndexOf('"'),
            beforeMatch.lastIndexOf("'"),
            beforeMatch.lastIndexOf("`"),
          );
          const afterQuote = moduleSource.substring(lastQuote);
          return afterQuote.includes(match) && (
            afterQuote.indexOf(match) < afterQuote.indexOf('"') ||
            afterQuote.indexOf(match) < afterQuote.indexOf("'") ||
            afterQuote.indexOf(match) < afterQuote.indexOf("`")
          );
        });
        assertEquals(
          inStringLiterals,
          true,
          "// should only appear in comments or string literals",
        );
      }
    } else {
      assertEquals(
        matches === null,
        true,
        `Should not contain platform-specific code: ${pattern}`,
      );
    }
  });

  // Verify proper delegation for platform handling
  const delegatesResolve = moduleSource.includes("this.strategy.resolve(");
  const delegatesNormalize = moduleSource.includes("this.strategy.normalize(");
  const delegatesValidate = moduleSource.includes("this.strategy.validate(");

  assertEquals(delegatesResolve, true, "Should delegate resolve to platform strategy");
  assertEquals(delegatesNormalize, true, "Should delegate normalize to platform strategy");
  assertEquals(delegatesValidate, true, "Should delegate validate to platform strategy");

  // Check that abstraction doesn't leak platform details
  const platformLeakage = moduleSource.includes("Windows") ||
    moduleSource.includes("Unix") ||
    moduleSource.includes("SEPARATOR");
  assertEquals(
    platformLeakage,
    false,
    "Should not leak platform-specific details in interface",
  );
});

/**
 * Architecture Test: Interface Compliance
 *
 * Validates that DefaultPathStrategyTotality provides a complete
 * and consistent interface for path operations.
 */
Deno.test("Architecture: DefaultPathStrategyTotality interface compliance", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./default_path_strategy.ts", import.meta.url)),
  );

  // Define required methods for path strategy interface
  const requiredMethods = [
    "resolve(",
    "normalize(",
    "validate(",
    "getBaseDir(",
  ];

  requiredMethods.forEach((method) => {
    const hasMethod = moduleSource.includes(method);
    assertEquals(hasMethod, true, `Should implement ${method} method`);
  });

  // Check method signatures for totality (Promise<Result> or Result)
  const resolveSignature = moduleSource.includes("async resolve(") &&
    moduleSource.includes("Promise<Result<string, PathErrorKind>>");
  assertEquals(resolveSignature, true, "resolve should return Promise<Result>");

  const normalizeSignature = moduleSource.includes("normalize(") &&
    moduleSource.includes("Result<string, PathErrorKind>");
  assertEquals(normalizeSignature, true, "normalize should return Result");

  const validateSignature = moduleSource.includes("async validate(") &&
    moduleSource.includes("Promise<Result<boolean, PathErrorKind>>");
  assertEquals(validateSignature, true, "validate should return Promise<Result>");

  // Verify no methods return undefined/null
  const returnsUndefined = moduleSource.includes(": undefined") ||
    moduleSource.includes(": null");
  assertEquals(returnsUndefined, false, "Methods should not return undefined/null");

  // Check error handling completeness
  const hasResultType = moduleSource.includes("type Result<T, E>");
  const hasPathErrorKind = moduleSource.includes("type PathErrorKind");
  assertEquals(hasResultType, true, "Should define Result type");
  assertEquals(hasPathErrorKind, true, "Should define PathErrorKind type");
});

/**
 * Architecture Test: Error Handling Architecture
 *
 * Ensures that error handling follows Totality principles
 * with comprehensive error types and proper propagation.
 */
Deno.test("Architecture: DefaultPathStrategyTotality error handling", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./default_path_strategy.ts", import.meta.url)),
  );

  // Check comprehensive error types
  const errorKinds = [
    "INVALID_PATH",
    "NORMALIZATION_FAILED",
    "SECURITY_VIOLATION",
    "PLATFORM_DETECTION_FAILED",
    "STRATEGY_CREATION_FAILED",
  ];

  errorKinds.forEach((errorKind) => {
    const hasErrorKind = moduleSource.includes(`"${errorKind}"`);
    assertEquals(hasErrorKind, true, `Should define ${errorKind} error kind`);
  });

  // Verify error propagation from underlying strategy
  const propagatesErrors = moduleSource.includes("if (!result.ok)") &&
    moduleSource.includes("return result");
  assertEquals(propagatesErrors, true, "Should propagate errors from underlying strategy");

  // Check proper error handling in factory methods
  const factoryErrorHandling = moduleSource.includes("if (!strategyResult.ok)") ||
    moduleSource.includes("if (!baseDirResult.ok)");
  assertEquals(factoryErrorHandling, true, "Factory methods should handle errors properly");

  // Verify no unhandled exceptions
  const hasTryCatch = moduleSource.includes("try {") && moduleSource.includes("} catch");
  const hasErrorPropagation = moduleSource.includes("return result") ||
    moduleSource.includes("return {");
  assertEquals(
    hasTryCatch || hasErrorPropagation,
    true,
    "Should handle or propagate all potential errors",
  );
});

/**
 * Architecture Test: Convenience Features Architecture
 *
 * Validates that convenience features (like empty path handling)
 * maintain architectural consistency.
 */
Deno.test("Architecture: DefaultPathStrategyTotality convenience features", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./default_path_strategy.ts", import.meta.url)),
  );

  // Check empty path handling
  const handlesEmptyPath = moduleSource.includes('path || "."') ||
    moduleSource.includes('path.trim() === ""');
  assertEquals(handlesEmptyPath, true, "Should handle empty paths gracefully");

  // Verify base directory defaults
  const hasDefaultBaseDir = moduleSource.includes("Deno.cwd()") ||
    moduleSource.includes("baseDir ||");
  assertEquals(hasDefaultBaseDir, true, "Should provide sensible base directory defaults");

  // Check workspace convenience method
  const hasWorkspaceDefault = moduleSource.includes('".agent/breakdown"');
  assertEquals(hasWorkspaceDefault, true, "Should provide workspace directory default");

  // Verify convenience doesn't compromise safety
  const maintainsSafety = moduleSource.includes("this.strategy.resolve(") &&
    moduleSource.includes("this.strategy.validate(");
  assertEquals(
    maintainsSafety,
    true,
    "Convenience features should still use underlying strategy for safety",
  );

  // Check batch operations maintain consistency
  const hasBatchOperations = moduleSource.includes("resolveMultiple(") ||
    moduleSource.includes("createChild(");
  if (hasBatchOperations) {
    const batchUsesStrategy = moduleSource.includes("await this.resolve(");
    assertEquals(
      batchUsesStrategy,
      true,
      "Batch operations should use consistent strategy methods",
    );
  }
});

/**
 * Architecture Test: Factory Pattern Implementation
 *
 * Verifies that PathStrategyFactory follows proper factory pattern
 * principles and provides consistent creation methods.
 */
Deno.test("Architecture: PathStrategyFactory implementation", async () => {
  const moduleSource = await Deno.readTextFile(
    fromFileUrl(new URL("./default_path_strategy.ts", import.meta.url)),
  );

  // Check factory class exists
  const hasFactory = moduleSource.includes("export class PathStrategyFactory");
  assertEquals(hasFactory, true, "Should export PathStrategyFactory class");

  // Verify static factory methods
  const factoryMethods = [
    "static createDefault(",
    "static createWorkspace(",
    "static createProject(",
    "static createTemp(",
  ];

  factoryMethods.forEach((method) => {
    const hasMethod = moduleSource.includes(method);
    assertEquals(hasMethod, true, `Factory should have ${method} method`);
  });

  // Check factory methods return proper types
  const returnsStrategy = moduleSource.includes("Result<DefaultPathStrategyTotality, string>");
  assertEquals(returnsStrategy, true, "Factory methods should return Result<Strategy, Error>");

  // Verify factory delegates to DefaultPathStrategyTotality
  const delegatesToDefault = moduleSource.includes("DefaultPathStrategyTotality.create(") ||
    moduleSource.includes("DefaultPathStrategyTotality.createForWorkspace(");
  assertEquals(
    delegatesToDefault,
    true,
    "Factory should delegate to DefaultPathStrategyTotality",
  );

  // Check consistency in factory patterns
  const consistentFactoryPattern = moduleSource.includes("return DefaultPathStrategyTotality");
  assertEquals(
    consistentFactoryPattern,
    true,
    "Factory methods should follow consistent pattern",
  );

  // Verify no direct instantiation in factory
  // Check that "new DefaultPathStrategyTotality(" does not appear in public methods
  const factorySection = moduleSource.substring(
    moduleSource.indexOf("export class PathStrategyFactory"),
    moduleSource.length,
  );
  const noDirectInstantiation = !factorySection.includes("new DefaultPathStrategyTotality(");
  assertEquals(
    noDirectInstantiation,
    true,
    "Factory should not directly instantiate strategies",
  );
});
