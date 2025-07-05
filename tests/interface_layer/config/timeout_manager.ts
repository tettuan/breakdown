/**
 * @fileoverview Timeout manager for interface layer
 *
 * This module provides timeout management for interface layer operations
 *
 * @module interface_layer/config/timeout_manager
 */

/**
 * Manages timeout operations for interface layer
 */
export class TimeoutManager {
  private timeouts: Map<string, number> = new Map();

  /**
   * Set timeout with key
   */
  setTimeout(key: string, callback: () => void, delay: number): void {
    const timeoutId = globalThis.setTimeout(callback, delay);
    this.timeouts.set(key, timeoutId);
  }

  /**
   * Clear timeout by key
   */
  clearTimeout(key: string): void {
    const timeoutId = this.timeouts.get(key);
    if (timeoutId !== undefined) {
      globalThis.clearTimeout(timeoutId);
      this.timeouts.delete(key);
    }
  }

  /**
   * Clear all timeouts
   */
  clearAll(): void {
    for (const timeoutId of this.timeouts.values()) {
      globalThis.clearTimeout(timeoutId);
    }
    this.timeouts.clear();
  }

  /**
   * Check if timeout exists
   */
  hasTimeout(key: string): boolean {
    return this.timeouts.has(key);
  }
}