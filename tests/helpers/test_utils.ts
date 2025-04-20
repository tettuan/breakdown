import { join } from "jsr:@std/path/join";

/**
 * Gets test environment options for a specific test module
 */
export function getTestEnvOptions(testModule: string) {
  return {
    workingDir: join("./tmp/test", testModule),
  };
}
