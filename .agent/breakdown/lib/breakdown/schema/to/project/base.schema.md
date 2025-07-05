# Project Schema

\`\`\`json { "\$schema": "http://json-schema.org/draft-07/schema#", "type": "object", "properties":
{ "project": { "type": "object", "properties": { "name": { "type": "string" }, "description": {
"type": "string" }, "objectives": { "type": "array", "items": { "type": "string" } },
"deliverables": { "type": "array", "items": { "type": "string" } }, "requirements": { "type":
"array", "items": { "type": "string" } }, "timeline": { "type": "object", "properties": { "start": {
"type": "string" }, "end": { "type": "string" } } } }, "required": ["name", "description",
"objectives", "deliverables", "requirements"] } } } \`\`\`
