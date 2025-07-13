/**
 * Tests for PromptVariables types following Totality Principle
 * Updated to use Duck Typing instead of Discriminated Union
 *
 * @module
 */

import { assertEquals, assertExists } from "../../deps.ts";
import { describe, it } from "@std/testing/bdd";
import {
  createPromptParams,
  FilePathVariable,
  type PromptVariables,
  StandardVariable,
  StandardVariableName,
  StdinVariable,
  toPromptParamsVariables,
  UserVariable,
} from "./prompt_variables.ts";

describe("PromptVariables - Unit Tests", () => {
  describe("StandardVariableName", () => {
    it("should create valid names", () => {
      const inputTextFile = StandardVariableName.create("input_text_file");
      assertExists(inputTextFile);
      if (inputTextFile.ok) {
        assertEquals(inputTextFile.data.value, "input_text_file");
      }

      const destinationPath = StandardVariableName.create("destination_path");
      assertExists(destinationPath);
      if (destinationPath.ok) {
        assertEquals(destinationPath.data.value, "destination_path");
      }
    });

    it("should reject invalid names", () => {
      const invalid = StandardVariableName.create("invalid_name");
      assertEquals(invalid.ok, false);
    });
  });

  describe("StandardVariable", () => {
    it("should handle creation and conversion", () => {
      const variable = StandardVariable.create("input_text_file", "/path/to/file.txt");
      assertExists(variable);

      if (variable.ok) {
        const record = variable.data.toRecord();
        assertEquals(record, { "input_text_file": "/path/to/file.txt" });
      }
    });
  });

  describe("toPromptParamsVariables", () => {
    it("should handle Duck Typing integration", () => {
      const standardVar = StandardVariable.create("input_text_file", "/path/to/input.txt");
      const filePathVar = FilePathVariable.create("schema_file", "/path/to/schema.json");
      const stdinVar = StdinVariable.create("input_text", "Hello world");
      const userVar = UserVariable.create("custom_option", "custom_value");

      if (!standardVar.ok || !filePathVar.ok || !stdinVar.ok || !userVar.ok) {
        throw new Error("Variable creation failed");
      }
      assertExists(stdinVar);
      assertExists(userVar);

      // Use the actual data from successful Results
      const variables: PromptVariables = [
        standardVar.data,
        filePathVar.data,
        stdinVar.data,
        userVar.data,
      ];

      const result = toPromptParamsVariables(variables);

      assertEquals(result, {
        "input_text_file": "/path/to/input.txt",
        "schema_file": "/path/to/schema.json",
        "input_text": "Hello world",
        "custom_option": "custom_value",
      });
    });
  });

  describe("StdinVariable", () => {
    it("should validate empty values", () => {
      // Test empty string
      const emptyResult = StdinVariable.create("input_text", "");
      assertEquals(emptyResult.ok, false);
      if (!emptyResult.ok) {
        assertEquals(emptyResult.error.kind, "EmptyValue");
      }

      // Test whitespace only
      const whitespaceResult = StdinVariable.create("input_text", "   ");
      assertEquals(whitespaceResult.ok, false);
      if (!whitespaceResult.ok) {
        assertEquals(whitespaceResult.error.kind, "EmptyValue");
      }

      // Test valid value
      const validResult = StdinVariable.create("input_text", "Valid input");
      assertEquals(validResult.ok, true);
    });
  });

  describe("createPromptParams", () => {
    it("should provide simplified interface", () => {
      const standardVar = StandardVariable.create("input_text_file", "/path/to/input.txt");
      const stdinVar = StdinVariable.create("input_text", "Sample input");

      if (!standardVar.ok || !stdinVar.ok) {
        throw new Error("Variable creation failed");
      }

      const variables: PromptVariables = [
        standardVar.data,
        stdinVar.data,
      ];

      const promptParams = createPromptParams("/path/to/template.md", variables);

      assertEquals(promptParams, {
        template_file: "/path/to/template.md",
        variables: {
          "input_text_file": "/path/to/input.txt",
          "input_text": "Sample input",
        },
      });
    });
  });
});
