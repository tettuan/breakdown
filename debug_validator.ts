import { ParamsParser } from "@tettuan/breakdownparams";
import { CommandOptionsValidator } from "./lib/cli/validators/command_options_validator.ts";
import { isStdinAvailable } from "./lib/io/stdin.ts";

const parser = new ParamsParser();
const result = parser.parse([
  "find",
  "bugs",
  "--from",
  "test_input.txt",
  "--destination",
  "output.md",
]);
console.log("ParamsParser result:", JSON.stringify(result, null, 2));

const validator = new CommandOptionsValidator();
const validationInput = {
  ...result,
  options: result.options || {},
  stdinAvailable: isStdinAvailable(),
};
console.log("Validation input:", JSON.stringify(validationInput, null, 2));

const validationResult = validator.validate(validationInput);
console.log("Validation result:", JSON.stringify(validationResult, null, 2));
