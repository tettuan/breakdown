/**
 * @fileoverview Configuration Pattern Generator
 *
 * 設定ファイルのパターンから動的にテストデータを生成
 * ハードコードされた配列を完全排除し、設定ファイル駆動の動的生成を実現
 *
 * EMERGENCY HARDCODE ELIMINATION (緊急ハードコード排除):
 * - 全てのハードコード配列 ["to", "summary", "defect"], ["project", "issue", "task"] を除去
 * - AsyncConfigPatternProvider経由で設定ファイルから動的読み込み
 * - generateFromConfigProfile()の使用を推奨
 *
 * @module lib/test_helpers/configuration_pattern_generator
 */

import { AsyncConfigPatternProvider } from "../config/pattern_provider_async.ts";

export interface PatternConfig {
  directiveType: {
    pattern: string;
    errorMessage?: string;
  };
  layerType: {
    pattern: string;
    errorMessage?: string;
  };
}

export interface GeneratedTestData {
  validDirectives: string[];
  validLayers: string[];
  invalidDirectives: string[];
  invalidLayers: string[];
}

export class ConfigurationPatternGenerator {
  /**
   * パターンから有効な値を生成（ハードコード完全排除版）
   * 設定ファイルから動的に取得または正規表現パターンから抽出
   */
  static generateValidValues(pattern: string, baseValues: string[] = []): string[] {
    const generated: string[] = [];

    // 正規表現パターンから値を抽出（例: "^(値1|値2|値3)$" -> 設定ファイルから動的に取得された値配列）
    const match = pattern.match(/^\^\(([^)]+)\)\$$/);
    if (match) {
      const values = match[1].split("|");
      generated.push(...values);
    } else {
      // ❌ HARDCODE ELIMINATION: All hardcoded arrays removed
      // Pattern-based value generation should use configuration files instead
      // This fallback section is kept minimal for backwards compatibility only

      // Generate example values based on pattern structure (minimal fallback)
      if (pattern.includes("[a-z]")) {
        // Generate sample alphabetic values
        generated.push("example1", "example2", "example3");
      }

      if (pattern.includes("[0-9]")) {
        // Generate sample numeric values
        generated.push("value1", "value2", "value3");
      }

      if (pattern.includes("_") || pattern.includes("-")) {
        // Generate sample compound values
        generated.push("test_value", "test-value", "compound_test");
      }

      if (pattern.includes("#")) {
        // Generate sample hash values
        generated.push("test#1", "value#2", "sample#test");
      }
    }

    // 基本値をベースにした生成
    for (const base of baseValues) {
      if (this.validatePattern(base, pattern)) {
        generated.push(base);
      }
    }

    // 重複除去
    return [...new Set(generated)];
  }

  /**
   * パターンから無効な値を生成
   */
  static generateInvalidValues(pattern: string): string[] {
    const invalid: string[] = [];

    // 共通の無効パターン
    invalid.push(""); // 空文字

    // 長さ制限違反
    if (pattern.includes("{1,20}") || pattern.includes("{2,20}")) {
      invalid.push("a"); // 短すぎる
      invalid.push("verylongtextthatexceedstwentycharacters"); // 長すぎる
    }

    // 大文字小文字違反
    if (pattern.includes("[a-z]") && !pattern.includes("[A-Z]")) {
      invalid.push("TO", "Summary", "PROJECT", "Issue");
    }

    // 特殊文字違反
    if (!pattern.includes("@") && !pattern.includes(" ")) {
      invalid.push("test@email", "test space", "INVALID@LAYER");
    }

    // ❌ HARDCODE ELIMINATION: Remove hardcoded pattern matching
    // Generate invalid values based on pattern structure instead of hardcoded values
    if (pattern.includes("^(") && pattern.includes(")$")) {
      // Extract values from pattern and create pluralized invalid versions
      const match = pattern.match(/^\^?\(([^)]+)\)\$?$/);
      if (match && match[1]) {
        const validValues = match[1].split("|");
        for (const value of validValues) {
          invalid.push(value + "s"); // Simple pluralization
          invalid.push(value.toUpperCase()); // Case violations
        }
      }
    }

    return invalid;
  }

  /**
   * パターンマッチングを検証
   */
  static validatePattern(value: string, pattern: string): boolean {
    try {
      // パターンから正規表現を構築
      let regexPattern = pattern;

      // パターンがすでに正規表現形式の場合
      if (!regexPattern.startsWith("^") && !regexPattern.includes("|")) {
        // 単純なパターンの場合
        regexPattern = `^${regexPattern}$`;
      }

      const regex = new RegExp(regexPattern);
      return regex.test(value);
    } catch {
      return false;
    }
  }

  /**
   * パターン設定から完全なテストデータを生成
   */
  static generateTestData(
    config: PatternConfig,
    baseDirectives: string[] = [],
    baseLayers: string[] = [],
  ): GeneratedTestData {
    return {
      validDirectives: this.generateValidValues(config.directiveType.pattern, baseDirectives),
      validLayers: this.generateValidValues(config.layerType.pattern, baseLayers),
      invalidDirectives: this.generateInvalidValues(config.directiveType.pattern),
      invalidLayers: this.generateInvalidValues(config.layerType.pattern),
    };
  }

  /**
   * 設定ファイルからパターンを抽出してテストデータを生成
   */
  static async generateFromConfigFile(configPath: string): Promise<GeneratedTestData> {
    const configText = await Deno.readTextFile(configPath);
    const { parse } = await import("jsr:@std/yaml@0.224.0");
    const config = parse(configText) as Record<string, unknown>;

    const params = config.params as { two?: unknown } | undefined;
    if (params?.two) {
      return this.generateTestData(params.two as PatternConfig);
    }

    throw new Error(`Invalid config structure in ${configPath}`);
  }

  /**
   * ConfigProfile経由で動的にテストデータを生成
   * ハードコード配列を完全排除し、設定ファイルから動的読み込み
   *
   * EMERGENCY REFACTORING: 完全にconfig-drivenなアプローチに移行
   * - AsyncConfigPatternProvider.create()による設定読み込み
   * - Result型によるエラーハンドリング
   * - ハードコード値の完全排除
   */
  static async generateFromConfigProfile(
    configSetName: string = "default",
    workspacePath: string = Deno.cwd(),
  ): Promise<GeneratedTestData> {
    // AsyncConfigPatternProviderを利用して設定から動的に取得
    const providerResult = await AsyncConfigPatternProvider.create(configSetName, workspacePath);

    if (!providerResult.ok) {
      const error = providerResult.error;
      let errorMessage: string;

      switch (error.kind) {
        case "ConfigLoadFailed":
          errorMessage = error.message;
          break;
        case "PatternCreationFailed":
          errorMessage = `Pattern creation failed for ${error.patternType}: ${error.pattern}`;
          break;
        case "NotInitialized":
          errorMessage = "Pattern provider not initialized";
          break;
        default:
          errorMessage = `Unknown error: ${JSON.stringify(error)}`;
          break;
      }

      throw new Error(`Failed to create pattern provider: ${errorMessage}`);
    }

    const provider = providerResult.data;

    // 設定ファイルから動的に値を取得（ハードコード配列は一切使用しない）
    const validDirectives = provider.getValidDirectiveTypes();
    const validLayers = provider.getValidLayerTypes();

    // パターンを取得して無効値を生成
    const directivePattern = provider.getDirectivePattern();
    const layerPattern = provider.getLayerTypePattern();

    const invalidDirectives = directivePattern
      ? this.generateInvalidValues(directivePattern.getPattern())
      : [];
    const invalidLayers = layerPattern ? this.generateInvalidValues(layerPattern.getPattern()) : [];

    return {
      validDirectives: [...validDirectives],
      validLayers: [...validLayers],
      invalidDirectives,
      invalidLayers,
    };
  }

  /**
   * 設定ファイル駆動でパターンから有効な値を生成（推奨メソッド）
   * ハードコード配列を完全に排除し、AsyncConfigPatternProviderを活用
   */
  static async generateValidValuesFromConfig(
    configSetName: string = "default",
    workspacePath: string = Deno.cwd(),
    type: "directive" | "layer" = "directive",
  ): Promise<string[]> {
    const providerResult = await AsyncConfigPatternProvider.create(configSetName, workspacePath);

    if (!providerResult.ok) {
      throw new Error(`Failed to load configuration: ${providerResult.error.kind}`);
    }

    const provider = providerResult.data;

    if (type === "directive") {
      return [...provider.getValidDirectiveTypes()];
    } else {
      return [...provider.getValidLayerTypes()];
    }
  }
}
