/**
 * @fileoverview Working Directory and Base Directory Interaction Tests
 *
 * Tests to verify the correct behavior of working_dir and base_dir combinations
 * This test specifically addresses the issue where paths are incorrectly resolved
 * when working_dir is "." and base_dir contains relative paths.
 *
 * @module tests/0_core_domain/prompt_path_resolution/working_dir_base_dir_interaction_test
 */

import { assertEquals, assertExists } from "../../deps.ts";
import { join } from "jsr:@std/path@^1.0.9";
import {
  PromptTemplatePathResolverTotality,
} from "../../../lib/factory/prompt_template_path_resolver_totality.ts";
import type { TwoParams_Result } from "../../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";

const logger = new BreakdownLogger("working-dir-base-dir-test");

Deno.test("3_core - Working directory '.' with relative base_dir paths", async () => {
  const originalCwd = Deno.cwd();
  const testDir = await Deno.makeTempDir({ prefix: "breakdown-wd-test-" });
  
  try {
    // Create test structure
    const agentDir = join(testDir, ".agent", "breakdown");
    const promptsDir = join(agentDir, "prompts", "to", "issue");
    await Deno.mkdir(promptsDir, { recursive: true });
    
    const templateFile = join(promptsDir, "f_default.md");
    await Deno.writeTextFile(templateFile, "# Test Template\n{{input_text}}");
    
    // Change to test directory
    Deno.chdir(testDir);
    
    logger.debug("Test setup", {
      testDir,
      currentDir: Deno.cwd(),
      templateFile,
    });
    
    // Test configuration that mimics E2E test setup
    const config = {
      working_dir: ".",
      app_prompt: {
        base_dir: "./.agent/breakdown/prompts"
      },
      app_schema: {
        base_dir: "./.agent/breakdown/schema"
      }
    };
    
    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["to", "issue"],
      directiveType: "to",
      layerType: "issue",
      options: {},
    };
    
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
        const expectedBaseDir = join(testDir, ".agent", "breakdown", "prompts");
        assertEquals(pathResult.data.metadata.baseDir, expectedBaseDir);
      }
    }
  } finally {
    Deno.chdir(originalCwd);
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("3_core - Working directory as absolute path with relative base_dir", async () => {
  const testDir = await Deno.makeTempDir({ prefix: "breakdown-wd-abs-test-" });
  
  try {
    // Create test structure
    const agentDir = join(testDir, ".agent", "breakdown");
    const promptsDir = join(agentDir, "prompts", "summary", "project");
    await Deno.mkdir(promptsDir, { recursive: true });
    
    const templateFile = join(promptsDir, "f_default.md");
    await Deno.writeTextFile(templateFile, "# Summary Template\n{{input_text}}");
    
    logger.debug("Test setup with absolute working_dir", {
      testDir,
      templateFile,
    });
    
    // Test configuration with absolute working_dir
    const config = {
      working_dir: testDir, // Absolute path
      app_prompt: {
        base_dir: ".agent/breakdown/prompts" // Relative path (no leading ./)
      }
    };
    
    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["summary", "project"],
      directiveType: "summary",
      layerType: "project",
      options: {},
    };
    
    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);
    
    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertExists(pathResult.ok);
      assertEquals(pathResult.ok, true);
      
      if (pathResult.ok) {
        logger.debug("Path resolution with absolute working_dir", {
          resolvedPath: pathResult.data.value,
          expectedPath: templateFile,
          metadata: pathResult.data.metadata,
        });
        
        // The resolved path should match the template file
        assertEquals(pathResult.data.value, templateFile);
        assertEquals(pathResult.data.status, "Found");
      }
    }
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});

Deno.test("3_core - Verify path resolution does not duplicate working_dir components", async () => {
  const testDir = await Deno.makeTempDir({ prefix: "breakdown-no-dup-test-" });
  
  try {
    // Create a structure that could cause duplication
    const workspaceDir = join(testDir, "workspace");
    const agentDir = join(workspaceDir, ".agent", "breakdown");
    const promptsDir = join(agentDir, "prompts", "defect", "task");
    await Deno.mkdir(promptsDir, { recursive: true });
    
    const templateFile = join(promptsDir, "f_default.md");
    await Deno.writeTextFile(templateFile, "# Defect Template\n{{input_text}}");
    
    logger.debug("Test setup for duplication check", {
      testDir,
      workspaceDir,
      templateFile,
    });
    
    // Configuration that might cause path duplication
    const config = {
      working_dir: workspaceDir,
      app_prompt: {
        base_dir: ".agent/breakdown/prompts"
      }
    };
    
    const cliParams: TwoParams_Result = {
      type: "two",
      params: ["defect", "task"],
      directiveType: "defect",
      layerType: "task",
      options: {},
    };
    
    const resolverResult = PromptTemplatePathResolverTotality.create(config, cliParams);
    assertExists(resolverResult.ok);
    assertEquals(resolverResult.ok, true);
    
    if (resolverResult.ok) {
      const pathResult = resolverResult.data.getPath();
      assertExists(pathResult.ok);
      assertEquals(pathResult.ok, true);
      
      if (pathResult.ok) {
        logger.debug("Path resolution without duplication", {
          resolvedPath: pathResult.data.value,
          expectedPath: templateFile,
          workingDir: config.working_dir,
          baseDir: config.app_prompt.base_dir,
        });
        
        // Ensure no duplication of path components
        assertEquals(pathResult.data.value, templateFile);
        
        // Verify the path doesn't contain duplicated segments
        const pathSegments = pathResult.data.value.split("/");
        const agentCount = pathSegments.filter(seg => seg === ".agent").length;
        const breakdownCount = pathSegments.filter(seg => seg === "breakdown").length;
        
        assertEquals(agentCount, 1, "Should have exactly one '.agent' in path");
        assertEquals(breakdownCount, 1, "Should have exactly one 'breakdown' in path");
      }
    }
  } finally {
    await Deno.remove(testDir, { recursive: true });
  }
});