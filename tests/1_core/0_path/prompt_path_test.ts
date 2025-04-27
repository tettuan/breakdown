import { assertMatch } from "https://deno.land/std/testing/asserts.ts";
import { BreakdownLogger } from "jsr:@tettuan/breakdownlogger";
import { cleanupTestEnvironment, setupTestEnvironment } from "../../helpers/setup.ts";
import { getPromptPath } from "$lib/path/path.ts";
import { getTestEnvOptions } from "../../helpers/test_utils.ts";

const logger = new BreakdownLogger();

// Test environment setup
const TEST_ENV = await setupTestEnvironment(getTestEnvOptions("prompt-path"));

// Test prompt path resolution for different layer types
Deno.test("prompt path - layer type resolution", () => {
  logger.debug("Testing prompt path resolution for different layer types");

  // Test project layer
  const projectPath = getPromptPath("to", "project", "path/to/project.md");
  assertMatch(
    projectPath,
    /prompts\/to\/project\/f_project\.md$/,
    "Should resolve project prompt path",
  );

  // Test issue layer
  const issuePath = getPromptPath("to", "issue", "path/to/issue.md");
  assertMatch(
    issuePath,
    /prompts\/to\/issue\/f_issue\.md$/,
    "Should resolve issue prompt path",
  );

  // Test task layer
  const taskPath = getPromptPath("to", "task", "path/to/task.md");
  assertMatch(
    taskPath,
    /prompts\/to\/task\/f_task\.md$/,
    "Should resolve task prompt path",
  );
});

// Test prompt path resolution for different demonstrative types
Deno.test("prompt path - demonstrative type handling", () => {
  logger.debug("Testing prompt path resolution for different demonstrative types");

  // Test 'to' demonstrative
  const toPath = getPromptPath("to", "project", "path/to/file.md");
  assertMatch(
    toPath,
    /\.agent\/breakdown\/prompts\/to\/project\/f_project\.md$/,
    "Should handle 'to' demonstrative",
  );

  // Test 'summary' demonstrative
  const summaryPath = getPromptPath("summary", "project", "path/to/file.md");
  assertMatch(
    summaryPath,
    /\.agent\/breakdown\/prompts\/summary\/project\/f_project\.md$/,
    "Should handle 'summary' demonstrative",
  );

  // Test 'defect' demonstrative
  const defectPath = getPromptPath("defect", "project", "path/to/file.md");
  assertMatch(
    defectPath,
    /\.agent\/breakdown\/prompts\/defect\/project\/f_project\.md$/,
    "Should handle 'defect' demonstrative",
  );
});

// Test from file type inference
Deno.test("prompt path - from file type inference", () => {
  logger.debug("Testing from file type inference");

  // Test project file inference
  const projectInfer = getPromptPath("to", "issue", "path/to/project/file.md");
  assertMatch(
    projectInfer,
    /\.agent\/breakdown\/prompts\/to\/issue\/f_project\.md$/,
    "Should infer project type from path",
  );

  // Test issue file inference
  const issueInfer = getPromptPath("to", "task", "path/to/issue/file.md");
  assertMatch(
    issueInfer,
    /\.agent\/breakdown\/prompts\/to\/task\/f_issue\.md$/,
    "Should infer issue type from path",
  );

  // Test task file inference
  const taskInfer = getPromptPath("to", "project", "path/to/task/file.md");
  assertMatch(
    taskInfer,
    /\.agent\/breakdown\/prompts\/to\/project\/f_task\.md$/,
    "Should infer task type from path",
  );

  // Test fallback to layer type
  const fallback = getPromptPath("to", "issue", "path/to/unknown/file.md");
  assertMatch(
    fallback,
    /\.agent\/breakdown\/prompts\/to\/issue\/f_issue\.md$/,
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
