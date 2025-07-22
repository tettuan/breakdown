/**
 * IO Mock
 * テスト用のIO操作モック実装
 * STDIN/STDOUT/ファイルシステム操作の動作を模擬
 */

export interface MockStdinData {
  content: string;
  encoding?: string;
  chunks?: string[];
}

export interface MockFileSystemEntry {
  path: string;
  content: string;
  type: "file" | "directory";
  permissions?: number;
  exists?: boolean;
}

export class IOServiceMock {
  private stdinBuffer: string = "";
  private stdoutBuffer: string = "";
  private stderrBuffer: string = "";
  private fileSystem: Map<string, MockFileSystemEntry> = new Map();
  private stdinClosed = false;
  private readPosition = 0;

  constructor() {
    this.setupDefaultFileSystem();
  }

  /**
   * デフォルトファイルシステムのセットアップ
   */
  private setupDefaultFileSystem(): void {
    const defaultFiles: MockFileSystemEntry[] = [
      {
        path: "/tmp/test-input.md",
        content: "# Test Input\nThis is test input content.",
        type: "file",
        exists: true,
      },
      {
        path: "/tmp/test-config.yml",
        content: `params:
  two:
    directiveType:
      pattern: "^(to|summary|defect)$"
    layerType:
      pattern: "^(project|issue|task)$"`,
        type: "file",
        exists: true,
      },
    ];

    defaultFiles.forEach((file) => {
      this.fileSystem.set(file.path, file);
    });
  }

  // STDIN操作のモック
  /**
   * STDINにデータを設定
   */
  setStdinContent(content: string): void {
    this.stdinBuffer = content;
    this.readPosition = 0;
    this.stdinClosed = false;
  }

  /**
   * STDINからの読み込み（非同期）
   */
  readStdin(): string {
    if (this.stdinClosed) {
      throw new Error("STDIN is closed");
    }

    const content = this.stdinBuffer.slice(this.readPosition);
    this.readPosition = this.stdinBuffer.length;
    return content;
  }

  /**
   * STDINの1行読み込み
   */
  readStdinLine(): string | null {
    if (this.stdinClosed || this.readPosition >= this.stdinBuffer.length) {
      return null;
    }

    const remaining = this.stdinBuffer.slice(this.readPosition);
    const lineEndIndex = remaining.indexOf("\n");

    if (lineEndIndex === -1) {
      // 最後の行
      this.readPosition = this.stdinBuffer.length;
      return remaining;
    }

    const line = remaining.slice(0, lineEndIndex);
    this.readPosition += lineEndIndex + 1;
    return line;
  }

  /**
   * STDINを閉じる
   */
  closeStdin(): void {
    this.stdinClosed = true;
  }

  /**
   * STDINの状態をリセット
   */
  resetStdin(): void {
    this.stdinBuffer = "";
    this.readPosition = 0;
    this.stdinClosed = false;
  }

  // STDOUT操作のモック
  /**
   * STDOUTへの書き込み
   */
  writeStdout(content: string): void {
    this.stdoutBuffer += content;
  }

  /**
   * STDOUTの内容を取得
   */
  getStdoutContent(): string {
    return this.stdoutBuffer;
  }

  /**
   * STDOUTをクリア
   */
  clearStdout(): void {
    this.stdoutBuffer = "";
  }

  // STDERR操作のモック
  /**
   * STDERRへの書き込み
   */
  writeStderr(content: string): void {
    this.stderrBuffer += content;
  }

  /**
   * STDERRの内容を取得
   */
  getStderrContent(): string {
    return this.stderrBuffer;
  }

  /**
   * STDERRをクリア
   */
  clearStderr(): void {
    this.stderrBuffer = "";
  }

  // ファイルシステム操作のモック
  /**
   * ファイルの読み込み
   */
  readFile(path: string): string {
    const entry = this.fileSystem.get(path);

    if (!entry || !entry.exists) {
      throw new Error(`File not found: ${path}`);
    }

    if (entry.type !== "file") {
      throw new Error(`Path is not a file: ${path}`);
    }

    return entry.content;
  }

  /**
   * ファイルの書き込み
   */
  writeFile(path: string, content: string): void {
    this.fileSystem.set(path, {
      path,
      content,
      type: "file",
      exists: true,
    });
  }

  /**
   * ファイルの存在確認
   */
  fileExists(path: string): boolean {
    const entry = this.fileSystem.get(path);
    return entry?.exists === true;
  }

  /**
   * ディレクトリの作成
   */
  mkdir(path: string): void {
    this.fileSystem.set(path, {
      path,
      content: "",
      type: "directory",
      exists: true,
    });
  }

  /**
   * ファイル/ディレクトリの削除
   */
  remove(path: string): void {
    const entry = this.fileSystem.get(path);
    if (entry) {
      entry.exists = false;
    }
  }

  /**
   * ファイルシステムにエントリを追加
   */
  addFileSystemEntry(entry: MockFileSystemEntry): void {
    this.fileSystem.set(entry.path, entry);
  }

  /**
   * ファイルシステムのリセット
   */
  resetFileSystem(): void {
    this.fileSystem.clear();
    this.setupDefaultFileSystem();
  }

  // テスト用のユーティリティ
  /**
   * 全バッファをクリア
   */
  clearAllBuffers(): void {
    this.clearStdout();
    this.clearStderr();
    this.resetStdin();
  }

  /**
   * 模擬的なエラー状況を作成
   */
  simulateFileError(
    path: string,
    errorType: "not_found" | "permission_denied" | "corrupted",
  ): void {
    const entry = this.fileSystem.get(path);
    if (entry) {
      switch (errorType) {
        case "not_found":
          entry.exists = false;
          break;
        case "permission_denied":
          entry.permissions = 0;
          break;
        case "corrupted":
          entry.content = "\0\0\0CORRUPTED\0\0\0";
          break;
      }
    }
  }

  /**
   * ファイルシステムの状態を取得（デバッグ用）
   */
  getFileSystemState(): Array<{ path: string; exists: boolean; type: string; size: number }> {
    return Array.from(this.fileSystem.entries()).map(([path, entry]) => ({
      path,
      exists: entry.exists ?? true,
      type: entry.type,
      size: entry.content.length,
    }));
  }

  /**
   * 入出力統計を取得
   */
  getIOStats(): {
    stdinBytesRead: number;
    stdoutBytesWritten: number;
    stderrBytesWritten: number;
    filesCreated: number;
    filesRead: number;
  } {
    const filesCount = Array.from(this.fileSystem.values())
      .filter((entry) => entry.type === "file" && entry.exists).length;

    return {
      stdinBytesRead: this.readPosition,
      stdoutBytesWritten: this.stdoutBuffer.length,
      stderrBytesWritten: this.stderrBuffer.length,
      filesCreated: filesCount,
      filesRead: filesCount,
    };
  }
}

/**
 * テスト用のファクトリー関数
 */
export function createMockIOService(options?: {
  stdinContent?: string;
  files?: MockFileSystemEntry[];
}): IOServiceMock {
  const mock = new IOServiceMock();

  if (options?.stdinContent) {
    mock.setStdinContent(options.stdinContent);
  }

  if (options?.files) {
    options.files.forEach((file) => mock.addFileSystemEntry(file));
  }

  return mock;
}

/**
 * 標準的なテストファイルセット
 */
export const STANDARD_TEST_FILES: MockFileSystemEntry[] = [
  {
    path: "/tmp/input.md",
    content: "# Project Requirements\n\n- Feature A\n- Feature B",
    type: "file",
    exists: true,
  },
  {
    path: "/tmp/output.json",
    content: '{"result": "test"}',
    type: "file",
    exists: true,
  },
  {
    path: "/tmp/error.log",
    content: "ERROR: Test error occurred",
    type: "file",
    exists: true,
  },
];
