/**
 * Utility functions for Markdown files
 */

/**
 * Remove YAML frontmatter from content
 * @param content - The content of the Markdown file
 * @returns The content with frontmatter removed
 */
export function removeYamlFrontmatter(content: string): string {
  const regex = /^---\s*$[\s\S]*?^---\s*$/m;
  return content.replace(regex, "").trimStart();
}
