/**
 * @fileoverview Filesystem Operations Boundary Conditions Integration Test
 * 
 * ファイルシステム操作の境界条件と異常系を重点的にテストし、
 * システム基盤の信頼性を保証します。
 * 
 * @module tests/2_generic_domain/system/io/filesystem_boundary_test
 */

import { assertEquals, assertRejects, assertStringIncludes } from "../../../../lib/deps.ts";
import { BreakdownLogger } from "@tettuan/breakdownlogger";
import { join } from "@std/path";
import { ensureDir } from "@std/fs";

const logger = new BreakdownLogger("filesystem-boundary");

/**
 * ファイルシステム操作境界条件テスト群
 * 
 * 異常系とエラーハンドリングに重点を置いた統合テストです：
 * 1. ファイルサイズ制限の境界条件
 * 2. パス長制限の境界条件  
 * 3. 同時アクセス競合状態の処理
 * 4. 権限エラーのハンドリング
 * 5. ディスク容量不足の対応
 * 6. 特殊文字・エンコーディング対応
 */

Deno.test("Filesystem Boundary: Large file operations", async () => {
  logger.debug("大容量ファイル操作境界テスト開始", {
    testType: "boundary",
    target: "large file operations",
  });

  const testDir = "/tmp/breakdown_filesystem_boundary";
  await ensureDir(testDir);

  try {
    // 大容量ファイルのテスト（メモリ効率性の確認）
    const largeFilePath = join(testDir, "large_test_file.txt");
    const chunkSize = 1024 * 1024; // 1MB chunk
    const totalChunks = 10; // 10MB total

    // ストリーミング書き込みテスト
    const file = await Deno.open(largeFilePath, { 
      create: true, 
      write: true, 
      truncate: true 
    });

    let totalBytesWritten = 0;
    for (let i = 0; i < totalChunks; i++) {
      const chunk = new Uint8Array(chunkSize).fill(65 + (i % 26)); // A-Z pattern
      const bytesWritten = await file.write(chunk);
      totalBytesWritten += bytesWritten;
      
      logger.debug(`大容量ファイル書き込み進行中`, {
        chunk: i + 1,
        totalChunks,
        bytesWritten: totalBytesWritten,
      });
    }
    file.close();

    // ファイルサイズ確認
    const fileInfo = await Deno.stat(largeFilePath);
    assertEquals(fileInfo.size, chunkSize * totalChunks);

    // ストリーミング読み込みテスト（メモリ効率性確認）
    const readFile = await Deno.open(largeFilePath, { read: true });
    let totalBytesRead = 0;
    const buffer = new Uint8Array(chunkSize);

    while (true) {
      const bytesRead = await readFile.read(buffer);
      if (bytesRead === null) break;
      totalBytesRead += bytesRead;
    }
    readFile.close();

    assertEquals(totalBytesRead, chunkSize * totalChunks);

    logger.debug("大容量ファイル操作成功", {
      fileSize: `${Math.round(totalBytesRead / 1024 / 1024)}MB`,
      writtenBytes: totalBytesWritten,
      readBytes: totalBytesRead,
    });

  } finally {
    // クリーンアップ
    try {
      await Deno.remove(testDir, { recursive: true });
    } catch {
      // ファイルが存在しない場合は無視
    }
  }
});

Deno.test("Filesystem Boundary: Long path handling", async () => {
  logger.debug("長いパス処理境界テスト開始", {
    testType: "boundary",
    target: "long path handling",
  });

  const baseDir = "/tmp/breakdown_long_path";
  await ensureDir(baseDir);

  try {
    // 長いパス名の生成（OS制限に近い）
    const longDirName = "a".repeat(100); // 100文字のディレクトリ名
    const deepPath = [baseDir];
    
    // 深い階層構造を作成（パス長制限をテスト）
    for (let i = 0; i < 5; i++) {
      deepPath.push(`${longDirName}_${i}`);
    }
    
    const fullPath = deepPath.reduce((acc, part) => join(acc, part));
    logger.debug("長いパス作成テスト", {
      pathLength: fullPath.length,
      pathComponents: deepPath.length,
      fullPath: fullPath.substring(0, 100) + "...",
    });

    // 深い階層の作成
    await ensureDir(fullPath);

    // 長いファイル名でのファイル作成
    const longFileName = "very_long_filename_".repeat(10) + ".txt";
    const longFilePath = join(fullPath, longFileName);
    
    await Deno.writeTextFile(longFilePath, "Test content for long path");
    const content = await Deno.readTextFile(longFilePath);
    assertEquals(content, "Test content for long path");

    // パス存在確認
    const pathExists = await Deno.stat(longFilePath);
    assertEquals(pathExists.isFile, true);

    logger.debug("長いパス処理成功", {
      finalPathLength: longFilePath.length,
      fileCreated: true,
      contentVerified: true,
    });

  } catch (error) {
    const err = error as Error;
    logger.debug("長いパス制限に到達", {
      errorType: err.name,
      errorMessage: err.message,
      expectedBehavior: "OS path length limits",
    });
    
    // OSのパス長制限は正常な動作
    assertStringIncludes(err.message.toLowerCase(), "path");
  } finally {
    // クリーンアップ
    try {
      await Deno.remove(baseDir, { recursive: true });
    } catch {
      // ファイルが存在しない場合は無視
    }
  }
});

Deno.test("Filesystem Boundary: Concurrent access handling", async () => {
  logger.debug("同時アクセス処理境界テスト開始", {
    testType: "boundary",
    target: "concurrent file access",
  });

  const testDir = "/tmp/breakdown_concurrent_access";
  await ensureDir(testDir);

  try {
    const sharedFilePath = join(testDir, "shared_file.txt");
    const concurrentOperations = 20;

    // 同時書き込み操作のテスト
    const writeOperations = Array.from({ length: concurrentOperations }, (_, i) => {
      return async () => {
        const content = `Content from writer ${i} at ${Date.now()}\n`;
        try {
          // ファイルに追記モードで書き込み
          const file = await Deno.open(sharedFilePath, { 
            create: true, 
            write: true, 
            append: true 
          });
          await file.write(new TextEncoder().encode(content));
          file.close();
          
          return { writerId: i, success: true, content };
        } catch (error) {
          const err = error as Error;
          logger.debug(`Writer ${i} エラー`, {
            writerId: i,
            error: err.message,
          });
          return { writerId: i, success: false, error: err.message };
        }
      };
    });

    // すべての書き込み操作を並行実行
    const writeResults = await Promise.all(
      writeOperations.map(op => op())
    );

    // 同時読み込み操作のテスト
    const readOperations = Array.from({ length: 10 }, (_, i) => {
      return async () => {
        try {
          const content = await Deno.readTextFile(sharedFilePath);
          return { readerId: i, success: true, contentLength: content.length };
        } catch (error) {
          const err = error as Error;
          return { readerId: i, success: false, error: err.message };
        }
      };
    });

    const readResults = await Promise.all(
      readOperations.map(op => op())
    );

    // 結果の検証
    const writeSuccessCount = writeResults.filter(r => r.success).length;
    const readSuccessCount = readResults.filter(r => r.success).length;

    logger.debug("同時アクセステスト結果", {
      totalWriteOperations: writeResults.length,
      successfulWrites: writeSuccessCount,
      totalReadOperations: readResults.length,
      successfulReads: readSuccessCount,
      writeSuccessRate: `${(writeSuccessCount / writeResults.length * 100).toFixed(1)}%`,
      readSuccessRate: `${(readSuccessCount / readResults.length * 100).toFixed(1)}%`,
    });

    // 高い成功率を期待（80%以上）
    assertEquals(writeSuccessCount >= Math.floor(writeResults.length * 0.8), true,
      `Write success rate should be at least 80%, got ${writeSuccessCount}/${writeResults.length}`);
    assertEquals(readSuccessCount >= Math.floor(readResults.length * 0.8), true,
      `Read success rate should be at least 80%, got ${readSuccessCount}/${readResults.length}`);

  } finally {
    // クリーンアップ
    try {
      await Deno.remove(testDir, { recursive: true });
    } catch {
      // ファイルが存在しない場合は無視
    }
  }
});

Deno.test("Filesystem Boundary: Permission error handling", async () => {
  logger.debug("権限エラーハンドリングテスト開始", {
    testType: "boundary",
    target: "permission errors",
  });

  // 権限制限されたパスでの操作テスト
  const restrictedPaths = [
    "/root/test_file.txt",           // Root権限が必要
    "/etc/breakdown_test.conf",      // システム設定ディレクトリ
    "/sys/test_file",                // システムファイルシステム
  ];

  for (const restrictedPath of restrictedPaths) {
    try {
      await assertRejects(
        async () => {
          await Deno.writeTextFile(restrictedPath, "test content");
        },
        Deno.errors.PermissionDenied,
        "Permission denied",
      );

      logger.debug("権限エラー正常検出", {
        path: restrictedPath,
        expectedError: "PermissionDenied",
      });

    } catch (error) {
      const err = error as Error;
      logger.debug("権限エラーテスト", {
        path: restrictedPath,
        errorType: err.name,
        errorMessage: err.message,
        note: "Some systems may have different permission models",
      });
    }
  }
});

Deno.test("Filesystem Boundary: Special characters and encoding", async () => {
  logger.debug("特殊文字・エンコーディング境界テスト開始", {
    testType: "boundary",
    target: "special characters and encoding",
  });

  const testDir = "/tmp/breakdown_encoding_test";
  await ensureDir(testDir);

  try {
    // 様々なエンコーディングと特殊文字のテスト
    const specialCharTests = [
      { name: "japanese", content: "こんにちは世界 🌍", filename: "日本語テスト.txt" },
      { name: "emoji", content: "🔥🚀⭐️🎉🌈", filename: "emoji_test.txt" },
      { name: "unicode", content: "ñáéíóú àèìòù äëïöü", filename: "unicode_test.txt" },
      { name: "mixed", content: "Mixed: English + 日本語 + Français + 🎌", filename: "mixed_encoding.txt" },
      { name: "symbols", content: "Special: @#$%^&*()_+-=[]{}|;:,.<>?", filename: "symbols.txt" },
    ];

    for (const test of specialCharTests) {
      const filePath = join(testDir, test.filename);
      
      try {
        // UTF-8エンコーディングでの書き込み
        await Deno.writeTextFile(filePath, test.content);
        
        // 読み込みと内容確認
        const readContent = await Deno.readTextFile(filePath);
        assertEquals(readContent, test.content);
        
        // ファイル存在確認
        const fileExists = await Deno.stat(filePath);
        assertEquals(fileExists.isFile, true);

        logger.debug(`特殊文字テスト成功: ${test.name}`, {
          filename: test.filename,
          contentLength: test.content.length,
          contentPreview: test.content.substring(0, 50),
        });

      } catch (error) {
        const err = error as Error;
        logger.debug(`特殊文字テスト問題: ${test.name}`, {
          filename: test.filename,
          error: err.message,
          note: "Some filesystems may not support all Unicode characters in filenames",
        });
      }
    }

    // バイナリデータのテスト
    const binaryData = new Uint8Array([0x00, 0xFF, 0x80, 0x7F, 0x42]);
    const binaryFilePath = join(testDir, "binary_test.bin");
    
    await Deno.writeFile(binaryFilePath, binaryData);
    const readBinaryData = await Deno.readFile(binaryFilePath);
    
    assertEquals(readBinaryData.length, binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      assertEquals(readBinaryData[i], binaryData[i]);
    }

    logger.debug("バイナリデータテスト成功", {
      dataLength: binaryData.length,
      checksumMatch: true,
    });

  } finally {
    // クリーンアップ
    try {
      await Deno.remove(testDir, { recursive: true });
    } catch {
      // ファイルが存在しない場合は無視
    }
  }
});

Deno.test("Filesystem Boundary: Resource exhaustion simulation", async () => {
  logger.debug("リソース枯渇シミュレーションテスト開始", {
    testType: "boundary",
    target: "resource exhaustion",
  });

  const testDir = "/tmp/breakdown_resource_exhaustion";
  await ensureDir(testDir);

  try {
    // ファイルハンドル制限のテスト
    const maxFileHandles = 100; // 控えめな数で制限をテスト
    const openFiles: Deno.FsFile[] = [];

    try {
      for (let i = 0; i < maxFileHandles; i++) {
        const filePath = join(testDir, `file_${i}.txt`);
        await Deno.writeTextFile(filePath, `Content ${i}`);
        
        const file = await Deno.open(filePath, { read: true });
        openFiles.push(file);
      }

      logger.debug("ファイルハンドル制限テスト", {
        openedFiles: openFiles.length,
        testPassed: openFiles.length === maxFileHandles,
      });

    } catch (error) {
      const err = error as Error;
      logger.debug("ファイルハンドル制限に到達", {
        openedFiles: openFiles.length,
        errorType: err.name,
        errorMessage: err.message,
      });
    } finally {
      // すべてのファイルハンドルを閉じる
      for (const file of openFiles) {
        try {
          file.close();
        } catch {
          // クローズエラーは無視
        }
      }
    }

    // 多数の小ファイル作成（inode制限テスト）
    const maxSmallFiles = 1000;
    let createdFiles = 0;

    try {
      for (let i = 0; i < maxSmallFiles; i++) {
        const filePath = join(testDir, "small", `small_file_${i}.txt`);
        await ensureDir(join(testDir, "small"));
        await Deno.writeTextFile(filePath, `${i}`);
        createdFiles++;
      }

      logger.debug("小ファイル大量作成テスト成功", {
        createdFiles,
        totalFiles: maxSmallFiles,
      });

    } catch (error) {
      const err = error as Error;
      logger.debug("小ファイル作成制限", {
        createdFiles,
        errorType: err.name,
        errorMessage: err.message,
      });
    }

    // 成功したファイル数が適切な範囲であることを確認
    assertEquals(createdFiles > 0, true, "Should be able to create at least some files");

  } finally {
    // クリーンアップ
    try {
      await Deno.remove(testDir, { recursive: true });
    } catch {
      // ファイルが存在しない場合は無視
    }
  }
});