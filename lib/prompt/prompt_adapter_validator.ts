/**
 * PromptAdapterValidator
 *
 * ファイル・ディレクトリ・baseDirのバリデーションを担うOOPクラス。
 * 各publicメソッドは「サニタイズ→パスバリデーション→存在チェック」の手順を一貫して実行し、Result型で返す。
 *
 * ---
 * ## 使い方例
 *
 * const validator = new PromptAdapterValidator();
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
  | { ok: false; error: string; message: string };

export class PromptAdapterValidator {
  /**
   * ファイルパスのバリデーション（サニタイズ→パスバリデーション→存在チェック）
   * @param path 入力パス
   * @param label エラー時のラベル
   * @returns ValidationResult
   */
  public async validateFile(path: string, label?: string): Promise<ValidationResult> {
    const safePath = this.sanitizePath(path);
    const pathError = this.getPathStringError(safePath);
    if (pathError) return { ok: false, error: "InvalidPath", message: pathError };
    const fileError = await this.getFileExistsError(safePath, label);
    if (fileError === "not_found") return { ok: false, error: "NotFound", message: `${label ? label + ': ' : ''}File does not exist: ${safePath}` };
    if (fileError === "not_file") return { ok: false, error: "NotFile", message: `${label ? label + ': ' : ''}Not a file: ${safePath}` };
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
    if (pathError) return { ok: false, error: "InvalidPath", message: pathError };
    const dirError = await this.getDirectoryExistsError(safePath, label);
    if (dirError === "not_found") return { ok: false, error: "NotFound", message: `${label ? label + ': ' : ''}Directory does not exist: ${safePath}` };
    if (dirError === "not_directory") return { ok: false, error: "NotDirectory", message: `${label ? label + ': ' : ''}Not a directory: ${safePath}` };
    return { ok: true, path: safePath };
  }

  /**
   * baseDirの存在チェックのみ行う
   * @param baseDir プロンプトのベースディレクトリ
   * @returns ValidationResult
   */
  public validateBaseDir(baseDir: string): ValidationResult {
    if (!baseDir) {
      return { ok: false, error: "InvalidBaseDir", message: "Prompt base_dir must be set" };
    }
    return { ok: true, path: baseDir };
  }

  // --- 以下はprivateメソッド ---
  private sanitizePath(path: string): string {
    if (!path) return "";
    let sanitizedPath = path.replace(/\\/g, "/").replace(/^[\/\\]/, "");
    sanitizedPath = sanitizedPath.replace(/\/+/g, "/");
    sanitizedPath = sanitizedPath.replace(/\/$/, "");
    const parts = sanitizedPath.split("/");
    const sanitizedParts = parts.map((part) => {
      if (/[^\p{ASCII}]/u.test(part)) return "_";
      return part.replace(/[^a-zA-Z0-9\-_\.]/g, "_");
    });
    const stack: string[] = [];
    for (const part of sanitizedParts) {
      if (part === "." || part === "") continue;
      else if (part === "..") stack.pop();
      else stack.push(part);
    }
    return stack.join("/");
  }

  private getPathStringError(path: string): string | null {
    if (!path) return null;
    if (path.includes("..")) {
      return "Path contains directory traversal '..' which is not allowed";
    }
    if (path.startsWith("/") || path.match(/^[A-Za-z]:\\/)) {
      return "Absolute paths are not allowed";
    }
    if (/[^a-zA-Z0-9\-_.\/]/.test(path)) {
      return "Path contains forbidden characters";
    }
    return null;
  }

  private async getFileExistsError(path: string, _label?: string): Promise<"not_found" | "not_file" | null> {
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

  private async getDirectoryExistsError(path: string, _label?: string): Promise<"not_found" | "not_directory" | null> {
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