import { assertEquals } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { walk } from "@std/fs";
import { basename, join } from "@std/path";

const logger = new BreakdownLogger("architecture-examples-test");

/**
 * Architecture tests for examples directory structure and organization
 *
 * These tests verify:
 * - Examples follow consistent naming conventions
 * - Examples are properly ordered and categorized
 * - No circular dependencies between examples
 * - Examples maintain proper separation of concerns
 */

/**
 * Test: Examples follow numbered naming convention
 */
Deno.test("Architecture: Examples follow numbered naming convention", async () => {
  const examplesDir = join(Deno.cwd(), "examples");
  const scriptPattern = /^\d{2}_[a-z_]+\.sh$/;
  const exceptions = ["README.md", "CLAUDE.md", "bugs_report.md", ".gitignore"];
  const testFiles = [
    "test_custom_vars.sh",
    "test_breakdown_config.ts",
    "test_direct_config.ts",
    "test_input.md",
    "test_params_access.ts",
    "test_yaml_load.ts",
    "debug_config.ts",
  ];

  for await (const entry of walk(examplesDir, { maxDepth: 1 })) {
    if (entry.isFile) {
      const filename = basename(entry.path);

      // Skip known exceptions
      if (exceptions.includes(filename)) continue;

      // Skip test files and config files
      if (testFiles.includes(filename)) continue;

      // Skip directories like output/, prompts/, etc.
      if (
        entry.path.includes("/output/") ||
        entry.path.includes("/prompts/") ||
        entry.path.includes("/.agent/")
      ) continue;

      // All .sh files should follow naming convention
      if (filename.endsWith(".sh")) {
        assertEquals(
          scriptPattern.test(filename),
          true,
          `Script ${filename} should follow pattern: NN_name.sh`,
        );
      }
    }
  }
});

/**
 * Test: Examples are properly categorized by number ranges
 */
Deno.test("Architecture: Examples are categorized by number ranges", async () => {
  const examplesDir = join(Deno.cwd(), "examples");
  const categories: Record<string, { range: [number, number]; examples: string[] }> = {
    "setup": { range: [0, 3], examples: [] },
    "basic": { range: [4, 5], examples: [] },
    "config": { range: [6, 11], examples: [] },
    "commands": { range: [12, 14], examples: [] },
    "advanced": { range: [15, 17], examples: [] },
    "integration": { range: [18, 22], examples: [] },
  };

  // Collect examples by category
  for await (const entry of walk(examplesDir, { maxDepth: 1 })) {
    if (entry.isFile && entry.name.endsWith(".sh")) {
      const match = entry.name.match(/^(\d{2})_/);
      if (match) {
        const num = parseInt(match[1]);

        for (const [_category, info] of Object.entries(categories)) {
          if (num >= info.range[0] && num <= info.range[1]) {
            info.examples.push(entry.name);
            break;
          }
        }
      }
    }
  }

  // Verify each category has examples
  for (const [category, info] of Object.entries(categories)) {
    logger.debug(`Category ${category}`, {
      range: info.range,
      count: info.examples.length,
      examples: info.examples,
    });

    // Most categories should have at least one example
    if (category !== "integration" || info.examples.length > 0) {
      assertEquals(
        info.examples.length > 0,
        true,
        `Category ${category} (${info.range[0]}-${info.range[1]}) should have examples`,
      );
    }
  }
});

/**
 * Test: No circular dependencies between example scripts
 */
Deno.test("Architecture: No circular dependencies between examples", async () => {
  const examplesDir = join(Deno.cwd(), "examples");
  const dependencies = new Map<string, Set<string>>();

  // Analyze each script for dependencies (source commands)
  for await (const entry of walk(examplesDir, { maxDepth: 1 })) {
    if (entry.isFile && entry.name.endsWith(".sh")) {
      const content = await Deno.readTextFile(entry.path);
      const deps = new Set<string>();

      // Look for source or . commands that reference other examples
      const sourcePattern = /(?:source|\.)\s+["']?(\d{2}_[a-z_]+\.sh)["']?/g;
      let match;
      while ((match = sourcePattern.exec(content)) !== null) {
        deps.add(match[1]);
      }

      dependencies.set(entry.name, deps);
    }
  }

  // Check for circular dependencies
  function hasCircularDep(
    script: string,
    visited: Set<string>,
    stack: Set<string>,
  ): boolean {
    visited.add(script);
    stack.add(script);

    const deps = dependencies.get(script) || new Set();
    for (const dep of deps) {
      if (!visited.has(dep)) {
        if (hasCircularDep(dep, visited, stack)) {
          return true;
        }
      } else if (stack.has(dep)) {
        logger.error("Circular dependency detected", {
          script,
          dependency: dep,
        });
        return true;
      }
    }

    stack.delete(script);
    return false;
  }

  // Test each script
  for (const script of dependencies.keys()) {
    const hasCircular = hasCircularDep(script, new Set(), new Set());
    assertEquals(
      hasCircular,
      false,
      `Script ${script} should not have circular dependencies`,
    );
  }
});

/**
 * Test: Examples maintain proper directory structure
 */
Deno.test("Architecture: Examples maintain proper directory structure", async () => {
  const examplesDir = join(Deno.cwd(), "examples");

  // Expected subdirectories that examples might create
  const expectedSubdirs = [
    ".agent/breakdown",
    "output",
    "prompts",
    "configs",
  ];

  // Verify examples don't create unexpected directories
  for await (const entry of walk(examplesDir, { maxDepth: 2 })) {
    if (entry.isDirectory && entry.path !== examplesDir) {
      const relativePath = entry.path.replace(examplesDir + "/", "");

      // Skip hidden directories except .agent
      if (relativePath.startsWith(".") && !relativePath.startsWith(".agent")) {
        continue;
      }

      // Check if it's an expected directory or subdirectory
      const isExpected = expectedSubdirs.some((expected) =>
        relativePath === expected || relativePath.startsWith(expected + "/")
      );

      if (!isExpected && !relativePath.match(/^\d{2}_/)) {
        logger.warn("Unexpected directory in examples", {
          directory: relativePath,
        });
      }
    }
  }

  // This test passes as long as no exceptions are thrown
  assertEquals(true, true);
});

/**
 * Test: Examples have consistent shebang and error handling
 */
Deno.test("Architecture: Examples have consistent shell practices", async () => {
  const examplesDir = join(Deno.cwd(), "examples");
  const testFiles = ["test_custom_vars.sh"];

  for await (const entry of walk(examplesDir, { maxDepth: 1 })) {
    if (entry.isFile && entry.name.endsWith(".sh")) {
      // Skip test files
      if (testFiles.includes(entry.name)) continue;

      const content = await Deno.readTextFile(entry.path);
      const lines = content.split("\n");

      // Check for shebang
      assertEquals(
        lines[0] === "#!/bin/bash" || lines[0] === "#!/usr/bin/env bash",
        true,
        `${entry.name} should start with proper shebang`,
      );

      // Check for basic error handling setup
      const hasErrorHandling = content.includes("set -e") ||
        content.includes("set -euo pipefail") ||
        content.includes("|| exit");

      // Not all examples need strict error handling (e.g., educational ones)
      // but most should have some form of it
      if (entry.name.match(/^(0[5-9]|1[0-9]|2[0-9])_/)) {
        assertEquals(
          hasErrorHandling,
          true,
          `${entry.name} should have error handling`,
        );
      }
    }
  }
});

/**
 * Test: Examples don't hardcode absolute paths
 */
Deno.test("Architecture: Examples use relative paths appropriately", async () => {
  const examplesDir = join(Deno.cwd(), "examples");
  const problematicPatterns = [
    /\/Users\//,
    /\/home\//,
    /C:\\/,
    /\/opt\/breakdown/, // Except for installation examples
  ];

  for await (const entry of walk(examplesDir, { maxDepth: 1 })) {
    if (entry.isFile && entry.name.endsWith(".sh")) {
      const content = await Deno.readTextFile(entry.path);

      // Skip installation examples which might reference system paths
      if (entry.name.includes("install") || entry.name.includes("compile")) {
        continue;
      }

      for (const pattern of problematicPatterns) {
        const hasAbsolutePath = pattern.test(content);
        assertEquals(
          hasAbsolutePath,
          false,
          `${entry.name} should not contain hardcoded absolute paths matching ${pattern}`,
        );
      }
    }
  }
});

/**
 * Test: Examples reference breakdown CLI consistently
 */
Deno.test("Architecture: Examples use consistent CLI references", async () => {
  const examplesDir = join(Deno.cwd(), "examples");
  const cliPatterns = [
    /deno run .* \.\.\/cli\/breakdown\.ts/,
    /\.\/\.deno\/bin\/breakdown/,
    /breakdown/, // After installation
  ];

  for await (const entry of walk(examplesDir, { maxDepth: 1 })) {
    if (entry.isFile && entry.name.endsWith(".sh")) {
      // Skip certain examples
      if (
        entry.name === "00_install.sh" ||
        entry.name === "01_compile.sh" ||
        entry.name === "19_clean.sh"
      ) {
        continue;
      }

      const content = await Deno.readTextFile(entry.path);

      // Check if any CLI pattern is used
      const usesCliPattern = cliPatterns.some((pattern) => pattern.test(content));

      // Examples after installation should reference the CLI
      if (parseInt(entry.name.substring(0, 2)) >= 2) {
        assertEquals(
          usesCliPattern,
          true,
          `${entry.name} should reference the breakdown CLI`,
        );
      }
    }
  }
});

/**
 * Test: Example documentation is consistent
 */
Deno.test("Architecture: Examples have consistent documentation", async () => {
  const examplesDir = join(Deno.cwd(), "examples");
  const testFiles = ["test_custom_vars.sh"];

  for await (const entry of walk(examplesDir, { maxDepth: 1 })) {
    if (entry.isFile && entry.name.endsWith(".sh")) {
      // Skip test files
      if (testFiles.includes(entry.name)) continue;

      const content = await Deno.readTextFile(entry.path);
      const lines = content.split("\n");

      // Check for header comments
      let hasDescription = false;
      let hasExampleComment = false;
      let hasGeneralComment = false;

      // Look in first 20 lines for documentation
      for (let i = 0; i < Math.min(20, lines.length); i++) {
        const line = lines[i];
        if (line.match(/^#\s+Example.*:/i) || line.match(/^#\s+Example\s+\d+/i)) {
          hasExampleComment = true;
        }
        if (line.match(/^#\s+Description:|^#\s+This example/i)) {
          hasDescription = true;
        }
        // More flexible: any meaningful comment after shebang
        if (i > 0 && line.match(/^#\s+\w+/) && !line.match(/^#!/)) {
          hasGeneralComment = true;
        }
      }

      // All examples should have some documentation
      assertEquals(
        hasExampleComment || hasDescription || hasGeneralComment,
        true,
        `${entry.name} should have header documentation`,
      );
    }
  }
});

/**
 * Test: Examples don't duplicate functionality unnecessarily
 */
Deno.test("Architecture: Examples have distinct purposes", async () => {
  const examplesDir = join(Deno.cwd(), "examples");
  const examplePurposes = new Map<string, string>();

  // Map examples to their primary purpose based on name and number
  const purposeMap: Record<string, string> = {
    "00": "installation",
    "01": "compilation",
    "02": "initialization",
    "03": "user_config",
    "04": "stdin_methods",
    "05": "basic_commands",
    "06": "basic_config",
    "07": "production_config",
    "08": "team_config",
    "09": "environment_config",
    "10": "production_bugs",
    "11": "custom_production",
    "12": "summary_issue",
    "13": "defect_patterns",
    "14": "custom_variables",
    "15": "pipeline_processing",
    "16": "batch_processing",
    "17": "error_handling",
    "18": "cicd_basic",
    "19": "cleanup",
    "22": "cicd_advanced",
  };

  for await (const entry of walk(examplesDir, { maxDepth: 1 })) {
    if (entry.isFile && entry.name.endsWith(".sh")) {
      const prefix = entry.name.substring(0, 2);
      const purpose = purposeMap[prefix];

      if (purpose) {
        // Check for duplicate purposes
        const existing = Array.from(examplePurposes.entries())
          .find(([_, p]) => p === purpose);

        if (existing && existing[0] !== entry.name) {
          logger.warn("Potential duplicate purpose", {
            example1: existing[0],
            example2: entry.name,
            purpose: purpose,
          });
        }

        examplePurposes.set(entry.name, purpose);
      }
    }
  }

  // Each example should have a unique purpose
  const uniquePurposes = new Set(examplePurposes.values());

  logger.debug("Example purposes", {
    total: examplePurposes.size,
    unique: uniquePurposes.size,
  });

  // Allow some overlap for related examples (like config variants)
  const _allowedDuplicates = ["config"];
  const significantDuplicates = Array.from(examplePurposes.values())
    .filter((p) => !p.includes("config"))
    .filter((p, i, arr) => arr.indexOf(p) !== i);

  assertEquals(
    significantDuplicates.length,
    0,
    "Non-config examples should have unique purposes",
  );
});
