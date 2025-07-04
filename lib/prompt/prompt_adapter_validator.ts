/**
 * PromptAdapterValidator
 *
 * ファイル・ディレクトリ・baseDirのバリデーションを担うOOPクラス。
 * 各publicメソッドは「サニタイズ→パスバリデーション→存在チェック」の手順を一貫して実行し、Result型で返す。
 *
 * ---
 * ## 使い方例
 *
 * const _validator = new PromptAdapterValidator();
 * const result = await validator.validateFile(userInputPath, "Input file");
 * if (result.ok) {
 *   // result.path を使う
 * } else {
 *   // result.error, result.message を使う
 * }
 *
 * ---
 */

/**
 * バリデーションエラー種別のENUM
 */
export enum ValidationErrorType {
  InvalidPath = "InvalidPath",
  NotFound = "NotFound",
  NotFile = "NotFile",
  NotDirectory = "NotDirectory",
  InvalidBaseDir = "InvalidBaseDir",
}

/**
 * バリデーションの結果を表すResult型。
 * - ok: true の場合はバリデーション成功、pathにサニタイズ済みパスが入る。
 * - ok: false の場合はバリデーション失敗、errorにエラー種別、messageに詳細説明が入る。
 *
 * ## 使用例
 *
 * const result = await validator.validateFile(userInputPath, "Input file");
 * if (result.ok) {
 *   // result.path を使う
 * } else {
 *   // result.error, result.message を使ってエラー処理
 * }
 */
export type ValidationResult =
  | { ok: true; path: string }
  | { ok: false; error: ValidationErrorType; message: string };

/**
 * Validates file, directory, and baseDir paths for the Breakdown CLI.
 * Provides public methods for sanitization, validation, and existence checks, returning a Result type.
 */
export class PromptAdapterValidator {
  /**
   * ファイルパスのバリデーション（サニタイズ→パスバリデーション→存在チェック）
   * @param path 入力パス
   * @param label エラー時のラベル
   * @returns ValidationResult
   * @note 出力ファイル（-o, --output）の存在バリデーションには使用しないこと。入力ファイル（-f, --from）専用。
   */
  public async validateFile(path: string, label?: string): Promise<ValidationResult> {
    const safePath = this.sanitizePath(path);
    const pathError = this.getPathStringError(safePath);
    if (pathError) return { ok: false, error: ValidationErrorType.InvalidPath, message: pathError };
    const fileError = await this.getFileExistsError(safePath);
    if (fileError === "not_found") {
      // Add debug info: baseDir and CWD
      const baseDir = (typeof Deno !== "undefined" && Deno.cwd) ? Deno.cwd() : "<no Deno.cwd()>";
      return {
        ok: false,
        error: ValidationErrorType.NotFound,
        message: `${
          label ? label + ": " : ""
        }File does not exist: ${safePath}\n[DEBUG] cwd: ${baseDir}`,
      };
    }
    if (fileError === "not_file") {
      return {
        ok: false,
        error: ValidationErrorType.NotFile,
        message: `${label ? label + ": " : ""}Not a file: ${safePath}`,
      };
    }
    return { ok: true, path: safePath };
  }

  /**
   * ディレクトリパスのバリデーション（サニタイズ→パスバリデーション→存在チェック）
   * @param path 入力パス
   * @param label エラー時のラベル
   * @returns ValidationResult
   */
  public async validateDirectory(path: string, label?: string): Promise<ValidationResult> {
    const safePath = this.sanitizePath(path);
    const pathError = this.getPathStringError(safePath);
    if (pathError) return { ok: false, error: ValidationErrorType.InvalidPath, message: pathError };
    const dirError = await this.getDirectoryExistsError(safePath);
    if (dirError === "not_found") {
      return {
        ok: false,
        error: ValidationErrorType.NotFound,
        message: `${label ? label + ": " : ""}Directory does not exist: ${safePath}`,
      };
    }
    if (dirError === "not_directory") {
      return {
        ok: false,
        error: ValidationErrorType.NotDirectory,
        message: `${label ? label + ": " : ""}Not a directory: ${safePath}`,
      };
    }
    return { ok: true, path: safePath };
  }

  /**
   * baseDirの存在チェックのみ行う
   * @param baseDir プロンプトのベースディレクトリ
   * @returns ValidationResult
   */
  public validateBaseDir(baseDir: string): ValidationResult {
    if (!baseDir) {
      return {
        ok: false,
        error: ValidationErrorType.InvalidBaseDir,
        message: "Prompt base_dir must be set",
      };
    }
    return { ok: true, path: baseDir };
  }

  // --- 以下はprivateメソッド ---
  /**
   * Sanitizes a file path for validation.
   * @param path The path to sanitize.
   * @returns The sanitized path string.
   * @private
   */
  private sanitizePath(path: string): string {
    if (!path) return "";
    // Normalize slashes
    let sanitizedPath = path.replace(/\\/g, "/");
    // Preserve leading slash for absolute paths
    const hasLeadingSlash = sanitizedPath.startsWith("/");
    sanitizedPath = sanitizedPath.replace(/\/+/g, "/");
    sanitizedPath = sanitizedPath.replace(/\/$/, "");
    const parts = sanitizedPath.split("/");
    const sanitizedParts = parts.map((part) => {
      if (/[^ -]/.test(part)) return "_";
      // Allow asterisk (*), colons, and other common file path characters
      return part.replace(/[^a-zA-Z0-9\-_\.\*:]/g, "_");
    });
    const stack: string[] = [];
    for (const part of sanitizedParts) {
      if (part === "." || part === "") continue;
      else if (part === "..") stack.pop();
      else stack.push(part);
    }
    let result = stack.join("/");
    if (hasLeadingSlash) result = "/" + result;
    return result;
  }

  /**
   * Gets a string error for a path if invalid.
   * @param path The path to check.
   * @returns The error string or null.
   * @private
   */
  private getPathStringError(path: string): string | null {
    if (!path) return null;
    if (path.includes("..")) {
      return "Path contains directory traversal '..' which is not allowed";
    }
    // Allow common file path characters including colons for macOS/Unix filenames
    if (/[^a-zA-Z0-9\-_.\/*\s:]/.test(path)) {
      return "Path contains forbidden characters";
    }
    return null;
  }

  /**
   * Checks if a file exists and returns an error if not.
   * @param path The file path to check.
   * @returns The error string or null.
   * @private
   */
  private async getFileExistsError(
    path: string,
  ): Promise<string | null> {
    try {
      const stat = await Deno.stat(path);
      if (!stat.isFile) {
        return "not_file";
      }
    } catch {
      return "not_found";
    }
    return null;
  }

  /**
   * Checks if a directory exists and returns an error if not.
   * @param path The directory path to check.
   * @returns The error string or null.
   * @private
   */
  private async getDirectoryExistsError(
    path: string,
  ): Promise<string | null> {
    try {
      const stat = await Deno.stat(path);
      if (!stat.isDirectory) {
        return "not_directory";
      }
    } catch {
      return "not_found";
    }
    return null;
  }
}
