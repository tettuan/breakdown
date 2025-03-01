import { assertEquals } from "../deps.ts";
import { MarkdownParser } from '../src/markdown/parser.ts';

Deno.test('MarkdownParser - heading parsing', () => {
  const parser = new MarkdownParser();
  const markdown = '# Test Heading';
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
  const result = parser.parse(markdown);
  assertEquals(result, [{
    type: 'paragraph',
    content: 'This is a test paragraph',
  }]);
});

Deno.test('MarkdownParser - list parsing', () => {
  const parser = new MarkdownParser();
  const markdown = '- List item 1\n- List item 2';
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