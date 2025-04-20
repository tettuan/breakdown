/**
 * Core tests for prompt selection functionality
 *
 * Purpose:
 * - Verify prompt selection based on demonstrative type
 * - Test layer type prompt selection
 * - Validate prompt loading and validation
 *
 * Success Definition:
 * - Correct prompts are selected for each type
 * - Prompts are properly loaded and validated
 * - Error handling for invalid prompts
 */

import { assertEquals } from "jsr:@std/assert@^0.224.0/assert-equals";
import { assertRejects } from "jsr:@std/assert@^0.224.0/assert-rejects";
import { afterEach, beforeEach, describe, it } from "jsr:@std/testing@^0.224.0/bdd";
import { join } from "jsr:@std/path@^0.224.0/join";
import { loadPrompt } from "../../../lib/prompt/loader.ts";
import { DemonstrativeType } from "../../../lib/types/mod.ts";

describe("Prompt Selection", () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = await Deno.makeTempDir();

    // Create test prompt files
    const projectPromptDir = join(testDir, "to", "issue");
    await Deno.mkdir(projectPromptDir, { recursive: true });
    await Deno.writeTextFile(
      join(projectPromptDir, "f_project.md"),
      "# Project Summary\nOutput directory: ./.agent/breakdown/issues/",
    );

    const issuePromptDir = join(testDir, "to", "task");
    await Deno.mkdir(issuePromptDir, { recursive: true });
    await Deno.writeTextFile(
      join(issuePromptDir, "f_issue.md"),
      "# Issue 1\nOutput directory: ./.agent/breakdown/tasks/",
    );
  });

  afterEach(async () => {
    await Deno.remove(testDir, { recursive: true });
  });

  describe("loadPrompt", () => {
    it("should load project to issue prompt", async () => {
      const result = await loadPrompt({
        demonstrativeType: "to",
        layerType: "issue",
        fromLayerType: "project",
        variables: {},
      }, testDir);

      assertEquals(result.content.includes("# Project Summary"), true);
      assertEquals(result.content.includes("./.agent/breakdown/issues/"), true);
    });

    it("should load issue to task prompt", async () => {
      const result = await loadPrompt({
        demonstrativeType: "to",
        layerType: "task",
        fromLayerType: "issue",
        variables: {},
      }, testDir);

      assertEquals(result.content.includes("# Issue 1"), true);
      assertEquals(result.content.includes("./.agent/breakdown/tasks/"), true);
    });

    it("should throw error for invalid prompt", async () => {
      await assertRejects(
        () =>
          loadPrompt({
            demonstrativeType: "no-params" as DemonstrativeType,
            layerType: "issue",
            fromLayerType: "project",
            variables: {},
          }, testDir),
        Error,
        "Prompt loading failed",
      );
    });
  });
});
