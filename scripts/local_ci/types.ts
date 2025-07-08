/**
 * @file types.ts
 * @description Type definitions for the local CI system
 */

export interface CIConfig {
  /** Run tests one file at a time in debug mode */
  singleFileMode: boolean;
  
  /** Run tests in batches (default behavior) */
  batchMode: boolean;
  
  /** Use legacy mode (all tests at once) */
  legacyMode: boolean;
  
  /** Enable automatic fallback to single-file mode on batch failure */
  fallbackToSingleFile: boolean;
  
  /** Number of test files to process in each batch */
  batchSize: number;
  
  /** Enable debug logging */
  debug: boolean;
  
  /** Enable silent mode (only show errors) */
  silent: boolean;
  
  /** Show only error files list (implies silent mode) */
  errorFilesOnly: boolean;
}

export interface TestResult {
  /** Path to the test file */
  filePath: string;
  
  /** Whether the test passed */
  success: boolean;
  
  /** Error message if test failed */
  error?: string;
  
  /** Execution time in milliseconds */
  duration?: number;
}

export interface BatchResult {
  /** Batch number (1-based) */
  batchNumber: number;
  
  /** Test files in this batch */
  files: string[];
  
  /** Whether the batch passed */
  success: boolean;
  
  /** Error message if batch failed */
  error?: string;
  
  /** Individual test results if available */
  testResults?: TestResult[];
}

export interface TypeCheckResult {
  /** Whether type check passed */
  success: boolean;
  
  /** Files that failed type check */
  failedFiles: string[];
  
  /** Error messages */
  errors: string[];
}

export interface CIResult {
  /** Whether the entire CI run was successful */
  success: boolean;
  
  /** Type check results */
  typeCheck: TypeCheckResult;
  
  /** Test execution results */
  testResults: TestResult[];
  
  /** Batch results if batch mode was used */
  batchResults?: BatchResult[];
  
  /** JSR publish test result */
  jsrPublishTest: boolean;
  
  /** Format check result */
  formatCheck: boolean;
  
  /** Lint check result */
  lintCheck: boolean;
  
  /** Total execution time in milliseconds */
  totalDuration: number;
}

export type ExecutionMode = "single-file" | "batch" | "legacy";

export type LogLevel = "info" | "debug" | "error" | "warn";

export type LogMode = "normal" | "silent" | "debug";

export interface LogConfig {
  /** Log level */
  level: LogLevel;
  
  /** Log output mode */
  mode: LogMode;
  
  /** Whether to show detailed messages */
  verbose: boolean;
}

export interface ProcessResult {
  /** Exit code */
  code: number;
  
  /** Stdout */
  stdout: string;
  
  /** Stderr */
  stderr: string;
  
  /** Whether the process was successful (exit code 0) */
  success: boolean;
}
