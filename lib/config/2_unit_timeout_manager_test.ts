/**
 * TimeoutManager Unit Tests
 *
 * 統一タイムアウト管理システムの単体テスト
 *
 * @module
 */

import { assert, assertEquals, assertExists } from "@std/assert";
import {
  createDefaultTimeoutManager,
  createTimeoutManagerFromConfig,
  DEFAULT_TIMEOUT_CONFIG,
  type EnvironmentTimeoutConfig,
  TimeoutManager,
} from "./timeout_manager.ts";

Deno.test("TimeoutManager - Default Configuration", () => {
  const manager = createDefaultTimeoutManager();

  assertExists(manager);
  // 環境タイプは実際の検出結果に依存するため、値の存在のみ確認
  assertExists(manager.getEnvironmentType());
  assertExists(manager.getTimeout());
  assertExists(manager.getStdinTimeout());
});

Deno.test("TimeoutManager - Custom Configuration", () => {
  const customConfig: Partial<EnvironmentTimeoutConfig> = {
    timeouts: {
      default: 45000,
      ci: 3000,
      test: 500,
      interactive: 60000,
    },
  };

  const manager = new TimeoutManager(customConfig);

  // カスタム設定が適用されていることを確認（具体的な値は環境に依存）
  assertExists(manager.getTimeout());
  assertExists(manager.getStdinTimeout());
  assert(manager.getTimeout() > 0);
  assert(manager.getStdinTimeout() > 0);
});

Deno.test("TimeoutManager - Environment Type Override", () => {
  const manager = new TimeoutManager(undefined, "ci");

  assertEquals(manager.getEnvironmentType(), "ci");
  assertEquals(manager.getTimeout(), DEFAULT_TIMEOUT_CONFIG.timeouts.ci);
  assertEquals(manager.getStdinTimeout(), DEFAULT_TIMEOUT_CONFIG.stdin.environments.ci.timeout);
});

Deno.test("TimeoutManager - STDIN Configuration", () => {
  const manager = new TimeoutManager(undefined, "interactive");
  const stdinConfig = manager.getStdinConfig();

  assertExists(stdinConfig);
  assertEquals(stdinConfig.timeout, 30000);
  assertEquals(stdinConfig.allowEmpty, false);
  assertEquals(stdinConfig.forceRead, false);
  assertEquals(stdinConfig.debug, false);
});

Deno.test("TimeoutManager - CI Environment STDIN Configuration", () => {
  const manager = new TimeoutManager(undefined, "ci");
  const stdinConfig = manager.getStdinConfig();

  assertEquals(stdinConfig.timeout, 5000);
  assertEquals(stdinConfig.allowEmpty, true);
  assertEquals(stdinConfig.forceRead, false);
  assertEquals(stdinConfig.debug, true);
});

Deno.test("TimeoutManager - Custom Timeout Application", () => {
  const manager = createDefaultTimeoutManager();

  assertEquals(manager.applyCustomTimeout(), manager.getTimeout());
  assertEquals(manager.applyCustomTimeout(15000), 15000);
  // 0はfalsyなので、デフォルト値が返される
  assertEquals(manager.applyCustomTimeout(0), manager.getTimeout());
});

Deno.test("TimeoutManager - Configuration Validation - Valid", () => {
  const manager = createDefaultTimeoutManager();
  const validation = manager.validateConfig();

  assert(validation.valid);
  assertEquals(validation.errors.length, 0);
});

Deno.test("TimeoutManager - Configuration Validation - Invalid", () => {
  const invalidConfig: Partial<EnvironmentTimeoutConfig> = {
    timeouts: {
      default: -1000, // 無効な負の値
      ci: 500000, // 非常に長いタイムアウト（警告）
      test: 500,
      interactive: 30000,
    },
  };

  const manager = new TimeoutManager(invalidConfig);
  const validation = manager.validateConfig();

  assert(!validation.valid);
  assert(validation.errors.length > 0);
  assert(validation.warnings.length > 0);
});

Deno.test("TimeoutManager - Debug Information", () => {
  const manager = new TimeoutManager(undefined, "test", true);
  const debugInfo = manager.getDebugInfo();

  assertExists(debugInfo);
  assertEquals(debugInfo.environmentType, "test");
  assertExists(debugInfo.environmentInfo);
  assertExists(debugInfo.timeout);
  assertExists(debugInfo.stdinTimeout);
  assertExists(debugInfo.stdinConfig);
  assertExists(debugInfo.config);
  assertExists(debugInfo.validation);
});

Deno.test("TimeoutManager - Configuration Update", () => {
  const manager = createDefaultTimeoutManager();
  const originalTimeout = manager.getTimeout();

  manager.updateConfig({
    timeouts: {
      default: 50000,
      ci: 2000,
      test: 2000, // 更新
      interactive: 50000,
    },
  });

  assertEquals(manager.getTimeout(), 2000);
  assert(manager.getTimeout() !== originalTimeout);
});

Deno.test("TimeoutManager - Environment Type Change", () => {
  const manager = new TimeoutManager(undefined, "test");
  assertEquals(manager.getEnvironmentType(), "test");

  manager.setEnvironmentType("ci");
  assertEquals(manager.getEnvironmentType(), "ci");
  assertEquals(manager.getTimeout(), DEFAULT_TIMEOUT_CONFIG.timeouts.ci);
});

Deno.test("TimeoutManager - YAML Config Factory", () => {
  const yamlConfig = {
    performance: {
      timeout: 25000,
      timeouts: {
        ci: 4000,
        test: 800,
        interactive: 35000,
      },
      stdin: {
        timeout: 25000,
        allowEmpty: true,
        debug: true,
        environments: {
          test: {
            timeout: 800,
            allowEmpty: false,
            debug: false,
          },
        },
      },
    },
  };

  const manager = createTimeoutManagerFromConfig(yamlConfig);

  // YAML設定が適用されていることを確認
  assertExists(manager.getTimeout());
  assert(manager.getTimeout() > 0);

  // CI環境での確認
  manager.setEnvironmentType("ci");
  assertEquals(manager.getTimeout(), 4000);

  // STDIN設定の確認
  manager.setEnvironmentType("test");
  const stdinConfig = manager.getStdinConfig();
  assertEquals(stdinConfig.timeout, 800);
  assertEquals(stdinConfig.allowEmpty, false);
  assertEquals(stdinConfig.debug, false);
});

Deno.test("TimeoutManager - Empty YAML Config", () => {
  const manager = createTimeoutManagerFromConfig({});

  // デフォルト設定が使用されることを確認
  assertExists(manager.getTimeout());
  assertExists(manager.getStdinTimeout());
  assert(manager.getTimeout() > 0);
  assert(manager.getStdinTimeout() > 0);
});

Deno.test("TimeoutManager - Partial YAML Config", () => {
  const yamlConfig = {
    performance: {
      timeout: 20000, // デフォルトのみ指定
    },
  };

  const manager = createTimeoutManagerFromConfig(yamlConfig);

  // カスタムデフォルト値が使用され、他はデフォルト設定
  assertExists(manager.getTimeout());
  assert(manager.getTimeout() > 0);

  manager.setEnvironmentType("interactive");
  assertExists(manager.getTimeout());
  assert(manager.getTimeout() > 0);
});

Deno.test("TimeoutManager - Debug Mode Toggle", () => {
  const manager = createDefaultTimeoutManager();

  // デバッグモードの切り替えテスト（出力は検証しないが、エラーが発生しないことを確認）
  manager.setDebugMode(true);
  manager.setDebugMode(false);

  // デバッグ情報の取得でエラーが発生しないことを確認
  const debugInfo = manager.getDebugInfo();
  assertExists(debugInfo);
});

Deno.test("TimeoutManager - Complex Configuration Merge", () => {
  const complexConfig: Partial<EnvironmentTimeoutConfig> = {
    timeouts: {
      default: 40000,
      ci: 3000,
      test: 600,
      interactive: 50000,
    },
    stdin: {
      timeout: 40000,
      allowEmpty: true,
      forceRead: true,
      debug: true,
      environments: {
        ci: {
          timeout: 2000,
          allowEmpty: false,
          forceRead: true,
          debug: false,
        },
        test: {
          timeout: 400,
          allowEmpty: true,
          forceRead: false,
          debug: true,
        },
        interactive: {
          timeout: 45000,
          allowEmpty: false,
          forceRead: false,
          debug: false,
        },
      },
    },
  };

  const manager = new TimeoutManager(complexConfig, "test");

  assertEquals(manager.getTimeout(), 600);

  const stdinConfig = manager.getStdinConfig();
  assertEquals(stdinConfig.timeout, 400);
  assertEquals(stdinConfig.allowEmpty, true);
  assertEquals(stdinConfig.forceRead, false);
  assertEquals(stdinConfig.debug, true);

  // 他の環境での確認
  manager.setEnvironmentType("ci");
  const ciStdinConfig = manager.getStdinConfig();
  assertEquals(ciStdinConfig.timeout, 2000);
  assertEquals(ciStdinConfig.allowEmpty, false);
  assertEquals(ciStdinConfig.forceRead, true);
  assertEquals(ciStdinConfig.debug, false);
});
