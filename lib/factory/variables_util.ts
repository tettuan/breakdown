/**
 * Sets the input_text property on a variables object.
 * @param variables - The variables object to set input_text on
 * @param inputText - The value to set as input_text
 * @returns The updated variables object
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
