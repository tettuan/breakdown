/**
 * @fileoverview Variable manipulation utilities for Breakdown prompt processing.
 * 
 * This module provides utility functions for manipulating variable objects
 * used in prompt template processing. The utilities handle the common task
 * of adding or modifying variables while maintaining type safety and
 * immutability principles.
 * 
 * These utilities are particularly useful for preparing variables for
 * template engines and ensuring consistent variable structure across
 * the Breakdown prompt generation pipeline.
 * 
 * @module factory/variables_util
 */

/**
 * Sets the input_text property on a variables object with type safety.
 * 
 * This utility function creates a new variables object with the input_text
 * property added, preserving all existing properties while ensuring type
 * safety. The function follows immutability principles by returning a new
 * object rather than modifying the original.
 * 
 * This is commonly used when preparing variables for prompt templates that
 * require input text from stdin or file sources.
 * 
 * @param variables - The existing variables object to extend
 * @param inputText - The input text value to add as the input_text property
 * @returns A new variables object with input_text property added
 * 
 * @example Basic usage with empty variables
 * ```typescript
 * import { setInputTextVariable } from "@tettuan/breakdown/lib/factory/variables_util.ts";
 * 
 * const baseVars = {};
 * const withInput = setInputTextVariable(baseVars, "Hello, world!");
 * console.log(withInput.input_text); // "Hello, world!"
 * ```
 * 
 * @example Extending existing variables
 * ```typescript
 * const existingVars = {
 *   projectName: "my-app",
 *   version: "1.0.0"
 * };
 * 
 * const enhanced = setInputTextVariable(existingVars, "User requirements...");
 * // Result: {
 * //   projectName: "my-app",
 * //   version: "1.0.0",
 * //   input_text: "User requirements..."
 * // }
 * ```
 * 
 * @example Integration with prompt processing
 * ```typescript
 * // Common pattern in prompt variable preparation
 * const templateVars = {
 *   layer: "project",
 *   demonstrative: "to"
 * };
 * 
 * const stdinContent = await readStdin();
 * const finalVars = setInputTextVariable(templateVars, stdinContent);
 * 
 * // Now ready for template engine
 * const prompt = await templateEngine.render(template, finalVars);
 * ```
 * 
 * @example Type safety demonstration
 * ```typescript
 * interface CustomVars {
 *   userId: number;
 *   sessionId: string;
 * }
 * 
 * const customVars: CustomVars = {
 *   userId: 123,
 *   sessionId: "abc-def"
 * };
 * 
 * const result = setInputTextVariable(customVars, "Input content");
 * // result is typed as CustomVars & { input_text: string }
 * console.log(result.userId); // Type-safe access to original properties
 * console.log(result.input_text); // Type-safe access to new property
 * ```
 */
export function setInputTextVariable<T extends Record<string, unknown>>(
  variables: T,
  inputText: string,
): T & { input_text: string } {
  return {
    ...variables,
    input_text: inputText,
  };
}
