# breakdown Rules Documentation

## Overview

This document describes the rules and conventions used by breakdown for converting Markdown to JSON.

## Node Types

### Heading
- Must have a level (1-6)
- Content is required
- No empty headings allowed

### List
- Can be nested up to 3 levels
- Both ordered and unordered lists are supported
- List items must have content

### Code Block
- Language specification is required
- Content can be empty
- Supports syntax highlighting hints

## Validation Rules

The validator ensures that:
1. All nodes have required properties
2. Node types are valid
3. Content meets formatting requirements
4. Structure follows nesting rules 