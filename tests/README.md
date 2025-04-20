# Breakdown Test Documentation

## Overview

Breakdownは、プロジェクト管理のための階層的なタスク分解をサポートするツールです。
このテスト仕様書は、以下の2つの観点からBreakdownの品質を保証します：

1. **階層的分解の正確性**
   - プロジェクト → イシュー → タスクの変換が正確に行われること
     ```typescript
     // 例：プロジェクトからイシューへの分解
     breakdown to issue --from project.md
     // 結果：プロジェクトの主要機能ごとにイシューが生成される
     ```
   - 各レイヤー間の関係性（依存関係、優先度など）が保持されること
   - GitHub Issuesとの連携を前提とした出力形式であること

2. **設定とリソース管理の確実性**
   - 作業ディレクトリ構造の整合性
     ```yaml
     # app.yml での定義
     working_dir: .agent/breakdown
     app_prompt:
       base_dir: lib/breakdown/prompts
     app_schema:
       base_dir: lib/breakdown/schema
     ```
   - プロンプトとスキーマの適切な配置と選択
   - パス解決の正確性（相対パス、絶対パス、ファイル名のみの場合）

注：テストコードのデバッグには @tettuan/breakdownlogger
を使用し、テストの実行状況や問題の特定を支援します。

## 依存ライブラリの検証

アプリケーションは以下のライブラリに依存しています：

- @tettuan/breakdownconfig: 設定管理
- @tettuan/breakdownparams: コマンドライン引数の解析
- @tettuan/breakdownprompt: プロンプト処理
- @tettuan/breakdownlogger: テストコードのデバッグ用

これらのライブラリの検証は、アプリケーションのテストとは別に、以下の形で行います：

1. **ライブラリのインストールと読み込みの確認**
   ```typescript
   // tests/0_foundation/setup_test.ts
   Deno.test("必要なライブラリが利用可能であること", async (t) => {
     // 各ライブラリが正しくインポートできることを確認
     const { BreakdownConfig } = await import("@tettuan/breakdownconfig");
     const { BreakdownParams } = await import("@tettuan/breakdownparams");
     const { BreakdownPrompt } = await import("@tettuan/breakdownprompt");

     // バージョンの確認
     assertEquals(BreakdownConfig.version, "0.1.10");
     // ...
   });
   ```

2. **ライブラリのバージョン整合性の確認**
   - アプリケーションの依存関係定義と実際のバージョンの一致
   - 各ライブラリ間のバージョン互換性

## Test Structure

```
tests/
├── 0_foundation/           # Foundation tests
│   ├── 0_env/             # Environment and initialization (most basic)
│   │   ├── setup_test.ts  # Test environment setup
│   │   └── init_test.ts   # Application initialization
│   ├── 1_config/          # Configuration (depends on env)
│   │   └── config_test.ts # Configuration management
│   └── 2_logger/          # Logging (depends on config)
│       └── logger_test.ts # Logger functionality
│
├── 1_core/                # Core functionality
│   ├── 0_path/           # Path handling (most fundamental)
│   │   ├── path_utils_test.ts
│   │   ├── path_resolver_test.ts
│   │   └── prompt_path_test.ts
│   ├── 1_io/             # I/O operations (depends on path)
│   │   └── stdin_test.ts
│   ├── 2_command/        # Command processing (depends on path and I/O)
│   │   ├── basic_commands_test.ts
│   │   ├── error_handling_test.ts
│   │   └── log_level_test.ts
│   └── 3_prompt/         # Prompt handling (depends on all above)
│       ├── selection_test.ts
│       └── prompt_processor_test.ts
│
├── 2_integration/         # Integration tests
│   ├── 0_flow/           # Basic workflow integration
│   │   └── flow_test.ts
│   ├── 1_command/        # Command integration tests
│   └── 2_prompt/         # Prompt integration tests
│
├── 3_scenarios/          # End-to-end scenarios
│   ├── 0_basic/         # Basic usage scenarios
│   │   └── commands_test.ts
│   ├── 1_workflow/      # Complex workflow scenarios
│   └── 2_error/         # Error handling scenarios
│
├── helpers/             # Test utilities
│   ├── setup.ts        # Environment setup
│   └── assertions.ts   # Custom assertions
│
└── fixtures/           # Test data
```

### Directory Structure Explanation

#### 0_foundation/

Foundation tests establish the basic environment and configuration:

- `0_env/`: Most basic setup and initialization
- `1_config/`: Configuration management (depends on environment)
- `2_logger/`: Logging functionality (depends on configuration)

#### 1_core/

Core functionality tests follow a dependency-based hierarchy:

- `0_path/`: Most fundamental path handling and utilities
- `1_io/`: I/O operations that depend on proper path handling
- `2_command/`: Command processing depending on path and I/O
- `3_prompt/`: Prompt handling depending on all previous components

#### 2_integration/

Integration tests verify component interactions:

- `0_flow/`: Basic workflow integration tests
- `1_command/`: Command integration across components
- `2_prompt/`: Prompt system integration tests

#### 3_scenarios/

End-to-end scenario tests for real-world use cases:

- `0_basic/`: Basic usage scenario tests
- `1_workflow/`: Complex workflow scenario tests
- `2_error/`: Error handling scenario tests

### Numbering Convention

The numbering scheme (0-N) in each directory indicates:

1. Dependency order - lower numbers have fewer dependencies
2. Execution order - tests should be run in numeric order
3. Complexity level - higher numbers typically involve more components

## Test Guidelines

### 1. Test Organization

- Tests are organized in numbered directories (0-3) to indicate their level and execution order
- Each test file should focus on a specific feature or scenario
- Use descriptive test names that indicate what is being tested

### 2. Test Environment

- Use the `setupTestEnvironment` helper to create a clean test environment
- Clean up after tests using `cleanupTestEnvironment`
- Use the provided assertion helpers for consistent error handling

Example:

```typescript
import { setupTestEnvironment, type TestEnvironment } from "../helpers/setup.ts";
import { assertFileContent, assertFileExists } from "../helpers/assertions.ts";

Deno.test("feature test", async () => {
  const env = await setupTestEnvironment({ debug: true });
  try {
    // Test implementation
    await assertFileExists(env, "output.json");
  } finally {
    await cleanupTestEnvironment(env);
  }
});
```

### 3. Debug Support

- Use the `BreakdownLogger` for test-specific logging
- Set `debug: true` in test environment options for detailed logging
- Log relevant information for test failures

### 4. Assertions

Use the provided assertion helpers for consistent error handling:

- `assertFileExists`: Check file existence
- `assertCommandSuccess`: Verify command execution
- `assertCommandOutput`: Check command output

### 5. Test Data

- Place test fixtures in the `fixtures/` directory
- Use meaningful names for test data files
- Document the purpose of test data files

## Test Resource Management

### Test Data Management (fixtures/)

1. Data Types and Organization
   - Configuration Files (config/)
     - Application config samples: `app.sample.yml`
     - User config samples: `user.sample.yml`
     - Error case configs: `error_*.yml`
   - Prompts (prompts/)
     - Samples for each layer and type
     - Templates for variable substitution tests
   - Projects (projects/)
     - Source data samples
     - Expected conversion results

2. Naming Conventions
   - Normal cases: `{target}_{case}.{ext}` Example: `project_basic.md`, `issue_with_subtasks.md`
   - Error cases: `error_{type}_{case}.{ext}` Example: `error_invalid_config.yml`,
     `error_missing_required.md`
   - Templates: `template_{type}.{ext}` Example: `template_project.md`, `template_issue.md`

3. Version Control Policy
   - All test data is managed in Git
   - Binary data is excluded (managed in .gitignore)
   - Test data updates maintain change history
   - Major changes managed through PRs

### Test Helpers (helpers/)

1. **Functionality Verification Helpers (assertions/)**
   ```typescript
   // CLI functionality verification
   export class CliAssertions {
     // Verify command line argument parsing
     static assertValidParsing(args: string[], expected: CommandParams): void;
     // Verify error handling
     static assertErrorHandling(args: string[], expectedError: ErrorType): void;
     // Verify help display
     static assertHelpDisplay(args: string[], expectedContent: string): void;
   }

   // File operation verification
   export class FileAssertions {
     // Verify file existence
     static assertFileExists(path: string): void;
     // Verify file content
     static assertFileContent(path: string, expected: string): void;
   }

   // Core functionality verification
   export class CoreAssertions {
     // Verify configuration values
     static assertConfigValue(key: string, expected: unknown): void;
     // Verify log output
     static assertLogOutput(level: string, message: string): void;
   }
   ```

2. **Scenario Test Helpers (scenarios/)**
   ```typescript
   // Support scenario execution
   export class ScenarioRunner {
     // Execute a series of commands
     async runCommands(commands: string[]): Promise<void>;
     // Verify scenario results
     async assertScenarioResult(expected: ScenarioResult): void;
   }

   // Test environment setup
   export class TestEnvironment {
     // Prepare test working directory
     static async prepare(scenario: string): Promise<void>;
     // Clean up after test completion
     static async cleanup(): Promise<void>;
   }
   ```

## Running Tests

### CI/CD Integration

Tests are automatically run in the CI pipeline using GitHub Actions:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Deno
        uses: denoland/setup-deno@v1

      - name: Foundation Tests
        run: deno test tests/0_foundation/

      - name: Core Tests
        if: success()
        run: deno test tests/1_core/

      - name: Integration Tests
        if: success()
        run: deno test tests/2_integration/

      - name: Scenario Tests
        if: success()
        run: deno test tests/3_scenarios/
```

### Local Test Execution

ローカルでのテスト実行は `scripts/local_ci.sh` を使用します：

1. 通常のテスト実行
   ```bash
   scripts/local_ci.sh
   ```

2. デバッグモードでの実行
   ```bash
   DEBUG=true scripts/local_ci.sh
   ```

3. 特定階層のテスト実行
   ```bash
   # 基盤テストのみ実行
   deno test tests/0_foundation/

   # コア機能テストのみ実行
   deno test tests/1_core/
   ```

4. 特定のテストファイル実行
   ```bash
   # 設定テストのみ実行
   deno test tests/0_foundation/config_test.ts
   ```

このスクリプトは、GitHub Actionsと同じフローでテストを実行し、以下を確認します：

- 全テストの実行
- コードフォーマットの検証
- リンターチェック
- その他のCI/CDチェック

エラーが発生した場合は、デバッグモードで再実行して詳細な情報を確認してください。

### Test Environment Variables

```bash
# テストモード設定
TEST_MODE=unit|integration|e2e

# テストデバッグ用ログレベル設定
LOG_LEVEL=debug|info|error

# テストタイムアウト設定
TEST_TIMEOUT=5000  # ミリ秒
```

## Test Coverage Gaps and Improvements Needed

### 1. Core Functionality Coverage Gaps

- stdin handling tests for defect and summary commands are missing
- Path normalization test cases are incomplete
- Working directory validation tests need expansion
- Configuration-based path completion test cases missing

### 2. Command Processing Tests

- Help message format verification tests needed
- Version command output format tests missing
- Pipe input handling tests for defect command required
- Summary command stdin processing tests needed

### 3. Error Handling Test Coverage

- Error message language consistency tests missing
- Error recovery procedure tests needed
- Error condition validation test cases incomplete
- Error type handling tests required

### 4. Configuration and Environment Tests

- Environment variable handling test cases missing
- Config file validation test coverage insufficient
- Schema version compatibility check tests needed
- Working directory structure validation tests required

### 5. Prompt Processing Test Coverage

- stdin reading test cases incomplete
- Output format validation tests missing
- Variable substitution test cases needed
- Error handling scenario tests required

### 6. Directory Structure Tests

- Directory naming convention validation tests missing
- Demonstrative type and directory structure relationship tests needed
- Required file check test cases missing
- Directory permission handling tests required

### 7. Integration Test Gaps

- End-to-end workflow tests need expansion
- Cross-command interaction tests missing
- Error recovery flow tests needed
- Performance benchmark tests required

### Priority Areas for Test Implementation

1. Core functionality tests (stdin, paths, validation)
2. Error handling and recovery tests
3. Configuration and environment tests
4. Directory structure and permission tests
5. Integration and workflow tests

### Test Implementation Guidelines

1. Each identified gap should have corresponding test files
2. Test cases should cover both success and failure scenarios
3. Error conditions should be thoroughly tested
4. Integration tests should verify complete workflows
5. Performance implications should be considered
