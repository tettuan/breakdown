import { assertMatch } from "https://deno.land/std/testing/asserts.ts";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { cleanupTestEnvironment, setupTestEnvironment } from "../../helpers/setup.ts";
import { getPromptPath } from "$lib/path/path.ts";
import { getTestEnvOptions } from "../../helpers/test_utils.ts";
import { PromptVariablesFactory } from "$lib/factory/PromptVariablesFactory.ts";
import { ensureDir } from "jsr:@std/fs@0.224.0";
import { join } from "@std/path/join";

const logger = new BreakdownLogger();

// Test environment setup
const TEST_ENV = await setupTestEnvironment(getTestEnvOptions("prompt-path"));

// Test prompt path resolution for different layer types
Deno.test("prompt path - layer type resolution", async () => {
  logger.debug("Testing prompt path resolution for different layer types");
  // Ensure config file exists
  const configDir = join(".agent", "breakdown", "config");
  const configFile = join(configDir, "app.yml");
  await ensureDir(configDir);
  await Deno.writeTextFile(configFile, `working_dir: .\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schemas\n`);
  // Test project layer
  let cliParams = { demonstrativeType: "to", layerType: "project", options: { fromFile: "path/to/project.md" } };
  let factory = await PromptVariablesFactory.create(cliParams);
  const projectPath = getPromptPath(factory);
  assertMatch(
    projectPath,
    /prompts\/to\/project\/f_project\.md$/,
    "Should resolve project prompt path",
  );
  // Test issue layer
  cliParams = { demonstrativeType: "to", layerType: "issue", options: { fromFile: "path/to/issue.md" } };
  factory = await PromptVariablesFactory.create(cliParams);
  const issuePath = getPromptPath(factory);
  assertMatch(
    issuePath,
    /prompts\/to\/issue\/f_issue\.md$/,
    "Should resolve issue prompt path",
  );
  // Test task layer
  cliParams = { demonstrativeType: "to", layerType: "task", options: { fromFile: "path/to/task.md" } };
  factory = await PromptVariablesFactory.create(cliParams);
  const taskPath = getPromptPath(factory);
  assertMatch(
    taskPath,
    /prompts\/to\/task\/f_task\.md$/,
    "Should resolve task prompt path",
  );
});

// Test prompt path resolution for different demonstrative types
Deno.test("prompt path - demonstrative type handling", async () => {
  logger.debug("Testing prompt path resolution for different demonstrative types");
  const configDir = join(".agent", "breakdown", "config");
  const configFile = join(configDir, "app.yml");
  await ensureDir(configDir);
  await Deno.writeTextFile(configFile, `working_dir: .\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schemas\n`);
  // Test 'to' demonstrative
  let cliParams = { demonstrativeType: "to", layerType: "project", options: { fromFile: "path/to/file.md" } };
  let factory = await PromptVariablesFactory.create(cliParams);
  const toPath = getPromptPath(factory);
  assertMatch(
    toPath,
    /prompts\/to\/project\/f_project\.md$/,
    "Should handle 'to' demonstrative",
  );
  // Test 'summary' demonstrative
  cliParams = { demonstrativeType: "summary", layerType: "project", options: { fromFile: "path/to/file.md" } };
  factory = await PromptVariablesFactory.create(cliParams);
  const summaryPath = getPromptPath(factory);
  assertMatch(
    summaryPath,
    /prompts\/summary\/project\/f_project\.md$/,
    "Should handle 'summary' demonstrative",
  );
  // Test 'defect' demonstrative
  cliParams = { demonstrativeType: "defect", layerType: "project", options: { fromFile: "path/to/file.md" } };
  factory = await PromptVariablesFactory.create(cliParams);
  const defectPath = getPromptPath(factory);
  assertMatch(
    defectPath,
    /prompts\/defect\/project\/f_project\.md$/,
    "Should handle 'defect' demonstrative",
  );
});

// Test from file type inference
Deno.test("prompt path - from file type inference", async () => {
  logger.debug("Testing from file type inference");
  const configDir = join(".agent", "breakdown", "config");
  const configFile = join(configDir, "app.yml");
  await ensureDir(configDir);
  await Deno.writeTextFile(configFile, `working_dir: .\napp_prompt:\n  base_dir: prompts\napp_schema:\n  base_dir: schemas\n`);
  // Test project file inference
  let cliParams = { demonstrativeType: "to", layerType: "issue", options: { fromFile: "path/to/project/file.md" } };
  let factory = await PromptVariablesFactory.create(cliParams);
  const projectInfer = getPromptPath(factory);
  assertMatch(
    projectInfer,
    /prompts\/to\/issue\/f_issue\.md$/,
    "Should infer project type from path",
  );
  // Test issue file inference
  cliParams = { demonstrativeType: "to", layerType: "task", options: { fromFile: "path/to/issue/file.md" } };
  factory = await PromptVariablesFactory.create(cliParams);
  const issueInfer = getPromptPath(factory);
  assertMatch(
    issueInfer,
    /prompts\/to\/task\/f_task\.md$/,
    "Should infer issue type from path",
  );
  // Test task file inference
  cliParams = { demonstrativeType: "to", layerType: "project", options: { fromFile: "path/to/task/file.md" } };
  factory = await PromptVariablesFactory.create(cliParams);
  const taskInfer = getPromptPath(factory);
  assertMatch(
    taskInfer,
    /prompts\/to\/project\/f_project\.md$/,
    "Should infer task type from path",
  );
  // Test fallback to layer type
  cliParams = { demonstrativeType: "to", layerType: "issue", options: { fromFile: "path/to/unknown/file.md" } };
  factory = await PromptVariablesFactory.create(cliParams);
  const fallback = getPromptPath(factory);
  assertMatch(
    fallback,
    /prompts\/to\/issue\/f_issue\.md$/,
    "Should fallback to layer type when inference fails",
  );
});

// Cleanup after all tests
Deno.test({
  name: "cleanup",
  fn: async () => {
    await cleanupTestEnvironment(TEST_ENV);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});
