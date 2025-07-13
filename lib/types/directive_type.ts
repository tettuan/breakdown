/**
 * @fileoverview DirectiveType implementation with Totality principle
 *
 * This module implements DirectiveType following the Totality principle,
 * ensuring type safety through Smart Constructor pattern. DirectiveType
 * represents the processing direction (to, summary, defect, etc.) and can
 * only be constructed from validated TwoParams_Result.
 *
 * All validation is performed by BreakdownParams before DirectiveType creation.
 * This ensures single responsibility and prevents validation logic duplication.
 *
 * @module types/directive_type
 */

import type { TwoParams_Result } from "../deps.ts";
import type { Result } from "./result.ts";
import { error, ok } from "./result.ts";
import type { ValidationError } from "./unified_error_types.ts";
import { ErrorFactory } from "./unified_error_types.ts";
import { ConfigProfileName } from "./config_profile_name.ts";

/**
 * TwoParamsDirectivePattern - DirectiveType用のバリデーションパターン
 *
 * 正規表現パターンを安全にラップし、DirectiveTypeのバリデーションに使用する。
 * Smart Constructorパターンを採用して、無効なパターンの作成を防ぐ。
 */
export class TwoParamsDirectivePattern {
  private constructor(private readonly pattern: RegExp) {}


  /**
   * 文字列パターンから TwoParamsDirectivePattern を作成（Result型版）
   *
   * Totality原則に準拠し、エラーを明示的に返す。
   *
   * @param pattern 正規表現文字列
   * @returns 成功時は Result<TwoParamsDirectivePattern>、失敗時はエラー情報
   */
  static createOrError(pattern: string): Result<TwoParamsDirectivePattern, ValidationError> {
    if (!pattern || pattern.length === 0) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "pattern",
        value: pattern,
        reason: "Pattern cannot be empty",
      }));
    }

    try {
      const regex = new RegExp(pattern);
      return ok(new TwoParamsDirectivePattern(regex));
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
    return this.pattern.toString();
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
   * @returns 自身を返す（TypePatternProvider.getDirectivePattern用）
   */
  getDirectivePattern(): TwoParamsDirectivePattern {
    return this;
  }
}

/**
 * DirectiveType - 処理方向型
 *
 * Totality原則に準拠した純粋なSmart Constructor実装。
 * TwoParams_Resultからのみ構築可能で、バリデーション責任はBreakdownParamsに委譲。
 *
 * ## 設計原則
 * 1. **単一責任**: 検証済み値の型安全な保持のみ
 * 2. **Smart Constructor**: private constructor + static create
 * 3. **Immutable**: 構築後の変更不可
 * 4. **Total Function**: 全ての入力に対して定義済み（TwoParams_Resultが前提）
 *
 * ## バリデーション責任分離
 * - **BreakdownParams**: 入力値の検証・TwoParams_Result生成
 * - **DirectiveType**: 検証済み値の型安全な保持・アクセス
 *
 * @example 基本的な使用例
 * ```typescript
 * // BreakdownParams でバリデーション済みの TwoParams_Result から構築
 * const twoParamsResult: TwoParams_Result = {
 *   type: "two",
 *   demonstrativeType: "to",
 *   layerType: "project",
 *   options: {}
 * };
 * const directiveType = DirectiveType.create(twoParamsResult);
 * console.log(directiveType.value); // "to"
 * ```
 *
 * @example 設定ファイル連携での使用
 * ```typescript
 * // カスタム設定から検証済みの値を使用
 * const customResult: TwoParams_Result = {
 *   type: "two",
 *   demonstrativeType: "analyze",
 *   layerType: "system",
 *   options: {}
 * };
 * const analyzeDirective = DirectiveType.create(customResult);
 * console.log(analyzeDirective.value); // "analyze"
 * ```
 */
export class DirectiveType {
  /**
   * Private constructor - Smart Constructor パターンの実装
   *
   * 直接インスタンス化を禁止し、create() メソッド経由での作成を強制。
   * これにより型の整合性と将来の拡張性を保証する。
   */
  private constructor(
    private readonly result: TwoParams_Result,
    private readonly _profile: ConfigProfileName,
    private readonly _validatedByPattern: boolean = true,
  ) {}

  /**
   * TwoParams_Result から DirectiveType を構築
   *
   * Totality原則に従い、TwoParams_Resultは既にBreakdownParamsで
   * バリデーション済みであることを前提とする。そのため、この関数は
   * 常に成功し、例外も発生しない（Total Function）。
   *
   * @param result BreakdownParamsで検証済みのTwoParams_Result
   * @param profile 設定プロファイル名（デフォルトを使用する場合はoptional）
   * @returns DirectiveType インスタンス（常に成功）
   *
   * @example
   * ```typescript
   * const result = await breakdownParams.parse(args);
   * if (_result.type === "two") {
   *   const directive = DirectiveType.create(result, configProfile);
   *   // 型安全に使用可能
   * }
   * ```
   */
  static create(result: TwoParams_Result, profile?: ConfigProfileName): DirectiveType {
    // ConfigProfileNameが未指定の場合は、デフォルトプロファイルを作成
    // Totality原則に準拠し、型アサーションを回避
    const defaultProfile = profile || ConfigProfileName.createDefault();
    return new DirectiveType(result, defaultProfile, true);
  }

  /**
   * TwoParams_Result から DirectiveType を構築（Result型版）
   *
   * Totality原則に完全準拠し、すべてのエラーケースを明示的に扱う。
   * DirectiveTypeの構築前に追加バリデーションを実行し、
   * 失敗の可能性がある場合はResult型でエラーを返す。
   *
   * @param result TwoParams_Result（基本的なバリデーション済み）
   * @param pattern オプショナル：追加バリデーション用のパターン
   * @returns 成功時は Result<DirectiveType>、失敗時はエラー情報
   *
   * @example
   * ```typescript
   * const pattern = TwoParamsDirectivePattern.createOrError("^(to|from|summary)$");
   * if (pattern.ok) {
   *   const directiveResult = DirectiveType.createOrError(result, pattern.data);
   *   if (directiveResult.ok) {
   *     // 型安全に使用可能
   *     console.log(directiveResult.data.value);
   *   } else {
   *     // エラーハンドリング
   *     console.error(directiveResult.error);
   *   }
   * }
   * ```
   */
  static createOrError(
    result: TwoParams_Result,
    pattern?: TwoParamsDirectivePattern,
    profile?: ConfigProfileName,
  ): Result<DirectiveType, ValidationError> {
    // 基本的なバリデーション
    if (!result || result.type !== "two") {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "result",
        value: result,
        reason: "Invalid TwoParams_Result: must have type 'two'",
      }));
    }

    if (!result.demonstrativeType || typeof result.demonstrativeType !== "string") {
      return error(ErrorFactory.validationError("MissingRequiredField", {
        field: "demonstrativeType",
        source: "TwoParams_Result",
      }));
    }

    // パターンマッチングによる追加バリデーション（オプショナル）
    if (pattern && !pattern.test(result.demonstrativeType)) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "demonstrativeType",
        value: result.demonstrativeType,
        reason: `Value does not match required pattern: ${pattern.getPattern()}`,
      }));
    }

    // すべてのバリデーションに成功
    // Totality原則に準拠し、型アサーションを回避してデフォルトプロファイルを作成
    const defaultProfile = profile || ConfigProfileName.createDefault();
    return ok(new DirectiveType(result, defaultProfile, pattern ? true : false));
  }

  /**
   * 検証済み demonstrativeType 値を取得
   *
   * TwoParams_Result.demonstrativeType の値を返す。
   * この値は BreakdownParams でバリデーション済みのため、
   * 安全に使用することができる。
   *
   * @returns 検証済みの処理方向文字列
   */
  get value(): string {
    return this.result.demonstrativeType;
  }

  /**
   * 設定プロファイル名を取得
   *
   * DirectiveTypeに関連付けられた設定プロファイル名を返す。
   *
   * @returns ConfigProfileName インスタンス
   */
  get profile(): ConfigProfileName {
    return this._profile;
  }

  /**
   * パターンバリデーションが実行されたかどうか
   *
   * DirectiveTypeがパターンベースバリデーションで検証されたかを示す。
   *
   * @returns バリデーション実行済みの場合 true
   */
  get validatedByPattern(): boolean {
    return this._validatedByPattern;
  }

  /**
   * equals method for value comparison
   */
  equals(other: DirectiveType): boolean {
    return this.value === other.value;
  }

  /**
   * プロファイルのバリデーション
   *
   * 指定されたプロファイルでDirectiveTypeが有効かどうかを判定。
   *
   * @param profile 検証対象のConfigProfileName
   * @returns 有効な場合 true
   */
  isValidForProfile(profile: ConfigProfileName): boolean {
    // TODO: 実際の実装では設定ファイルから検証
    // 現在はプレースホルダー実装
    return this._profile?.equals(profile) ?? true;
  }

  /**
   * プロンプトディレクトリパスを取得
   *
   * DirectiveTypeとLayerTypeからプロンプトファイルのディレクトリパスを生成。
   *
   * @param baseDir ベースディレクトリ
   * @param layer LayerType インスタンス
   * @returns ディレクトリパス
   */
  getPromptDirectory(baseDir: string, layer: { value: string }): string {
    return `${baseDir}/${this.value}/${layer.value}`;
  }

  /**
   * スキーマディレクトリパスを取得
   *
   * DirectiveTypeとLayerTypeからスキーマファイルのディレクトリパスを生成。
   *
   * @param baseDir ベースディレクトリ
   * @param layer LayerType インスタンス
   * @returns ディレクトリパス
   */
  getSchemaDirectory(baseDir: string, layer: { value: string }): string {
    return `${baseDir}/${this.value}/${layer.value}`;
  }

  /**
   * リソースパス用の有効性チェック
   *
   * DirectiveTypeがファイルシステムリソースのパス解決に使用可能かを判定。
   *
   * @returns パス解決に使用可能な場合 true
   */
  isValidForResourcePath(): boolean {
    // ファイルシステムで使用不可能な文字をチェック
    // deno-lint-ignore no-control-regex
    const invalidChars = /[<>:"|?*\x00-\x1f]/;
    return !invalidChars.test(this.value) && this.value.length > 0;
  }

  // パス解決メソッド群（設計仕様に基づく実装）

  /**
   * プロンプトテンプレートファイルのパスを取得
   *
   * DirectiveTypeとLayerTypeの組み合わせから、適切なプロンプトテンプレートファイルのパスを生成します。
   * パターン: {baseDir}/{directiveType}/{layerType}/f_{fromLayerType}[_{adaptation}].md
   *
   * @param layer LayerType インスタンス
   * @param baseDir ベースディレクトリ（デフォルト: "prompts"）
   * @param fromLayerType 変換元の階層タイプ（デフォルト: layerTypeと同じ）
   * @param adaptation 適応タイプ（オプション）
   * @returns プロンプトテンプレートファイルのパス
   *
   * @example
   * ```typescript
   * const directive = DirectiveType.create(result);
   * const layer = LayerType.create(result);
   *
   * // 基本的な使用例
   * const path = directive.getPromptPath(layer);
   * // 結果: "prompts/to/project/f_project.md"
   *
   * // 適応タイプ付きの使用例
   * const adaptedPath = directive.getPromptPath(layer, "prompts", "issue", "analysis");
   * // 結果: "prompts/to/project/f_issue_analysis.md"
   * ```
   */
  getPromptPath(
    layer: { value: string },
    baseDir = "prompts",
    fromLayerType?: string,
    adaptation?: string,
  ): string {
    const actualFromLayerType = fromLayerType || layer.value;
    const fileName = adaptation
      ? `f_${actualFromLayerType}_${adaptation}.md`
      : `f_${actualFromLayerType}.md`;

    return `${baseDir}/${this.value}/${layer.value}/${fileName}`;
  }

  /**
   * スキーマファイルのパスを取得
   *
   * DirectiveTypeとLayerTypeの組み合わせから、JSONスキーマファイルのパスを生成します。
   * パターン: {baseDir}/{directiveType}/{layerType}/base.schema.md
   *
   * @param layer LayerType インスタンス
   * @param baseDir ベースディレクトリ（デフォルト: "schema"）
   * @returns スキーマファイルのパス
   *
   * @example
   * ```typescript
   * const directive = DirectiveType.create(result);
   * const layer = LayerType.create(result);
   *
   * const schemaPath = directive.getSchemaPath(layer);
   * // 結果: "schema/to/project/base.schema.md"
   * ```
   */
  getSchemaPath(
    layer: { value: string },
    baseDir = "schema",
  ): string {
    return `${baseDir}/${this.value}/${layer.value}/base.schema.md`;
  }

  /**
   * 出力ファイルのパスを解決
   *
   * 入力ファイルパスまたは自動生成ルールに基づいて、出力ファイルのパスを生成します。
   * 自動生成パターン: {YYYYMMDD}_{timestampHash}{randomHash}.md
   *
   * @param input 入力ファイルパスまたは自動生成のための基準文字列
   * @param layer LayerType インスタンス（オプション、自動生成時のディレクトリ分けに使用）
   * @param baseDir 出力ベースディレクトリ（デフォルト: "output"）
   * @returns 出力ファイルのパス
   *
   * @example
   * ```typescript
   * const directive = DirectiveType.create(result);
   * const layer = LayerType.create(result);
   *
   * // 自動生成
   * const autoPath = directive.resolveOutputPath("", layer);
   * // 結果: "output/to/project/20250712_1a2b3c4d.md"
   *
   * // 指定ファイル名ベース
   * const namedPath = directive.resolveOutputPath("my-analysis.md", layer);
   * // 結果: "output/to/project/my-analysis.md"
   * ```
   */
  resolveOutputPath(
    input: string,
    layer?: { value: string },
    baseDir = "output",
  ): string {
    // 層別ディレクトリ構造
    const layerDir = layer ? `/${this.value}/${layer.value}` : `/${this.value}`;

    // 入力が空または自動生成を指示する場合
    if (!input || input.trim() === "" || input === "-") {
      // 自動ファイル名生成（lib/factory/output_file_path_resolver.tsのロジックを参考）
      const now = new Date();
      const dateStr = now.getFullYear().toString() +
        (now.getMonth() + 1).toString().padStart(2, "0") +
        now.getDate().toString().padStart(2, "0");

      // タイムスタンプハッシュ（ミリ秒からの変換）
      const timestampHash = Math.floor(performance.now() * 1000).toString(16).slice(-4);

      // ランダムハッシュ
      const randomHash = Math.random().toString(16).slice(2, 5);

      const fileName = `${dateStr}_${timestampHash}${randomHash}.md`;
      return `${baseDir}${layerDir}/${fileName}`;
    }

    // 入力ファイル名がある場合はそのまま使用
    // パスの正規化とバリデーション
    // deno-lint-ignore no-control-regex
    const sanitizedInput = input.replace(/[<>:"|?*\x00-\x1f]/g, "_");

    // 拡張子の確認と付与
    const fileName = sanitizedInput.endsWith(".md") ? sanitizedInput : `${sanitizedInput}.md`;

    return `${baseDir}${layerDir}/${fileName}`;
  }

  /**
   * String representation of DirectiveType
   *
   * デバッグや表示用の文字列表現を返す。
   * フォーマット: "DirectiveType(value)"
   *
   * @returns DirectiveType の文字列表現
   */
  toString(): string {
    return `DirectiveType(${this.value})`;
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
}
