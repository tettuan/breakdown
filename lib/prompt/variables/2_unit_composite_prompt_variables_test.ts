/**
 * @fileoverview Unit tests for CompositePromptVariables
 *
 * This module tests the CompositePromptVariables class focusing on:
 * - Composing multiple PromptVariables instances
 * - Variable precedence (later overrides earlier)
 * - Empty composite handling
 * - Immutability of operations
 * - Integration with various PromptVariables implementations
 *
 * @module prompt/variables/2_unit_composite_prompt_variables_test
 */

import { assertEquals, assertNotStrictEquals } from "../../deps.ts";
import { CompositePromptVariables } from "./composite_prompt_variables.ts";
import { StandardPromptVariables } from "./standard_prompt_variables.ts";
import { UserPromptVariables } from "./user_prompt_variables.ts";
import type { PromptVariables } from "../../types/prompt_types.ts";

/**
 * Simple mock PromptVariables for testing
 */
class MockPromptVariables implements PromptVariables {
  constructor(private readonly variables: Record<string, string>) {}

  toRecord(): Record<string, string> {
    return { ...this.variables };
  }
}

Deno.test("CompositePromptVariables - empty composite", () => {
  const composite = CompositePromptVariables.empty();

  assertEquals(composite.isEmpty(), true);
  assertEquals(composite.size(), 0);
  assertEquals(composite.toRecord(), {});
});

Deno.test("CompositePromptVariables - single component", () => {
  const variables = new MockPromptVariables({
    key1: "value1",
    key2: "value2",
  });

  const composite = new CompositePromptVariables([variables]);

  assertEquals(composite.isEmpty(), false);
  assertEquals(composite.size(), 1);
  assertEquals(composite.toRecord(), {
    key1: "value1",
    key2: "value2",
  });
});

Deno.test("CompositePromptVariables - multiple components with no overlap", () => {
  const variables1 = new MockPromptVariables({
    key1: "value1",
    key2: "value2",
  });

  const variables2 = new MockPromptVariables({
    key3: "value3",
    key4: "value4",
  });

  const composite = new CompositePromptVariables([variables1, variables2]);

  assertEquals(composite.size(), 2);
  assertEquals(composite.toRecord(), {
    key1: "value1",
    key2: "value2",
    key3: "value3",
    key4: "value4",
  });
});

Deno.test("CompositePromptVariables - later components override earlier ones", () => {
  const base = new MockPromptVariables({
    env: "development",
    debug: "false",
    port: "3000",
  });

  const override = new MockPromptVariables({
    env: "production",
    debug: "true",
  });

  const composite = new CompositePromptVariables([base, override]);

  assertEquals(composite.toRecord(), {
    env: "production", // overridden
    debug: "true", // overridden
    port: "3000", // preserved from base
  });
});

Deno.test("CompositePromptVariables - three level override", () => {
  const level1 = new MockPromptVariables({
    a: "1",
    b: "1",
    c: "1",
  });

  const level2 = new MockPromptVariables({
    b: "2",
    c: "2",
    d: "2",
  });

  const level3 = new MockPromptVariables({
    c: "3",
    d: "3",
    e: "3",
  });

  const composite = new CompositePromptVariables([level1, level2, level3]);

  assertEquals(composite.toRecord(), {
    a: "1", // only in level1
    b: "2", // overridden by level2
    c: "3", // overridden by level3
    d: "3", // overridden by level3
    e: "3", // only in level3
  });
});

Deno.test("CompositePromptVariables - add() creates new instance", () => {
  const base = new MockPromptVariables({ key: "base" });
  const additional = new MockPromptVariables({ key: "additional" });

  const composite1 = new CompositePromptVariables([base]);
  const composite2 = composite1.add(additional);

  // Should create a new instance
  assertNotStrictEquals(composite1, composite2);

  // Original should remain unchanged
  assertEquals(composite1.size(), 1);
  assertEquals(composite1.toRecord(), { key: "base" });

  // New instance should have both components
  assertEquals(composite2.size(), 2);
  assertEquals(composite2.toRecord(), { key: "additional" });
});

Deno.test("CompositePromptVariables - static of() factory", () => {
  const var1 = new MockPromptVariables({ a: "1" });
  const var2 = new MockPromptVariables({ b: "2" });
  const var3 = new MockPromptVariables({ c: "3" });

  const composite = CompositePromptVariables.of(var1, var2, var3);

  assertEquals(composite.size(), 3);
  assertEquals(composite.toRecord(), {
    a: "1",
    b: "2",
    c: "3",
  });
});

Deno.test("CompositePromptVariables - with real implementations", () => {
  // Create standard variables
  const standard = StandardPromptVariables.create(
    "/path/to/input.md",
    "/path/to/output",
    { standardExtra: "value" },
  );

  // Create user variables
  const user = UserPromptVariables.create({
    userName: "太郎",
    projectName: "マイプロジェクト",
  });

  // Compose them (accessing .data from Result objects)
  // Check if standard creation succeeded
  if (!standard.ok) {
    throw new Error("Failed to create standard variables");
  }
  
  // Check if user creation succeeded
  if (!user.ok) {
    throw new Error("Failed to create user variables");
  }

  const composite = CompositePromptVariables.of(standard.data, user.data);

  const result = composite.toRecord();
  assertEquals(result.input_text_file, "/path/to/input.md");
  assertEquals(result.destination_path, "/path/to/output");
  assertEquals(result.standardExtra, "value");
  assertEquals(result.userName, "太郎");
  assertEquals(result.projectName, "マイプロジェクト");
});

Deno.test("CompositePromptVariables - override standard variables with user variables", () => {
  // Standard variables with default values
  const standard = StandardPromptVariables.create(
    "default_input.md",
    "default_output",
    { version: "1.0.0" },
  );

  // User variables that override some standard values
  const user = UserPromptVariables.create({
    input_text_file: "user_input.md", // Override standard
    version: "2.0.0", // Override additional
    custom: "value", // New variable
  });

  // Check if standard creation succeeded
  if (!standard.ok) {
    throw new Error("Failed to create standard variables");
  }
  
  // Check if user creation succeeded
  if (!user.ok) {
    throw new Error("Failed to create user variables");
  }

  const composite = new CompositePromptVariables([standard.data, user.data]);

  assertEquals(composite.toRecord(), {
    input_text_file: "user_input.md", // User override
    destination_path: "default_output", // Standard preserved
    version: "2.0.0", // User override
    custom: "value", // User addition
  });
});

Deno.test("CompositePromptVariables - empty components are handled correctly", () => {
  const empty1 = UserPromptVariables.empty();
  const filled = new MockPromptVariables({ key: "value" });
  const empty2 = UserPromptVariables.empty();

  const composite = CompositePromptVariables.of(empty1, filled, empty2);

  assertEquals(composite.size(), 3);
  assertEquals(composite.toRecord(), { key: "value" });
});

Deno.test("CompositePromptVariables - immutability of components array", () => {
  const components = [
    new MockPromptVariables({ a: "1" }),
    new MockPromptVariables({ b: "2" }),
  ];

  const composite = new CompositePromptVariables(components);

  // Modify original array
  components.push(new MockPromptVariables({ c: "3" }));

  // Composite should not be affected
  assertEquals(composite.size(), 2);
  assertEquals(composite.toRecord(), {
    a: "1",
    b: "2",
  });
});

Deno.test("CompositePromptVariables - chaining add operations", () => {
  const composite = CompositePromptVariables.empty()
    .add(new MockPromptVariables({ a: "1" }))
    .add(new MockPromptVariables({ b: "2" }))
    .add(new MockPromptVariables({ c: "3", a: "override" }));

  assertEquals(composite.size(), 3);
  assertEquals(composite.toRecord(), {
    a: "override",
    b: "2",
    c: "3",
  });
});

Deno.test("CompositePromptVariables - order matters for precedence", () => {
  const var1 = new MockPromptVariables({ shared: "first", unique1: "1" });
  const var2 = new MockPromptVariables({ shared: "second", unique2: "2" });

  // Different order
  const composite1 = new CompositePromptVariables([var1, var2]);
  const composite2 = new CompositePromptVariables([var2, var1]);

  // Different results
  assertEquals(composite1.toRecord().shared, "second");
  assertEquals(composite2.toRecord().shared, "first");

  // But same unique values
  assertEquals(composite1.toRecord().unique1, "1");
  assertEquals(composite1.toRecord().unique2, "2");
  assertEquals(composite2.toRecord().unique1, "1");
  assertEquals(composite2.toRecord().unique2, "2");
});
