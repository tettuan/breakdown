/**
 * @fileoverview Behavior tests for PromptVariablesVO module
 * Testing business logic and expected behaviors
 * 
 * Behavior tests verify:
 * - Business rules and invariants
 * - Collection operations
 * - Edge cases and boundary conditions
 * - State consistency
 */

import { assertEquals, assertExists } from "@std/assert";
import { PromptVariablesVO } from "./prompt_variables_vo.ts";
import { StandardVariable, FilePathVariable, StdinVariable, UserVariable } from "./prompt_variables.ts";
import type { PromptVariable } from "./prompt_variables.ts";

// Test helper to create test variables
const createStandardVar = (name: string, value: string): PromptVariable => {
  const result = StandardVariable.create(name, value);
  if (!result.ok) throw new Error(`Failed to create StandardVariable: ${name}`);
  return result.data;
};

const createFilePathVar = (value: string): PromptVariable => {
  const result = FilePathVariable.create("schema_file", value);
  if (!result.ok) throw new Error("Failed to create FilePathVariable");
  return result.data;
};

const createStdinVar = (value: string): PromptVariable => {
  const result = StdinVariable.create("input_text", value);
  if (!result.ok) throw new Error("Failed to create StdinVariable");
  return result.data;
};

const createUserVar = (name: string, value: string): PromptVariable => {
  const result = UserVariable.create(name, value);
  if (!result.ok) throw new Error(`Failed to create UserVariable: ${name}`);
  return result.data;
};

Deno.test("1_behavior: PromptVariablesVO correctly manages empty collections", () => {
  const vo = PromptVariablesVO.create([]);
  
  assertEquals(vo.size(), 0);
  assertEquals(vo.isEmpty(), true);
  assertEquals(vo.value.length, 0);
  assertEquals(vo.originalVariables.length, 0);
  assertEquals(vo.toRecord(), {});
  assertEquals(vo.getNames(), []);
  assertEquals(vo.findByName("any"), undefined);
  assertEquals(vo.hasVariable("any"), false);
});

Deno.test("1_behavior: PromptVariablesVO correctly manages single variable", () => {
  const standardVar = createStandardVar("input_text_file", "/path/to/file");
  const vo = PromptVariablesVO.create([standardVar]);
  
  assertEquals(vo.size(), 1);
  assertEquals(vo.isEmpty(), false);
  assertEquals(vo.value.length, 1);
  assertEquals(vo.toRecord(), { input_text_file: "/path/to/file" });
  assertEquals(vo.getNames(), ["input_text_file"]);
  assertEquals(vo.findByName("input_text_file"), standardVar);
  assertEquals(vo.hasVariable("input_text_file"), true);
  assertEquals(vo.hasVariable("non_existent"), false);
});

Deno.test("1_behavior: PromptVariablesVO correctly manages multiple variables", () => {
  const var1 = createStandardVar("input_text_file", "/input");
  const var2 = createFilePathVar("/schema.json");
  const var3 = createStdinVar("test content");
  const var4 = createUserVar("uv-custom", "custom value");
  
  const vo = PromptVariablesVO.create([var1, var2, var3, var4]);
  
  assertEquals(vo.size(), 4);
  assertEquals(vo.isEmpty(), false);
  
  const record = vo.toRecord();
  assertEquals(record, {
    input_text_file: "/input",
    schema_file: "/schema.json",
    input_text: "test content",
    custom: "custom value", // uv- prefix removed
  });
  
  const names = vo.getNames().sort();
  assertEquals(names, ["custom", "input_text", "input_text_file", "schema_file"]);
});

Deno.test("1_behavior: PromptVariablesVO findByName works correctly", () => {
  const var1 = createStandardVar("input_text_file", "/path1");
  const var2 = createStandardVar("destination_path", "/path2");
  const var3 = createUserVar("uv-feature", "enabled");
  
  const vo = PromptVariablesVO.create([var1, var2, var3]);
  
  // Found cases
  assertEquals(vo.findByName("input_text_file"), var1);
  assertEquals(vo.findByName("destination_path"), var2);
  assertEquals(vo.findByName("feature"), var3); // Without uv- prefix
  
  // Not found cases
  assertEquals(vo.findByName("non_existent"), undefined);
  assertEquals(vo.findByName("uv-feature"), undefined); // With prefix doesn't work
  assertEquals(vo.findByName(""), undefined);
});

Deno.test("1_behavior: PromptVariablesVO equality comparison works correctly", () => {
  const var1 = createStandardVar("input_text_file", "/path");
  const var2 = createFilePathVar("/schema");
  
  // Same variables in same order
  const vo1 = PromptVariablesVO.create([var1, var2]);
  const vo2 = PromptVariablesVO.create([var1, var2]);
  assertEquals(vo1.equals(vo2), true);
  assertEquals(vo2.equals(vo1), true);
  
  // Same variables in different order (should still be equal based on content)
  const vo3 = PromptVariablesVO.create([var2, var1]);
  assertEquals(vo1.equals(vo3), true);
  
  // Different variables
  const var3 = createStdinVar("different content");
  const vo4 = PromptVariablesVO.create([var1, var3]);
  assertEquals(vo1.equals(vo4), false);
  
  // Different number of variables
  const vo5 = PromptVariablesVO.create([var1]);
  assertEquals(vo1.equals(vo5), false);
  
  // Self equality
  assertEquals(vo1.equals(vo1), true);
  
  // Empty collections
  const empty1 = PromptVariablesVO.create([]);
  const empty2 = PromptVariablesVO.create([]);
  assertEquals(empty1.equals(empty2), true);
});

Deno.test("1_behavior: PromptVariablesVO toString provides consistent format", () => {
  const testCases = [
    { variables: [], expected: "PromptVariablesVO(count: 0)" },
    { 
      variables: [createStandardVar("input_text_file", "/path")], 
      expected: "PromptVariablesVO(count: 1)" 
    },
    { 
      variables: [
        createStandardVar("input_text_file", "/path"),
        createFilePathVar("/schema"),
        createStdinVar("content"),
      ], 
      expected: "PromptVariablesVO(count: 3)" 
    },
  ];
  
  for (const { variables, expected } of testCases) {
    const vo = PromptVariablesVO.create(variables);
    assertEquals(vo.toString(), expected);
  }
});

Deno.test("1_behavior: PromptVariablesVO handles duplicate variable names correctly", () => {
  // Note: Based on Totality principle, PromptVariablesVO doesn't validate duplicates
  // It trusts that the caller handles validation
  // Later values override earlier ones in toRecord()
  
  const var1 = createStandardVar("input_text_file", "/path1");
  const var2 = createStandardVar("input_text_file", "/path2");
  
  const vo = PromptVariablesVO.create([var1, var2]);
  
  assertEquals(vo.size(), 2); // Both variables are stored
  assertEquals(vo.value.length, 2);
  
  const record = vo.toRecord();
  assertEquals(record.input_text_file, "/path2"); // Later value wins
  
  // findByName returns the first match
  assertEquals(vo.findByName("input_text_file"), var1);
});

Deno.test("1_behavior: PromptVariablesVO handles special characters in values", () => {
  const specialCases = [
    { name: "input_text_file", value: "path with spaces/file.txt" },
    { name: "input_text_file", value: "path/with/特殊文字.txt" },
    { name: "input_text_file", value: "path\\with\\backslashes" },
    { name: "input_text_file", value: "" }, // Empty value
    { name: "input_text_file", value: "path/with/🎯/emoji" },
    { name: "input_text_file", value: "path\nwith\nnewlines" },
    { name: "input_text_file", value: "path\twith\ttabs" },
  ];
  
  for (const { name, value } of specialCases) {
    const var1 = createStandardVar(name, value);
    const vo = PromptVariablesVO.create([var1]);
    
    // PromptVariablesVO doesn't validate - it trusts the variables
    assertEquals(vo.toRecord()[name], value);
    assertEquals(vo.findByName(name)?.toRecord()[name], value);
  }
});

Deno.test("1_behavior: PromptVariablesVO preserves variable order", () => {
  const var1 = createStandardVar("input_text_file", "/1");
  const var2 = createStandardVar("destination_path", "/2");
  const var3 = createFilePathVar("/3");
  const var4 = createStdinVar("4");
  const var5 = createUserVar("uv-five", "5");
  
  const vo = PromptVariablesVO.create([var1, var2, var3, var4, var5]);
  
  // value property preserves order
  const values = vo.value;
  assertEquals(values[0], var1);
  assertEquals(values[1], var2);
  assertEquals(values[2], var3);
  assertEquals(values[3], var4);
  assertEquals(values[4], var5);
  
  // originalVariables also preserves order
  const original = vo.originalVariables;
  assertEquals(original[0], var1);
  assertEquals(original[1], var2);
  assertEquals(original[2], var3);
  assertEquals(original[3], var4);
  assertEquals(original[4], var5);
});

Deno.test("1_behavior: PromptVariablesVO toRecord merges all variables correctly", () => {
  const var1 = createStandardVar("input_text_file", "/input");
  const var2 = createStandardVar("destination_path", "/output");
  const var3 = createFilePathVar("/schema.json");
  const var4 = createStdinVar("stdin content");
  const var5 = createUserVar("uv-custom-option", "value1");
  const var6 = createUserVar("uv-another-option", "value2");
  
  const vo = PromptVariablesVO.create([var1, var2, var3, var4, var5, var6]);
  
  const record = vo.toRecord();
  assertEquals(record, {
    input_text_file: "/input",
    destination_path: "/output",
    schema_file: "/schema.json",
    input_text: "stdin content",
    "custom-option": "value1",
    "another-option": "value2",
  });
});

Deno.test("1_behavior: PromptVariablesVO getNames returns all unique names", () => {
  const var1 = createStandardVar("input_text_file", "/1");
  const var2 = createStandardVar("input_text_file", "/2"); // Duplicate name
  const var3 = createFilePathVar("/schema");
  const var4 = createUserVar("uv-custom", "value");
  
  const vo = PromptVariablesVO.create([var1, var2, var3, var4]);
  
  const names = vo.getNames();
  // getNames returns all names including duplicates
  assertEquals(names.length, 4);
  assertEquals(names.includes("input_text_file"), true);
  assertEquals(names.includes("schema_file"), true);
  assertEquals(names.includes("custom"), true);
  
  // Count occurrences
  const inputFileCount = names.filter(n => n === "input_text_file").length;
  assertEquals(inputFileCount, 2); // Duplicate is included
});

Deno.test("1_behavior: PromptVariablesVO maintains consistency across multiple accesses", () => {
  const var1 = createStandardVar("input_text_file", "/consistent");
  const vo = PromptVariablesVO.create([var1]);
  
  // Multiple accesses should return the same values
  const size1 = vo.size();
  const size2 = vo.size();
  assertEquals(size1, 1);
  assertEquals(size2, 1);
  
  const isEmpty1 = vo.isEmpty();
  const isEmpty2 = vo.isEmpty();
  assertEquals(isEmpty1, false);
  assertEquals(isEmpty2, false);
  
  // toRecord should return equal but different objects
  const record1 = vo.toRecord();
  const record2 = vo.toRecord();
  assertEquals(record1, record2);
  assertEquals(record1 !== record2, true); // Different references
  
  // getNames should return equal but different arrays
  const names1 = vo.getNames();
  const names2 = vo.getNames();
  assertEquals(names1, names2);
  assertEquals(names1 !== names2, true); // Different references
});

Deno.test("1_behavior: PromptVariablesVO handles empty string variable names", () => {
  // UserVariable allows any name, including empty string
  const userVar = createUserVar("", "empty name value");
  const vo = PromptVariablesVO.create([userVar]);
  
  assertEquals(vo.size(), 1);
  const record = vo.toRecord();
  assertEquals(record[""], "empty name value");
  
  assertEquals(vo.hasVariable(""), true);
  assertEquals(vo.findByName(""), userVar);
  
  const names = vo.getNames();
  assertEquals(names.includes(""), true);
});

Deno.test("1_behavior: PromptVariablesVO works with all variable types", () => {
  // Test all four variable types together
  const standardVars = [
    createStandardVar("input_text_file", "/input"),
    createStandardVar("destination_path", "/output"),
    createStandardVar("demonstrative_type", "to"),
    createStandardVar("layer_type", "project"),
  ];
  
  const filePathVar = createFilePathVar("/schema/path.json");
  const stdinVar = createStdinVar("This is stdin content");
  
  const userVars = [
    createUserVar("uv-debug", "true"),
    createUserVar("uv-profile", "production"),
    createUserVar("uv-feature-flag", "enabled"),
  ];
  
  const allVars = [...standardVars, filePathVar, stdinVar, ...userVars];
  const vo = PromptVariablesVO.create(allVars);
  
  assertEquals(vo.size(), 8);
  assertEquals(vo.isEmpty(), false);
  
  // Verify all variables are accessible
  assertEquals(vo.hasVariable("input_text_file"), true);
  assertEquals(vo.hasVariable("destination_path"), true);
  assertEquals(vo.hasVariable("demonstrative_type"), true);
  assertEquals(vo.hasVariable("layer_type"), true);
  assertEquals(vo.hasVariable("schema_file"), true);
  assertEquals(vo.hasVariable("input_text"), true);
  assertEquals(vo.hasVariable("debug"), true);
  assertEquals(vo.hasVariable("profile"), true);
  assertEquals(vo.hasVariable("feature-flag"), true);
});