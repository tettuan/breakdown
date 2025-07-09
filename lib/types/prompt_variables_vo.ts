/**
 * @fileoverview PromptVariablesVO implementation with Totality principle
 * 
 * This module implements PromptVariablesVO following the Totality principle,
 * ensuring type safety through Smart Constructor pattern. PromptVariablesVO
 * represents an immutable collection of prompt variables.
 * 
 * ## Design Principles
 * 1. **Smart Constructor**: private constructor + static create
 * 2. **Immutable**: All properties are readonly, no mutation after creation
 * 3. **Total Function**: All operations are defined for all valid inputs
 * 4. **Single Responsibility**: Holds validated prompt variables collection
 * 
 * @module types/prompt_variables_vo
 */

import type { PromptVariable } from "./prompt_variables.ts";
import type { Result } from "./result.ts";
import { error, ok } from "./result.ts";
import type { ValidationError } from "./unified_error_types.ts";
import { ErrorFactory } from "./unified_error_types.ts";

/**
 * PromptVariablesVO - Immutable collection of prompt variables
 * 
 * Totality原則に準拠した純粋なSmart Constructor実装。
 * 検証済みのPromptVariable配列を保持し、不変性を保証する。
 * 
 * ## 設計原則
 * 1. **単一責任**: 検証済み変数コレクションの型安全な保持のみ
 * 2. **Smart Constructor**: private constructor + static create
 * 3. **Immutable**: 構築後の変更不可
 * 4. **Total Function**: 全ての入力に対して定義済み
 * 
 * @example 基本的な使用例
 * ```typescript
 * const var1 = StandardVariable.create("input_text_file", "/path/to/file");
 * const var2 = FilePathVariable.create("schema_file", "/path/to/schema");
 * 
 * if (var1.ok && var2.ok) {
 *   const variables = PromptVariablesVO.create([var1.data, var2.data]);
 *   console.log(variables.size()); // 2
 *   console.log(variables.toRecord()); // { input_text_file: "/path/to/file", schema_file: "/path/to/schema" }
 * }
 * ```
 * 
 * @example 空のコレクション
 * ```typescript
 * const empty = PromptVariablesVO.create([]);
 * console.log(empty.isEmpty()); // true
 * console.log(empty.size()); // 0
 * ```
 */
export class PromptVariablesVO {
  /**
   * Private constructor - Smart Constructor パターンの実装
   * 
   * 直接インスタンス化を禁止し、create() メソッド経由での作成を強制。
   * 内部で配列をフリーズして不変性を保証する。
   */
  private constructor(private readonly variables: readonly PromptVariable[]) {
    // Defensive copy and freeze for true immutability
    this.variables = Object.freeze([...variables]);
  }

  /**
   * PromptVariable配列から PromptVariablesVO を構築
   * 
   * Totality原則に従い、有効な配列に対しては常に成功する。
   * 重複チェックなどのバリデーションは呼び出し側の責任とする。
   * 
   * @param variables PromptVariable の配列
   * @returns PromptVariablesVO インスタンス（常に成功）
   * 
   * @example
   * ```typescript
   * const variables = [standardVar, filePathVar];
   * const vo = PromptVariablesVO.create(variables);
   * // 型安全に使用可能
   * ```
   */
  static create(variables: PromptVariable[]): PromptVariablesVO {
    return new PromptVariablesVO(variables);
  }

  /**
   * PromptVariable配列から PromptVariablesVO を構築（Result型版）
   * 
   * Totality原則に完全準拠し、すべてのエラーケースを明示的に扱う。
   * PromptVariablesVOの構築前に追加バリデーションを実行し、
   * 失敗の可能性がある場合はResult型でエラーを返す。
   * 
   * @param variables PromptVariable の配列
   * @param options オプショナル：追加バリデーション設定
   * @returns 成功時は Result<PromptVariablesVO>、失敗時はエラー情報
   * 
   * @example
   * ```typescript
   * const result = PromptVariablesVO.createOrError(variables, {
   *   allowDuplicates: false,
   *   requireNonEmpty: true
   * });
   * if (result.ok) {
   *   // 型安全に使用可能
   *   console.log(result.data.size());
   * } else {
   *   // エラーハンドリング
   *   console.error(result.error);
   * }
   * ```
   */
  static createOrError(
    variables: PromptVariable[] | null | undefined,
    options?: {
      allowDuplicates?: boolean;
      requireNonEmpty?: boolean;
      maxVariables?: number;
    }
  ): Result<PromptVariablesVO, ValidationError> {
    // 基本的なバリデーション
    if (!variables || variables === null || variables === undefined) {
      return error(ErrorFactory.validationError("MissingRequiredField", {
        field: "variables",
        source: "PromptVariablesVO",
        context: { reason: "Variables array is required and cannot be null or undefined" }
      }));
    }

    if (!Array.isArray(variables)) {
      return error(ErrorFactory.validationError("InvalidFieldType", {
        field: "variables",
        expected: "Array<PromptVariable>",
        received: typeof variables,
        context: { value: variables }
      }));
    }

    // 空配列チェック（オプショナル）
    if (options?.requireNonEmpty && variables.length === 0) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "variables",
        value: variables,
        reason: "Variables array cannot be empty when requireNonEmpty is true"
      }));
    }

    // 最大数チェック（オプショナル）
    if (options?.maxVariables && variables.length > options.maxVariables) {
      return error(ErrorFactory.validationError("InvalidInput", {
        field: "variables",
        value: variables.length,
        reason: `Variables count (${variables.length}) exceeds maximum allowed (${options.maxVariables})`
      }));
    }

    // 重複チェック（オプショナル）
    if (options?.allowDuplicates === false) {
      const names = new Map<string, number>();
      for (let i = 0; i < variables.length; i++) {
        const variable = variables[i];
        const record = variable.toRecord();
        for (const name of Object.keys(record)) {
          if (names.has(name)) {
            return error(ErrorFactory.validationError("InvalidInput", {
              field: `variables[${i}]`,
              value: name,
              reason: `Duplicate variable name: ${name} (first occurrence at index ${names.get(name)})`
            }));
          }
          names.set(name, i);
        }
      }
    }

    // すべてのバリデーションに成功
    return ok(new PromptVariablesVO(variables));
  }

  /**
   * 検証済み変数の配列を取得
   * 
   * 不変の配列を返すため、外部から変更することはできない。
   * 
   * @returns 読み取り専用の変数配列
   */
  get value(): readonly PromptVariable[] {
    return this.variables;
  }

  /**
   * 変数の数を取得
   * 
   * @returns 変数の数
   */
  size(): number {
    return this.variables.length;
  }

  /**
   * コレクションが空かどうかをチェック
   * 
   * @returns 変数が存在しない場合 true
   */
  isEmpty(): boolean {
    return this.variables.length === 0;
  }

  /**
   * 全ての変数を単一のレコードに変換
   * 
   * 各変数の toRecord() を呼び出して結果をマージする。
   * 重複するキーがある場合は後の値で上書きされる。
   * 
   * @returns 全ての変数のキー値ペアを含むレコード
   */
  toRecord(): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const variable of this.variables) {
      Object.assign(result, variable.toRecord());
    }

    return result;
  }

  /**
   * 変数名のリストを取得
   * 
   * @returns 全ての変数名の配列
   */
  getNames(): string[] {
    const names: string[] = [];
    
    for (const variable of this.variables) {
      const record = variable.toRecord();
      names.push(...Object.keys(record));
    }

    return names;
  }

  /**
   * 指定された名前の変数を検索
   * 
   * @param name 検索する変数名
   * @returns 見つかった場合は変数、見つからない場合は undefined
   */
  findByName(name: string): PromptVariable | undefined {
    for (const variable of this.variables) {
      const record = variable.toRecord();
      if (name in record) {
        return variable;
      }
    }
    return undefined;
  }

  /**
   * 指定された名前の変数が存在するかチェック
   * 
   * @param name チェックする変数名
   * @returns 変数が存在する場合 true
   */
  hasVariable(name: string): boolean {
    return this.findByName(name) !== undefined;
  }

  /**
   * equals method for value comparison
   * 
   * 順序も含めて完全に同じ変数を持つ場合のみ true を返す。
   * 
   * @param other 比較対象の PromptVariablesVO
   * @returns 同じ変数を持つ場合 true
   */
  equals(other: PromptVariablesVO): boolean {
    if (this.variables.length !== other.variables.length) {
      return false;
    }

    const thisRecord = this.toRecord();
    const otherRecord = other.toRecord();

    const thisKeys = Object.keys(thisRecord).sort();
    const otherKeys = Object.keys(otherRecord).sort();

    if (thisKeys.length !== otherKeys.length) {
      return false;
    }

    for (let i = 0; i < thisKeys.length; i++) {
      const key = thisKeys[i];
      if (key !== otherKeys[i] || thisRecord[key] !== otherRecord[key]) {
        return false;
      }
    }

    return true;
  }

  /**
   * String representation of PromptVariablesVO
   * 
   * デバッグや表示用の文字列表現を返す。
   * フォーマット: "PromptVariablesVO(count: n)"
   * 
   * @returns PromptVariablesVO の文字列表現
   */
  toString(): string {
    return `PromptVariablesVO(count: ${this.variables.length})`;
  }

  /**
   * 元の変数配列への読み取り専用アクセス
   * 
   * デバッグや詳細情報が必要な場合に使用。
   * Immutable なので安全に公開可能。
   * 
   * @returns 元の変数配列（読み取り専用）
   */
  get originalVariables(): readonly PromptVariable[] {
    return this.variables;
  }
}