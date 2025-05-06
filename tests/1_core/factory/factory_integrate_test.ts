// Factory integration test for input_text with PromptManager (TDD first)
import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
// Mock Factory and PromptManager
import { setInputTextVariable } from "$lib/factory/variables_util.ts";

// Dummy PromptManager for testing (just receives input_text)
class TestPromptManager {
  public inputText: string | undefined;
  setVariables(variables: { input_text?: string }) {
    this.inputText = variables.input_text;
  }
}

Deno.test("PromptManager receives input_text from Factory", () => {
  const logger = new BreakdownLogger();
  logger.debug("Factory→PromptManager integration test start");
  // Set input_text via Factory
  const variables = setInputTextVariable({}, "test input");
  const promptManager = new TestPromptManager();
  promptManager.setVariables(variables);
  logger.debug(`PromptManager.inputText: ${promptManager.inputText}`);
  assertEquals(promptManager.inputText, "test input");
  logger.debug("Factory→PromptManager integration test end");
});

Deno.test("PromptManager receives empty input_text from Factory", () => {
  const logger = new BreakdownLogger();
  logger.debug("Factory→PromptManager empty input test start");
  const variables = setInputTextVariable({}, "");
  const promptManager = new TestPromptManager();
  promptManager.setVariables(variables);
  logger.debug(`PromptManager.inputText: ${promptManager.inputText}`);
  assertEquals(promptManager.inputText, "");
  logger.debug("Factory→PromptManager empty input test end");
});
