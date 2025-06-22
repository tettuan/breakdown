/**
 * MockStdinReader - テスト用のSTDIN読み込みモック実装
 *
 * 依存性注入パターンに従い、テスト環境での標準入力のシミュレーションを提供します。
 * リソース管理とクリーンアップを適切に行い、テストの冪等性を確保します。
 */

// Core interfaces
export interface StdinReader {
  read(options?: StdinReadOptions): Promise<string>;
  isAvailable(): boolean;
  isTerminal(): boolean;
}

export interface StdinReadOptions {
  timeout?: number;
  allowEmpty?: boolean;
  signal?: AbortSignal;
}

export interface MockStdinConfig {
  data?: string;
  isTerminal?: boolean;
  isAvailable?: boolean;
  delay?: number;
  throwError?: boolean;
  errorMessage?: string;
}

export interface StdinTestResource {
  readonly id: string;
  readonly abortController: AbortController;
  readonly cleanupCallbacks: Array<() => void>;
  readonly createdAt: number;
}

export class StdinTestResourceManager {
  private resources = new Map<string, StdinTestResource>();

  createResource(id: string): StdinTestResource {
    const resource: StdinTestResource = {
      id,
      abortController: new AbortController(),
      cleanupCallbacks: [],
      createdAt: Date.now(),
    };
    this.resources.set(id, resource);
    return resource;
  }

  async cleanupResource(id: string): Promise<void> {
    const resource = this.resources.get(id);
    if (!resource) return;

    // 1. Abort all pending operations
    resource.abortController.abort();

    // 2. Execute cleanup callbacks in reverse order
    for (const callback of resource.cleanupCallbacks.reverse()) {
      try {
        await callback();
      } catch (error) {
        console.error(`Cleanup error for ${id}:`, error);
      }
    }

    // 3. Remove from registry
    this.resources.delete(id);
  }

  async cleanupAll(): Promise<void> {
    const ids = Array.from(this.resources.keys());
    await Promise.all(ids.map((id) => this.cleanupResource(id)));
  }
}

// Mock implementation
export class MockStdinReader implements StdinReader {
  constructor(
    private config: MockStdinConfig,
    private resourceManager: StdinTestResourceManager,
  ) {}

  async read(options?: StdinReadOptions): Promise<string> {
    const resource = await this.resourceManager.createResource(`read-${Date.now()}`);

    try {
      // タイムアウト処理
      if (options?.timeout) {
        const timeoutId = setTimeout(() => {
          resource.abortController.abort();
        }, options.timeout);

        resource.cleanupCallbacks.push(() => {
          clearTimeout(timeoutId);
        });
      }

      // データ読み込みシミュレーション
      return await this.simulateRead(resource.abortController.signal);
    } finally {
      await this.resourceManager.cleanupResource(resource.id);
    }
  }

  isAvailable(): boolean {
    return this.config.isAvailable ?? true;
  }

  isTerminal(): boolean {
    return this.config.isTerminal ?? false;
  }

  private async simulateRead(signal: AbortSignal): Promise<string> {
    if (this.config.throwError) {
      throw new Error(this.config.errorMessage || "Mock stdin error");
    }

    if (this.config.delay) {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(resolve, this.config.delay);
        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          reject(new Error("Operation aborted"));
        });
      });
    }

    return this.config.data || "";
  }
}

// Factory interface
export interface StdinReaderFactory {
  create(config?: Partial<MockStdinConfig>): StdinReader;
}

// Test factory implementation
export class TestStdinReaderFactory implements StdinReaderFactory {
  constructor(private resourceManager: StdinTestResourceManager) {}

  create(config?: Partial<MockStdinConfig>): StdinReader {
    const defaultConfig: MockStdinConfig = {
      data: "",
      isTerminal: false,
      isAvailable: true,
      delay: 0,
      throwError: false,
    };

    return new MockStdinReader(
      { ...defaultConfig, ...config },
      this.resourceManager,
    );
  }
}

// Test context interface
export interface StdinTestContext {
  resourceManager: StdinTestResourceManager;
  createMockStdin: (config?: Partial<MockStdinConfig>) => StdinReader;
}

// Test wrapper function
export async function withStdinTest<T>(
  _testName: string,
  testFn: (context: StdinTestContext) => Promise<T>,
): Promise<T> {
  const resourceManager = new StdinTestResourceManager();
  const factory = new TestStdinReaderFactory(resourceManager);

  const testContext: StdinTestContext = {
    resourceManager,
    createMockStdin: (config) => factory.create(config),
  };

  try {
    return await testFn(testContext);
  } finally {
    // 確実にすべてのリソースをクリーンアップ
    await resourceManager.cleanupAll();
  }
}
