// デバッグ用ロガー - 詳細なチェックポイントログを提供
import { logger, LogLevel } from "./logger.ts";

/**
 * 関数の入出力をログに記録するラッパー関数
 * @param name 関数名
 * @param fn 対象関数
 * @returns ラップされた関数
 */
export function logFunction<T extends (...args: any[]) => any>(
  name: string,
  fn: T
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    logger.debug(`[ENTER] ${name} with args:`, args);
    try {
      const result = fn(...args);
      
      // Promiseの場合は特別処理
      if (result instanceof Promise) {
        return result
          .then((value) => {
            logger.debug(`[EXIT] ${name} returned:`, value);
            return value;
          })
          .catch((error) => {
            logger.error(`[ERROR] ${name} threw:`, error);
            throw error;
          }) as ReturnType<T>;
      }
      
      logger.debug(`[EXIT] ${name} returned:`, result);
      return result;
    } catch (error) {
      logger.error(`[ERROR] ${name} threw:`, error);
      throw error;
    }
  };
}

/**
 * 値をログに記録するチェックポイント関数
 * @param label チェックポイントのラベル
 * @param value ログに記録する値
 * @returns 元の値（チェーン可能）
 */
export function checkpoint<T>(label: string, value: T): T {
  logger.debug(`[CHECKPOINT] ${label}:`, value);
  return value;
}

/**
 * オブジェクトのプロパティをログに記録
 * @param obj 対象オブジェクト
 * @param label ログのラベル
 */
export function logObject(obj: unknown, label = "Object"): void {
  if (typeof obj !== "object" || obj === null) {
    logger.debug(`[${label}] Not an object:`, obj);
    return;
  }
  
  logger.debug(`[${label}] Properties:`);
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    logger.debug(`  - ${key}:`, value);
  }
}

/**
 * 処理の開始をログに記録
 * @param section セクション名
 */
export function startSection(section: string): void {
  logger.debug(`[START] ====== ${section} ======`);
}

/**
 * 処理の終了をログに記録
 * @param section セクション名
 */
export function endSection(section: string): void {
  logger.debug(`[END] ====== ${section} ======`);
} 