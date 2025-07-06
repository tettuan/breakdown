/**
 * @fileoverview Result Type Consistency Validation - Behavior Testing
 * 
 * Validates consistent Result type usage patterns across all domains,
 * ensuring behavioral consistency and proper error handling throughout
 * the system architecture.
 */

import { assertEquals, assertExists, assertInstanceOf } from "../../tests/deps.ts";
import type { Result } from "./result.ts";
import { ok, error, isOk, isError, map, chain } from "./result.ts";

/**
 * Test suite for factory pattern Result consistency
 */
Deno.test("Result Type - Factory Pattern Consistency", async (t) => {
  await t.step("should maintain consistent factory Result patterns", () => {
    // Simulate factory patterns used throughout the codebase
    type FactoryResult<T> = Result<T, {
      code: string;
      message: string;
      context?: Record<string, unknown>;
    }>;
    
    // Test DirectiveType factory pattern
    const createDirectiveType = (value: string): FactoryResult<string> => {
      const validTypes = ["to", "summary", "defect"];
      if (validTypes.includes(value)) {
        return ok(value);
      }
      return error({
        code: "INVALID_DIRECTIVE_TYPE",
        message: `Invalid directive type: ${value}`,
        context: { validTypes, provided: value }
      });
    };
    
    // Test LayerType factory pattern
    const createLayerType = (value: string): FactoryResult<string> => {
      const validLayers = ["project", "issue", "task"];
      if (validLayers.includes(value)) {
        return ok(value);
      }
      return error({
        code: "INVALID_LAYER_TYPE",
        message: `Invalid layer type: ${value}`,
        context: { validLayers, provided: value }
      });
    };
    
    // Test successful creation
    const validDirective = createDirectiveType("to");
    const validLayer = createLayerType("project");
    
    assertEquals(validDirective.ok, true);
    assertEquals(validLayer.ok, true);
    
    if (validDirective.ok) assertEquals(validDirective.data, "to");
    if (validLayer.ok) assertEquals(validLayer.data, "project");
    
    // Test error creation
    const invalidDirective = createDirectiveType("invalid");
    const invalidLayer = createLayerType("invalid");
    
    assertEquals(invalidDirective.ok, false);
    assertEquals(invalidLayer.ok, false);
    
    if (!invalidDirective.ok) {
      assertEquals(invalidDirective.error.code, "INVALID_DIRECTIVE_TYPE");
      assertExists(invalidDirective.error.context);
    }
    
    if (!invalidLayer.ok) {
      assertEquals(invalidLayer.error.code, "INVALID_LAYER_TYPE");
      assertExists(invalidLayer.error.context);
    }
  });

  await t.step("should maintain consistent path resolver Result patterns", () => {
    // Simulate path resolver patterns from factory components
    type PathResult = Result<string, {
      type: "PATH_ERROR";
      reason: "NOT_FOUND" | "INVALID_FORMAT" | "ACCESS_DENIED";
      path: string;
    }>;
    
    const resolvePath = (input: string, exists: boolean = true): PathResult => {
      if (!input || input.trim().length === 0) {
        return error({
          type: "PATH_ERROR",
          reason: "INVALID_FORMAT",
          path: input
        });
      }
      
      if (!exists) {
        return error({
          type: "PATH_ERROR",
          reason: "NOT_FOUND",
          path: input
        });
      }
      
      return ok(`/resolved/${input}`);
    };
    
    // Test successful resolution
    const validPath = resolvePath("valid/path");
    assertEquals(validPath.ok, true);
    if (validPath.ok) assertEquals(validPath.data, "/resolved/valid/path");
    
    // Test format error
    const invalidFormat = resolvePath("");
    assertEquals(invalidFormat.ok, false);
    if (!invalidFormat.ok) {
      assertEquals(invalidFormat.error.type, "PATH_ERROR");
      assertEquals(invalidFormat.error.reason, "INVALID_FORMAT");
    }
    
    // Test not found error
    const notFound = resolvePath("missing", false);
    assertEquals(notFound.ok, false);
    if (!notFound.ok) {
      assertEquals(notFound.error.type, "PATH_ERROR");
      assertEquals(notFound.error.reason, "NOT_FOUND");
    }
  });

  await t.step("should maintain consistent validation Result patterns", () => {
    // Simulate validation patterns from validator components
    type ValidationResult<T> = Result<T, {
      type: "VALIDATION_ERROR";
      field: string;
      rule: string;
      message: string;
      value: unknown;
    }>;
    
    const validateEmail = (email: string): ValidationResult<string> => {
      if (!email) {
        return error({
          type: "VALIDATION_ERROR",
          field: "email",
          rule: "required",
          message: "Email is required",
          value: email
        });
      }
      
      if (!email.includes("@")) {
        return error({
          type: "VALIDATION_ERROR",
          field: "email",
          rule: "format",
          message: "Email must contain @ symbol",
          value: email
        });
      }
      
      return ok(email.toLowerCase());
    };
    
    // Test successful validation
    const validEmail = validateEmail("test@example.com");
    assertEquals(validEmail.ok, true);
    if (validEmail.ok) assertEquals(validEmail.data, "test@example.com");
    
    // Test required error
    const missingEmail = validateEmail("");
    assertEquals(missingEmail.ok, false);
    if (!missingEmail.ok) {
      assertEquals(missingEmail.error.type, "VALIDATION_ERROR");
      assertEquals(missingEmail.error.field, "email");
      assertEquals(missingEmail.error.rule, "required");
    }
    
    // Test format error
    const invalidEmail = validateEmail("invalid-email");
    assertEquals(invalidEmail.ok, false);
    if (!invalidEmail.ok) {
      assertEquals(invalidEmail.error.type, "VALIDATION_ERROR");
      assertEquals(invalidEmail.error.field, "email");
      assertEquals(invalidEmail.error.rule, "format");
    }
  });
});

/**
 * Test suite for domain service Result consistency
 */
Deno.test("Result Type - Domain Service Consistency", async (t) => {
  await t.step("should maintain consistent prompt generation Result patterns", () => {
    // Simulate prompt generation service patterns
    interface PromptGenerationError {
      stage: "TEMPLATE_LOADING" | "VARIABLE_RESOLUTION" | "OUTPUT_GENERATION";
      message: string;
      details: Record<string, unknown>;
    }
    
    type PromptResult = Result<{
      content: string;
      variables: Record<string, string>;
      metadata: Record<string, unknown>;
    }, PromptGenerationError>;
    
    const generatePrompt = (
      template: string,
      variables: Record<string, string>,
      shouldFail?: string
    ): PromptResult => {
      if (shouldFail === "template") {
        return error({
          stage: "TEMPLATE_LOADING",
          message: "Template not found",
          details: { template, path: `/templates/${template}` }
        });
      }
      
      if (shouldFail === "variables") {
        return error({
          stage: "VARIABLE_RESOLUTION",
          message: "Missing required variables",
          details: { required: ["name", "type"], provided: Object.keys(variables) }
        });
      }
      
      if (shouldFail === "output") {
        return error({
          stage: "OUTPUT_GENERATION",
          message: "Output generation failed",
          details: { reason: "template_syntax_error" }
        });
      }
      
      return ok({
        content: `Generated prompt for ${template}`,
        variables,
        metadata: { timestamp: Date.now(), template }
      });
    };
    
    // Test successful generation
    const success = generatePrompt("test-template", { name: "test", type: "unit" });
    assertEquals(success.ok, true);
    if (success.ok) {
      assertExists(success.data.content);
      assertExists(success.data.variables);
      assertExists(success.data.metadata);
    }
    
    // Test different error stages
    const templateError = generatePrompt("missing", {}, "template");
    assertEquals(templateError.ok, false);
    if (!templateError.ok) {
      assertEquals(templateError.error.stage, "TEMPLATE_LOADING");
      assertExists(templateError.error.details.template);
    }
    
    const variableError = generatePrompt("test", {}, "variables");
    assertEquals(variableError.ok, false);
    if (!variableError.ok) {
      assertEquals(variableError.error.stage, "VARIABLE_RESOLUTION");
      assertExists(variableError.error.details.required);
    }
  });

  await t.step("should maintain consistent configuration Result patterns", () => {
    // Simulate configuration service patterns
    interface ConfigError {
      source: "FILE_SYSTEM" | "PARSING" | "VALIDATION";
      message: string;
      path?: string;
      line?: number;
    }
    
    type ConfigResult<T> = Result<T, ConfigError>;
    
    const loadConfig = <T>(
      path: string,
      defaultValue: T,
      shouldFail?: string
    ): ConfigResult<T> => {
      if (shouldFail === "filesystem") {
        return error({
          source: "FILE_SYSTEM",
          message: "Configuration file not found",
          path
        });
      }
      
      if (shouldFail === "parsing") {
        return error({
          source: "PARSING",
          message: "Invalid YAML syntax",
          path,
          line: 42
        });
      }
      
      if (shouldFail === "validation") {
        return error({
          source: "VALIDATION",
          message: "Configuration validation failed",
          path
        });
      }
      
      return ok(defaultValue);
    };
    
    // Test successful loading
    const config = { app: "test", version: "1.0.0" };
    const success = loadConfig("app.yml", config);
    assertEquals(success.ok, true);
    if (success.ok) assertEquals(success.data, config);
    
    // Test different error sources
    const fsError = loadConfig("missing.yml", {}, "filesystem");
    assertEquals(fsError.ok, false);
    if (!fsError.ok) {
      assertEquals(fsError.error.source, "FILE_SYSTEM");
      assertEquals(fsError.error.path, "missing.yml");
    }
    
    const parseError = loadConfig("invalid.yml", {}, "parsing");
    assertEquals(parseError.ok, false);
    if (!parseError.ok) {
      assertEquals(parseError.error.source, "PARSING");
      assertEquals(parseError.error.line, 42);
    }
  });
});

/**
 * Test suite for error chaining and composition consistency
 */
Deno.test("Result Type - Error Chaining Consistency", async (t) => {
  await t.step("should maintain consistent error chaining patterns", () => {
    // Simulate complex operation chaining used throughout the system
    type ProcessingError = {
      stage: string;
      operation: string;
      message: string;
      cause?: ProcessingError;
    };
    
    type ProcessingResult<T> = Result<T, ProcessingError>;
    
    const step1 = (input: string): ProcessingResult<number> => {
      if (!input) {
        return error({
          stage: "INPUT_VALIDATION",
          operation: "parse_input",
          message: "Input cannot be empty"
        });
      }
      
      const num = parseInt(input);
      if (isNaN(num)) {
        return error({
          stage: "INPUT_VALIDATION",
          operation: "parse_number",
          message: `Cannot parse "${input}" as number`
        });
      }
      
      return ok(num);
    };
    
    const step2 = (num: number): ProcessingResult<string> => {
      if (num < 0) {
        return error({
          stage: "BUSINESS_LOGIC",
          operation: "validate_positive",
          message: "Number must be positive"
        });
      }
      
      return ok(`processed_${num}`);
    };
    
    const step3 = (str: string): ProcessingResult<{ result: string; metadata: Record<string, unknown> }> => {
      if (str.length > 50) {
        return error({
          stage: "OUTPUT_FORMATTING",
          operation: "format_result",
          message: "Result string too long"
        });
      }
      
      return ok({
        result: str,
        metadata: { timestamp: Date.now(), length: str.length }
      });
    };
    
    // Test successful chain
    const processInput = (input: string) => 
      chain(
        chain(step1(input), step2),
        step3
      );
    
    const success = processInput("42");
    assertEquals(success.ok, true);
    if (success.ok) {
      assertEquals(success.data.result, "processed_42");
      assertExists(success.data.metadata);
    }
    
    // Test error in different stages
    const inputError = processInput("");
    assertEquals(inputError.ok, false);
    if (!inputError.ok) {
      assertEquals(inputError.error.stage, "INPUT_VALIDATION");
      assertEquals(inputError.error.operation, "parse_input");
    }
    
    const parseError = processInput("invalid");
    assertEquals(parseError.ok, false);
    if (!parseError.ok) {
      assertEquals(parseError.error.stage, "INPUT_VALIDATION");
      assertEquals(parseError.error.operation, "parse_number");
    }
    
    const businessError = processInput("-5");
    assertEquals(businessError.ok, false);
    if (!businessError.ok) {
      assertEquals(businessError.error.stage, "BUSINESS_LOGIC");
      assertEquals(businessError.error.operation, "validate_positive");
    }
  });

  await t.step("should maintain consistent error context preservation", () => {
    // Test error context preservation through chains
    interface ContextualError {
      type: string;
      message: string;
      context: Record<string, unknown>;
      trace: string[];
    }
    
    type ContextualResult<T> = Result<T, ContextualError>;
    
    const addContext = <T>(
      result: ContextualResult<T>,
      operation: string,
      context: Record<string, unknown>
    ): ContextualResult<T> => {
      if (result.ok) return result;
      
      return error({
        ...result.error,
        context: { ...result.error.context, ...context },
        trace: [...result.error.trace, operation]
      });
    };
    
    // Create base error
    const baseError: ContextualError = {
      type: "VALIDATION_ERROR",
      message: "Invalid input",
      context: { field: "email" },
      trace: ["validate_email"]
    };
    
    const baseResult: ContextualResult<string> = error(baseError);
    
    // Add context through chain
    const contextualResult = addContext(
      addContext(baseResult, "process_user_data", { userId: 123 }),
      "handle_request",
      { requestId: "req_456" }
    );
    
    assertEquals(contextualResult.ok, false);
    if (!contextualResult.ok) {
      assertEquals(contextualResult.error.type, "VALIDATION_ERROR");
      assertEquals(contextualResult.error.message, "Invalid input");
      
      // Check context accumulation
      assertEquals(contextualResult.error.context.field, "email");
      assertEquals(contextualResult.error.context.userId, 123);
      assertEquals(contextualResult.error.context.requestId, "req_456");
      
      // Check trace accumulation
      assertEquals(contextualResult.error.trace.length, 3);
      assertEquals(contextualResult.error.trace[0], "validate_email");
      assertEquals(contextualResult.error.trace[1], "process_user_data");
      assertEquals(contextualResult.error.trace[2], "handle_request");
    }
  });
});

/**
 * Test suite for Result type performance consistency
 */
Deno.test("Result Type - Performance Consistency", async (t) => {
  await t.step("should maintain consistent performance across domains", () => {
    // Test performance characteristics across different Result usage patterns
    const iterations = 10000;
    
    // Test factory patterns performance
    const factoryStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      const result = i % 2 === 0 
        ? ok({ id: i, name: `item_${i}` })
        : error({ code: "ERROR", message: `Error ${i}` });
      
      if (result.ok) {
        assertEquals(typeof result.data.id, "number");
      } else {
        assertEquals(typeof result.error.code, "string");
      }
    }
    const factoryDuration = performance.now() - factoryStart;
    
    // Test chaining patterns performance
    const chainStart = performance.now();
    for (let i = 0; i < iterations / 10; i++) {
      const result = chain(
        ok(i),
        x => ok(x * 2)
      );
      
      chain(result, x => ok(x.toString()));
    }
    const chainDuration = performance.now() - chainStart;
    
    // Test mapping patterns performance
    const mapStart = performance.now();
    for (let i = 0; i < iterations / 10; i++) {
      const result = ok(i);
      map(map(result, x => x * 2), x => x.toString());
    }
    const mapDuration = performance.now() - mapStart;
    
    // Performance should be reasonable
    assertEquals(factoryDuration < 200, true, `Factory patterns took ${factoryDuration}ms`);
    assertEquals(chainDuration < 100, true, `Chaining patterns took ${chainDuration}ms`);
    assertEquals(mapDuration < 100, true, `Mapping patterns took ${mapDuration}ms`);
  });
});