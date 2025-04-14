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

注：テストコードのデバッグには @tettuan/breakdownlogger を使用し、テストの実行状況や問題の特定を支援します。

## 依存ライブラリの検証

アプリケーションは以下のライブラリに依存しています：
- @tettuan/breakdownconfig: 設定管理
- @tettuan/breakdownparams: コマンドライン引数の解析
- @tettuan/breakdownprompt: プロンプト処理
- @tettuan/breakdownlogger: テストコードのデバッグ用

これらのライブラリの検証は、アプリケーションのテストとは別に行います。

## Test Structure

```
tests/
├── 0_foundation/           # Foundation tests
│   ├── setup_test.ts      # Environment setup
│   ├── init_test.ts       # Initialization
│   ├── config_test.ts     # Configuration
│   └── logger_test.ts     # Logging
│
├── 1_core/                # Core functionality
│   ├── command/           # Command processing
│   ├── prompt/            # Prompt handling
│   └── path/              # Path resolution
│
├── 2_integration/         # Integration tests
│   ├── project_breakdown/ # Project decomposition
│   └── workflow/          # Workflow tests
│
├── 3_scenarios/           # End-to-end scenarios
│   ├── convert/          # Conversion scenarios
│   └── error_handling/   # Error scenarios
│
├── helpers/              # Test utilities
│   ├── setup.ts         # Environment setup
│   └── assertions.ts    # Custom assertions
│
└── fixtures/            # Test data
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
import { assertFileExists, assertFileContent } from "../helpers/assertions.ts";

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