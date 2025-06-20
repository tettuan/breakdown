/**
 * Schema templates for the Breakdown tool.
 *
 * This module provides all schema templates as a TypeScript object, mapping relative paths to schema content strings.
 * These templates are used for initializing and generating schema files in Breakdown workspaces.
 *
 * @example
 * ```ts
 * import { schema } from "jsr:@tettuan/breakdown/lib/templates/schema.ts";
 *
 * // Get the content of a specific schema template
 * const projectSchema = schema["to/project/base.schema.md"];
 * ```
 *
 * @module
 */
/**
 * An object containing all schema templates for Breakdown.
 *
 * - Keys are relative paths (from the original schema directory)
 * - Values are the Markdown content of each schema template
 *
 * Use this object to programmatically access or expand schema templates in your application or CLI tools.
 */
export const schema = {
  "to/project/base.schema.md":
    '# Project Schema\n\n\\`\\`\\`json\n{\n  "\\$schema": "http://json-schema.org/draft-07/schema#",\n  "type": "object",\n  "properties": {\n    "project": {\n      "type": "object",\n      "properties": {\n        "name": { "type": "string" },\n        "description": { "type": "string" },\n        "objectives": {\n          "type": "array",\n          "items": { "type": "string" }\n        },\n        "deliverables": {\n          "type": "array",\n          "items": { "type": "string" }\n        },\n        "requirements": {\n          "type": "array",\n          "items": { "type": "string" }\n        },\n        "timeline": {\n          "type": "object",\n          "properties": {\n            "start": { "type": "string" },\n            "end": { "type": "string" }\n          }\n        }\n      },\n      "required": ["name", "description", "objectives", "deliverables", "requirements"]\n    }\n  }\n}\n\\`\\`\\` ',
  "to/issue/base.schema.md":
    '# Issue Schema\n\n\\`\\`\\`json\n{\n  "\\$schema": "http://json-schema.org/draft-07/schema#",\n  "type": "object",\n  "properties": {\n    "issues": {\n      "type": "array",\n      "items": {\n        "type": "object",\n        "properties": {\n          "title": { "type": "string" },\n          "description": { "type": "string" },\n          "acceptance_criteria": {\n            "type": "array",\n            "items": { "type": "string" }\n          },\n          "dependencies": {\n            "type": "array",\n            "items": { "type": "string" }\n          },\n          "priority": {\n            "type": "string",\n            "enum": ["high", "medium", "low"]\n          },\n          "effort": {\n            "type": "string",\n            "enum": ["small", "medium", "large"]\n          }\n        },\n        "required": ["title", "description", "acceptance_criteria", "priority", "effort"]\n      }\n    }\n  }\n}\n\\`\\`\\` ',
  "to/task/base.schema.md":
    '# Task Schema\n\n\\`\\`\\`json\n{\n  "\\$schema": "http://json-schema.org/draft-07/schema#",\n  "type": "object",\n  "properties": {\n    "tasks": {\n      "type": "array",\n      "items": {\n        "type": "object",\n        "properties": {\n          "title": { "type": "string" },\n          "description": { "type": "string" },\n          "steps": {\n            "type": "array",\n            "items": { "type": "string" }\n          },\n          "dependencies": {\n            "type": "array",\n            "items": { "type": "string" }\n          },\n          "priority": {\n            "type": "string",\n            "enum": ["high", "medium", "low"]\n          },\n          "estimate": {\n            "type": "string",\n            "pattern": "^[0-9]+h\\$"\n          },\n          "technical_requirements": {\n            "type": "array",\n            "items": { "type": "string" }\n          }\n        },\n        "required": ["title", "description", "steps", "priority", "estimate"]\n      }\n    }\n  }\n}\n\\`\\`\\` ',
} as const;
