/**
 * Behavior tests for ZeroParamsHandler
 *
 * Tests functional behavior and business logic:
 * - Option-based command routing
 * - Help display behavior
 * - Version display behavior
 * - Usage display behavior
 * - Option precedence behavior
 * - Edge case handling
 *
 * @module cli/handlers/zero_params_handler_behavior_test
 */

import { assertEquals, assertExists as _assertExists } from "../../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { handleZeroParams } from "./zero_params_handler.ts";

const logger = new BreakdownLogger("zero-params-handler-behavior");

describe("Behavior: Option-Based Command Routing", () => {
  it("should route to help when help option is present", () => {
    logger.debug("Testing help option routing");

    let helpCalled = false;
    let versionCalled = false;
    let usageCalled = false;

    // Mock console to capture output
    const originalLog = console.log;
    console.log = (msg: string) => {
      if (msg.includes("Usage:") || msg.includes("Commands:")) {
        helpCalled = true;
      } else if (msg.includes("Breakdown v")) {
        versionCalled = true;
      } else if (msg.includes("No parameters provided")) {
        usageCalled = true;
      }
    };

    try {
      const helpOptions = [
        { help: true },
        { help: true, version: true }, // help should take precedence
        { help: "any truthy value" },
        { help: 1 },
      ];

      for (const options of helpOptions) {
        helpCalled = false;
        versionCalled = false;
        usageCalled = false;

        handleZeroParams([], {}, options);

        assertEquals(
          helpCalled,
          true,
          `Should route to help for options: ${JSON.stringify(options)}`,
        );
        assertEquals(
          versionCalled,
          false,
          `Should not route to version when help is present: ${JSON.stringify(options)}`,
        );
        assertEquals(
          usageCalled,
          false,
          `Should not route to usage when help is present: ${JSON.stringify(options)}`,
        );
      }
    } finally {
      console.log = originalLog;
    }

    logger.debug("Help option routing completed");
  });

  it("should route to version when version option is present (without help)", () => {
    logger.debug("Testing version option routing");

    let helpCalled = false;
    let versionCalled = false;
    let usageCalled = false;

    const originalLog = console.log;
    console.log = (msg: string) => {
      if (msg.includes("Usage:") || msg.includes("Commands:")) {
        helpCalled = true;
      } else if (msg.includes("Breakdown v")) {
        versionCalled = true;
      } else if (msg.includes("No parameters provided")) {
        usageCalled = true;
      }
    };

    try {
      const versionOptions = [
        { version: true },
        { version: "any truthy value" },
        { version: 1 },
        { version: true, other_option: false },
      ];

      for (const options of versionOptions) {
        helpCalled = false;
        versionCalled = false;
        usageCalled = false;

        handleZeroParams([], {}, options);

        assertEquals(
          versionCalled,
          true,
          `Should route to version for options: ${JSON.stringify(options)}`,
        );
        assertEquals(
          helpCalled,
          false,
          `Should not route to help when only version is present: ${JSON.stringify(options)}`,
        );
        assertEquals(
          usageCalled,
          false,
          `Should not route to usage when version is present: ${JSON.stringify(options)}`,
        );
      }
    } finally {
      console.log = originalLog;
    }

    logger.debug("Version option routing completed");
  });

  it("should route to usage when no recognized options are present", () => {
    logger.debug("Testing usage fallback routing");

    let helpCalled = false;
    let versionCalled = false;
    let usageCalled = false;

    const originalLog = console.log;
    console.log = (msg: string) => {
      if (msg.includes("Usage:") || msg.includes("Commands:")) {
        helpCalled = true;
      } else if (msg.includes("Breakdown v")) {
        versionCalled = true;
      } else if (msg.includes("No parameters provided")) {
        usageCalled = true;
      }
    };

    try {
      const usageOptions = [
        {},
        { other_option: true },
        { help: false, version: false },
        { unknown: "value" },
        null,
        undefined,
      ];

      for (const options of usageOptions) {
        helpCalled = false;
        versionCalled = false;
        usageCalled = false;

        handleZeroParams([], {}, options);

        assertEquals(
          usageCalled,
          true,
          `Should route to usage for options: ${JSON.stringify(options)}`,
        );
        assertEquals(
          helpCalled,
          false,
          `Should not route to help for fallback case: ${JSON.stringify(options)}`,
        );
        assertEquals(
          versionCalled,
          false,
          `Should not route to version for fallback case: ${JSON.stringify(options)}`,
        );
      }
    } finally {
      console.log = originalLog;
    }

    logger.debug("Usage fallback routing completed");
  });
});

describe("Behavior: Option Precedence", () => {
  it("should prioritize help over version", () => {
    logger.debug("Testing help over version precedence");

    let helpCalled = false;
    let versionCalled = false;

    const originalLog = console.log;
    console.log = (msg: string) => {
      if (msg.includes("Usage:") || msg.includes("Commands:")) {
        helpCalled = true;
      } else if (msg.includes("Breakdown v")) {
        versionCalled = true;
      }
    };

    try {
      const conflictingOptions = [
        { help: true, version: true },
        { help: 1, version: 1 },
        { help: "yes", version: "yes" },
      ];

      for (const options of conflictingOptions) {
        helpCalled = false;
        versionCalled = false;

        handleZeroParams([], {}, options);

        assertEquals(
          helpCalled,
          true,
          `Help should take precedence for: ${JSON.stringify(options)}`,
        );
        assertEquals(
          versionCalled,
          false,
          `Version should not be called when help is present: ${JSON.stringify(options)}`,
        );
      }
    } finally {
      console.log = originalLog;
    }

    logger.debug("Help over version precedence completed");
  });

  it("should handle falsy values correctly", () => {
    logger.debug("Testing falsy value handling");

    let helpCalled = false;
    let versionCalled = false;
    let usageCalled = false;

    const originalLog = console.log;
    console.log = (msg: string) => {
      if (msg.includes("Usage:") || msg.includes("Commands:")) {
        helpCalled = true;
      } else if (msg.includes("Breakdown v")) {
        versionCalled = true;
      } else if (msg.includes("No parameters provided")) {
        usageCalled = true;
      }
    };

    try {
      const falsyOptions = [
        { help: false, version: false },
        { help: 0, version: 0 },
        { help: "", version: "" },
        { help: null, version: null },
        { help: undefined, version: undefined },
      ];

      for (const options of falsyOptions) {
        helpCalled = false;
        versionCalled = false;
        usageCalled = false;

        handleZeroParams([], {}, options);

        assertEquals(
          usageCalled,
          true,
          `Should route to usage for falsy options: ${JSON.stringify(options)}`,
        );
        assertEquals(
          helpCalled,
          false,
          `Should not route to help for falsy values: ${JSON.stringify(options)}`,
        );
        assertEquals(
          versionCalled,
          false,
          `Should not route to version for falsy values: ${JSON.stringify(options)}`,
        );
      }
    } finally {
      console.log = originalLog;
    }

    logger.debug("Falsy value handling completed");
  });
});

describe("Behavior: Edge Case Handling", () => {
  it("should handle null and undefined options gracefully", () => {
    logger.debug("Testing null/undefined options handling");

    let usageCalled = false;
    const originalLog = console.log;
    console.log = (msg: string) => {
      if (msg.includes("No parameters provided")) {
        usageCalled = true;
      }
    };

    try {
      const nullishOptions = [null, undefined];

      for (const options of nullishOptions) {
        usageCalled = false;

        // Should not throw error
        handleZeroParams([], {}, options);

        assertEquals(
          usageCalled,
          true,
          `Should handle ${options} gracefully and show usage`,
        );
      }
    } finally {
      console.log = originalLog;
    }

    logger.debug("Null/undefined options handling completed");
  });

  it("should handle non-object options gracefully", () => {
    logger.debug("Testing non-object options handling");

    let usageCalled = false;
    const originalLog = console.log;
    console.log = (msg: string) => {
      if (msg.includes("No parameters provided")) {
        usageCalled = true;
      }
    };

    try {
      const nonObjectOptions = [
        "string",
        123,
        true,
        [],
        new Date(),
      ];

      for (const options of nonObjectOptions) {
        usageCalled = false;

        // Should not throw error
        handleZeroParams([], {}, options as unknown as Record<string, unknown>);

        assertEquals(
          usageCalled,
          true,
          `Should handle non-object options gracefully: ${typeof options}`,
        );
      }
    } finally {
      console.log = originalLog;
    }

    logger.debug("Non-object options handling completed");
  });

  it("should handle options with unexpected properties", () => {
    logger.debug("Testing unexpected properties handling");

    let routingResults: string[] = [];
    const originalLog = console.log;
    console.log = (msg: string) => {
      if (msg.includes("Usage:") || msg.includes("Commands:")) {
        routingResults.push("help");
      } else if (msg.includes("Breakdown v")) {
        routingResults.push("version");
      } else if (msg.includes("No parameters provided")) {
        routingResults.push("usage");
      }
    };

    try {
      const unexpectedOptions = [
        { help: true, unexpected: "value", random: 123 },
        { version: true, weird: {}, deep: { nested: { object: true } } },
        { other: "value", help: false, version: false },
      ];

      const expectedResults = ["help", "version", "usage"];

      for (let i = 0; i < unexpectedOptions.length; i++) {
        routingResults = [];

        handleZeroParams([], {}, unexpectedOptions[i]);

        assertEquals(
          routingResults[0],
          expectedResults[i],
          `Should route correctly despite unexpected properties: ${
            JSON.stringify(unexpectedOptions[i])
          }`,
        );
      }
    } finally {
      console.log = originalLog;
    }

    logger.debug("Unexpected properties handling completed");
  });
});

describe("Behavior: Parameter Compatibility", () => {
  it("should ignore unused args parameter", () => {
    logger.debug("Testing args parameter compatibility");

    let usageCalled = false;
    const originalLog = console.log;
    console.log = (msg: string) => {
      if (msg.includes("No parameters provided")) {
        usageCalled = true;
      }
    };

    try {
      const variousArgs = [
        [],
        ["some", "arguments"],
        ["--help", "--version"],
        null,
        undefined,
      ];

      for (const args of variousArgs) {
        usageCalled = false;

        // Args should not affect behavior
        handleZeroParams(args as unknown as string[], {}, {});

        assertEquals(
          usageCalled,
          true,
          `Should ignore args parameter: ${JSON.stringify(args)}`,
        );
      }
    } finally {
      console.log = originalLog;
    }

    logger.debug("Args parameter compatibility completed");
  });

  it("should ignore unused config parameter", () => {
    logger.debug("Testing config parameter compatibility");

    let usageCalled = false;
    const originalLog = console.log;
    console.log = (msg: string) => {
      if (msg.includes("No parameters provided")) {
        usageCalled = true;
      }
    };

    try {
      const variousConfigs = [
        {},
        { app_config: { setting: "value" } },
        { complex: { nested: { config: true } } },
        null,
        undefined,
      ];

      for (const config of variousConfigs) {
        usageCalled = false;

        // Config should not affect behavior
        handleZeroParams([], config as unknown as Record<string, unknown>, {});

        assertEquals(
          usageCalled,
          true,
          `Should ignore config parameter: ${JSON.stringify(config)}`,
        );
      }
    } finally {
      console.log = originalLog;
    }

    logger.debug("Config parameter compatibility completed");
  });
});

describe("Behavior: Consistency and Reliability", () => {
  it("should produce consistent output for same inputs", () => {
    logger.debug("Testing output consistency");

    const testCases = [
      { options: { help: true }, expectedType: "help" },
      { options: { version: true }, expectedType: "version" },
      { options: {}, expectedType: "usage" },
    ];

    const originalLog = console.log;

    for (const testCase of testCases) {
      const firstOutput: string[] = [];
      const secondOutput: string[] = [];

      // First call
      console.log = (msg: string) => {
        firstOutput.push(msg);
      };
      handleZeroParams([], {}, testCase.options);

      // Second call
      console.log = (msg: string) => {
        secondOutput.push(msg);
      };
      handleZeroParams([], {}, testCase.options);

      // Should produce identical output
      assertEquals(
        firstOutput.length,
        secondOutput.length,
        `Should produce same number of lines for ${testCase.expectedType}`,
      );

      for (let i = 0; i < firstOutput.length; i++) {
        assertEquals(
          firstOutput[i],
          secondOutput[i],
          `Line ${i} should be identical for ${testCase.expectedType}`,
        );
      }
    }

    console.log = originalLog;

    logger.debug("Output consistency completed");
  });

  it("should be side-effect free except for console output", () => {
    logger.debug("Testing side-effect isolation");

    const originalOptions = { help: true, other: "value" };
    const originalConfig = { setting: "test" };
    const originalArgs = ["arg1", "arg2"];

    // Create copies to verify no modification
    const optionsCopy = JSON.parse(JSON.stringify(originalOptions));
    const configCopy = JSON.parse(JSON.stringify(originalConfig));
    const argsCopy = [...originalArgs];

    const originalLog = console.log;
    console.log = () => {}; // Suppress output

    try {
      handleZeroParams(originalArgs, originalConfig, originalOptions);

      // Should not modify input parameters
      assertEquals(
        JSON.stringify(originalOptions),
        JSON.stringify(optionsCopy),
        "Should not modify options parameter",
      );
      assertEquals(
        JSON.stringify(originalConfig),
        JSON.stringify(configCopy),
        "Should not modify config parameter",
      );
      assertEquals(
        JSON.stringify(originalArgs),
        JSON.stringify(argsCopy),
        "Should not modify args parameter",
      );
    } finally {
      console.log = originalLog;
    }

    logger.debug("Side-effect isolation completed");
  });

  it("should handle rapid successive calls correctly", () => {
    logger.debug("Testing rapid successive calls");

    const callResults: string[] = [];
    const originalLog = console.log;
    console.log = (msg: string) => {
      if (msg.includes("No parameters provided")) {
        callResults.push("usage");
      } else if (msg.includes("Breakdown v")) {
        callResults.push("version");
      } else if (msg.includes("Usage:")) {
        callResults.push("help");
      }
    };

    try {
      const rapidCalls = [
        { options: { help: true }, expected: "help" },
        { options: { version: true }, expected: "version" },
        { options: {}, expected: "usage" },
        { options: { help: true }, expected: "help" },
        { options: {}, expected: "usage" },
      ];

      for (let i = 0; i < rapidCalls.length; i++) {
        handleZeroParams([], {}, rapidCalls[i].options);

        assertEquals(
          callResults[i],
          rapidCalls[i].expected,
          `Rapid call ${i} should produce correct result`,
        );
      }
    } finally {
      console.log = originalLog;
    }

    logger.debug("Rapid successive calls completed");
  });
});
