import { assert, assertEquals } from "https://deno.land/std@0.208.0/testing/asserts.ts";
import { toJSON } from "./to.ts";
import type { ConversionResult } from "../mod.ts";

const mockProjectMd = `# Test Project
## Overview
Test project description
`;

const mockIssueMd = `# Test Issue
## Description
Test issue description
`;

const mockTaskMd = `# Test Task
## Steps
1. First step
2. Second step
`;

Deno.test("toJSON - converts project markdown to JSON", async () => {
  const result = await toJSON("project", mockProjectMd, "test_output");
  assertEquals(result.success, true);
  assert(result.data && typeof result.data === "object");
  assertEquals(result.data.title, "Test Project");
});

Deno.test("toJSON - converts issue markdown to JSON", async () => {
  const result = await toJSON("issue", mockIssueMd, "test_output");
  assertEquals(result.success, true);
  assert(result.data && typeof result.data === "object");
  assertEquals(result.data.title, "Test Issue");
});

Deno.test("toJSON - converts task markdown to JSON", async () => {
  const result = await toJSON("task", mockTaskMd, "test_output");
  assertEquals(result.success, true);
  assert(result.data && typeof result.data === "object");
  assertEquals(result.data.title, "Test Task");
}); 