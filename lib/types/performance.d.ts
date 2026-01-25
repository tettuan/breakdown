/**
 * Performance Memory API Type Definitions
 * Type definitions for Node.js/Browser-specific performance APIs
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
