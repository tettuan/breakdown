import { assertEquals } from "$std/testing/asserts.ts";
import { MarkdownParser } from "@tettuan/breakdownparser";
import { setupTestEnvironment, cleanupTestEnvironment } from "../helpers/setup.ts";
import { assertValidPrompt, assertPromptContains } from "../helpers/assertions.ts";

/**
 * Core tests for markdown parsing functionality
 * These tests verify the fundamental parsing capabilities
 * that form the foundation of the breakdown tool.
 */

const TEST_ENV = await setupTestEnvironment();

// Cleanup after all tests
Deno.test({
  name: "cleanup",
  fn: async () => {
    await cleanupTestEnvironment(TEST_ENV);
  },
  sanitizeResources: false,
  sanitizeOps: false,
});

// Basic parsing tests
Deno.test('MarkdownParser - heading parsing', () => {
  const parser = new MarkdownParser();
  const markdown = '# Test Heading';
  
  assertValidPrompt(markdown);
  const result = parser.parse(markdown);
  
  assertEquals(result, [{
    type: 'heading',
    content: 'Test Heading',
    level: 1,
  }]);
});

Deno.test('MarkdownParser - paragraph parsing', () => {
  const parser = new MarkdownParser();
  const markdown = 'This is a test paragraph';
  
  assertValidPrompt(markdown);
  const result = parser.parse(markdown);
  
  assertEquals(result, [{
    type: 'paragraph',
    content: 'This is a test paragraph',
  }]);
});

Deno.test('MarkdownParser - list parsing', () => {
  const parser = new MarkdownParser();
  const markdown = '- List item 1\n- List item 2';
  
  assertValidPrompt(markdown);
  assertPromptContains(markdown, 'List item 1');
  assertPromptContains(markdown, 'List item 2');
  
  const result = parser.parse(markdown);
  assertEquals(result, [
    {
      type: 'listItem',
      content: 'List item 1',
    },
    {
      type: 'listItem',
      content: 'List item 2',
    },
  ]);
});

// Advanced parsing tests
Deno.test('MarkdownParser - nested list parsing', () => {
  const parser = new MarkdownParser();
  const markdown = '- Level 1\n  - Level 2\n    - Level 3';
  
  assertValidPrompt(markdown);
  const result = parser.parse(markdown);
  
  assertEquals(result, [
    {
      type: 'listItem',
      content: 'Level 1',
      items: [
        {
          type: 'listItem',
          content: 'Level 2',
          items: [
            {
              type: 'listItem',
              content: 'Level 3',
            },
          ],
        },
      ],
    },
  ]);
});

Deno.test('MarkdownParser - mixed content parsing', () => {
  const parser = new MarkdownParser();
  const markdown = '# Title\n\nParagraph\n\n- List item';
  
  assertValidPrompt(markdown);
  const result = parser.parse(markdown);
  
  assertEquals(result, [
    {
      type: 'heading',
      content: 'Title',
      level: 1,
    },
    {
      type: 'paragraph',
      content: 'Paragraph',
    },
    {
      type: 'listItem',
      content: 'List item',
    },
  ]);
});

// Error handling tests
Deno.test('MarkdownParser - empty input handling', () => {
  const parser = new MarkdownParser();
  const markdown = '';
  
  const result = parser.parse(markdown);
  assertEquals(result, []);
});

Deno.test('MarkdownParser - invalid heading level', () => {
  const parser = new MarkdownParser();
  const markdown = '####### Invalid heading level';
  
  const result = parser.parse(markdown);
  assertEquals(result, [{
    type: 'paragraph',
    content: '####### Invalid heading level',
  }]);
}); 