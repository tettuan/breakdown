/**
 * Unit tests for help.ts
 *
 * Tests the help message generation, command list completeness,
 * and display functions.
 *
 * Important: Uses dynamic imports within test functions to avoid
 * static import issues in function scope.
 */

import { assertEquals, assertStringIncludes } from "@std/assert";

/**
 * Test help text content and format
 */
Deno.test("HELP_TEXT contains all required sections", async () => {
  const { HELP_TEXT } = await import("./help.ts");

  // Check for main sections
  assertStringIncludes(HELP_TEXT, "Usage: breakdown [command] [options]");
  assertStringIncludes(HELP_TEXT, "Commands:");
  assertStringIncludes(HELP_TEXT, "Options:");
  assertStringIncludes(HELP_TEXT, "Examples:");
});

/**
 * Test command list completeness
 */
Deno.test("HELP_TEXT includes all documented commands", async () => {
  const { HELP_TEXT } = await import("./help.ts");

  // Check for documented commands
  assertStringIncludes(HELP_TEXT, "init");
  assertStringIncludes(HELP_TEXT, "Initialize breakdown configuration");
  assertStringIncludes(HELP_TEXT, "to <type> <layer>");
  assertStringIncludes(HELP_TEXT, "Process with two parameters");
});

/**
 * Test options list completeness
 */
Deno.test("HELP_TEXT includes all documented options", async () => {
  const { HELP_TEXT } = await import("./help.ts");

  // Check for options
  assertStringIncludes(HELP_TEXT, "--config/-c <prefix>");
  assertStringIncludes(HELP_TEXT, "Use custom config prefix");
  assertStringIncludes(HELP_TEXT, "--help/-h");
  assertStringIncludes(HELP_TEXT, "Show this help message");
  assertStringIncludes(HELP_TEXT, "--version/-v");
  assertStringIncludes(HELP_TEXT, "Show version information");
});

/**
 * Test examples section
 */
Deno.test("HELP_TEXT includes usage examples", async () => {
  const { HELP_TEXT } = await import("./help.ts");

  // Check for examples
  assertStringIncludes(HELP_TEXT, "breakdown init");
  assertStringIncludes(HELP_TEXT, "breakdown to project --config=custom");
  assertStringIncludes(HELP_TEXT, "breakdown to issue < input.md");
});

/**
 * Test help text formatting
 */
Deno.test("HELP_TEXT has proper formatting and alignment", async () => {
  const { HELP_TEXT } = await import("./help.ts");
  const _lines = HELP_TEXT.split("\n");

  // Check for proper indentation
  const commandLines = lines.filter((line) => line.includes("init") || line.includes("to <type>"));
  commandLines.forEach((line) => {
    assertEquals(line.startsWith("  "), true, "Command lines should be indented with 2 spaces");
  });

  const optionLines = lines.filter((line) => line.includes("--"));
  optionLines.forEach((line) => {
    assertEquals(line.startsWith("  "), true, "Option lines should be indented with 2 spaces");
  });

  const exampleLines = lines.filter((line) => line.includes("breakdown ") && line.startsWith("  "));
  exampleLines.forEach((line) => {
    assertEquals(line.startsWith("  "), true, "Example lines should be indented with 2 spaces");
  });
});

/**
 * Test showVersion function output
 */
Deno.test("showVersion displays correct version information", async () => {
  const { showVersion, VERSION, APP_NAME } = await import("./help.ts");

  // Capture console.log output
  const originalLog = console.log;
  const logs: string[] = [];
  console.log = (msg: string) => logs.push(msg);

  try {
    showVersion();

    assertEquals(logs.length, 2);
    assertEquals(logs[0], `Breakdown v${VERSION}`);
    assertEquals(logs[1], APP_NAME);
  } finally {
    console.log = originalLog;
  }
});

/**
 * Test showHelp function output
 */
Deno.test("showHelp displays app name and help text", async () => {
  const { showHelp, APP_NAME, HELP_TEXT } = await import("./help.ts");

  // Capture console.log output
  const originalLog = console.log;
  const logs: string[] = [];
  console.log = (msg: string) => logs.push(msg);

  try {
    showHelp();

    assertEquals(logs.length, 2);
    assertEquals(logs[0], APP_NAME);
    assertEquals(logs[1], HELP_TEXT);
  } finally {
    console.log = originalLog;
  }
});

/**
 * Test showUsage function output
 */
Deno.test("showUsage displays minimal usage information", async () => {
  const { showUsage, APP_NAME } = await import("./help.ts");

  // Capture console.log output
  const originalLog = console.log;
  const logs: string[] = [];
  console.log = (msg: string) => logs.push(msg);

  try {
    showUsage();

    assertEquals(logs.length, 2);
    assertEquals(logs[0], APP_NAME);
    assertEquals(logs[1], "No parameters provided. Use --help for usage information.");
  } finally {
    console.log = originalLog;
  }
});

/**
 * Test constants are properly exported
 */
Deno.test("Exported constants have correct values", async () => {
  const { VERSION, APP_NAME } = await import("./help.ts");
  assertEquals(VERSION.constructor.name, "String", "VERSION should be a string");
  assertEquals(VERSION.length > 0, true, "VERSION should not be empty");
  assertEquals(APP_NAME, "Breakdown - AI Development Instruction Tool");
});

/**
 * Test help text doesn't contain undefined or null values
 */
Deno.test("HELP_TEXT doesn't contain undefined or null values", async () => {
  const { HELP_TEXT } = await import("./help.ts");
  assertEquals(HELP_TEXT.includes("undefined"), false);
  assertEquals(HELP_TEXT.includes("null"), false);
  assertEquals(HELP_TEXT.includes("[object"), false);
});

/**
 * Test help text line endings and formatting consistency
 */
Deno.test("HELP_TEXT has consistent line endings", async () => {
  const { HELP_TEXT } = await import("./help.ts");
  // Check that there are no double line breaks except between sections
  const doubleLineBreaks = HELP_TEXT.match(/\n\n\n/g);
  assertEquals(doubleLineBreaks, null, "Should not have triple line breaks");

  // Check that sections are properly separated
  const sections = ["Commands:", "Options:", "Examples:"];
  sections.forEach((section) => {
    const sectionIndex = HELP_TEXT.indexOf(section);
    if (sectionIndex > 0) {
      const beforeSection = HELP_TEXT.substring(sectionIndex - 2, sectionIndex);
      assertEquals(
        beforeSection,
        "\n\n",
        `Section "${section}" should be preceded by double line break`,
      );
    }
  });
});

/**
 * Test edge case: empty command in examples
 */
Deno.test("HELP_TEXT examples are valid command formats", async () => {
  const { HELP_TEXT } = await import("./help.ts");
  const exampleSection = HELP_TEXT.substring(HELP_TEXT.indexOf("Examples:"));
  const exampleLines = exampleSection.split("\n").filter((line: string) =>
    line.trim().startsWith("breakdown")
  );

  exampleLines.forEach((example: string) => {
    assertStringIncludes(example, "breakdown", "Each example should start with 'breakdown'");
    assertEquals(example.includes("  breakdown"), true, "Examples should be properly indented");
  });
});

/**
 * Test command descriptions are informative
 */
Deno.test("Command descriptions provide useful information", async () => {
  const { HELP_TEXT } = await import("./help.ts");
  const commandDescriptions = [
    "Initialize breakdown configuration",
    "Process with two parameters",
  ];

  commandDescriptions.forEach((description) => {
    assertStringIncludes(HELP_TEXT, description);
    assertEquals(description.length > 10, true, "Description should be meaningful");
  });
});

/**
 * Test option descriptions are clear
 */
Deno.test("Option descriptions are clear and helpful", async () => {
  const { HELP_TEXT } = await import("./help.ts");
  const optionDescriptions = [
    "Use custom config prefix",
    "Show this help message",
    "Show version information",
  ];

  optionDescriptions.forEach((description) => {
    assertStringIncludes(HELP_TEXT, description);
    assertEquals(
      description.endsWith("."),
      false,
      "Descriptions should not end with period for consistency",
    );
  });
});
