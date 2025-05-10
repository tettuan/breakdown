import { PathResolutionStrategy } from "../interfaces.ts";
import { join, normalize } from "jsr:@std/path@0.224.0";

// Unix形式のパス解決戦略
export class UnixPathStrategy implements PathResolutionStrategy {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  resolve(path: string): Promise<string> {
    return Promise.resolve(join(this.baseDir, path));
  }

  normalize(path: string): Promise<string> {
    return Promise.resolve(normalize(path).replace(/\\/g, "/"));
  }

  validate(path: string): Promise<boolean> {
    return this.normalize(path).then((normalized) => !normalized.includes("//"));
  }
}

// Windows形式のパス解決戦略
export class WindowsPathStrategy implements PathResolutionStrategy {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  resolve(path: string): Promise<string> {
    return Promise.resolve(join(this.baseDir, path));
  }

  normalize(path: string): Promise<string> {
    return Promise.resolve(normalize(path).replace(/\//g, "\\"));
  }

  validate(path: string): Promise<boolean> {
    return this.normalize(path).then((normalized) => !normalized.includes("\\\\"));
  }
}

// プラットフォーム非依存のパス解決戦略
export class PlatformAgnosticPathStrategy implements PathResolutionStrategy {
  private baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = baseDir;
  }

  async resolve(path: string): Promise<string> {
    if (!(await this.validate(path))) {
      throw new Error(`Invalid path: ${path}`);
    }
    const normalized = await this.normalize(path);
    return join(this.baseDir, normalized);
  }

  normalize(path: string): Promise<string> {
    return Promise.resolve(normalize(path).replace(/\\/g, "/"));
  }

  validate(path: string): Promise<boolean> {
    // Convert all backslashes to slashes, then check for double slashes before normalization
    const preNormalized = path.replace(/\\/g, "/");
    if (preNormalized.includes("//")) {
      return Promise.resolve(false);
    }
    return Promise.resolve(true);
  }
}

export class DefaultPathResolutionStrategy implements PathResolutionStrategy {
  private baseDir: string;

  constructor(baseDir: string = ".agent/breakdown") {
    this.baseDir = baseDir;
  }

  resolve(path: string): Promise<string> {
    return Promise.resolve(join(this.baseDir, path));
  }

  normalize(path: string): Promise<string> {
    return Promise.resolve(join(this.baseDir, path));
  }

  validate(path: string): Promise<boolean> {
    return this.resolve(path).then((resolved) => !resolved.includes(".."));
  }
}
