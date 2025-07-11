# Issue Schema

\`\`\`json { "\$schema": "http://json-schema.org/draft-07/schema#", "type": "object", "properties":
{ "issues": { "type": "array", "items": { "type": "object", "properties": { "title": { "type":
"string" }, "description": { "type": "string" }, "acceptance_criteria": { "type": "array", "items":
{ "type": "string" } }, "dependencies": { "type": "array", "items": { "type": "string" } },
"priority": { "type": "string", "enum": ["high", "medium", "low"] }, "effort": { "type": "string",
"enum": ["small", "medium", "large"] } }, "required": ["title", "description",
"acceptance_criteria", "priority", "effort"] } } } } \`\`\`
