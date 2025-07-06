# Bug Analysis Schema

\`\`\`json
{
  "\$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "analysis_summary": {
      "type": "object",
      "properties": {
        "total_issues": { "type": "number" },
        "critical_count": { "type": "number" },
        "high_count": { "type": "number" },
        "medium_count": { "type": "number" },
        "low_count": { "type": "number" },
        "analyzed_files": {
          "type": "array",
          "items": { "type": "string" }
        }
      },
      "required": ["total_issues", "critical_count", "high_count", "medium_count", "low_count"]
    },
    "bugs": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { 
            "type": "string",
            "description": "Unique identifier for the bug"
          },
          "title": { 
            "type": "string",
            "description": "Brief title of the bug"
          },
          "description": { 
            "type": "string",
            "description": "Detailed description of the issue"
          },
          "severity": {
            "type": "string",
            "enum": ["critical", "high", "medium", "low"],
            "description": "Severity level of the bug"
          },
          "type": {
            "type": "string",
            "enum": [
              "code_quality",
              "security_vulnerability", 
              "error_handling",
              "resource_management",
              "type_safety",
              "concurrency",
              "api_integration",
              "configuration",
              "performance",
              "logic_error"
            ],
            "description": "Category of the bug"
          },
          "location": {
            "type": "object",
            "properties": {
              "file": { "type": "string" },
              "line": { "type": "number" },
              "column": { "type": "number" },
              "function": { "type": "string" }
            },
            "required": ["file"]
          },
          "impact": {
            "type": "string",
            "description": "Potential impact of the bug"
          },
          "code_snippet": {
            "type": "string",
            "description": "Relevant code snippet showing the issue"
          },
          "suggested_fix": {
            "type": "string",
            "description": "Recommended solution or fix"
          },
          "references": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Links to documentation or resources"
          },
          "tags": {
            "type": "array",
            "items": { "type": "string" },
            "description": "Tags for categorization"
          }
        },
        "required": ["id", "title", "description", "severity", "type", "location", "impact", "suggested_fix"]
      }
    },
    "recommendations": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "priority": {
            "type": "string",
            "enum": ["immediate", "high", "medium", "low"]
          },
          "action": { "type": "string" },
          "reason": { "type": "string" }
        },
        "required": ["priority", "action", "reason"]
      }
    }
  },
  "required": ["analysis_summary", "bugs", "recommendations"]
}
\`\`\`