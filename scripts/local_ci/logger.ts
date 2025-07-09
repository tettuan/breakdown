/**
 * @file logger.ts
 * @description Logging utilities for the CI system
 */

import type { LogConfig, LogLevel, LogMode } from "./types.ts";

export class Logger {
  private config: LogConfig;

  constructor(debugMode = false, silentMode = false) {
    this.config = {
      level: debugMode ? "debug" : "info",
      mode: silentMode ? "silent" : (debugMode ? "debug" : "normal"),
      verbose: debugMode,
    };
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.config.mode === "silent") {
      return level === "error";
    }

    if (this.config.mode === "debug") {
      return true; // Show all levels in debug mode
    }

    // Normal mode: show info, warn, error
    return level !== "debug";
  }

  private formatMessage(level: LogLevel, message: string, status?: string): string {
    const timestamp = new Date().toISOString().substring(11, 19); // HH:mm:ss

    if (this.config.mode === "debug") {
      return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    }

    if (this.config.mode === "silent") {
      return status ? `✗ ${status}: ${message}` : `✗ ${message}`;
    }

    // Normal mode: concise format
    if (level === "info") {
      return status ? `${status}` : message;
    }

    if (level === "error") {
      return status ? `✗ ${status}` : `✗ ${message}`;
    }

    return message;
  }

  info(message: string, status?: string): void {
    if (this.shouldLog("info")) {
      console.log(this.formatMessage("info", message, status));
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      const formattedMessage = this.formatMessage("debug", message);
      if (args.length > 0) {
        console.log(formattedMessage, ...args);
      } else {
        console.log(formattedMessage);
      }
    }
  }

  warn(message: string, status?: string): void {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, status));
    }
  }

  error(message: string, status?: string): void {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, status));
    }
  }

  section(title: string): void {
    if (this.config.mode === "silent") {
      return; // No section headers in silent mode
    }

    if (this.config.mode === "debug") {
      const separator = "=".repeat(79);
      console.log(`
${separator}
>>> ${title} <<<
${separator}`);
    } else {
      // Normal mode: simple section header
      console.log(`\n>>> ${title}`);
    }
  }

  subsection(title: string): void {
    if (this.config.mode === "silent") {
      return; // No subsection headers in silent mode
    }

    if (this.config.mode === "debug") {
      console.log(`
-------------------------------------------------------------------------------
>>> ${title} <<<
-------------------------------------------------------------------------------`);
    } else {
      // Normal mode: simple subsection header
      console.log(`> ${title}`);
    }
  }

  success(message: string): void {
    if (this.config.mode !== "silent") {
      console.log(`✓ ${message}`);
    }
  }

  failure(message: string): void {
    console.error(`✗ ${message}`);
  }

  step(step: number, total: number, message: string): void {
    if (this.config.mode !== "silent") {
      console.log(`[${step}/${total}] ${message}`);
    }
  }

  progress(current: number, total: number, item: string): void {
    if (this.config.mode === "silent") {
      return; // No progress in silent mode
    }

    if (this.config.mode === "debug") {
      const percentage = Math.round((current / total) * 100);
      console.log(`[${current}/${total}] (${percentage}%) ${item}`);
    } else {
      // Normal mode: just show progress without item details
      const percentage = Math.round((current / total) * 100);
      console.log(`[${current}/${total}] ${percentage}%`);
    }
  }

  enableDebug(): void {
    this.config.mode = "debug";
    this.config.level = "debug";
    this.config.verbose = true;
    this.debug("Debug mode enabled");
  }

  disableDebug(): void {
    this.config.mode = "normal";
    this.config.level = "info";
    this.config.verbose = false;
  }

  enableSilent(): void {
    this.config.mode = "silent";
    this.config.verbose = false;
  }

  disableSilent(): void {
    this.config.mode = "normal";
  }

  isDebugEnabled(): boolean {
    return this.config.mode === "debug";
  }

  isSilentEnabled(): boolean {
    return this.config.mode === "silent";
  }

  getMode(): LogMode {
    return this.config.mode;
  }

  /**
   * Display error file list in silent mode
   */
  errorFileList(title: string, files: string[], errors?: string[]): void {
    if (this.config.mode !== "silent") {
      return; // Only show in silent mode
    }

    if (files.length === 0) {
      return; // No errors to show
    }

    console.error(`\n✗ ${title}:`);
    files.forEach((file, index) => {
      if (errors && errors[index]) {
        console.error(`  ${file}: ${errors[index]}`);
      } else {
        console.error(`  ${file}`);
      }
    });
  }

  /**
   * Display summary of all errors in silent mode
   */
  errorSummary(typeCheckErrors: string[], testFailures: string[]): void {
    if (this.config.mode !== "silent") {
      return; // Only show in silent mode
    }

    const totalErrors = typeCheckErrors.length + testFailures.length;
    if (totalErrors === 0) {
      return; // No errors to show
    }

    console.error(`\n✗ FAILED: ${totalErrors} error(s) found`);

    if (typeCheckErrors.length > 0) {
      console.error(`  Type Check Errors: ${typeCheckErrors.length}`);
      typeCheckErrors.forEach((file) => console.error(`    ${file}`));
    }

    if (testFailures.length > 0) {
      console.error(`  Test Failures: ${testFailures.length}`);
      testFailures.forEach((file) => console.error(`    ${file}`));
    }
  }
}
