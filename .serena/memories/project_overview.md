# Breakdown Project Overview

Breakdown is a powerful CLI tool for creating AI-optimized development instructions using TypeScript
and JSON Schema. It converts markdown requirements into structured prompts for AI development
agents.

## Purpose

- Transform human-written development requirements into AI-interpretable structured prompts
- Support 3-tier breakdown hierarchy: Project → Issue → Task
- Optimize for AI development agents (Claude, Cursor, etc.)
- Provide JSON Schema-based structured output

## Tech Stack

- **Language**: TypeScript/Deno
- **Version**: 1.3.3
- **Platform**: macOS (Darwin)
- **Runtime**: Deno 2.0+
- **Testing**: Deno test framework with Domain-Driven Design approach
- **CI/CD**: GitHub Actions (test.yml, version-check.yml)

## Architecture

Built on 4 JSR packages:

- @tettuan/breakdownconfig - Configuration management
- @tettuan/breakdownparams - CLI parameter parsing
- @tettuan/breakdownprompt - Core prompt generation engine
- @tettuan/breakdownlogger - Structured logging

## Domain Structure (DDD)

1. **Core Domain** - Prompt generation, parameter handling
2. **Supporting Domain** - Template management, workspace initialization
3. **Generic Domain** - Technical infrastructure, error handling
4. **Interface Layer** - CLI commands, configuration management

## Key Features

- Convert markdown specifications into structured AI prompts
- Support multiple command types: `to`, `summary`, `defect`
- Flexible output formats (Markdown/JSON/YAML)
- Profile-based configuration switching
- Template-driven prompt generation
