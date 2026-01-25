import { assertEquals } from "@std/assert";
import { removeYamlFrontmatter } from "./markdown_utils.ts";

Deno.test("removeYamlFrontmatter - removes frontmatter", () => {
  const input = `---
title: Test Document
date: 2024-01-01
tags: [test, markdown]
---

# Main Content

This is the actual content.`;

  const expected = `# Main Content

This is the actual content.`;

  assertEquals(removeYamlFrontmatter(input), expected);
});

Deno.test("removeYamlFrontmatter - returns input unchanged when no frontmatter exists", () => {
  const input = `# Main Content

This is the actual content.`;

  assertEquals(removeYamlFrontmatter(input), input);
});

Deno.test("removeYamlFrontmatter - removes empty frontmatter", () => {
  const input = `---
---

# Main Content`;

  const expected = `# Main Content`;

  assertEquals(removeYamlFrontmatter(input), expected);
});
