/**
 * User Config Loader
 * テスト用の設定ファイルローダー
 */

import { join } from "@std/path";
import { parse } from "@std/yaml";
import { ConfigProfile } from "./config_profile_name.ts";

export async function loadUserConfig(profile: ConfigProfile): Promise<Record<string, unknown>> {
  const configPath = join(
    Deno.cwd(),
    "tests",
    "fixtures",
    "configs",
    `${profile.value}-user.yml`,
  );

  try {
    const content = await Deno.readTextFile(configPath);
    return parse(content) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Failed to load config ${configPath}: ${error}`);
  }
}
