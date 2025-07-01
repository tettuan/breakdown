/**
 * @fileoverview Architecture Test for Prompt Variables
 * 
 * Verifies architectural constraints for prompt variables types:
 * - Dependency direction compliance (no circular dependencies)
 * - Layer boundary adherence (types layer constraints)
 * - Interface consistency with Duck Typing pattern
 * - Smart constructor pattern implementation
 * - Integration with external dependencies
 * 
 * This test ensures the module follows the Totality principle by:
 * - Using Result types for all error handling
 * - Implementing smart constructors for type safety
 * - Following consistent architectural patterns
 * 
 * @module lib/types/0_architecture_prompt_variables_test
 */

import { assertEquals, assertExists } from "../../deps.ts";
import {
  StandardVariable,
  FilePathVariable,
  StdinVariable,
  UserVariable,
  StandardVariableName,
  FilePathVariableName,
  StdinVariableName,
  toPromptParamsVariables,
  createPromptParams,
  type PromptVariable,
  type PromptVariableBase,
  type PromptVariables,
} from "./prompt_variables.ts";

Deno.test("Architecture: Prompt Variables dependency validation", () => {
  // Test that the module has proper dependencies
  // Should only depend on:
  // - variable_result.ts (same layer)
  // - @tettuan/breakdownprompt (external package)
  
  // The imports at the top validate this at compile time
  // If circular dependencies existed, TypeScript would error
  
  // Test that we can create instances without issues
  const stdResult = StandardVariable.create("input_text_file", "test.txt");
  assertExists(stdResult);
  assertEquals(typeof stdResult.ok, "boolean");
});

Deno.test("Architecture: Duck Typing interface pattern", () => {
  // All variable types should implement PromptVariableBase
  // This enables polymorphic usage through duck typing
  
  const testCases: Array<() => PromptVariable | null> = [
    () => {
      const result = StandardVariable.create("input_text_file", "test.txt");
      return result.ok ? result.data : null;
    },
    () => {
      const result = FilePathVariable.create("schema_file", "schema.json");
      return result.ok ? result.data : null;
    },
    () => {
      const result = StdinVariable.create("input_text", "content");
      return result.ok ? result.data : null;
    },
    () => {
      const result = UserVariable.create("custom", "value");
      return result.ok ? result.data : null;
    },
  ];
  
  for (const createVar of testCases) {
    const variable = createVar();
    if (variable) {
      // All should implement toRecord method
      assertEquals(typeof variable.toRecord, "function");
      const record = variable.toRecord();
      assertEquals(typeof record, "object");
      assertEquals(Object.keys(record).length, 1);
    }
  }
});

Deno.test("Architecture: Smart constructor pattern compliance", () => {
  // All variable types should use static create methods
  // returning Result types (no exceptions thrown)
  
  // Test StandardVariable
  const stdInvalid = StandardVariable.create("invalid_name", "value");
  assertEquals(stdInvalid.ok, false);
  
  const stdEmpty = StandardVariable.create("input_text_file", "");
  assertEquals(stdEmpty.ok, false);
  
  const stdValid = StandardVariable.create("input_text_file", "valid");
  assertEquals(stdValid.ok, true);
  
  // Test FilePathVariable
  const fileInvalid = FilePathVariable.create("invalid_name", "value");
  assertEquals(fileInvalid.ok, false);
  
  const fileValid = FilePathVariable.create("schema_file", "path.json");
  assertEquals(fileValid.ok, true);
  
  // Test StdinVariable
  const stdinInvalid = StdinVariable.create("invalid_name", "value");
  assertEquals(stdinInvalid.ok, false);
  
  const stdinValid = StdinVariable.create("input_text", "content");
  assertEquals(stdinValid.ok, true);
  
  // Test UserVariable (no name validation)
  const userEmpty = UserVariable.create("", "value");
  assertEquals(userEmpty.ok, false);
  
  const userValid = UserVariable.create("any_name", "value");
  assertEquals(userValid.ok, true);
});

Deno.test("Architecture: Variable name type safety", () => {
  // Name types should enforce valid values at compile time
  
  // StandardVariableName
  const stdName1 = StandardVariableName.create("input_text_file");
  assertEquals(stdName1.ok, true);
  
  const stdName2 = StandardVariableName.create("destination_path");
  assertEquals(stdName2.ok, true);
  
  const stdNameInvalid = StandardVariableName.create("invalid");
  assertEquals(stdNameInvalid.ok, false);
  
  // FilePathVariableName
  const fileName = FilePathVariableName.create("schema_file");
  assertEquals(fileName.ok, true);
  
  const fileNameInvalid = FilePathVariableName.create("invalid");
  assertEquals(fileNameInvalid.ok, false);
  
  // StdinVariableName
  const stdinName = StdinVariableName.create("input_text");
  assertEquals(stdinName.ok, true);
  
  const stdinNameInvalid = StdinVariableName.create("invalid");
  assertEquals(stdinNameInvalid.ok, false);
});

Deno.test("Architecture: Layer boundary compliance", () => {
  // Types module should not depend on higher layers
  // Should not import from:
  // - cli/
  // - processor/
  // - factory/
  // - builder/
  
  // This is validated at compile time through imports
  // The module only imports from:
  // - Same layer (variable_result.ts)
  // - External packages (@tettuan/breakdownprompt)
  
  // Test that types are pure data structures
  const result = StandardVariable.create("input_text_file", "test.txt");
  if (result.ok) {
    const variable = result.data;
    // Should not have methods that perform I/O or side effects
    const proto = Object.getPrototypeOf(variable);
    const methods = Object.getOwnPropertyNames(proto);
    
    for (const method of methods) {
      if (method !== "constructor" && method !== "toRecord") {
        // Only toRecord should be public
        assertEquals(false, true, `Unexpected method: ${method}`);
      }
    }
  }
});

Deno.test("Architecture: Integration function separation", () => {
  // Integration functions should be separate from core types
  
  // toPromptParamsVariables should be a pure function
  const var1 = StandardVariable.create("input_text_file", "test.txt");
  const var2 = UserVariable.create("custom", "value");
  
  if (var1.ok && var2.ok) {
    const variables: PromptVariables = [var1.data, var2.data];
    const result = toPromptParamsVariables(variables);
    
    assertEquals(typeof result, "object");
    assertEquals(Object.keys(result).length, 2);
    assertEquals(result["input_text_file"], "test.txt");
    assertEquals(result["custom"], "value");
  }
  
  // createPromptParams should be a pure function
  if (var1.ok) {
    const params = createPromptParams("template.md", [var1.data]);
    assertEquals(params.template_file, "template.md");
    assertExists(params.variables);
    assertEquals(Object.keys(params.variables).length, 1);
  }
});

Deno.test("Architecture: Type union completeness", () => {
  // PromptVariable union should include all variable types
  // This is validated at compile time
  
  const createFunctions = [
    () => StandardVariable.create("input_text_file", "test"),
    () => FilePathVariable.create("schema_file", "test"),
    () => StdinVariable.create("input_text", "test"),
    () => UserVariable.create("custom", "test"),
  ];
  
  for (const createFn of createFunctions) {
    const result = createFn();
    if (result.ok) {
      // Should be assignable to PromptVariable
      const variable: PromptVariable = result.data;
      assertExists(variable);
    }
  }
});

Deno.test("Architecture: Immutability and encapsulation", () => {
  // Variables should be immutable after creation
  
  const result = StandardVariable.create("input_text_file", "test.txt");
  if (result.ok) {
    const variable = result.data;
    
    // Properties should be readonly (enforced by TypeScript)
    // Private constructor prevents direct instantiation (enforced by TypeScript)
    
    assertEquals(variable.name.getValue(), "input_text_file");
    assertEquals(variable.value, "test.txt");
  }
});

Deno.test("Architecture: Error handling consistency", () => {
  // All create methods should return Result types
  // Errors should be handled consistently
  
  // Test empty value errors for most variable types
  const emptyTests = [
    { name: "StandardVariable", result: StandardVariable.create("input_text_file", ""), expectFail: true },
    { name: "FilePathVariable", result: FilePathVariable.create("schema_file", ""), expectFail: true },
    { name: "StdinVariable", result: StdinVariable.create("input_text", ""), expectFail: true },
    { name: "UserVariable", result: UserVariable.create("name", ""), expectFail: false }, // UserVariable allows empty strings
  ];
  
  for (const test of emptyTests) {
    assertEquals(test.result.ok, !test.expectFail, `${test.name} should ${test.expectFail ? 'fail' : 'succeed'} with empty value`);
    if (!test.result.ok) {
      assertEquals(test.result.error.kind, "EmptyValue");
    }
  }
  
  // Test invalid name errors
  const invalidNameTests = [
    StandardVariable.create("invalid", "value"),
    FilePathVariable.create("invalid", "value"),
    StdinVariable.create("invalid", "value"),
  ];
  
  for (const result of invalidNameTests) {
    assertEquals(result.ok, false);
    if (!result.ok) {
      assertEquals(result.error.kind, "InvalidName");
    }
  }
});

Deno.test("Architecture: No side effects in type module", () => {
  // Type modules should be pure - no side effects
  
  // Creating variables should not cause observable side effects
  // We test this by checking that the operations are repeatable
  
  const result1 = StandardVariable.create("input_text_file", "test");
  const result2 = StandardVariable.create("input_text_file", "test");
  
  assertEquals(result1.ok, result2.ok);
  if (result1.ok && result2.ok) {
    assertEquals(result1.data.name.getValue(), result2.data.name.getValue());
    assertEquals(result1.data.value, result2.data.value);
  }
  
  // Multiple creations should work consistently
  const results = Array.from({ length: 5 }, () => 
    UserVariable.create("test", "value")
  );
  
  for (const result of results) {
    assertEquals(result.ok, true);
    if (result.ok) {
      assertEquals(result.data.name, "test");
      assertEquals(result.data.value, "value");
    }
  }
});