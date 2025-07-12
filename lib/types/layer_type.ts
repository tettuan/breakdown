/**
 * @fileoverview LayerType implementation with Totality principle
 *
 * This module implements LayerType following the Totality principle,
 * ensuring type safety through Smart Constructor pattern and validation.
 * LayerType represents the hierarchical layer (project, issue, task, etc.)
 * and can only be constructed through proper validation.
 *
 * @module types/layer_type
 */

import type { TwoParams_Result } from "../deps.ts";
import type { Result } from "./result.ts";
import { error, ok } from "./result.ts";
import type { ValidationError } from "./unified_error_types.ts";
import { ErrorFactory } from "./unified_error_types.ts";

/**
 * TwoParamsLayerTypePattern - LayerType用のバリデーションパターン
 *
 * 正規表現パターンを安全にラップし、LayerTypeのバリデーションに使用する。
 * Smart Constructorパターンを採用して、無効なパターンの作成を防ぐ。
 */
export class TwoParamsLayerTypePattern {
  private constructor(private readonly pattern: RegExp) {}

  /**
   * 文字列パターンから TwoParamsLayerTypePattern を作成
   * @param pattern 正規表現文字列
   * @returns 成功時は TwoParamsLayerTypePattern、失敗時は null
   */
  static create(pattern: string): TwoParamsLayerTypePattern | null {
    // Validate input type first
    if (typeof pattern !== "string" || pattern == null || pattern.trim().length === 0) {
      return null;
    }

    try {
      const regex = new RegExp(pattern);
      return new TwoParamsLayerTypePattern(regex);
    } catch {
      return null;
    }
  }

  /**
   * 文字列パターンから TwoParamsLayerTypePattern を作成（Result型版）
   *
   * Totality原則に準拠し、エラーを明示的に返す。
   *
   * @param pattern 正規表現文字列
   * @returns 成功時は Result<TwoParamsLayerTypePattern>、失敗時はエラー情報
   */
  static createOrError(pattern: string): Result<TwoParamsLayerTypePattern, ValidationError> {
    if (typeof pattern !== "string") {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "pattern",
        value: pattern,
        reason: "Pattern must be a string",
      }));
    }
    
    if (!pattern || pattern.trim().length === 0) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "pattern",
        value: pattern,
        reason: "Pattern cannot be empty",
      }));
    }

    try {
      const regex = new RegExp(pattern);
      return ok(new TwoParamsLayerTypePattern(regex));
    } catch (e) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "pattern",
        value: pattern,
        reason: `Invalid regex pattern: ${e instanceof Error ? e.message : "Unknown error"}`,
      }));
    }
  }

  /**
   * 値がパターンにマッチするかテスト
   * @param value テスト対象の値
   * @returns マッチする場合 true
   */
  test(value: string): boolean {
    return this.pattern.test(value);
  }

  /**
   * パターンの文字列表現を取得
   * @returns 正規表現の文字列
   */
  toString(): string {
    return this.pattern.source;
  }

  /**
   * パターンの文字列表現を取得（getPatternメソッド）
   * @returns 正規表現の文字列
   */
  getPattern(): string {
    return this.pattern.source;
  }

  /**
   * TypePatternProvider インターフェース準拠のためのメソッド
   * @returns 自身を返す（TypePatternProvider.getLayerTypePattern用）
   */
  getLayerTypePattern(): TwoParamsLayerTypePattern {
    return this;
  }
}

/**
 * LayerType - 階層型
 *
 * Totality原則に準拠した制約型。TwoParams_Result を受け取る制約を持ち、
 * バリデーション経由でのみ構築可能。
 * 処理対象の階層（project, issue, task, bugs, temp等）を表現し、
 * TwoParams_Result.layerType の値として検証される。
 *
 * バリデーションパターンは BreakdownParams 呼び出し時に適用される。
 *
 * ## Smart Constructor パターン
 * このクラスは Smart Constructor パターンを実装しています：
 * - `private constructor`: 直接インスタンス化を禁止
 * - `static create()`: 制御された唯一の作成方法を提供
 * - 型安全性と将来のバリデーション拡張性を保証
 *
 * 環境別設定での使用例：
 * - デフォルト: "project|issue|task|bugs"
 * - staging: "project|issue|task|epic|system"
 * - production: "bugs|issues|todos|comments|notes"
 *
 * @example 基本的な使用例
 * ```typescript
 * const twoParamsResult: TwoParams_Result = {
 *   type: "two",
 *   demonstrativeType: "to",
 *   layerType: "project",
 *   options: {}
 * };
 * const layerType = LayerType.create(twoParamsResult);
 * console.log(layerType.value); // "project"
 * ```
 *
 * @example 環境別設定での使用
 * ```typescript
 * // staging環境での拡張パターン
 * const epicResult: TwoParams_Result = { type: "two", demonstrativeType: "to", layerType: "epic", options: {} };
 * const epicLayer = LayerType.create(epicResult);
 *
 * // production環境での特化パターン
 * const issuesResult: TwoParams_Result = { type: "two", demonstrativeType: "to", layerType: "issues", options: {} };
 * const issuesLayer = LayerType.create(issuesResult);
 * ```
 */
export class LayerType {
  /**
   * Private constructor - Smart Constructor パターンの実装
   * 直接インスタンス化を禁止し、create() メソッド経由での作成を強制
   */
  private constructor(
    private readonly result: TwoParams_Result,
    private readonly _validatedByPattern?: TwoParamsLayerTypePattern,
  ) {}

  /**
   * バリデーションに使用されたパターン
   *
   * このプロパティは、LayerTypeが作成時にバリデーションされたパターンを保持します。
   * パターンが使用されていない場合はundefinedになります。
   *
   * @returns バリデーションに使用されたパターン、または undefined
   */
  get validatedByPattern(): TwoParamsLayerTypePattern | undefined {
    return this._validatedByPattern;
  }

  /**
   * TwoParams_Result からバリデーション済み LayerType を構築
   *
   * この静的メソッドは Totality 原則の核心部分。
   * TwoParams_Result を受け取り、既にバリデーション済みの値のみが LayerType として構築される。
   * バリデーションは BreakdownParams 側で実行済み。
   *
   * @param result TwoParams_Result 型の検証済みデータ
   * @param pattern オプショナル：バリデーションに使用されたパターン
   * @returns LayerType インスタンス（TwoParams_Result は既にバリデーション済みのため常に成功）
   */
  static create(result: TwoParams_Result, pattern?: TwoParamsLayerTypePattern): LayerType {
    return new LayerType(result, pattern);
  }

  /**
   * TwoParams_Result から LayerType を構築（Result型版）
   *
   * Totality原則に完全準拠し、すべてのエラーケースを明示的に扱う。
   * LayerTypeの構築前に追加バリデーションを実行し、
   * 失敗の可能性がある場合はResult型でエラーを返す。
   *
   * @param result TwoParams_Result（基本的なバリデーション済み）
   * @param pattern オプショナル：追加バリデーション用のパターン
   * @returns 成功時は Result<LayerType>、失敗時はエラー情報
   *
   * @example
   * ```typescript
   * const pattern = TwoParamsLayerTypePattern.createOrError("^(project|issue|task|bugs)$");
   * if (pattern.ok) {
   *   const layerResult = LayerType.createOrError(result, pattern.data);
   *   if (layerResult.ok) {
   *     // 型安全に使用可能
   *     console.log(layerResult.data.value);
   *   } else {
   *     // エラーハンドリング
   *     console.error(layerResult.error);
   *   }
   * }
   * ```
   */
  static createOrError(
    result: TwoParams_Result,
    pattern?: TwoParamsLayerTypePattern,
  ): Result<LayerType, ValidationError> {
    // 基本的なバリデーション
    if (!result || result.type !== "two") {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "result",
        value: result,
        reason: "Invalid TwoParams_Result: must have type 'two'",
      }));
    }

    if (!result.layerType || typeof result.layerType !== "string") {
      return error(ErrorFactory.validationError("MissingRequiredField", {
        field: "layerType",
        source: "TwoParams_Result",
      }));
    }

    // パターンマッチングによる追加バリデーション（オプショナル）
    if (pattern && !pattern.test(result.layerType)) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "layerType",
        value: result.layerType,
        reason: `Value does not match required pattern: ${pattern.getPattern()}`,
      }));
    }

    // すべてのバリデーションに成功
    return ok(new LayerType(result, pattern));
  }

  /**
   * 検証済み layerType 値を取得
   *
   * このプロパティで取得される値は必ずバリデーション済みのため、
   * 安全に使用することができる。TwoParams_Result.layerType を返す。
   *
   * @returns TwoParams_Result.layerType の検証済み文字列値
   */
  get value(): string {
    return this.result.layerType;
  }

  /**
   * getValue method for compatibility with test files
   * @deprecated Use .value property instead
   */
  getValue(): string {
    return this.value;
  }

  /**
   * equals method for value comparison
   */
  equals(other: LayerType): boolean {
    return this.value === other.value;
  }

  /**
   * getHierarchyLevel method for compatibility with test files
   * @deprecated This method is for testing purposes only
   */
  getHierarchyLevel(): number {
    const hierarchyMap: Record<string, number> = {
      "project": 1,
      "issue": 2,
      "task": 3,
      "bugs": 0,
      "temp": 0,
    };
    return hierarchyMap[this.value] || 0;
  }

  /**
   * isStandardHierarchy method for compatibility with test files
   * @deprecated This method is for testing purposes only
   */
  isStandardHierarchy(): boolean {
    const standardTypes = ["project", "issue", "task"];
    return standardTypes.includes(this.value);
  }

  /**
   * String representation of LayerType
   *
   * デバッグや表示用の文字列表現を返す。
   * フォーマット: "LayerType(value)"
   *
   * @returns LayerType の文字列表現
   */
  toString(): string {
    return `LayerType(${this.value})`;
  }

  /**
   * 元の TwoParams_Result への読み取り専用アクセス
   *
   * デバッグや詳細情報が必要な場合に使用。
   * Immutable なので安全に公開可能。
   *
   * @returns 元の TwoParams_Result（読み取り専用）
   */
  get originalResult(): Readonly<TwoParams_Result> {
    return this.result;
  }

  // パス解決メソッド群

  /**
   * プロンプトテンプレートのファイルパスを解決
   *
   * DirectiveTypeと組み合わせてプロンプトテンプレートのパスを構築します。
   *
   * @param directiveType プロンプトの方向性を表すタイプ
   * @param baseDir ベースディレクトリ（デフォルト: "prompts"）
   * @returns プロンプトテンプレートのファイルパス
   */
  resolvePromptTemplatePath(directiveType: string, baseDir = "prompts"): string {
    return `${baseDir}/${directiveType}/${this.value}.md`;
  }

  /**
   * スキーマファイルのパスを解決
   *
   * DirectiveTypeと組み合わせてJSONスキーマファイルのパスを構築します。
   *
   * @param directiveType プロンプトの方向性を表すタイプ
   * @param baseDir ベースディレクトリ（デフォルト: "schema"）
   * @returns スキーマファイルのパス
   */
  resolveSchemaPath(directiveType: string, baseDir = "schema"): string {
    return `${baseDir}/${directiveType}-${this.value}.json`;
  }

  /**
   * 出力ファイルのパスを解決
   *
   * DirectiveTypeと組み合わせて出力ファイルのパスを構築します。
   *
   * @param directiveType プロンプトの方向性を表すタイプ
   * @param extension ファイル拡張子（デフォルト: ".md"）
   * @param baseDir ベースディレクトリ（デフォルト: "output"）
   * @returns 出力ファイルのパス
   */
  resolveOutputPath(directiveType: string, extension = ".md", baseDir = "output"): string {
    const timestamp = new Date().toISOString().slice(0, 10);
    return `${baseDir}/${directiveType}-${this.value}-${timestamp}${extension}`;
  }

  /**
   * 設定ファイルのパスを解決
   *
   * LayerType固有の設定ファイルパスを構築します。
   *
   * @param configType 設定のタイプ（"app" | "user"）
   * @param profile プロファイル名（デフォルト: "default"）
   * @param baseDir ベースディレクトリ（デフォルト: "config"）
   * @returns 設定ファイルのパス
   */
  resolveConfigPath(configType: "app" | "user", profile = "default", baseDir = "config"): string {
    return `${baseDir}/${profile}-${configType}.yml`;
  }

  // 検証メソッド群

  /**
   * 指定されたDirectiveTypeに対してこのLayerTypeが有効かどうかを検証
   *
   * LayerTypeとDirectiveTypeの組み合わせの妥当性を検証します。
   * 例えば、"defect"（欠陥検出）は"bugs"（バグ）LayerTypeに適しているが、
   * "project"（プロジェクト）LayerTypeには適していない場合があります。
   *
   * @param directiveType 検証対象のDirectiveType
   * @param validCombinations 有効な組み合わせを定義するマップ（オプション）
   * @returns 有効な組み合わせの場合 true
   *
   * @example
   * ```typescript
   * const layerType = LayerType.create(result);
   * const isValid = layerType.isValidForDirective("to");
   * console.log(isValid); // true または false
   *
   * // カスタム組み合わせルールを使用
   * const customRules = {
   *   "defect": ["bugs", "issue"],
   *   "summary": ["project", "issue", "task"],
   *   "to": ["project", "issue", "task"]
   * };
   * const isValidCustom = layerType.isValidForDirective("defect", customRules);
   * ```
   */
  isValidForDirective(
    directiveType: string,
    validCombinations?: Record<string, string[]>,
  ): boolean {
    // デフォルトの有効な組み合わせルール
    const defaultCombinations: Record<string, string[]> = {
      "to": ["project", "issue", "task", "bugs", "temp"],
      "summary": ["project", "issue", "task"],
      "defect": ["bugs", "issue", "task"],
      "analysis": ["project", "issue"],
      "review": ["project", "issue", "task"],
      "doc": ["project", "issue"],
      "test": ["project", "issue", "task"],
    };

    const combinations = validCombinations || defaultCombinations;
    const validLayerTypes = combinations[directiveType];

    // DirectiveTypeが定義されていない場合は、すべてのLayerTypeで有効とする
    if (!validLayerTypes) {
      return true;
    }

    return validLayerTypes.includes(this.value);
  }

  /**
   * 指定されたDirectiveTypeに対してこのLayerTypeが有効かどうかを検証（Result型版）
   *
   * isValidForDirectiveのResult型版で、詳細なエラー情報を提供します。
   *
   * @param directiveType 検証対象のDirectiveType
   * @param validCombinations 有効な組み合わせを定義するマップ（オプション）
   * @returns 成功時は Result<true>、失敗時はエラー情報
   */
  isValidForDirectiveOrError(
    directiveType: string,
    validCombinations?: Record<string, string[]>,
  ): Result<true, ValidationError> {
    if (!directiveType || typeof directiveType !== "string") {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "directiveType",
        value: directiveType,
        reason: "DirectiveType must be a non-empty string",
      }));
    }

    const isValid = this.isValidForDirective(directiveType, validCombinations);

    if (!isValid) {
      const combinations = validCombinations || {};
      const validLayerTypes = combinations[directiveType];

      return error(ErrorFactory.validationError("ValidationFailed", {
        errors: [
          `LayerType '${this.value}' is not valid for DirectiveType '${directiveType}'. Valid LayerTypes: ${
            validLayerTypes ? validLayerTypes.join(", ") : "any"
          }`,
        ],
        context: {
          field: "layerType-directiveType",
          value: `${this.value}-${directiveType}`,
        },
      }));
    }

    return ok(true as const);
  }
}
