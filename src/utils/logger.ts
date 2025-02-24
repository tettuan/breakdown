export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private static level: LogLevel = LogLevel.INFO;
  private static isTest = Deno.env.get("DENO_ENV") === "test";

  static init() {
    const level = Deno.env.get("LOG_LEVEL")?.toLowerCase();
    if (level === "debug") this.level = LogLevel.DEBUG;
    if (level === "info") this.level = LogLevel.INFO;
    if (level === "warn") this.level = LogLevel.WARN;
    if (level === "error") this.level = LogLevel.ERROR;
  }

  static debug(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.DEBUG) {
      if (this.isTest) {
        // テスト環境では logs/test.log に出力
        Deno.writeTextFileSync("logs/test.log", 
          `[DEBUG] ${message} ${args.map(a => JSON.stringify(a)).join(" ")}\n`, 
          { append: true });
      } else {
        console.debug(`[DEBUG] ${message}`, ...args);
      }
    }
  }

  static info(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  static warn(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  static error(message: string, ...args: unknown[]) {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }
} 