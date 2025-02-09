# Issue Fix Documentation

This document describes the structure and usage of issue fix files in the Breakdown system.

## Overview

Issue fix files are JSON documents that describe a single issue, its analysis, and solution. Each file follows a strict schema that ensures all necessary information is captured consistently.

## Schema Structure

### Root Properties

| Property | Required | Type | Description |
|----------|----------|------|-------------|
| issueId | Yes | string | Unique identifier (format: YYYYMMDD-description) |
| title | Yes | string | Brief description of the issue |
| gap | Yes | object | Gap between ideal and current state |
| errorSummary | Yes | object | Overview of the error situation |
| analysis | Yes | object | Detailed analysis of the issue |
| solution | Yes | object | Proposed solution and tasks |
| references | Yes | array | Related files and documents |
| scope | Yes | string | Issue scope: "minimal" or "comprehensive" |

### Gap Analysis

Describes the gap between ideal and current state:

| Property | Required | Type | Description |
|----------|----------|------|-------------|
| ideal | Yes | string | Description of the desired state |
| current | Yes | string | Description of the current state |
| impact | Yes | string | Impact of this gap on the project |
| minGoalLink | Yes | string | Link to minimal goal documentation |

### Error Summary

Contains the immediate context of the error:

| Property | Required | Type | Description |
|----------|----------|------|-------------|
| command | Yes | string | Command that triggered the error |
| previousChanges | Yes | string | Code changes before the error |
| reason | Yes | string | Overall error explanation |

### Analysis

Detailed breakdown of the issue:

| Property | Required | Type | Description |
|----------|----------|------|-------------|
| requirements | Yes | string[] | Requirement file paths |
| design | Yes | string[] | Design file paths |
| errors | Yes | object[] | List of specific errors |

#### Error Details

Each error in the errors array contains:

| Property | Required | Type | Description |
|----------|----------|------|-------------|
| file | Yes | string | Error file location |
| line | Yes | integer | Error line number |
| message | Yes | string | Error message |
| type | Yes | enum | Error type: code/data/syntax |
| source | Yes | enum | Error source: typescript/deno/application |
| analysis | Yes | object | Detailed error analysis |
| priority | Yes | integer | Priority level (1-5) |

##### Error Analysis Properties

| Property | Required | Type | Description |
|----------|----------|------|-------------|
| occurrenceCount | Yes | integer | Number of times error occurred |
| relatedFiles | Yes | string[] | Files related to this error |
| triggersOtherErrors | Yes | boolean | Whether error triggers others |

### Solution

Proposed fix and implementation plan:

| Property | Required | Type | Description |
|----------|----------|------|-------------|
| approach | Yes | string | Overall solution approach |
| tasks | Yes | object[] | Implementation tasks |
| minGoalAlignment | Yes | string | How solution aligns with minimal goals |

#### Task Properties

| Property | Required | Type | Description |
|----------|----------|------|-------------|
| id | Yes | string | Task identifier |
| description | Yes | string | Task description |
| type | Yes | enum | Task type: code/test/config/docs |
| status | Yes | enum | Status: pending/in-progress/completed |

### References

Links to related files:

| Property | Required | Type | Description |
|----------|----------|------|-------------|
| type | Yes | enum | Reference type: requirement/design/test/code/mingoal |
| path | Yes | string | Path to reference file |

## Example Usage

```json
{
  "issueId": "20250209-typescript-config",
  "title": "TypeScript Configuration Error in Path Resolution",
  "gap": {
    "ideal": "TypeScript path aliases should resolve correctly for all imports",
    "current": "Path aliases fail to resolve in specific test files",
    "impact": "Prevents running tests and blocks CI pipeline",
    "minGoalLink": "docs/mingoal.md#path-resolution"
  },
  "errorSummary": {
    "command": "deno test",
    "previousChanges": "Updated import map configuration",
    "reason": "Import map configuration conflicts with TypeScript paths"
  },
  "analysis": {
    "requirements": ["draft/20250207-defect.md"],
    "design": ["draft/20250207-design.md"],
    "errors": [
      {
        "file": "src/utils/path.ts",
        "line": 42,
        "message": "Cannot find module '@types/command.ts'",
        "type": "code",
        "source": "typescript",
        "analysis": {
          "occurrenceCount": 3,
          "relatedFiles": ["src/cli/breakdown.ts"],
          "triggersOtherErrors": true
        },
        "priority": 1
      }
    ]
  },
  "solution": {
    "approach": "Update import map configuration to align with TypeScript path aliases",
    "tasks": [
      {
        "id": "FIX-001",
        "description": "Update import map paths",
        "type": "config",
        "status": "pending"
      }
    ],
    "minGoalAlignment": "Directly addresses core functionality requirement of working imports"
  },
  "references": [
    {
      "type": "design",
      "path": "draft/20250207-design.md"
    },
    {
      "type": "mingoal",
      "path": "docs/mingoal.md"
    }
  ],
  "scope": "minimal"
}
```

## Notes

- All file paths should be relative to the project root
- Priority levels range from 1 (highest) to 5 (lowest)
- Task IDs should follow the format: FIX-NNN
- Dates in issueId should use YYYYMMDD format
- Scope values:
  - "minimal": Issue directly addresses minimal goals
  - "comprehensive": Issue addresses broader improvements
- minGoalLink should reference specific sections in docs/mingoal.md 