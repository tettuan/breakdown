/**
 * BreakdownPrompt Mock
 * テスト用のBreakdownPromptモック実装
 * プロンプト生成の動作を模擬し、テスト環境でのプロンプト処理をサポート
 */

export interface MockPromptTemplate {
  directiveType: string;
  layerType: string;
  content: string;
  variables?: Record<string, string>;
  schemaPath?: string;
}

export interface MockPromptResult {
  success: boolean;
  content?: string;
  variables?: Record<string, string>;
  templatePath?: string;
  schemaPath?: string;
  error?: string;
}

export interface MockPromptGenerationOptions {
  workingDir?: string;
  resourceDir?: string;
  customVariables?: Record<string, string>;
  includeSchema?: boolean;
}

export class BreakdownPromptMock {
  private templates: Map<string, MockPromptTemplate> = new Map();
  private schemaMapping: Map<string, string> = new Map();

  constructor() {
    this.setupDefaultTemplates();
  }

  /**
   * デフォルトテンプレートのセットアップ
   */
  private setupDefaultTemplates(): void {
    const defaultTemplates: MockPromptTemplate[] = [
      {
        directiveType: "to",
        layerType: "project",
        content:
          "Convert the following input to project format:\n\n{{input_content}}\n\nAuthor: {{author}}",
        variables: { author: "Test Suite" },
        schemaPath: "to/project.json",
      },
      {
        directiveType: "to",
        layerType: "issue",
        content:
          "Convert the following input to issue format:\n\n{{input_content}}\n\nVersion: {{version}}",
        variables: { version: "1.0.0" },
        schemaPath: "to/issue.json",
      },
      {
        directiveType: "summary",
        layerType: "project",
        content: "Create a summary of the project:\n\n{{input_content}}\n\nSummary by: {{author}}",
        variables: { author: "Summary Bot" },
        schemaPath: "summary/project.json",
      },
    ];

    defaultTemplates.forEach((template) => {
      const key = `${template.directiveType}-${template.layerType}`;
      this.templates.set(key, template);
      if (template.schemaPath) {
        this.schemaMapping.set(key, template.schemaPath);
      }
    });
  }

  /**
   * テンプレートを追加
   */
  addTemplate(template: MockPromptTemplate): void {
    const key = `${template.directiveType}-${template.layerType}`;
    this.templates.set(key, template);

    if (template.schemaPath) {
      this.schemaMapping.set(key, template.schemaPath);
    }
  }

  /**
   * プロンプトを生成（BreakdownPrompt.generate模擬）
   */
  generate(
    directiveType: string,
    layerType: string,
    inputContent?: string,
    options?: MockPromptGenerationOptions,
  ): MockPromptResult {
    const key = `${directiveType}-${layerType}`;
    const template = this.templates.get(key);

    if (!template) {
      return {
        success: false,
        error: `Template not found for ${directiveType}-${layerType}`,
      };
    }

    // 変数の置換処理
    let content = template.content;
    const variables = { ...template.variables, ...options?.customVariables };

    if (inputContent) {
      content = content.replace("{{input_content}}", inputContent);
    }

    // その他の変数を置換
    Object.entries(variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
    });

    const result: MockPromptResult = {
      success: true,
      content,
      variables,
      templatePath: `${options?.resourceDir || "/tmp/resources"}/${directiveType}/${layerType}.md`,
    };

    // スキーマパスを含める場合
    if (options?.includeSchema && this.schemaMapping.has(key)) {
      result.schemaPath = `${options?.resourceDir || "/tmp/resources"}/schema/${
        this.schemaMapping.get(key)
      }`;
    }

    return result;
  }

  /**
   * テンプレートが存在するかチェック
   */
  hasTemplate(directiveType: string, layerType: string): boolean {
    const key = `${directiveType}-${layerType}`;
    return this.templates.has(key);
  }

  /**
   * 利用可能なテンプレート一覧を取得
   */
  getAvailableTemplates(): Array<{ directiveType: string; layerType: string }> {
    return Array.from(this.templates.keys()).map((key) => {
      const [directiveType, layerType] = key.split("-");
      return { directiveType, layerType };
    });
  }

  /**
   * 変数を抽出
   */
  extractVariables(content: string): string[] {
    const variablePattern = /{{(\w+)}}/g;
    const variables: string[] = [];
    let match;

    while ((match = variablePattern.exec(content)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }

    return variables;
  }

  /**
   * スキーマパスを取得
   */
  getSchemaPath(directiveType: string, layerType: string): string | undefined {
    const key = `${directiveType}-${layerType}`;
    return this.schemaMapping.get(key);
  }

  /**
   * テスト用のリセット機能
   */
  resetToDefaults(): void {
    this.templates.clear();
    this.schemaMapping.clear();
    this.setupDefaultTemplates();
  }

  /**
   * エラーをシミュレート
   */
  simulateError(directiveType: string, layerType: string, _errorMessage: string): void {
    const key = `${directiveType}-${layerType}`;
    // エラーを起こすために無効なテンプレートを設定
    this.templates.set(key, {
      directiveType,
      layerType,
      content: "", // 空コンテンツでエラーを誘発
      variables: {},
    });
  }

  /**
   * プロンプトの検証
   */
  validatePrompt(content: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!content || content.trim().length === 0) {
      issues.push("Content is empty");
    }

    const unresolvedVariables = this.extractVariables(content);
    if (unresolvedVariables.length > 0) {
      issues.push(`Unresolved variables: ${unresolvedVariables.join(", ")}`);
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

/**
 * テスト用のファクトリー関数
 */
export function createMockBreakdownPrompt(templates?: MockPromptTemplate[]): BreakdownPromptMock {
  const mock = new BreakdownPromptMock();

  if (templates) {
    mock.resetToDefaults();
    templates.forEach((template) => mock.addTemplate(template));
  }

  return mock;
}

/**
 * 標準的なテストテンプレートセット
 */
export const STANDARD_TEST_TEMPLATES: MockPromptTemplate[] = [
  {
    directiveType: "to",
    layerType: "project",
    content: "Convert input to project: {{input_content}} by {{author}}",
    variables: { author: "Test Author" },
    schemaPath: "to/project.json",
  },
  {
    directiveType: "summary",
    layerType: "issue",
    content: "Summarize issue: {{input_content}} version {{version}}",
    variables: { version: "test-1.0" },
    schemaPath: "summary/issue.json",
  },
  {
    directiveType: "defect",
    layerType: "task",
    content: "Find defects in task: {{input_content}} by {{inspector}}",
    variables: { inspector: "Test Inspector" },
    schemaPath: "defect/task.json",
  },
];
