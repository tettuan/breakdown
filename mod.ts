#!/usr/bin/env -S deno run -A
// This file intentionally omits module-level documentation (such as @module JSDoc)
// to allow the README.md to be used as the "Overview" in JSR documentation.
// See: https://jsr.io/docs/packages#documentation
//
// For full documentation and usage, refer to the README.md at the root of this repository.
//
// Purpose: This approach ensures that the JSR package overview is sourced from the README,
// providing richer and more maintainable documentation for users.

// Export the CLI entry point
export { runBreakdown } from "./cli/breakdown.ts";

// When this file is executed directly (not imported as a module), redirect to CLI
if (import.meta.main) {
  const { runBreakdown } = await import("./cli/breakdown.ts");
  await runBreakdown();
}
