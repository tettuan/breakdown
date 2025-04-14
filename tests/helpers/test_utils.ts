import { join } from "$std/path/mod.ts";

/**
 * Gets test environment options for a specific test module
 */
export function getTestEnvOptions(testModule: string) {
  return {
    workingDir: join("./tmp/test", testModule)
  };
} 