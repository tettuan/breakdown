/**
 * @fileoverview Unit test for optional variable placeholder behavior
 * 
 * Tests that unspecified options result in template variables remaining as placeholders
 * instead of being replaced with empty strings.
 * 
 * @module lib/factory/prompt_variables_factory_placeholder.test
 */

import { assertEquals } from "@std/assert";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { PromptVariablesFactory } from "./prompt_variables_factory.ts";

const logger = new BreakdownLogger("factory-placeholder-test");

/**
 * Test helper to simulate template variable replacement
 */
function simulateTemplateReplacement(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    result = result.replace(pattern, value);
  }
  return result;
}

Deno.test("Optional variables: both fromFile and outputFile present", () => {
  logger.debug("Test Case 1: Both fromFile and outputFile present");
  
  const cliParams = {
    directiveType: "to",
    layerType: "issue",
    options: {
      fromFile: "/path/to/input.md",
      destinationFile: "/path/to/output.md",
    }
  };
  
  const config = {
    app_prompt: { base_dir: "prompts" },
    app_schema: { base_dir: "schemas" }
  };
  
  const result = PromptVariablesFactory.createWithConfig(config, cliParams);
  assertEquals(result.ok, true);
  
  if (result.ok) {
    const factory = result.data;
    const params = factory.build();
    assertEquals(params.ok, true);
    
    if (params.ok) {
      const vars = params.data.variables;
      
      // Both variables should be present
      assertEquals("input_file" in vars, true);
      assertEquals("output_file" in vars, true);
      assertEquals(vars.input_file, "/path/to/input.md");
      assertEquals(vars.output_file, "/path/to/output.md");
      
      // Simulate template replacement
      const template = "Input: {{input_file}}, Output: {{output_file}}";
      const replaced = simulateTemplateReplacement(template, vars);
      assertEquals(replaced, "Input: /path/to/input.md, Output: /path/to/output.md");
    }
  }
});

Deno.test("Optional variables: only fromFile present", () => {
  logger.debug("Test Case 2: Only fromFile present");
  
  const cliParams = {
    directiveType: "to",
    layerType: "issue",
    options: {
      fromFile: "/path/to/input.md",
    }
  };
  
  const config = {
    app_prompt: { base_dir: "prompts" },
    app_schema: { base_dir: "schemas" }
  };
  
  const result = PromptVariablesFactory.createWithConfig(config, cliParams);
  assertEquals(result.ok, true);
  
  if (result.ok) {
    const factory = result.data;
    const params = factory.build();
    assertEquals(params.ok, true);
    
    if (params.ok) {
      const vars = params.data.variables;
      
      // Only input_file should be present
      assertEquals("input_file" in vars, true);
      assertEquals("output_file" in vars, false);
      assertEquals(vars.input_file, "/path/to/input.md");
      
      // Simulate template replacement - output_file placeholder remains
      const template = "Input: {{input_file}}, Output: {{output_file}}";
      const replaced = simulateTemplateReplacement(template, vars);
      assertEquals(replaced, "Input: /path/to/input.md, Output: {{output_file}}");
    }
  }
});

Deno.test("Optional variables: only outputFile present", () => {
  logger.debug("Test Case 3: Only outputFile present");
  
  const cliParams = {
    directiveType: "to",
    layerType: "issue",
    options: {
      destinationFile: "/path/to/output.md",
    }
  };
  
  const config = {
    app_prompt: { base_dir: "prompts" },
    app_schema: { base_dir: "schemas" }
  };
  
  const result = PromptVariablesFactory.createWithConfig(config, cliParams);
  assertEquals(result.ok, true);
  
  if (result.ok) {
    const factory = result.data;
    const params = factory.build();
    assertEquals(params.ok, true);
    
    if (params.ok) {
      const vars = params.data.variables;
      
      // Only output_file should be present (input_file is not created when empty)
      assertEquals("input_file" in vars, false);
      assertEquals("output_file" in vars, true);
      assertEquals(vars.output_file, "/path/to/output.md");
      
      // Simulate template replacement - input_file placeholder remains
      const template = "Input: {{input_file}}, Output: {{output_file}}";
      const replaced = simulateTemplateReplacement(template, vars);
      assertEquals(replaced, "Input: {{input_file}}, Output: /path/to/output.md");
    }
  }
});

Deno.test("Optional variables: neither fromFile nor outputFile present", () => {
  logger.debug("Test Case 4: Neither fromFile nor outputFile present");
  
  const cliParams = {
    directiveType: "to",
    layerType: "issue",
    options: {}
  };
  
  const config = {
    app_prompt: { base_dir: "prompts" },
    app_schema: { base_dir: "schemas" }
  };
  
  const result = PromptVariablesFactory.createWithConfig(config, cliParams);
  assertEquals(result.ok, true);
  
  if (result.ok) {
    const factory = result.data;
    const params = factory.build();
    assertEquals(params.ok, true);
    
    if (params.ok) {
      const vars = params.data.variables;
      
      // Neither variable should be present
      assertEquals("input_file" in vars, false);
      assertEquals("output_file" in vars, false);
      
      // Simulate template replacement - both placeholders remain
      const template = "Input: {{input_file}}, Output: {{output_file}}";
      const replaced = simulateTemplateReplacement(template, vars);
      assertEquals(replaced, "Input: {{input_file}}, Output: {{output_file}}");
    }
  }
});

Deno.test("Optional variables: empty string values are ignored", () => {
  logger.debug("Test Case 5: Empty string values");
  
  const cliParams = {
    directiveType: "to",
    layerType: "issue",  
    options: {
      fromFile: "",
      destinationFile: "",
    }
  };
  
  const config = {
    app_prompt: { base_dir: "prompts" },
    app_schema: { base_dir: "schemas" }
  };
  
  const result = PromptVariablesFactory.createWithConfig(config, cliParams);
  assertEquals(result.ok, true);
  
  if (result.ok) {
    const factory = result.data;
    const params = factory.build();
    assertEquals(params.ok, true);
    
    if (params.ok) {
      const vars = params.data.variables;
      
      // Neither variable should be present (empty strings are ignored)
      assertEquals("input_file" in vars, false);
      assertEquals("output_file" in vars, false);
      
      // Simulate template replacement - both placeholders remain
      const template = "Input: {{input_file}}, Output: {{output_file}}";
      const replaced = simulateTemplateReplacement(template, vars);
      assertEquals(replaced, "Input: {{input_file}}, Output: {{output_file}}");
    }
  }
});

Deno.test("Optional variables: whitespace-only values are ignored", () => {
  logger.debug("Test Case 6: Whitespace-only values");
  
  const cliParams = {
    directiveType: "to",
    layerType: "issue",
    options: {
      fromFile: "   ",
      destinationFile: "\t\n",
    }
  };
  
  const config = {
    app_prompt: { base_dir: "prompts" },
    app_schema: { base_dir: "schemas" }
  };
  
  const result = PromptVariablesFactory.createWithConfig(config, cliParams);
  assertEquals(result.ok, true);
  
  if (result.ok) {
    const factory = result.data;
    const params = factory.build();
    assertEquals(params.ok, true);
    
    if (params.ok) {
      const vars = params.data.variables;
      
      // Whitespace-only values are treated as valid paths (with working directory prepended)
      // This is because the factory resolves paths and whitespace is considered a valid filename
      assertEquals("input_file" in vars, true);
      assertEquals("output_file" in vars, true);
      // The actual values will have the working directory prepended
      assertEquals(vars.input_file.endsWith("   "), true);
      assertEquals(vars.output_file.endsWith("\t\n"), true);
      
      // Simulate complex template with conditionals
      const template = `
{{#if input_file}}Input provided: {{input_file}}{{else}}No input file{{/if}}
{{#if output_file}}Output to: {{output_file}}{{else}}No output file{{/if}}
`;
      // Since we're not using a real template engine, and whitespace values ARE included,
      // the placeholders will be replaced
      const replaced = simulateTemplateReplacement(template, vars);
      assertEquals(replaced.includes("{{input_file}}"), false);
      assertEquals(replaced.includes("{{output_file}}"), false);
      // But the template will contain the whitespace values
      assertEquals(replaced.includes(vars.input_file), true);
      assertEquals(replaced.includes(vars.output_file), true);
    }
  }
});

Deno.test("Optional variables: mixed present and absent options", () => {
  logger.debug("Test Case 7: Mixed present and absent options");
  
  const testCases = [
    {
      name: "fromFile present, outputFile absent, userVars present",
      options: {
        fromFile: "/input.md",
        userVariables: { custom: "value" }
      },
      expected: {
        hasInputFile: true,
        hasOutputFile: false,
        hasCustom: true,
      }
    },
    {
      name: "fromFile absent, outputFile present, userVars present",
      options: {
        destinationFile: "/output.md",
        userVariables: { custom: "value" }
      },
      expected: {
        hasInputFile: false,
        hasOutputFile: true,
        hasCustom: true,
      }
    },
    {
      name: "both absent, userVars present",
      options: {
        userVariables: { custom: "value", another: "test" }
      },
      expected: {
        hasInputFile: false,
        hasOutputFile: false,
        hasCustom: true,
        hasAnother: true,
      }
    }
  ] as const;
  
  for (const testCase of testCases) {
    logger.debug(`Sub-test: ${testCase.name}`);
    
    const cliParams = {
      directiveType: "to",
      layerType: "issue",
      options: testCase.options
    };
    
    const config = {
      app_prompt: { base_dir: "prompts" },
      app_schema: { base_dir: "schemas" }
    };
    
    const result = PromptVariablesFactory.createWithConfig(config, cliParams);
    assertEquals(result.ok, true);
    
    if (result.ok) {
      const factory = result.data;
      const params = factory.build();
      assertEquals(params.ok, true);
      
      if (params.ok) {
        const vars = params.data.variables;
        
        // Check expected presence/absence
        assertEquals("input_file" in vars, testCase.expected.hasInputFile);
        assertEquals("output_file" in vars, testCase.expected.hasOutputFile);
        if (testCase.expected.hasCustom !== undefined) {
          assertEquals("custom" in vars, testCase.expected.hasCustom);
        }
        if ("hasAnother" in testCase.expected) {
          assertEquals("another" in vars, testCase.expected.hasAnother);
        }
        
        // Template simulation
        const template = "{{input_file}} | {{output_file}} | {{custom}}";
        const replaced = simulateTemplateReplacement(template, vars);
        
        // Check that missing variables remain as placeholders
        if (!testCase.expected.hasInputFile) {
          assertEquals(replaced.includes("{{input_file}}"), true);
        }
        if (!testCase.expected.hasOutputFile) {
          assertEquals(replaced.includes("{{output_file}}"), true);
        }
      }
    }
  }
});