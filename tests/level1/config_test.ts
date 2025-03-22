import { assertEquals, assertRejects } from "../../deps.ts";
import { BreakdownConfig } from "$lib/config/config.ts";
import { ConfigLoadError } from "$lib/config/errors.ts";
import { exists, join } from "../../deps.ts";

const TEST_WORKING_DIR = ".agent_test/breakdown";

function getDefaultConfig() {
  return {
    working_dir: TEST_WORKING_DIR,
    app_prompt: {
      base_dir: "./breakdown/prompts/"
    },
    app_schema: {
      base_dir: "./rules/schema/"
    }
  };
}

Deno.test("BreakdownConfig - getInstance returns singleton instance", () => {
  const instance1 = BreakdownConfig.getInstance();
  const instance2 = BreakdownConfig.getInstance();
  assertEquals(instance1, instance2);
});

Deno.test("BreakdownConfig - loadConfig loads default configuration", async () => {
  const config = BreakdownConfig.getInstance();
  await config.loadConfig();
  
  const settings = config.getConfig();
  assertEquals(settings.working_dir, "./.agent/breakdown");
  assertEquals(typeof settings.app_prompt?.base_dir, "string");
  assertEquals(settings.app_prompt?.base_dir, "./breakdown/prompts/");
});

Deno.test("BreakdownConfig - loadConfig with custom options", async () => {
  const config = BreakdownConfig.getInstance();
  await config.loadConfig({
    workingDir: "./custom/path",
    configPath: "test_assets/config/valid_config.json"
  });
  
  const settings = config.getConfig();
  assertEquals(settings.working_dir, "./custom/path");
  assertEquals(typeof settings.app_prompt?.base_dir, "string");
  assertEquals(settings.app_prompt?.base_dir, "./breakdown/prompts/");
});

Deno.test("BreakdownConfig - loadConfig with invalid path throws ConfigLoadError", async () => {
  const config = BreakdownConfig.getInstance();
  await assertRejects(
    () => config.loadConfig({ configPath: "nonexistent.json" }),
    ConfigLoadError
  );
});

Deno.test("BreakdownConfig - getters return correct values", async () => {
  const config = BreakdownConfig.getInstance();
  await config.loadConfig({
    workingDir: TEST_WORKING_DIR
  });
  
  assertEquals(config.getWorkingDir(), TEST_WORKING_DIR);
  assertEquals(config.getPromptBaseDir(), "./breakdown/prompts/");
});

Deno.test("BreakdownConfig - loads from deno.land/x", async () => {
  const config = BreakdownConfig.getInstance();
  await config.loadConfig();
  const settings = config.getConfig();
  
  assertEquals(typeof settings.working_dir, "string");
  assertEquals(typeof settings.app_prompt?.base_dir, "string");
});

Deno.test("BreakdownConfig - applies custom config", async () => {
  const config = BreakdownConfig.getInstance();
  const customConfig = {
    working_dir: "./custom/path",
    app_prompt: {
      base_dir: "./custom/prompts/"
    }
  };
  
  await config.loadConfig({
    workingDir: customConfig.working_dir,
    configPath: "test_assets/config/working_dir_config.json"
  });
  
  const settings = config.getConfig();
  assertEquals(settings.working_dir, customConfig.working_dir);
}); 