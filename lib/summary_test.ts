import { assert, assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { toMarkdown } from "./summary.ts";
import type { ConversionResult } from "../mod.ts";

// Sample text inputs for testing
const mockProjectJson = {
  title: "Test Project",
  overview: "Test project description"
};

const mockIssueJson = {
  title: "Test Issue",
  description: "Test issue description"
};

const mockTaskJson = {
  title: "Test Task",
  steps: ["First step", "Second step"]
};

Deno.test("toMarkdown - converts project text to structured markdown", async () => {
  const result = await toMarkdown("project", JSON.stringify(mockProjectJson), "test_output");
  assertEquals(result.success, true);
  assert(result.data && typeof result.data === "string");
  assert(result.data.includes("# Test Project"));
});

Deno.test("toMarkdown - converts issue text to structured markdown", async () => {
  const result = await toMarkdown("issue", JSON.stringify(mockIssueJson), "test_output");
  assertEquals(result.success, true);
  assert(result.data && typeof result.data === "string");
  assert(result.data.includes("# Test Issue"));
});

Deno.test("toMarkdown - converts task text to structured markdown", async () => {
  const result = await toMarkdown("task", JSON.stringify(mockTaskJson), "test_output");
  assertEquals(result.success, true);
  assert(result.data && typeof result.data === "string");
  assert(result.data.includes("# Test Task"));
}); 