/**
 * Behavior tests for Help Module
 *
 * Tests functional behavior and business logic:
 * - Help text content and formatting
 * - Version display behavior
 * - Usage information display
 * - Output formatting consistency
 * - User interaction scenarios
 *
 * @module cli/help_behavior_test
 */

import { assertEquals, assertExists as _assertExists } from "../deps.ts";
import { describe, it } from "@std/testing/bdd";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { _VERSION, APP_NAME, HELP_TEXT, showHelp, showUsage, showVersion } from "./help.ts";

const logger = new BreakdownLogger("help-behavior");

describe("Behavior: Help Text Content", () => {
  it("should display comprehensive command information", () => {
    logger.debug("Testing command information display");

    // Should include all essential commands
    assertEquals(
      HELP_TEXT.includes("init"),
      true,
      "Should include init command",
    );
    assertEquals(
      HELP_TEXT.includes("to <type> <layer>"),
      true,
      "Should include two-parameter command with placeholders",
    );

    // Should include command descriptions
    assertEquals(
      HELP_TEXT.includes("Initialize breakdown configuration"),
      true,
      "Should include init command description",
    );
    assertEquals(
      HELP_TEXT.includes("Process with two parameters"),
      true,
      "Should include two-parameter command description",
    );

    // Should have proper command section
    assertEquals(
      HELP_TEXT.includes("Commands:"),
      true,
      "Should have Commands section header",
    );

    logger.debug("Command information display completed");
  });

  it("should display comprehensive option information", () => {
    logger.debug("Testing option information display");

    // Should include all essential options
    assertEquals(
      HELP_TEXT.includes("--config/-c"),
      true,
      "Should include config option with short form",
    );
    assertEquals(
      HELP_TEXT.includes("--help/-h"),
      true,
      "Should include help option with short form",
    );
    assertEquals(
      HELP_TEXT.includes("--version/-v"),
      true,
      "Should include version option with short form",
    );

    // Should include option descriptions
    assertEquals(
      HELP_TEXT.includes("Use custom config prefix"),
      true,
      "Should include config option description",
    );
    assertEquals(
      HELP_TEXT.includes("Show this help message"),
      true,
      "Should include help option description",
    );
    assertEquals(
      HELP_TEXT.includes("Show version information"),
      true,
      "Should include version option description",
    );

    // Should have proper options section
    assertEquals(
      HELP_TEXT.includes("Options:"),
      true,
      "Should have Options section header",
    );

    logger.debug("Option information display completed");
  });

  it("should display practical usage examples", () => {
    logger.debug("Testing usage examples display");

    // Should include essential examples
    assertEquals(
      HELP_TEXT.includes("breakdown init"),
      true,
      "Should include init example",
    );
    assertEquals(
      HELP_TEXT.includes("breakdown to project --config=custom"),
      true,
      "Should include config usage example",
    );
    assertEquals(
      HELP_TEXT.includes("breakdown to issue < input.md"),
      true,
      "Should include stdin usage example",
    );

    // Should have proper examples section
    assertEquals(
      HELP_TEXT.includes("Examples:"),
      true,
      "Should have Examples section header",
    );

    // Examples should demonstrate key features
    assertEquals(
      HELP_TEXT.includes("<"),
      true,
      "Should show stdin redirection in examples",
    );
    assertEquals(
      HELP_TEXT.includes("--config"),
      true,
      "Should show config option usage in examples",
    );

    logger.debug("Usage examples display completed");
  });

  it("should have proper text structure and formatting", () => {
    logger.debug("Testing text structure and formatting");

    // Should start with usage line
    assertEquals(
      HELP_TEXT.startsWith("\nUsage: breakdown"),
      true,
      "Should start with usage information",
    );

    // Should have proper section ordering
    const commandsIndex = HELP_TEXT.indexOf("Commands:");
    const optionsIndex = HELP_TEXT.indexOf("Options:");
    const examplesIndex = HELP_TEXT.indexOf("Examples:");

    assertEquals(
      commandsIndex < optionsIndex,
      true,
      "Commands section should come before Options",
    );
    assertEquals(
      optionsIndex < examplesIndex,
      true,
      "Options section should come before Examples",
    );

    // Should have proper indentation
    assertEquals(
      HELP_TEXT.includes("  init"),
      true,
      "Commands should be indented",
    );
    assertEquals(
      HELP_TEXT.includes("  --config"),
      true,
      "Options should be indented",
    );
    assertEquals(
      HELP_TEXT.includes("  breakdown init"),
      true,
      "Examples should be indented",
    );

    logger.debug("Text structure and formatting completed");
  });
});

describe("Behavior: Version Display", () => {
  it("should display version information correctly", () => {
    logger.debug("Testing version information display");

    const capturedOutput: string[] = [];
    const originalLog = console.log;
    console.log = (msg: string) => {
      capturedOutput.push(msg);
    };

    try {
      showVersion();

      // Should output exactly 2 lines
      assertEquals(
        capturedOutput.length,
        2,
        "Should output exactly 2 lines for version",
      );

      // First line should be version
      assertEquals(
        capturedOutput[0].includes(`Breakdown v${_VERSION}`),
        true,
        "First line should include formatted version",
      );

      // Second line should be app name
      assertEquals(
        capturedOutput[1],
        APP_NAME,
        "Second line should be app name",
      );

      // Version should be valid format
      assertEquals(
        /^\d+\.\d+\.\d+/.test(_VERSION),
        true,
        "Version should follow semantic versioning format",
      );
    } finally {
      console.log = originalLog;
    }

    logger.debug("Version information display completed");
  });

  it("should be consistent with help text version reference", () => {
    logger.debug("Testing version consistency");

    // Version shown should match what's referenced in help
    assertEquals(
      typeof _VERSION,
      "string",
      "Version should be string",
    );
    assertEquals(
      _VERSION.length > 0,
      true,
      "Version should not be empty",
    );

    // App name should be consistent
    assertEquals(
      APP_NAME.includes("Breakdown"),
      true,
      "App name should include product name",
    );
    assertEquals(
      APP_NAME.length > 10,
      true,
      "App name should be descriptive",
    );

    logger.debug("Version consistency completed");
  });
});

describe("Behavior: Help Display", () => {
  it("should display complete help information", () => {
    logger.debug("Testing complete help information display");

    const capturedOutput: string[] = [];
    const originalLog = console.log;
    console.log = (msg: string) => {
      capturedOutput.push(msg);
    };

    try {
      showHelp();

      // Should output app name first
      assertEquals(
        capturedOutput[0],
        APP_NAME,
        "Should start with app name",
      );

      // Should output help text
      assertEquals(
        capturedOutput[1],
        HELP_TEXT,
        "Should output complete help text",
      );

      // Should output exactly 2 items
      assertEquals(
        capturedOutput.length,
        2,
        "Should output exactly 2 items (app name + help text)",
      );
    } finally {
      console.log = originalLog;
    }

    logger.debug("Complete help information display completed");
  });

  it("should provide actionable information", () => {
    logger.debug("Testing actionable information");

    // Help should tell users how to perform common tasks
    assertEquals(
      HELP_TEXT.includes("breakdown init"),
      true,
      "Should show how to initialize",
    );
    assertEquals(
      HELP_TEXT.includes("breakdown to"),
      true,
      "Should show how to use main functionality",
    );

    // Help should explain option usage
    assertEquals(
      HELP_TEXT.includes("--config"),
      true,
      "Should explain config option",
    );
    assertEquals(
      HELP_TEXT.includes("<prefix>"),
      true,
      "Should show parameter placeholders",
    );

    // Help should show stdin usage
    assertEquals(
      HELP_TEXT.includes("< input.md"),
      true,
      "Should demonstrate stdin redirection",
    );

    logger.debug("Actionable information completed");
  });
});

describe("Behavior: Usage Display", () => {
  it("should display minimal usage guidance", () => {
    logger.debug("Testing minimal usage guidance");

    const capturedOutput: string[] = [];
    const originalLog = console.log;
    console.log = (msg: string) => {
      capturedOutput.push(msg);
    };

    try {
      showUsage();

      // Should output app name first
      assertEquals(
        capturedOutput[0],
        APP_NAME,
        "Should start with app name",
      );

      // Should output guidance message
      assertEquals(
        capturedOutput[1].includes("No parameters provided"),
        true,
        "Should indicate no parameters were provided",
      );
      assertEquals(
        capturedOutput[1].includes("--help"),
        true,
        "Should reference help option",
      );

      // Should output exactly 2 lines
      assertEquals(
        capturedOutput.length,
        2,
        "Should output exactly 2 lines",
      );
    } finally {
      console.log = originalLog;
    }

    logger.debug("Minimal usage guidance completed");
  });

  it("should guide users to detailed help", () => {
    logger.debug("Testing guidance to detailed help");

    const capturedOutput: string[] = [];
    const originalLog = console.log;
    console.log = (msg: string) => {
      capturedOutput.push(msg);
    };

    try {
      showUsage();
      const usageMessage = capturedOutput[1];

      // Should mention help option
      assertEquals(
        usageMessage.includes("--help"),
        true,
        "Should mention --help option",
      );
      assertEquals(
        usageMessage.includes("usage information"),
        true,
        "Should mention usage information",
      );

      // Should be helpful but brief
      assertEquals(
        usageMessage.length < 100,
        true,
        "Should be concise message",
      );
      assertEquals(
        usageMessage.length > 20,
        true,
        "Should be informative message",
      );
    } finally {
      console.log = originalLog;
    }

    logger.debug("Guidance to detailed help completed");
  });
});

describe("Behavior: Output Formatting Consistency", () => {
  it("should use consistent app name presentation", () => {
    logger.debug("Testing app name presentation consistency");

    const versionOutput: string[] = [];
    const helpOutput: string[] = [];
    const usageOutput: string[] = [];

    const originalLog = console.log;
    console.log = (msg: string) => {
      if (versionOutput.length < 2) versionOutput.push(msg);
      else if (helpOutput.length < 2) helpOutput.push(msg);
      else usageOutput.push(msg);
    };

    try {
      showVersion();
      showHelp();
      showUsage();

      // All should include app name
      assertEquals(
        versionOutput.some((line) => line.includes("Breakdown")),
        true,
        "Version output should include app name",
      );
      assertEquals(
        helpOutput.some((line) => line.includes("Breakdown")),
        true,
        "Help output should include app name",
      );
      assertEquals(
        usageOutput.some((line) => line.includes("Breakdown")),
        true,
        "Usage output should include app name",
      );

      // App name should be presented consistently
      const _appNameInVersion = versionOutput.find((line) => line.includes("Breakdown"));
      const appNameInHelp = helpOutput.find((line) => line === APP_NAME);
      const appNameInUsage = usageOutput.find((line) => line === APP_NAME);

      assertEquals(
        appNameInHelp,
        APP_NAME,
        "Help should show exact app name",
      );
      assertEquals(
        appNameInUsage,
        APP_NAME,
        "Usage should show exact app name",
      );
    } finally {
      console.log = originalLog;
    }

    logger.debug("App name presentation consistency completed");
  });

  it("should maintain appropriate line counts", () => {
    logger.debug("Testing output line counts");

    const functions = [
      { name: "showVersion", func: showVersion, expectedLines: 2 },
      { name: "showHelp", func: showHelp, expectedLines: 2 },
      { name: "showUsage", func: showUsage, expectedLines: 2 },
    ];

    for (const { name, func, expectedLines } of functions) {
      const outputLines: string[] = [];
      const originalLog = console.log;
      console.log = (msg: string) => {
        outputLines.push(msg);
      };

      try {
        func();
        assertEquals(
          outputLines.length,
          expectedLines,
          `${name} should output exactly ${expectedLines} lines`,
        );
      } finally {
        console.log = originalLog;
      }
    }

    logger.debug("Output line counts completed");
  });

  it("should handle repeated calls consistently", () => {
    logger.debug("Testing repeated call consistency");

    for (const func of [showVersion, showHelp, showUsage]) {
      let firstOutput: string[] = [];
      let secondOutput: string[] = [];

      const originalLog = console.log;

      // First call
      console.log = (msg: string) => {
        firstOutput.push(msg);
      };
      func();

      // Second call
      firstOutput = [];
      secondOutput = [];
      console.log = (msg: string) => {
        firstOutput.push(msg);
      };
      func();
      console.log = (msg: string) => {
        secondOutput.push(msg);
      };
      func();

      try {
        assertEquals(
          firstOutput.length,
          secondOutput.length,
          "Repeated calls should produce same number of lines",
        );

        for (let i = 0; i < firstOutput.length; i++) {
          assertEquals(
            firstOutput[i],
            secondOutput[i],
            `Line ${i} should be identical on repeated calls`,
          );
        }
      } finally {
        console.log = originalLog;
      }
    }

    logger.debug("Repeated call consistency completed");
  });
});

describe("Behavior: User Interaction Scenarios", () => {
  it("should provide appropriate response for new users", () => {
    logger.debug("Testing new user scenario");

    // New users likely see usage first, then help
    const usageOutput: string[] = [];
    const helpOutput: string[] = [];

    const originalLog = console.log;

    console.log = (msg: string) => {
      usageOutput.push(msg);
    };
    showUsage();

    console.log = (msg: string) => {
      helpOutput.push(msg);
    };
    showHelp();

    try {
      // Usage should guide to help
      assertEquals(
        usageOutput.some((line) => line.includes("--help")),
        true,
        "Usage should guide users to help option",
      );

      // Help should provide complete guidance
      assertEquals(
        helpOutput.some((line) => line.includes("Commands:")),
        true,
        "Help should list available commands",
      );
      assertEquals(
        helpOutput.some((line) => line.includes("Examples:")),
        true,
        "Help should provide usage examples",
      );
    } finally {
      console.log = originalLog;
    }

    logger.debug("New user scenario completed");
  });

  it("should provide appropriate response for version checking", () => {
    logger.debug("Testing version checking scenario");

    const versionOutput: string[] = [];
    const originalLog = console.log;
    console.log = (msg: string) => {
      versionOutput.push(msg);
    };

    try {
      showVersion();

      // Should provide both version number and app identification
      assertEquals(
        versionOutput.some((line) => /v\d+\.\d+\.\d+/.test(line)),
        true,
        "Should show version number in recognizable format",
      );
      assertEquals(
        versionOutput.some((line) => line.includes("Breakdown")),
        true,
        "Should identify the application",
      );

      // Should be concise for scripting
      assertEquals(
        versionOutput.length <= 3,
        true,
        "Version output should be concise",
      );
    } finally {
      console.log = originalLog;
    }

    logger.debug("Version checking scenario completed");
  });
});
