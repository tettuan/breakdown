# BreakdownConfig ユースケース

## 1. 環境別設定管理

Breakdownでは、環境や機能、クライアントごとに異なる設定を管理できる：

```typescript
// 環境別設定
const devConfig = new BreakdownConfig("development");
const prodConfig = new BreakdownConfig("production");

// 機能別設定
const basicConfig = new BreakdownConfig("basic-features");
const premiumConfig = new BreakdownConfig("premium-features");
```

**設定ファイル例：**
- 環境: `development-app.yml`, `production-app.yml`
- 機能: `basic-features-app.yml`, `premium-features-app.yml`
- クライアント: `client-a-app.yml`, `client-b-app.yml`

## 2. Breakdownプロンプト設定管理

Breakdownではプロンプト、スキーマ、作業ディレクトリを管理：

```typescript
const config = new BreakdownConfig();
await config.loadConfig();

const settings = config.getConfig();
// settings.app_prompt.base_dir: プロンプトテンプレート
// settings.app_schema.base_dir: 検証スキーマ
// settings.working_dir: 作業ディレクトリ
```

## 3. マルチプロジェクト設定

複数のBreakdownプロジェクトを管理：

```typescript
// プロジェクトAの設定
const projectA = new BreakdownConfig("project-a", "/workspace/project-a");
await projectA.loadConfig();

// プロジェクトBの設定  
const projectB = new BreakdownConfig("project-b", "/workspace/project-b");
await projectB.loadConfig();
```

## 4. チーム設定のオーバーライド

チームメンバーが個人設定でカスタマイズ可能：

```typescript
// チームの基本設定
const teamConfig = new BreakdownConfig("team");
await teamConfig.loadConfig();

// user.ymlで個人設定をオーバーライド：
// - カスタム作業ディレクトリ
// - 個人のプロンプト設定
// - 開発用設定
```

## 5. 設定テストと検証

異なる設定シナリオをテスト：

```typescript
// 最小設定でテスト
const minimalConfig = new BreakdownConfig();
await minimalConfig.loadConfig();

// フル機能設定でテスト
const fullConfig = new BreakdownConfig("full-features");
await fullConfig.loadConfig();

// 設定構造の検証
const settings = testConfig.getConfig();
assert(settings.working_dir);
assert(settings.app_prompt.base_dir);
assert(settings.app_schema.base_dir);
```

## 6. 動的設定読み込み

実行時条件に基づいて設定を読み込み：

```typescript
// 環境変数に基づく設定
const env = Deno.env.get("APP_ENV") || "development";
const config = new BreakdownConfig(env);
await config.loadConfig();

// コマンドライン引数に基づく設定
const configSet = Deno.args[0] || "default";
const baseDir = Deno.args[1] || "";
const dynamicConfig = new BreakdownConfig(configSet, baseDir);
await dynamicConfig.loadConfig();
```

## 7. 設定の継承と階層化

設定の階層構造を作成：

```typescript
// ベース設定
const baseConfig = new BreakdownConfig("base");
await baseConfig.loadConfig();

// 機能固有の設定がベースを拡張
const featureConfig = new BreakdownConfig("feature-x");
await featureConfig.loadConfig();
```

設定ファイルはベース設定を継承し、必要な部分のみオーバーライドできる。