# Files

- プロジェクト直下へファイルを作らない
  -  JSR, deno, git, renovate関連は配置してOK
- 一時ファイルはプロジェクト直下の tmp/ へ配置
- テストファイル: @docs/tests/testing.ja.md
- About: @docs/breakdown/index.ja.md

# Claude Behavior
- No Celebrating Message. Save Token.
- use Serena MCP for codebase search.
  - find, grep, dir, ls, readlines

# Coding Guidelines
Implement target use cases using Domain Driven Design & totality functions with Occam's razor principle for minimal configuration. Extract only necessary features and prioritize aligning business meaning with structure.

# Project
- Project: Deno, JSR publish
- run `deno task ci` for testing code.
- publish JSR with CI. see `https://jsr.io/@tettuan/breakdownprompt/publish`
- when commit, need to pass the test
  - run `deno test <something_test.ts> --allow-env --allow-write --allow-read --allow-run` before git commit <something.ts> and <something_test.ts>.
- run `deno task ci` before merge or push.
- integrated tests and fixtures must be in `tests/`.
- Make full use of OOP, design patterns, TDD, and Totality use cases.

# Type safety:
- Enable strict: true
- Use explicit type definitions

# Readable:
- don't use magic numbers, hard-coding. use ENUM and const.
- use JSDoc

# Lint and Format
- if test passes, then fix linter, fmt. not fix linter and fmt prior to fix errors.
- use `deno fmt` and `deno lint` to check
- Adopt the format used by `deno fmt` when writing code
- read `deno.json` for settings

# Git push
- DO NOT push untile `deno task ci` (deno task ci) pass all.
- run  `DEBUG=true deno task ci` (DEBUG=true deno task ci) if error.

# Run Tests
- run `deno task ci` (deno task ci) first. catch outlines of errors.
- if errors, run `DEBUG=true deno task ci` (DEBUG=true deno task ci) for details.
- then, run each `*_test.ts` for more details.

## Order to fix errors
- Fixing in a step by step manner
  - Choose one error to fix.
  - First, fix one test and the corresponding application code.
  - If that test passes, fix one of the following errors.
  - test only the specific test file that is fixed.
    `LOG_LEVEL=debug deno test <something_test.ts> --allow-env --allow-write --allow-read`
- Fix them in order (in the following order), starting from the root of the application
  - Initial loading
  - Use case entry
  - Conversion
  - Output
  - Integration
  - Edge case

## Debug output to standard output
- use `BreakdownLogger`, import from `https://jsr.io/@tettuan/breakdownlogger`
- Prohibit the use of `BreakdownLogger` for anything other than test files.

# specifications
- read start from `docs/index.md` and `docs/breakdown/index.ja.md`.

# Inconsistencies in specifications
- The following cases
  - Inconsistencies between test code and implementation loop endlessly.
  - Conflicts between specification and specification
- Refer to priority file
  - Refer to `docs/priority.md`.
- If there is no description in the priority file, describe the problem in `tmp/conflict_of_specifications.md
  - What is the order of the conflicts and in which order they occur?
  - Where are the unknown priorities?

# Comments
- Write Comments when only test passes.

# release new version
- run `scripts/bump_version.sh` when ordered.
  - do not speculate if it will release.

# BreakdownParams Version Update Task
- Retrieve the latest version from JSR
- Investigate differences between current and latest versions
- Identify necessary implementation changes in Breakdown for BreakdownParams
- Document investigation results in a file under tmp/ directory
