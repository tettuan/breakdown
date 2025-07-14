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
  PromptVariablesVO,
  StandardVariable,
  StdinVariable,
  toPromptParamsVariables,
  UserVariable,
} from "./prompt_variables_vo.ts";

describe("PromptVariables - Unit Tests", () => {
  describe("StandardVariable", () => {
    it("should create valid variables", () => {
      const inputTextFile = StandardVariable.create("input_text_file", "/path/to/file");
      assertExists(inputTextFile);
      if (inputTextFile.ok) {
        assertEquals(inputTextFile.data.toRecord(), {
          "input_text_file": "/path/to/file"
        });
      }

      const destinationPath = StandardVariable.create("destination_path", "/path/to/dest");
      assertExists(destinationPath);
      if (destinationPath.ok) {
        assertEquals(destinationPath.data.toRecord(), {
          "destination_path": "/path/to/dest"
        });
      }
    });

    it("should reject invalid variables", () => {
      const invalid = StandardVariable.create("", "");
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

      // Use the actual data from successful Results - create PromptVariablesVO properly
      const variableArray = [
        standardVar.data,
        filePathVar.data,
        stdinVar.data,
        userVar.data,
      ];

      const variables: PromptVariables = PromptVariablesVO.create(variableArray);
      const result = variables.toRecord();

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

      const variableArray = [
        standardVar.data,
        stdinVar.data,
      ];

      const variables: PromptVariables = PromptVariablesVO.create(variableArray);
      const promptParams = createPromptParams(variableArray);

      assertEquals(promptParams.toRecord(), {
        "input_text_file": "/path/to/input.txt",
        "input_text": "Sample input",
      });
    });
  });
});
