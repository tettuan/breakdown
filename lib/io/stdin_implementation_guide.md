# CI環境STDIN問題解決策実装ガイド

## 実装優先順位

### 🚨 優先度1 (即座実装) - 緊急

1. **CI環境判定の確実性向上**
   - 複数CI環境変数の包括チェック
   - CI provider specific handling
   - 環境変数による動作制御

2. **isTerminal()判定の改善**
   - 非インタラクティブ環境での適切な判定
   - CI環境でのフォールバック機能
   - エラー時の安全なデフォルト値

### 🔥 優先度2 (今週実装) - 高

3. **CI環境専用STDINテストモック**
   - MockStdin implementation
   - Scenario-based testing framework  
   - Test isolation and cleanup

4. **テスト環境変数による動作制御**
   - Environment-specific timeouts
   - Debug logging controls
   - Override mechanisms

### ⚡ 優先度3 (来週実装) - 中

5. **CI環境でのSTDIN動作検証フラグ**
   - Validation mode for CI
   - Safe testing mechanisms
   - Comprehensive scenario coverage

## 具体的実装コード案

### 1. 改善されたCI環境判定

```typescript
// lib/io/enhanced_stdin.ts から抜粋
export function detectEnvironment(): EnvironmentInfo {
  // 包括的なCI環境変数チェック
  const ciIndicators = [
    "CI", "GITHUB_ACTIONS", "GITLAB_CI", "JENKINS_URL",
    "BUILDKITE", "CIRCLECI", "TRAVIS", "APPVEYOR",
    "TEAMCITY_VERSION", "TF_BUILD", "BAMBOO_BUILD_NUMBER"
  ];

  let isCI = false;
  let ciProvider: string | undefined;

  for (const indicator of ciIndicators) {
    const value = Deno.env.get(indicator);
    if (value && (value === "true" || value === "1" || indicator === "JENKINS_URL")) {
      isCI = true;
      ciProvider = indicator;
      break;
    }
  }

  return { isCI, ciProvider, ... };
}
```

### 2. 改善されたisTerminal()判定

```typescript
// lib/io/ci_stdin_test_framework.ts から抜粋
export class EnhancedTerminalDetector {
  static detectTerminalState(): {
    isTerminal: boolean;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
  } {
    const isCI = detectCIEnvironment();
    
    if (isCI) {
      // CI環境では環境変数での明示的制御を優先
      const hasStdinRedirect = Deno.env.get("STDIN_REDIRECTED") === "true";
      if (hasStdinRedirect) {
        return { isTerminal: false, confidence: 'high', reason: 'CI piped input' };
      }
    }

    try {
      return { 
        isTerminal: Deno.stdin.isTerminal(), 
        confidence: 'high', 
        reason: 'Native detection' 
      };
    } catch (error) {
      // エラー時は安全なデフォルト
      return { 
        isTerminal: !isCI, 
        confidence: 'low', 
        reason: `Fallback: ${error}` 
      };
    }
  }
}
```

### 3. CI環境専用テストモック

```typescript
// tests/helpers/stdin_test_helper.ts から抜粋
export class StdinTestUtils {
  static async testCIStdinBehavior<T>(
    testName: string,
    inputData: string,
    testFunction: (inputData: string) => Promise<T>
  ): Promise<void> {
    const config: StdinMockConfig = {
      scenario: StdinTestScenario.CI_PIPED,
      inputData,
      isTerminal: false,
      envVars: { 
        CI: "true", 
        GITHUB_ACTIONS: "true",
        STDIN_DEBUG: "true" 
      },
    };

    await framework.runStdinTest(config, async () => {
      return await testFunction(inputData);
    });
  }
}
```

### 4. 環境変数による動作制御

```bash
# CI環境での推奨設定
export CI=true
export GITHUB_ACTIONS=true
export CI_STDIN_BEHAVIOR=strict    # strict|permissive|disabled
export CI_STDIN_TIMEOUT=5000       # CI用短縮タイムアウト
export STDIN_DEBUG=true            # CI環境でのデバッグ有効

# テスト環境での設定  
export DENO_TESTING=true
export TEST_STDIN_AVAILABLE=false  # テストでのstdin無効化
export TEST_STDIN_MOCK=true        # モック使用
export STDIN_DEBUG_LEVEL=verbose   # 詳細ログ

# 強制オーバーライド
export FORCE_NON_INTERACTIVE=true  # 非インタラクティブ強制
export SKIP_STDIN_CHECK=true       # stdin チェックスキップ
```

### 5. CLI統合実装

```typescript
// cli/breakdown.ts 修正案
import { handleStdinForCLI } from "../lib/io/stdin_integration_wrapper.ts";

async function handleTwoParams(params: string[], config: Record<string, unknown>, options: Record<string, any>) {
  try {
    const stdinResult = await handleStdinForCLI({
      from: options.from,
      fromFile: options.fromFile,
      allowEmpty: true,
      timeout: (config?.performance as any)?.timeout || 30000,
      debug: Deno.env.get("STDIN_DEBUG") === "true",
    });

    // 警告メッセージの処理
    for (const warning of stdinResult.warnings) {
      console.warn(`⚠️ ${warning}`);
    }

    const inputText = stdinResult.inputText;
    // 以下既存処理...
    
  } catch (error) {
    console.warn("⚠️ STDIN reading failed:", error instanceof Error ? error.message : String(error));
  }
}
```

## 環境変数設定早見表

| 環境変数 | 用途 | 値 | 説明 |
|---------|------|----|----- |
| `CI` | CI判定 | true/false | CI環境の基本判定 |
| `CI_STDIN_BEHAVIOR` | CI動作制御 | strict/permissive/disabled | CI環境でのstdin動作モード |
| `CI_STDIN_TIMEOUT` | CIタイムアウト | ミリ秒 | CI環境専用タイムアウト値 |
| `TEST_STDIN_AVAILABLE` | テスト制御 | true/false | テスト環境でのstdin利用可否 |
| `TEST_STDIN_MOCK` | テストモック | true/false | モックstdinの使用 |
| `STDIN_DEBUG` | デバッグ | true/false | stdin関連のデバッグログ |
| `STDIN_DEBUG_LEVEL` | ログレベル | minimal/standard/verbose | デバッグログの詳細度 |
| `FORCE_NON_INTERACTIVE` | 強制制御 | true/false | 非インタラクティブ強制 |
| `SKIP_STDIN_CHECK` | チェック制御 | true/false | stdin チェックのスキップ |

## テスト実行方法

### CI環境テスト
```bash
# CI環境の模擬
CI=true GITHUB_ACTIONS=true STDIN_DEBUG=true deno test tests/3_integration/stdin_timeout_test.ts --allow-env --allow-read

# CI環境でのタイムアウトテスト
CI=true CI_STDIN_TIMEOUT=1000 deno test tests/4_e2e/examples_timeout_issue_test.ts --allow-env --allow-read --allow-write
```

### モックテスト
```bash
# テストモックを使用
TEST_STDIN_MOCK=true STDIN_DEBUG=true deno test tests/helpers/stdin_test_helper.ts --allow-env

# 包括的なシナリオテスト
deno test tests/1_core/factory/stdin_handling_test.ts --allow-env --allow-read --allow-write
```

## 段階的移行計画

### フェーズ1: 緊急対応 (今日)
1. `enhanced_stdin.ts` の基本実装
2. CI環境判定の改善
3. 既存テストでの検証

### フェーズ2: 統合実装 (今週)
1. `stdin_integration_wrapper.ts` による統合
2. CLI での利用開始
3. examples での動作確認

### フェーズ3: 完全移行 (来週)
1. 全テストでの新実装利用
2. ドキュメント更新
3. 旧実装の段階的廃止

## トラブルシューティング

### よくある問題と解決策

1. **CI環境でテストがハングする**
   ```bash
   CI=true FORCE_NON_INTERACTIVE=true deno test
   ```

2. **タイムアウトが効かない**
   ```bash
   CI_STDIN_TIMEOUT=1000 STDIN_DEBUG=true deno test
   ```

3. **モック環境が動作しない**
   ```bash
   TEST_STDIN_MOCK=true TEST_STDIN_AVAILABLE=false deno test
   ```

4. **デバッグ情報が不足**
   ```bash
   STDIN_DEBUG=true STDIN_DEBUG_LEVEL=verbose deno test
   ```

この実装により、CI環境でのSTDIN処理問題を根本的に解決し、安全で信頼性の高いテスト実行が可能になります。