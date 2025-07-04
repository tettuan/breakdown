/**
 * @fileoverview Composite pattern implementation for PromptVariables
 *
 * This module provides a composite implementation that can combine multiple
 * PromptVariables instances into a single unified interface.
 *
 * @module prompt/variables/composite_prompt_variables
 */

import { PromptVariables } from "../../types/prompt_types.ts";

/**
 * Composite implementation of PromptVariables
 *
 * Combines multiple PromptVariables instances using the Composite pattern.
 * When multiple sources provide the same key, the last added source takes precedence.
 *
 * @example
 * ```typescript
 * const base = new BaseVariables({ env: "dev" });
 * const override = new OverrideVariables({ env: "prod", debug: "true" });
 * const composite = new CompositePromptVariables([base, override]);
 *
 * console.log(composite.toRecord()); // { env: "prod", debug: "true" }
 * ```
 */
export class CompositePromptVariables implements PromptVariables {
  private readonly components: ReadonlyArray<PromptVariables>;

  /**
   * Create a CompositePromptVariables instance
   *
   * @param components - Array of PromptVariables to compose
   */
  constructor(components: PromptVariables[]) {
    this.components = Object.freeze([...components]);
  }

  /**
   * Convert all composed variables to a unified record
   *
   * Later components override earlier ones for duplicate keys.
   *
   * @returns Merged record of all component variables
   */
  toRecord(): Record<string, string> {
    const result: Record<string, string> = {};

    // Iterate through all components and merge their records
    for (const component of this.components) {
      const record = component.toRecord();
      Object.assign(result, record);
    }

    return result;
  }

  /**
   * Add a new component to create a new composite
   *
   * Returns a new instance (immutable operation).
   *
   * @param component - The PromptVariables to add
   * @returns New CompositePromptVariables instance
   */
  add(component: PromptVariables): CompositePromptVariables {
    return new CompositePromptVariables([...this.components, component]);
  }

  /**
   * Get the number of components
   *
   * @returns Number of composed PromptVariables
   */
  size(): number {
    return this.components.length;
  }

  /**
   * Check if the composite is empty
   *
   * @returns true if no components, false otherwise
   */
  isEmpty(): boolean {
    return this.components.length === 0;
  }

  /**
   * Create an empty composite
   *
   * @returns New empty CompositePromptVariables instance
   */
  static empty(): CompositePromptVariables {
    return new CompositePromptVariables([]);
  }

  /**
   * Create a composite from variable number of components
   *
   * @param components - Variable number of PromptVariables
   * @returns New CompositePromptVariables instance
   */
  static of(...components: PromptVariables[]): CompositePromptVariables {
    return new CompositePromptVariables(components);
  }
}
