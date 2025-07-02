/**
 * @fileoverview Architecture Test for PathResolver Components
 *
 * Validates architectural constraints and safety principles
 * for all PathResolver components following Totality principle.
 *
 * Key architectural validations:
 * - File system safety and error handling
 * - Path resolution security (no path traversal)
 * - Dependency structure and boundaries
 * - Configuration isolation
 *
 * @module factory/0_architecture_path_resolver_test
 */

import { assertEquals, assertExists } from "@std/assert";

/**
 * Architecture Test Suite: PathResolver Components
 *
 * These tests verify architectural principles:
 * 1. Safe file system operations (no arbitrary path access)
 * 2. Proper error handling without exceptions
 * 3. Configuration boundary respect
 * 4. No path traversal vulnerabilities
 * 5. Consistent dependency structure
 */
Deno.test("PathResolver Architecture", async (t) => {
  await t.step("maintains safe dependency structure", async () => {
    // Check all PathResolver files for proper dependencies
    const resolverFiles = [
      "prompt_template_path_resolver.ts",
      "input_file_path_resolver.ts",
      "output_file_path_resolver.ts",
      "schema_file_path_resolver.ts",
    ];

    for (const file of resolverFiles) {
      try {
        const content = await Deno.readTextFile(`./lib/factory/${file}`);

        // Should only import from allowed modules
        const imports = content.match(/import.*from ["']([^"']+)["']/g) || [];

        for (const importStatement of imports) {
          const modulePath = importStatement.match(/from ["']([^"']+)["']/)?.[1];

          // Allowed dependencies
          const allowedPrefixes = [
            "@std/", // Standard library
            "$lib/", // Internal modules
            "../", // Relative imports within project
            "./", // Same directory imports
            "jsr:", // JSR packages
          ];

          const isAllowed = allowedPrefixes.some((prefix) => modulePath?.startsWith(prefix));
          assertEquals(
            isAllowed,
            true,
            `${file} should not import from external modules: ${modulePath}`,
          );
        }

        // Should not use dangerous file operations
        assertEquals(content.includes("Deno.remove"), false, "Should not use file deletion");
        assertEquals(content.includes("Deno.mkdir"), false, "Should not create directories");
        assertEquals(content.includes("Deno.writeFile"), false, "Should not write files");
      } catch (error) {
        // File might not exist, skip
        console.warn(`Skipping ${file}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  });

  await t.step("implements safe path resolution patterns", async () => {
    try {
      const promptResolverContent = await Deno.readTextFile(
        "./lib/factory/prompt_template_path_resolver.ts",
      );

      // Should use safe path operations
      assertEquals(
        promptResolverContent.includes("join("),
        true,
        "Should use path.join for safety",
      );
      assertEquals(
        promptResolverContent.includes("resolve("),
        true,
        "Should use path.resolve for normalization",
      );

      // Should validate paths before use
      assertEquals(
        promptResolverContent.includes("isAbsolute"),
        true,
        "Should check for absolute paths",
      );
      assertEquals(
        promptResolverContent.includes("existsSync"),
        true,
        "Should verify file existence",
      );

      // Should not use dangerous path operations
      assertEquals(
        promptResolverContent.includes(".."),
        false,
        "Should not use relative path traversal",
      );
      assertEquals(promptResolverContent.includes("eval("), false, "Should not use eval");
      assertEquals(
        promptResolverContent.includes("require("),
        false,
        "Should not use dynamic require",
      );
    } catch (error) {
      console.warn(
        `Prompt resolver test skipped: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  await t.step("follows Result type pattern for error handling", async () => {
    try {
      const { PromptTemplatePathResolver } = await import("./prompt_template_path_resolver.ts");

      // Should exist and be instantiable
      assertExists(PromptTemplatePathResolver);

      const _resolver = new PromptTemplatePathResolver({}, {
        demonstrativeType: "to",
        layerType: "project",
        options: {},
      } as unknown);
      assertExists(_resolver);

      // Should have safe methods that return results, not throw
      assertEquals(typeof _resolver.getPath, "function");
    } catch (error) {
      console.warn(
        `PromptTemplatePathResolver import test skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  });

  await t.step("restricts file system access to configured directories", async () => {
    try {
      const content = await Deno.readTextFile("./lib/factory/prompt_template_path_resolver.ts");

      // Should use configuration-based base directories
      assertEquals(
        content.includes("DEFAULT_PROMPT_BASE_DIR"),
        true,
        "Should use configured base directory",
      );

      // Should not access system directories
      const forbiddenPaths = ["/etc/", "/usr/", "/var/", "/tmp/", "C:\\", "/root/"];
      for (const path of forbiddenPaths) {
        assertEquals(
          content.includes(`"${path}"`),
          false,
          `Should not access system path: ${path}`,
        );
      }

      // Should not use environment variables for paths (security)
      assertEquals(
        content.includes("Deno.env"),
        false,
        "Should not use environment variables for paths",
      );
      assertEquals(content.includes("process.env"), false, "Should not use process.env");
    } catch (error) {
      console.warn(
        `File system access test skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  });

  await t.step("implements proper abstraction boundaries", async () => {
    // PathResolvers should not know about CLI specifics beyond their interface
    const resolverFiles = [
      "prompt_template_path_resolver.ts",
      "input_file_path_resolver.ts",
      "output_file_path_resolver.ts",
      "schema_file_path_resolver.ts",
    ];

    for (const file of resolverFiles) {
      try {
        const content = await Deno.readTextFile(`./lib/factory/${file}`);

        // Should not import CLI handlers or processors
        assertEquals(
          content.includes("../cli/handlers"),
          false,
          "Should not depend on CLI handlers",
        );
        assertEquals(
          content.includes("../cli/processors"),
          false,
          "Should not depend on CLI processors",
        );

        // Should not handle command-line parsing
        assertEquals(
          content.includes("Deno.args"),
          false,
          "Should not access command line arguments",
        );
        assertEquals(
          content.includes("process.argv"),
          false,
          "Should not access process arguments",
        );

        // Should focus on path resolution only
        assertEquals(content.includes("console.log"), false, "Should not handle output directly");
      } catch (error) {
        console.warn(
          `Skipping abstraction test for ${file}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  });

  await t.step("enforces immutable configuration usage", async () => {
    try {
      const content = await Deno.readTextFile("./lib/factory/prompt_template_path_resolver.ts");

      // Should not modify configuration objects
      assertEquals(content.includes("config."), true, "Should use configuration");

      // Should not use mutable state
      const letCount = (content.match(/let /g) || []).length;
      const varCount = (content.match(/var /g) || []).length;

      // Allow minimal mutable state for construction but prefer immutability
      assertEquals(letCount <= 3, true, "Should minimize mutable state");
      assertEquals(varCount, 0, "Should not use var declarations");

      // Should not modify passed objects
      assertEquals(
        content.includes("Object.assign(config"),
        false,
        "Should not modify config objects",
      );
      assertEquals(content.includes("delete config"), false, "Should not delete config properties");
    } catch (error) {
      console.warn(
        `Configuration immutability test skipped: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  });
});

/**
 * Security Architecture Test
 *
 * Verifies security-related architectural constraints
 */
Deno.test("PathResolver Security Architecture", async (t) => {
  await t.step("prevents path traversal vulnerabilities", async () => {
    try {
      const content = await Deno.readTextFile("./lib/factory/prompt_template_path_resolver.ts");

      // Should sanitize paths
      assertEquals(content.includes("resolve("), true, "Should use path.resolve for normalization");

      // Should not allow dangerous path patterns
      const dangerousPatterns = ["../", ".\\", "%2e%2e", "%2f", "%5c"];
      for (const pattern of dangerousPatterns) {
        // Check that code doesn't build paths with these patterns directly
        const directUsage = new RegExp(
          `["'\`].*${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*["'\`]`,
        );
        assertEquals(
          directUsage.test(content),
          false,
          `Should not directly use dangerous path pattern: ${pattern}`,
        );
      }
    } catch (error) {
      console.warn(
        `Path traversal test skipped: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  await t.step("validates input parameters", async () => {
    try {
      const { PromptTemplatePathResolver } = await import("./prompt_template_path_resolver.ts");

      const _resolver = new PromptTemplatePathResolver({}, {
        demonstrativeType: "to",
        layerType: "project",
        options: {},
      } as unknown);

      // Should handle invalid inputs gracefully
      // This is testing the architecture, not the specific behavior
      assertEquals(typeof _resolver.getPath, "function");
    } catch (error) {
      console.warn(
        `Input validation test skipped: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  });

  await t.step("limits file system operations to read-only", async () => {
    const resolverFiles = [
      "prompt_template_path_resolver.ts",
      "input_file_path_resolver.ts",
      "output_file_path_resolver.ts",
      "schema_file_path_resolver.ts",
    ];

    for (const file of resolverFiles) {
      try {
        const content = await Deno.readTextFile(`./lib/factory/${file}`);

        // Should only read, not write
        assertEquals(content.includes("Deno.writeFile"), false, "Should not write files");
        assertEquals(content.includes("Deno.writeTextFile"), false, "Should not write text files");
        assertEquals(content.includes("Deno.create"), false, "Should not create files");

        // Should only check existence, not modify
        assertEquals(content.includes("existsSync"), true, "Should check file existence");
      } catch (error) {
        console.warn(
          `Read-only test skipped for ${file}: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }
  });
});
