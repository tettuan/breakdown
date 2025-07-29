/**
 * Markdownファイルのユーティリティ関数
 */

/**
 * YAMLフロントマターを除去する
 * @param content - Markdownファイルの内容
 * @returns フロントマターを除去した内容
 */
export function removeYamlFrontmatter(content: string): string {
  const regex = /^---\s*$[\s\S]*?^---\s*$/m;
  return content.replace(regex, '').trimStart();
}