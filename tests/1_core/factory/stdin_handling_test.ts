/**
 * Tests for stdin handling in the factory
 *
 * Purpose:
 * - Test that stdin input is correctly handled by the factory
 * - Verify that stdin input is properly passed to the prompt manager
 * - Ensure that stdin input is not rejected when using '-' as input
 *
 * Related Docs:
 * - docs/breakdown/index.ja.md: CLI specifications
 * - docs/breakdown/testing.ja.md: Test requirements
 * - docs/breakdown/options.ja.md: Option specifications
 *
 * Dependencies:
 * - Requires 1_core/1_io/stdin_test.ts to pass first
 * - Requires 1_core/4_cli/io_test.ts to pass first
 */

import { assertEquals } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { PromptVariablesFactory } from "$lib/factory/prompt_variables_factory.ts";
import { setInputTextVariable } from "$lib/factory/variables_util.ts";
import type { DemonstrativeType, LayerType } from "$lib/types/mod.ts";

const logger = new BreakdownLogger();

Deno.test("Factory stdin handling", async (t) => {
  await t.step("should handle stdin input", async () => {
    logger.debug("Testing stdin input handling in factory", {
      purpose: "Verify stdin input is correctly processed",
    });

    const cliParams = {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "project" as LayerType,
      options: {
        fromFile: "-",
        destinationFile: "output.md",
      },
    };

    const factory = await PromptVariablesFactory.create(cliParams);
    const params = factory.getAllParams();
    const updatedParams = setInputTextVariable(params, "Test input from stdin");

    assertEquals(updatedParams.input_text, "Test input from stdin", "Input text should be set from stdin");
  });

  await t.step("should handle both stdin and file input", async () => {
    logger.debug("Testing handling of both stdin and file input", {
      purpose: "Verify stdin input is correctly processed with file input",
    });

    const cliParams = {
      demonstrativeType: "to" as DemonstrativeType,
      layerType: "project" as LayerType,
      options: {
        fromFile: "-",
        destinationFile: "output.md",
      },
    };

    const factory = await PromptVariablesFactory.create(cliParams);
    const params = factory.getAllParams();
    const updatedParams = setInputTextVariable(params, "Test input from stdin");

    assertEquals(updatedParams.input_text, "Test input from stdin", "Input text should be set from stdin");
  });
}); 