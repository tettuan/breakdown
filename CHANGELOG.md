# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
