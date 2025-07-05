/**
 * TimeoutManager Unit Tests
 *
 * 統一タイムアウト管理システムの単体テスト
 *
 * @module
 */

import { assert, assertEquals, assertExists } from "../deps.ts";
import {
  createDefaultTimeoutManager,
  createTimeoutManagerFromConfig,
  DEFAULT_TIMEOUT_CONFIG,
  type EnvironmentTimeoutConfig,
  TimeoutManager,
} from "./timeout_manager.ts";

Deno.test("TimeoutManager - Default Configuration", () => {
  const _manager = createDefaultTimeoutManager();

  assertExists(_manager);
  // 環境タイプは実際の検出結果に依存するため、値の存在のみ確認
  assertExists(_manager.getEnvironmentType());
  assertExists(_manager.getTimeout());
  assertExists(_manager.getStdinTimeout());
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

  const _manager = new TimeoutManager(customConfig);

  // カスタム設定が適用されていることを確認（具体的な値は環境に依存）
  assertExists(_manager.getTimeout());
  assertExists(_manager.getStdinTimeout());
  assert(_manager.getTimeout() > 0);
  assert(_manager.getStdinTimeout() > 0);
});

Deno.test("TimeoutManager - Environment Type Override", () => {
  const _manager = new TimeoutManager(undefined, "ci");

  assertEquals(_manager.getEnvironmentType(), "ci");
  assertEquals(_manager.getTimeout(), DEFAULT_TIMEOUT_CONFIG.timeouts.ci);
  assertEquals(_manager.getStdinTimeout(), DEFAULT_TIMEOUT_CONFIG.stdin.environments.ci.timeout);
});

Deno.test("TimeoutManager - STDIN Configuration", () => {
  const _manager = new TimeoutManager(undefined, "interactive");
  const stdinConfig = _manager.getStdinConfig();

  assertExists(stdinConfig);
  assertEquals(stdinConfig.timeout, 30000);
  assertEquals(stdinConfig.allowEmpty, false);
  assertEquals(stdinConfig.forceRead, false);
  assertEquals(stdinConfig.debug, false);
});

Deno.test("TimeoutManager - CI Environment STDIN Configuration", () => {
  const _manager = new TimeoutManager(undefined, "ci");
  const stdinConfig = _manager.getStdinConfig();

  assertEquals(stdinConfig.timeout, 5000);
  assertEquals(stdinConfig.allowEmpty, true);
  assertEquals(stdinConfig.forceRead, false);
  assertEquals(stdinConfig.debug, true);
});

Deno.test("TimeoutManager - Custom Timeout Application", () => {
  const _manager = createDefaultTimeoutManager();

  assertEquals(_manager.applyCustomTimeout(), _manager.getTimeout());
  assertEquals(_manager.applyCustomTimeout(15000), 15000);
  // 0はfalsyなので、デフォルト値が返される
  assertEquals(_manager.applyCustomTimeout(0), _manager.getTimeout());
});

Deno.test("TimeoutManager - Configuration Validation - Valid", () => {
  const _manager = createDefaultTimeoutManager();
  const validation = _manager.validateConfig();

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

  const _manager = new TimeoutManager(invalidConfig);
  const validation = _manager.validateConfig();

  assert(!validation.valid);
  assert(validation.errors.length > 0);
  assert(validation.warnings.length > 0);
});

Deno.test("TimeoutManager - Debug Information", () => {
  const _manager = new TimeoutManager(undefined, "test", true);
  const debugInfo = _manager.getDebugInfo();

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
  const _manager = createDefaultTimeoutManager();
  const originalTimeout = _manager.getTimeout();

  _manager.updateConfig({
    timeouts: {
      default: 50000,
      ci: 2000,
      test: 2000, // 更新
      interactive: 50000,
    },
  });

  assertEquals(_manager.getTimeout(), 2000);
  assert(_manager.getTimeout() !== originalTimeout);
});

Deno.test("TimeoutManager - Environment Type Change", () => {
  const _manager = new TimeoutManager(undefined, "test");
  assertEquals(_manager.getEnvironmentType(), "test");

  _manager.setEnvironmentType("ci");
  assertEquals(_manager.getEnvironmentType(), "ci");
  assertEquals(_manager.getTimeout(), DEFAULT_TIMEOUT_CONFIG.timeouts.ci);
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

  const _manager = createTimeoutManagerFromConfig(yamlConfig);

  // YAML設定が適用されていることを確認
  assertExists(_manager.getTimeout());
  assert(_manager.getTimeout() > 0);

  // CI環境での確認
  _manager.setEnvironmentType("ci");
  assertEquals(_manager.getTimeout(), 4000);

  // STDIN設定の確認
  _manager.setEnvironmentType("test");
  const stdinConfig = _manager.getStdinConfig();
  assertEquals(stdinConfig.timeout, 800);
  assertEquals(stdinConfig.allowEmpty, false);
  assertEquals(stdinConfig.debug, false);
});

Deno.test("TimeoutManager - Empty YAML Config", () => {
  const _manager = createTimeoutManagerFromConfig({});

  // デフォルト設定が使用されることを確認
  assertExists(_manager.getTimeout());
  assertExists(_manager.getStdinTimeout());
  assert(_manager.getTimeout() > 0);
  assert(_manager.getStdinTimeout() > 0);
});

Deno.test("TimeoutManager - Partial YAML Config", () => {
  const yamlConfig = {
    performance: {
      timeout: 20000, // デフォルトのみ指定
    },
  };

  const _manager = createTimeoutManagerFromConfig(yamlConfig);

  // カスタムデフォルト値が使用され、他はデフォルト設定
  assertExists(_manager.getTimeout());
  assert(_manager.getTimeout() > 0);

  _manager.setEnvironmentType("interactive");
  assertExists(_manager.getTimeout());
  assert(_manager.getTimeout() > 0);
});

Deno.test("TimeoutManager - Debug Mode Toggle", () => {
  const _manager = createDefaultTimeoutManager();

  // デバッグモードの切り替えテスト（出力は検証しないが、エラーが発生しないことを確認）
  _manager.setDebugMode(true);
  _manager.setDebugMode(false);

  // デバッグ情報の取得でエラーが発生しないことを確認
  const debugInfo = _manager.getDebugInfo();
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

  const _manager = new TimeoutManager(complexConfig, "test");

  assertEquals(_manager.getTimeout(), 600);

  const stdinConfig = _manager.getStdinConfig();
  assertEquals(stdinConfig.timeout, 400);
  assertEquals(stdinConfig.allowEmpty, true);
  assertEquals(stdinConfig.forceRead, false);
  assertEquals(stdinConfig.debug, true);

  // 他の環境での確認
  _manager.setEnvironmentType("ci");
  const ciStdinConfig = _manager.getStdinConfig();
  assertEquals(ciStdinConfig.timeout, 2000);
  assertEquals(ciStdinConfig.allowEmpty, false);
  assertEquals(ciStdinConfig.forceRead, true);
  assertEquals(ciStdinConfig.debug, false);
});
