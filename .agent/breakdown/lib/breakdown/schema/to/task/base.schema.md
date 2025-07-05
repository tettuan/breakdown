# Task Schema

\`\`\`json { "\$schema": "http://json-schema.org/draft-07/schema#", "type": "object", "properties":
{ "tasks": { "type": "array", "items": { "type": "object", "properties": { "title": { "type":
"string" }, "description": { "type": "string" }, "steps": { "type": "array", "items": { "type":
"string" } }, "dependencies": { "type": "array", "items": { "type": "string" } }, "priority": {
"type": "string", "enum": ["high", "medium", "low"] }, "estimate": { "type": "string", "pattern":
"^[0-9]+h\$" }, "technical_requirements": { "type": "array", "items": { "type": "string" } } },
"required": ["title", "description", "steps", "priority", "estimate"] } } } } \`\`\`
