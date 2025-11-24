# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
