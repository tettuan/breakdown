/**
 * User Config Loader
 * テスト用の設定ファイルローダー
 */

import { join } from "@std/path";
import { parse } from "@std/yaml";
import { ConfigProfile } from "./config_profile_name.ts";
import { DEFAULT_CONFIG_DIR } from "./constants.ts";

export async function loadUserConfig(profile: ConfigProfile): Promise<Record<string, unknown>> {
  // Use the current working directory as base
  const cwd = Deno.cwd();

  // Use the default config directory constant
  const configPath = join(
    cwd,
    DEFAULT_CONFIG_DIR,
    `${profile.value}-user.yml`,
  );

  try {
    const content = await Deno.readTextFile(configPath);
    return parse(content) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Failed to load config ${configPath}: ${error}`);
  }
}
