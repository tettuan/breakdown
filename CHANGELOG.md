# CHANGELOG

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-07-21

### Changed
- **BREAKING CHANGE**: Configuration parameter `demonstrativeType` renamed to `directiveType`
- **MIGRATION REQUIRED**: Update all `*.yml` configuration files manually: `s/demonstrativeType/directiveType/g`
- Application will fail to start without this configuration update
