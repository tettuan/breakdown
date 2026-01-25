/**
 * IO Mock
 * Mock implementation of IO operations for testing
 * Simulates STDIN/STDOUT/file system operations
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
   * Setup default file system
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

  // STDIN operation mocks
  /**
   * Set data for STDIN
   */
  setStdinContent(content: string): void {
    this.stdinBuffer = content;
    this.readPosition = 0;
    this.stdinClosed = false;
  }

  /**
   * Read from STDIN (async)
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
   * Read a single line from STDIN
   */
  readStdinLine(): string | null {
    if (this.stdinClosed || this.readPosition >= this.stdinBuffer.length) {
      return null;
    }

    const remaining = this.stdinBuffer.slice(this.readPosition);
    const lineEndIndex = remaining.indexOf("\n");

    if (lineEndIndex === -1) {
      // Last line
      this.readPosition = this.stdinBuffer.length;
      return remaining;
    }

    const line = remaining.slice(0, lineEndIndex);
    this.readPosition += lineEndIndex + 1;
    return line;
  }

  /**
   * Close STDIN
   */
  closeStdin(): void {
    this.stdinClosed = true;
  }

  /**
   * Reset STDIN state
   */
  resetStdin(): void {
    this.stdinBuffer = "";
    this.readPosition = 0;
    this.stdinClosed = false;
  }

  // STDOUT operation mocks
  /**
   * Write to STDOUT
   */
  writeStdout(content: string): void {
    this.stdoutBuffer += content;
  }

  /**
   * Get STDOUT content
   */
  getStdoutContent(): string {
    return this.stdoutBuffer;
  }

  /**
   * Clear STDOUT
   */
  clearStdout(): void {
    this.stdoutBuffer = "";
  }

  // STDERR operation mocks
  /**
   * Write to STDERR
   */
  writeStderr(content: string): void {
    this.stderrBuffer += content;
  }

  /**
   * Get STDERR content
   */
  getStderrContent(): string {
    return this.stderrBuffer;
  }

  /**
   * Clear STDERR
   */
  clearStderr(): void {
    this.stderrBuffer = "";
  }

  // File system operation mocks
  /**
   * Read a file
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
   * Write to a file
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
   * Check if a file exists
   */
  fileExists(path: string): boolean {
    const entry = this.fileSystem.get(path);
    return entry?.exists === true;
  }

  /**
   * Create a directory
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
   * Remove a file/directory
   */
  remove(path: string): void {
    const entry = this.fileSystem.get(path);
    if (entry) {
      entry.exists = false;
    }
  }

  /**
   * Add an entry to the file system
   */
  addFileSystemEntry(entry: MockFileSystemEntry): void {
    this.fileSystem.set(entry.path, entry);
  }

  /**
   * Reset the file system
   */
  resetFileSystem(): void {
    this.fileSystem.clear();
    this.setupDefaultFileSystem();
  }

  // Utility methods for testing
  /**
   * Clear all buffers
   */
  clearAllBuffers(): void {
    this.clearStdout();
    this.clearStderr();
    this.resetStdin();
  }

  /**
   * Simulate an error condition
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
   * Get file system state (for debugging)
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
   * Get IO statistics
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
 * Factory function for testing
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
 * Standard test file set
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
