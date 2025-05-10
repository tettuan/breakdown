/**
 * WorkspaceConfig interface for type safety in workspace modules.
 *
 * Note: When reading actual configuration values, always use BreakdownConfig from @tettuan/breakdownconfig.
 * This interface is for type definition only and should not be used to load config values directly.
 */
export interface WorkspaceConfig {
  workingDir: string;
  promptBaseDir: string;
  schemaBaseDir: string;
}

// パス解決のインターフェース
export interface PathResolutionStrategy {
  resolve(path: string): Promise<string>;
  normalize(path: string): Promise<string>;
  validate(path: string): Promise<boolean>;
}

// ディレクトリ構造管理のインターフェース
export interface WorkspaceStructure {
  initialize(): Promise<void>;
  ensureDirectories(): Promise<void>;
  exists(path?: string): Promise<boolean>;
  createDirectory(path: string): Promise<void>;
  removeDirectory(path: string): Promise<void>;
}

// 設定管理のインターフェース
export interface WorkspaceConfigManager {
  load(): Promise<void>;
  get(): Promise<WorkspaceConfig>;
  update(config: Partial<WorkspaceConfig>): Promise<void>;
  validate(): Promise<void>;
}

// パス解決のインターフェース
export interface WorkspacePathResolver {
  resolve(path: string): Promise<string>;
  normalize(path: string): Promise<string>;
  validate(path: string): Promise<boolean>;
  updateStrategy(strategy: PathResolutionStrategy): void;
}

// エラー処理のインターフェース
export interface WorkspaceErrorHandler {
  handleError(error: Error, type: string): void;
  logError(error: Error, context: Record<string, unknown>): void;
}

// イベント管理のインターフェース
export interface WorkspaceEventEmitter {
  on(event: string, listener: (data: unknown) => void): void;
  emit(event: string, data: unknown): void;
}

// メインのWorkspaceインターフェース
export interface Workspace {
  initialize(): Promise<void>;
  resolvePath(path: string): Promise<string>;
  createDirectory(path: string): Promise<void>;
  removeDirectory(path: string): Promise<void>;
  exists(path?: string): Promise<boolean>;
  getPromptBaseDir(): Promise<string>;
  getSchemaBaseDir(): Promise<string>;
  getWorkingDir(): Promise<string>;
  validateConfig(): Promise<void>;
  reloadConfig(): Promise<void>;
}
