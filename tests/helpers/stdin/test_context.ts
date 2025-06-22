/**
 * IsolatedTestEnvironment
 *
 * テスト環境の完全な分離と復元を保証するためのクラス。
 * 各テストケースが独立して実行され、環境の変更が他のテストに
 * 影響しないことを保証します。
 */
export class IsolatedTestEnvironment {
  private originalStdin!: typeof Deno.stdin;
  private originalEnv!: Map<string, string>;
  private cleanupCallbacks: Array<() => Promise<void>> = [];

  /**
   * テスト環境のセットアップ
   *
   * 現在の環境状態を保存し、テスト実行のための
   * クリーンな環境を準備します。
   */
  setup(): void {
    // stdin の保存
    this.originalStdin = Deno.stdin;

    // 環境変数の保存（最小限必要なもののみ）
    this.originalEnv = new Map();
    const keysToPreserve = ["CI", "GITHUB_ACTIONS", "LOG_LEVEL"];

    for (const key of keysToPreserve) {
      const value = Deno.env.get(key);
      if (value !== undefined) {
        this.originalEnv.set(key, value);
      }
    }

    // クリーンアップコールバックのリセット
    this.cleanupCallbacks = [];
  }

  /**
   * テスト環境の復元
   *
   * 保存した環境状態を復元し、テスト中に行われた
   * すべての変更をロールバックします。
   */
  async teardown(): Promise<void> {
    // クリーンアップコールバックを逆順で実行
    for (const callback of this.cleanupCallbacks.reverse()) {
      try {
        await callback();
      } catch (error) {
        console.error("Cleanup callback error:", error);
      }
    }

    // stdin の復元
    Object.defineProperty(globalThis.Deno, "stdin", {
      value: this.originalStdin,
      writable: true,
      configurable: true,
    });

    // 環境変数の復元
    for (const [key, value] of this.originalEnv) {
      Deno.env.set(key, value);
    }

    // 保存していないキーは削除（テスト中に追加された可能性があるもの）
    const currentKeys = Array.from(this.originalEnv.keys());
    const keysToCheck = ["CI", "GITHUB_ACTIONS", "LOG_LEVEL"];

    for (const key of keysToCheck) {
      if (!currentKeys.includes(key) && Deno.env.get(key) !== undefined) {
        Deno.env.delete(key);
      }
    }
  }

  /**
   * クリーンアップコールバックの登録
   *
   * teardown時に実行されるコールバックを登録します。
   * コールバックは登録と逆順（LIFO）で実行されます。
   */
  registerCleanup(callback: () => Promise<void>): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * モックstdinの設定
   *
   * Deno.stdinを指定されたモックオブジェクトで置き換えます。
   */
  setMockStdin(mockStdin: typeof Deno.stdin): void {
    Object.defineProperty(globalThis.Deno, "stdin", {
      value: mockStdin,
      writable: true,
      configurable: true,
    });
  }

  /**
   * 環境変数の一時的な設定
   *
   * テスト用に環境変数を設定します。
   * teardown時に自動的に復元されます。
   */
  setEnvVar(key: string, value: string): void {
    // 元の値が保存されていない場合のみ保存
    if (!this.originalEnv.has(key)) {
      const originalValue = Deno.env.get(key);
      if (originalValue !== undefined) {
        this.originalEnv.set(key, originalValue);
      }
    }

    Deno.env.set(key, value);
  }

  /**
   * 環境変数の一時的な削除
   *
   * テスト用に環境変数を削除します。
   * teardown時に自動的に復元されます。
   */
  deleteEnvVar(key: string): void {
    // 元の値が保存されていない場合のみ保存
    if (!this.originalEnv.has(key)) {
      const originalValue = Deno.env.get(key);
      if (originalValue !== undefined) {
        this.originalEnv.set(key, originalValue);
      }
    }

    Deno.env.delete(key);
  }
}

// Deno標準ライブラリからのインポート
import { assertEquals, assertRejects } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  MockStdinConfig,
  MockStdinReader as StdinReader,
  StdinReadOptions,
  StdinTestResourceManager,
  TestStdinReaderFactory,
} from "./mock_factory.ts";

/**
 * StdinTestContext
 *
 * STDINテストに必要なコンテキスト情報を提供します。
 */
export interface StdinTestContext {
  environment: IsolatedTestEnvironment;
  createMockStdin: (config: MockStdinConfig) => StdinReader;
}

/**
 * MockStdinReader
 *
 * テスト用のSTDINリーダーのモック実装
 */
export interface MockStdinReader {
  read(options?: StdinReadOptions): Promise<string>;
  isAvailable(): boolean;
  isTerminal(): boolean;
}

/**
 * withStdinTest
 *
 * STDINテストを分離された環境で実行するためのラッパー関数。
 * テスト実行後は環境が自動的に復元されます。
 */
export async function withStdinTest<T>(
  _testName: string,
  testFn: (context: StdinTestContext) => Promise<T>,
): Promise<T> {
  const environment = new IsolatedTestEnvironment();
  const resourceManager = new StdinTestResourceManager();
  const factory = new TestStdinReaderFactory(resourceManager);

  try {
    await environment.setup();

    const context: StdinTestContext = {
      environment,
      createMockStdin: (config) => factory.create(config) as StdinReader,
    };

    return await testFn(context);
  } finally {
    // リソースのクリーンアップ
    await resourceManager.cleanupAll();
    // 環境の復元
    await environment.teardown();
  }
}

/**
 * StdinTestCase
 *
 * 構造化されたテストケースの定義
 */
export interface StdinTestCase {
  name: string;
  config: MockStdinConfig;
  input?: string;
  expectedOutput?: string;
  expectedError?: string;
  timeout?: number;
}

/**
 * defineStdinTests
 *
 * 複数のSTDINテストケースを定義し、それぞれを分離された
 * 環境で実行します。
 */
export function defineStdinTests(cases: StdinTestCase[]): void {
  for (const testCase of cases) {
    Deno.test({
      name: testCase.name,
      async fn() {
        await withStdinTest(testCase.name, async (context) => {
          const reader = context.createMockStdin(testCase.config);

          if (testCase.expectedError) {
            await assertRejects(
              () => reader.read({ timeout: testCase.timeout }),
              Error,
              testCase.expectedError,
            );
          } else {
            const result = await reader.read({ timeout: testCase.timeout });
            assertEquals(result, testCase.expectedOutput);
          }
        });
      },
      // リソースリーク検出を有効化
      sanitizeResources: true,
      sanitizeOps: true,
    });
  }
}
