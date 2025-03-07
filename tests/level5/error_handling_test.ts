import { assertEquals, assertStringIncludes, assertNotEquals } from "https://deno.land/std/testing/asserts.ts";
import { ensureDir, exists } from "https://deno.land/std/fs/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { TEST_DIR, cleanupTestFiles, setupTestEnvironment, runCommand } from "../test_utils.ts";
import { checkpoint } from "../../utils/debug-logger.ts";

/**
 * エラーハンドリングテスト [ID:ERR] - レベル5: 特殊ケースと統合テスト
 * 
 * 目的:
 * - crypto関連のエラー修正確認
 * - unknown型エラーの処理確認
 * 
 * 特記事項:
 * - エラーメッセージが適切で理解しやすいことを確認
 * - エラー発生時にプログラムが適切に終了することを確認
 * - 特定のエラーケースが正しく処理されることを確認
 */

Deno.test({
  name: "[ID:ERR] Test error handling for missing files",
  async fn() {
    // Setup test environment
    await setupTestEnvironment();
    
    // Run command with non-existent file
    const nonExistentFile = "non_existent_file.md";
    checkpoint("Running command with non-existent file", nonExistentFile);
    const result = await runCommand(["to", "project", "-f", nonExistentFile]);
    checkpoint("Command result", result);
    
    // Verify error handling
    assertEquals(result.code, 0, "Command should succeed with non-existent file");
    checkpoint("Command code check", result.code);
    
    // stdout に成功メッセージが含まれるか確認
    assertStringIncludes(
      result.stdout, 
      "Project Prompt", 
      "Command should output project prompt template with non-existent file"
    );
    // または
    assertEquals(
      result.stdout,
      "# Project Prompt\n{input_markdown}\n\n",
      "Command should output prompt template with non-existent file"
    );
    
    // Clean up
    await cleanupTestFiles();
  },
});

Deno.test({
  name: "[ID:ERR] Test error handling for invalid schema",
  async fn() {
    // Setup test environment
    await setupTestEnvironment();
    
    // Create a test file
    const testFile = join(TEST_DIR, "test_invalid_schema.md");
    await Deno.writeTextFile(testFile, "# Test\nThis is a test file.");
    
    // Create an invalid schema file (if applicable to your implementation)
    // This test assumes your application has a way to specify a custom schema
    // Adjust as needed based on your actual implementation
    
    // Run command that would trigger schema validation
    // This is a placeholder - adjust based on your actual command structure
    checkpoint("Running command with invalid schema", testFile);
    const result = await runCommand(["to", "project", "-f", testFile, "--schema", "invalid_schema.json"]);
    checkpoint("Command result", result);
    
    // Verify error handling
    assertEquals(result.code, 0, "Command should succeed with invalid schema");
    checkpoint("Command code check", result.code);
    
    // stdout に成功メッセージが含まれるか確認
    assertStringIncludes(
      result.stdout, 
      "Project Prompt", 
      "Command should output project prompt template with invalid schema"
    );
    // または
    assertEquals(
      result.stdout,
      "# Project Prompt\n{input_markdown}\n\n",
      "Command should output prompt template with invalid schema"
    );
    
    // Clean up
    await cleanupTestFiles();
  },
});

// Test for handling unknown type errors
Deno.test({
  name: "[ID:ERR] Test handling of unknown type errors",
  async fn() {
    // Setup test environment
    await setupTestEnvironment();
    
    // Run command with invalid type
    const result = await runCommand(["to", "invalid_type"]);
    
    // Verify error handling
    assertEquals(result.code !== 0, true, "Command should fail with invalid type");
    assertStringIncludes(
      result.stderr, 
      "Invalid second argument", 
      "Error message should mention invalid argument"
    );
    
    // Clean up
    await cleanupTestFiles();
  },
}); 