// Standard library dependencies managed through deno.json imports
// Re-export as needed
export { exists, ensureDir } from "$std/fs/mod.ts";
export { join, dirname } from "$std/path/mod.ts";
export { parse } from "$std/flags/mod.ts";
export { assertEquals, assert, assertStringIncludes, assertRejects } from "$std/testing/asserts.ts";

// Remove the incorrect Command import
// export { Command } from "https://deno.land/std@0.210.0/cli/mod.ts";

// Third-party dependencies
// (Add as needed) 