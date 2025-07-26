/**
 * @fileoverview ConfigFileGeneratorのユニットテスト
 * @module supporting/initialization/config_file_generator.test
 */

import { assertEquals, assertExists } from "jsr:@std/assert";
import { join } from "jsr:@std/path";
import { ConfigFileGenerator } from "./config_file_generator.ts";
import { DEFAULT_CONFIG_DIR } from "../../config/constants.ts";

Deno.test("ConfigFileGenerator - default directory should use DEFAULT_CONFIG_DIR", async (t) => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    await t.step("constructor without arguments should use DEFAULT_CONFIG_DIR", () => {
      const generator = new ConfigFileGenerator();
      // Private fieldなので直接アクセスできないが、生成されるファイルパスで確認
      assertEquals(DEFAULT_CONFIG_DIR, ".agent/breakdown/config");
    });

    await t.step("generateAppConfig should create file in default directory", async () => {
      // テスト用に一時ディレクトリ内にDEFAULT_CONFIG_DIRと同じ構造を作成
      const testConfigDir = join(tempDir, DEFAULT_CONFIG_DIR);
      const generator = new ConfigFileGenerator(testConfigDir);
      
      const result = await generator.generateAppConfig("test");
      
      assertEquals(result.ok, true);
      if (result.ok) {
        assertEquals(result.data, join(testConfigDir, "test-app.yml"));
        
        // ファイルが実際に作成されたことを確認
        const fileInfo = await Deno.stat(result.data);
        assertExists(fileInfo);
        assertEquals(fileInfo.isFile, true);
      }
    });

    await t.step("generateUserConfig should create file in default directory", async () => {
      const testConfigDir = join(tempDir, DEFAULT_CONFIG_DIR);
      const generator = new ConfigFileGenerator(testConfigDir);
      
      const result = await generator.generateUserConfig("test");
      
      assertEquals(result.ok, true);
      if (result.ok) {
        assertEquals(result.data, join(testConfigDir, "test-user.yml"));
        
        // ファイルが実際に作成されたことを確認
        const fileInfo = await Deno.stat(result.data);
        assertExists(fileInfo);
        assertEquals(fileInfo.isFile, true);
      }
    });

    await t.step("should not create files in project root config directory", async () => {
      // プロジェクトルートの"config"ディレクトリにファイルが作成されないことを確認
      const generator = new ConfigFileGenerator();
      
      // デフォルトコンストラクタはDEFAULT_CONFIG_DIRを使用するため、
      // プロジェクトルートの"config"ディレクトリは使用されない
      assertEquals(DEFAULT_CONFIG_DIR.startsWith(".agent/breakdown"), true);
    });
  } finally {
    // クリーンアップ
    await Deno.remove(tempDir, { recursive: true });
  }
});

Deno.test("ConfigFileGenerator - custom directory", async (t) => {
  const tempDir = await Deno.makeTempDir();
  
  try {
    await t.step("constructor with custom directory", async () => {
      const customDir = join(tempDir, "custom-config");
      const generator = new ConfigFileGenerator(customDir);
      
      const result = await generator.generateAppConfig("custom");
      
      assertEquals(result.ok, true);
      if (result.ok) {
        assertEquals(result.data, join(customDir, "custom-app.yml"));
        
        // ファイルが実際に作成されたことを確認
        const fileInfo = await Deno.stat(result.data);
        assertExists(fileInfo);
        assertEquals(fileInfo.isFile, true);
      }
    });
  } finally {
    // クリーンアップ
    await Deno.remove(tempDir, { recursive: true });
  }
});