/**
 * Performance Memory API Type Definitions
 * Node.js/Browser特有のパフォーマンスAPIの型定義
 */

declare global {
  interface Performance {
    memory?: {
      usedJSHeapSize: number;
      totalJSHeapSize: number;
      jsHeapSizeLimit: number;
    };
  }

  var gc: (() => void) | undefined;
}

export {};
