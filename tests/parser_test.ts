import { assertEquals } from "https://deno.land/std@0.210.0/testing/asserts.ts";
import { MarkdownParser } from "../src/mod.ts";
import type { MarkdownNode, NodeType } from "../src/markdown/types.ts";

Deno.test("MarkdownParser - heading parsing", () => {
  const parser = new MarkdownParser();
  const result = parser.parse("# Test Heading\n");
  const expected: MarkdownNode = {
    type: "heading" as NodeType,
    title: "Test Heading",
    content: "# Test Heading\n",
    metadata: {},
    children: [{
      type: "heading" as NodeType,
      content: "Test Heading",
      level: 1,
      title: "Test Heading"
    }]
  };
  assertEquals(result, expected);
});

Deno.test("MarkdownParser - paragraph parsing", () => {
  const parser = new MarkdownParser();
  const result = parser.parse("Test paragraph\n");
  const expected: MarkdownNode = {
    type: "heading" as NodeType,
    title: "Test Project",
    content: "Test paragraph\n",
    metadata: {},
    children: [{
      type: "paragraph" as NodeType,
      content: "Test paragraph"
    }]
  };
  assertEquals(result, expected);
});

Deno.test("MarkdownParser - list parsing", () => {
  const parser = new MarkdownParser();
  const result = parser.parse("- Item 1\n- Item 2\n");
  const expected: MarkdownNode = {
    type: "heading" as NodeType,
    title: "Test Project",
    content: "- Item 1\n- Item 2\n",
    metadata: {},
    children: [
      {
        type: "listItem" as NodeType,
        content: "Item 1"
      },
      {
        type: "listItem" as NodeType,
        content: "Item 2"
      }
    ]
  };
  assertEquals(result, expected);
}); 