/**
 * @fileoverview Working Directory "." with specific base_dir Test
 *
 * Tests the behavior when working_dir is set to "." and base_dir is set to "tests/tmp/prompts"
 * This test verifies the path resolution logic and ensures correct handling of relative paths.
 *
 * @module tests/0_core_domain/prompt_path_resolution/working_dir_dot_test
 */

import { assertEquals, assertExists } from "../../deps.ts";
import { join } from "jsr:@std/path@^1.0.9";
import {
  PromptTemplatePathResolverTotality,
} from "../../../lib/factory/prompt_template_path_resolver_totality.ts";
import type { TwoParams_Result } from "../../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("working-dir-dot-test");

Deno.test("Working directory '.' with base_dir 'tests/tmp/prompts' - from project root", async () => {
  const originalCwd = Deno.cwd();

  try {
    // Create test structure from project root
    const testPromptsDir = join(originalCwd, "tests", "tmp", "prompts", "to", "issue");
    await Deno.mkdir(testPromptsDir, { recursive: true });

    const templateFile = join(testPromptsDir, "f_default.md");
    await Deno.writeTextFile(templateFile, "# Test Template\n{{input_text}}");

    logger.debug("Test setup from project root", {
      originalCwd,
      testPromptsDir,
      templateFile,
    });

    // Test configuration
    const config = {
      working_dir: ".",
      app_prompt: {
        base_dir: "tests/tmp/prompts",
      },
    };

    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["to", "issue"],
      directiveType: "to",
      layerType: "issue",
      options: {},
    };

    logger.debug("Configuration", {
      config,
      expectedBaseDir: join(originalCwd, "tests", "tmp", "prompts"),
      expectedTemplatePath: templateFile,
    });

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertExists(pathResult.ok);
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        logger.debug("Path resolution result", {
          resolvedPath: pathResult.data.value,
          expectedPath: templateFile,
          metadata: pathResult.data.metadata,
        });

        // The resolved path should be the absolute path to the template
        assertEquals(pathResult.data.value, templateFile);
        assertEquals(pathResult.data.status, "Found");

        // Verify the base directory is correctly resolved
        const expectedBaseDir = join(originalCwd, "tests", "tmp", "prompts");
        assertEquals(pathResult.data.metadata.baseDir, expectedBaseDir);
      }
    }
  } finally {
    // Cleanup
    try {
      await Deno.remove(join(originalCwd, "tests", "tmp"), { recursive: true });
    } catch {
      // Ignore if doesn't exist
    }
  }
});

Deno.test("Working directory '.' with base_dir 'tests/tmp/prompts' - from subdirectory", async () => {
  const originalCwd = Deno.cwd();
  const testSubDir = join(originalCwd, "tests", "fixtures");

  try {
    // Create test structure
    const testPromptsDir = join(originalCwd, "tests", "tmp", "prompts", "summary", "project");
    await Deno.mkdir(testPromptsDir, { recursive: true });

    const templateFile = join(testPromptsDir, "f_default.md");
    await Deno.writeTextFile(templateFile, "# Summary Template\n{{input_text}}");

    // Change to subdirectory
    Deno.chdir(testSubDir);

    logger.debug("Test setup from subdirectory", {
      originalCwd,
      currentCwd: Deno.cwd(),
      testPromptsDir,
      templateFile,
    });

    // Test configuration with working_dir "." from subdirectory
    const config = {
      working_dir: ".",
      app_prompt: {
        base_dir: "tests/tmp/prompts",
      },
    };

    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["summary", "project"],
      directiveType: "summary",
      layerType: "project",
      options: {},
    };

    logger.debug("Configuration from subdirectory", {
      config,
      currentDir: Deno.cwd(),
      expectedResolvedWorkingDir: testSubDir,
      expectedBaseDir: join(testSubDir, "tests", "tmp", "prompts"),
    });

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();

      logger.debug("Path resolution from subdirectory", {
        resolverOk: resolverResult.ok,
        pathOk: pathResult.ok,
        error: !pathResult.ok ? pathResult.error : undefined,
      });

      // From tests/fixtures, the path tests/tmp/prompts won't exist
      // This should result in a BaseDirectoryNotFound error
      assertEquals(pathResult.ok, false);

      if (!pathResult.ok) {
        assertEquals(pathResult.error.kind, "BaseDirectoryNotFound");
        logger.debug("Expected error", {
          errorKind: pathResult.error.kind,
          attemptedPaths: pathResult.error.kind === "TemplateNotFound"
            ? pathResult.error.attempted
            : undefined,
        });
      }
    }
  } finally {
    Deno.chdir(originalCwd);
    // Cleanup
    try {
      await Deno.remove(join(originalCwd, "tests", "tmp"), { recursive: true });
    } catch {
      // Ignore if doesn't exist
    }
  }
});

Deno.test("Working directory '.' behavior comparison", async () => {
  const originalCwd = Deno.cwd();

  try {
    // Create two different prompt structures
    const structure1 = join(originalCwd, "tests", "tmp", "prompts", "to", "task");
    const structure2 = join(originalCwd, ".agent", "breakdown", "prompts", "to", "task");

    await Deno.mkdir(structure1, { recursive: true });
    await Deno.mkdir(structure2, { recursive: true });

    const template1 = join(structure1, "f_default.md");
    const template2 = join(structure2, "f_default.md");

    await Deno.writeTextFile(template1, "# Template from tests/tmp\n{{input_text}}");
    await Deno.writeTextFile(template2, "# Template from .agent\n{{input_text}}");

    logger.debug("Comparison test setup", {
      cwd: originalCwd,
      template1,
      template2,
    });

    // Test configuration 1: tests/tmp/prompts
    const config1 = {
      working_dir: ".",
      app_prompt: {
        base_dir: "tests/tmp/prompts",
      },
    };

    // Test configuration 2: .agent/breakdown/prompts
    const config2 = {
      working_dir: ".",
      app_prompt: {
        base_dir: ".agent/breakdown/prompts",
      },
    };

    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["to", "task"],
      directiveType: "to",
      layerType: "task",
      options: {},
    };

    // Test config 1
    const resolver1Result = PromptTemplatePathResolverTotality.create(config1, cliParams);
    assertExists(resolver1Result.ok);
    assertEquals(resolver1Result.ok, true);

    if (resolver1Result.ok) {
      const path1Result = resolver1Result.data.getPath();
      assertExists(path1Result.ok);
      assertEquals(path1Result.ok, true);

      if (path1Result.ok) {
        logger.debug("Config 1 result", {
          config: config1,
          resolvedPath: path1Result.data.value,
          baseDir: path1Result.data.metadata.baseDir,
        });

        assertEquals(path1Result.data.value, template1);
        assertEquals(
          path1Result.data.metadata.baseDir,
          join(originalCwd, "tests", "tmp", "prompts"),
        );
      }
    }

    // Test config 2
    const resolver2Result = PromptTemplatePathResolverTotality.create(config2, cliParams);
    assertExists(resolver2Result.ok);
    assertEquals(resolver2Result.ok, true);

    if (resolver2Result.ok) {
      const path2Result = resolver2Result.data.getPath();
      assertExists(path2Result.ok);
      assertEquals(path2Result.ok, true);

      if (path2Result.ok) {
        logger.debug("Config 2 result", {
          config: config2,
          resolvedPath: path2Result.data.value,
          baseDir: path2Result.data.metadata.baseDir,
        });

        assertEquals(path2Result.data.value, template2);
        assertEquals(
          path2Result.data.metadata.baseDir,
          join(originalCwd, ".agent", "breakdown", "prompts"),
        );
      }
    }

    logger.debug("Comparison summary", {
      workingDir: ".",
      resolvedWorkingDir: originalCwd,
      config1BaseDir: "tests/tmp/prompts",
      config1ResolvedPath: join(originalCwd, "tests", "tmp", "prompts"),
      config2BaseDir: ".agent/breakdown/prompts",
      config2ResolvedPath: join(originalCwd, ".agent", "breakdown", "prompts"),
    });
  } finally {
    // Cleanup
    try {
      await Deno.remove(join(originalCwd, "tests", "tmp"), { recursive: true });
    } catch {
      // Ignore
    }
    try {
      await Deno.remove(join(originalCwd, ".agent"), { recursive: true });
    } catch {
      // Ignore
    }
  }
});

Deno.test("Working directory 'tmp' with base_dir '.agent/breakdown' - path resolution", async () => {
  const originalCwd = Deno.cwd();

  try {
    // Create test structure
    // tmp directory at project root
    const tmpDir = join(originalCwd, "tmp");
    await Deno.mkdir(tmpDir, { recursive: true });

    // .agent/breakdown structure inside tmp
    const agentPromptsDir = join(tmpDir, ".agent", "breakdown", "prompts", "defect", "issue");
    await Deno.mkdir(agentPromptsDir, { recursive: true });

    const templateFile = join(agentPromptsDir, "f_default.md");
    await Deno.writeTextFile(templateFile, "# Defect Template in tmp/.agent\n{{input_text}}");

    logger.debug("Test setup for tmp + .agent/breakdown", {
      originalCwd,
      tmpDir,
      agentPromptsDir,
      templateFile,
    });

    // Test configuration
    const config = {
      working_dir: "tmp",
      app_prompt: {
        base_dir: ".agent/breakdown/prompts",
      },
    };

    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["defect", "issue"],
      directiveType: "defect",
      layerType: "issue",
      options: {},
    };

    logger.debug("Configuration with tmp working_dir", {
      config,
      expectedWorkingDir: tmpDir,
      expectedBaseDir: join(tmpDir, ".agent", "breakdown", "prompts"),
      expectedTemplatePath: templateFile,
    });

    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);

    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertExists(pathResult.ok);
      assertEquals(pathResult.ok, true);

      if (pathResult.ok) {
        logger.debug("Path resolution result", {
          resolvedPath: pathResult.data.value,
          expectedPath: templateFile,
          metadata: pathResult.data.metadata,
        });

        // The resolved path should be the absolute path to the template
        assertEquals(pathResult.data.value, templateFile);
        assertEquals(pathResult.data.status, "Found");

        // Verify the base directory is correctly resolved
        const expectedBaseDir = join(tmpDir, ".agent", "breakdown", "prompts");
        assertEquals(pathResult.data.metadata.baseDir, expectedBaseDir);
      }
    }
  } finally {
    // Cleanup
    try {
      await Deno.remove(join(originalCwd, "tmp"), { recursive: true });
    } catch {
      // Ignore if doesn't exist
    }
  }
});

Deno.test("Working directory relative paths - comprehensive test", async () => {
  const originalCwd = Deno.cwd();

  try {
    // Create various test structures
    const structures = [
      {
        name: "Relative working_dir with relative base_dir",
        workingDir: "examples",
        baseDir: ".agent/breakdown/prompts",
        expectedBasePath: join(originalCwd, "examples", ".agent", "breakdown", "prompts"),
      },
      {
        name: "Nested relative working_dir",
        workingDir: "tests/fixtures",
        baseDir: "prompts",
        expectedBasePath: join(originalCwd, "tests", "fixtures", "prompts"),
      },
      {
        name: "Parent directory reference",
        workingDir: "tests/../tmp",
        baseDir: "workspace/prompts",
        expectedBasePath: join(originalCwd, "tmp", "workspace", "prompts"),
      },
    ];

    for (const struct of structures) {
      logger.debug(`Testing: ${struct.name}`, {
        workingDir: struct.workingDir,
        baseDir: struct.baseDir,
        expectedBasePath: struct.expectedBasePath,
      });

      // Create the expected directory structure
      const templateDir = join(struct.expectedBasePath, "to", "task");
      await Deno.mkdir(templateDir, { recursive: true });

      const templateFile = join(templateDir, "f_default.md");
      await Deno.writeTextFile(templateFile, `# Template for ${struct.name}\n{{input_text}}`);

      // Test configuration
      const config = {
        working_dir: struct.workingDir,
        app_prompt: {
          base_dir: struct.baseDir,
        },
      };

      const cliParams: TwoParams_Result = {
        type: "two",
        params: ["to", "task"],
        directiveType: "to",
        layerType: "task",
        options: {},
      };

      const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
      assertExists(resolverResult.ok, `Failed to create resolver for ${struct.name}`);
      assertEquals(resolverResult.ok, true);

      if (resolverResult.ok) {
        const pathResult = resolverResult.data.getPath();
        assertExists(pathResult.ok, `Failed to get path for ${struct.name}`);
        assertEquals(pathResult.ok, true);

        if (pathResult.ok) {
          assertEquals(pathResult.data.value, templateFile, `Path mismatch for ${struct.name}`);
          assertEquals(
            pathResult.data.metadata.baseDir,
            struct.expectedBasePath,
            `Base dir mismatch for ${struct.name}`,
          );

          logger.debug(`Success: ${struct.name}`, {
            resolvedPath: pathResult.data.value,
            baseDir: pathResult.data.metadata.baseDir,
          });
        }
      }
    }
  } finally {
    // Cleanup
    const dirsToClean = ["tmp", "examples/.agent", "tests/fixtures/prompts"];
    for (const dir of dirsToClean) {
      try {
        await Deno.remove(join(originalCwd, dir), { recursive: true });
      } catch {
        // Ignore if doesn't exist
      }
    }
  }
});
