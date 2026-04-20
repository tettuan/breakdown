# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.8.9] - 2026-04-20

### Changed
- Bumped `@tettuan/breakdownconfig` to `^1.2.5` (refactor of `baseDir` validation: removed hardcoded absolute-path allowlist, added Windows drive-letter handling).

## [1.8.8] - 2026-04-19

### Changed
- Updated JSR dependencies to latest compatible versions.

### Documentation
- `release` skill: auto-progress release flow without per-step user confirmation; prefer `pull --ff-only` for develop/main syncing.

## [1.8.7] - 2026-04-18

### Changed
- CI: removed duplicate workflow triggers to prevent redundant pipeline runs.

### Documentation
- `branch-management` skill: link to issue-fix convention.
- Skill guidance: enforce issue-linked commits and stepwise release checklist.

## [1.8.6] - 2026-04-18

### Changed
- `runBreakdown({ returnMode: true })` now returns `{ ok: false, error }` with a structured `BreakdownError` when prompt generation fails (Issue #104). Previously it returned `{ ok: true, data: undefined }` with a stdout warning for some error cases, violating the Result contract.
- Library mode produces no stdout output. Diagnostic warnings (e.g. missing configuration profile) are routed to stderr via `console.error`, so callers using `returnMode: true` receive clean `Result<string, BreakdownError>` without side effects on stdout.
- `TwoParamsHandlerError.PromptGenerationError.error` changed from `string` to `PromptError | string` to preserve the discriminated `PromptError` kind (e.g. `TemplateNotFound`) across layer boundaries. `BreakdownError.PromptGenerationError.cause` is the surfaced field for library consumers.

### Removed
- `handleTwoParamsError`, `analyzeErrorSeverity`, `isTestingErrorHandling`, and the `ErrorHandlingResult` / `ErrorSeverity*` types in `lib/cli/error_handler.ts`. The severity-downgrade path violated the Result contract by returning `{ ok: true }` for recoverable errors and relied on fragile substring matching (e.g. `"/nonexistent/"`).
- `lib/cli/error_handler.ts` itself after the refactor (dead code).

### Migration notes
- Callers of `runBreakdown(args, { returnMode: true })` that previously treated `result.data === undefined` as success should now check `result.ok === true` and `typeof result.data === "string"`.
- Error cases now set `result.error.kind === "PromptGenerationError"` with `result.error.cause` being a `PromptError` object when the failure originated from the BreakdownPrompt adapter. Path-resolution short-circuits (e.g. missing `base_dir`) still surface as `cause: string`. Consumers that need to branch on `result.error.cause.kind` should first check `typeof result.error.cause === "object"`.

## [1.8.4] - 2026-02-19

### Changed
- **Skills**: Merged `release-procedure` skill into `release` skill, fixing vtag documentation

## [1.8.3] - 2026-02-18

### Fixed
- **Examples**: Fixed examples 15 and 16 broken validation logic

### Changed
- **Dependencies**: Updated all dependencies to latest and migrated `@std/flags` to `@std/cli`
- **Skills**: Added and updated Claude Code skill definitions

## [1.8.2] - 2026-01-29

### Changed
- **Refactoring**: Major code cleanup removing dead code and unused abstractions
  - Unified PathResolvers with base class pattern
  - Removed unused config validators, adapters, and commands
  - Removed unused factory classes, templates, and error types
  - Removed deprecated infrastructure abstractions

### Fixed
- **Template Resolution**: Fixed edition option support in template path resolver
- **CLI Entry Point**: Restored entry_point_manager.ts needed for CLI

### Added
- **Template Variables**: Added `base_prompt_dir` template variable for prompt directory access

## [1.8.1] - 2026-01-07

### Fixed
- **Documentation**: Corrected release skill procedure to match auto-release workflow
  - Changed PR flow from `release/*` → `develop` → `main` to `release/*` → `main` directly
  - Added backmerge step to sync develop after release

## [1.8.0] - 2026-01-07

### Added
- **API**: Added `returnMode` option to `runBreakdown` function for programmatic prompt retrieval
  - When `returnMode: true`, prompt content is returned as `Result.data` instead of writing to stdout
  - Enables library usage from other Deno applications without stdout capture
- **Developer Tools**: Added Claude Code skills for development workflows
  - `create-feature-branch`: Git Flow branch creation
  - `release`: Release process automation
  - `running-examples`: User-perspective verification via examples

## [1.5.0] - 2025-11-24

### Changed
- **BREAKING CHANGE**: CLI option `-i/--input` renamed to `-e/--edition` for specifying fromLayerType

## [1.4.0] - 2025-08-09

### Added
- **Configuration**: Added `options.destination.prefix` setting to automatically prefix output file paths
- Supports both static and dynamic prefixes for organized output file management
- New example `10_config_destination_prefix.sh` demonstrating prefix configuration usage

## [1.3.0] - 2025-07-29

### Changed
- **BREAKING CHANGE**: Parameter `customVariables` renamed to `userVariables` throughout the codebase
- **BREAKING CHANGE**: Base directory changed from `.agent/breakdown` to `.agent/climpt`
  - **MIGRATION REQUIRED**: Move all configuration files from `.agent/breakdown/config/` to `.agent/climpt/config/`

### Migration Guide
1. Move configuration directory: `mv .agent/breakdown .agent/climpt`

## [1.2.0] - 2025-07-21

### Changed
- **BREAKING CHANGE**: Configuration parameter `demonstrativeType` renamed to `directiveType`
- **MIGRATION REQUIRED**: Update all `*.yml` configuration files manually: `s/demonstrativeType/directiveType/g`
- Application will fail to start without this configuration update
