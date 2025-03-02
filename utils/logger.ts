// ログレベルの定義
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

// 環境変数からログレベルを取得
const getLogLevel = (): LogLevel => {
  const envLevel = Deno.env.get("LOG_LEVEL");
  if (!envLevel) return LogLevel.INFO;
  
  const level = parseInt(envLevel, 10);
  return isNaN(level) ? LogLevel.INFO : level;
};

// 現在のログレベル
const currentLevel = getLogLevel();

// ロガー関数
export const logger = {
  error: (message: string, ...args: unknown[]) => {
    if (currentLevel >= LogLevel.ERROR) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: unknown[]) => {
    if (currentLevel >= LogLevel.WARN) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  info: (message: string, ...args: unknown[]) => {
    if (currentLevel >= LogLevel.INFO) {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  debug: (message: string, ...args: unknown[]) => {
    if (currentLevel >= LogLevel.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  },
  trace: (message: string, ...args: unknown[]) => {
    if (currentLevel >= LogLevel.TRACE) {
      console.log(`[TRACE] ${message}`, ...args);
    }
  },
}; 