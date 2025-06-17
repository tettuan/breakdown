# BreakdownConfig

Breakdown用の設定管理ライブラリ。アプリケーション設定とユーザー設定を安全に読み込み、マージする機能を提供。

## 主要機能

- アプリケーション設定の読み込みと検証（固定パス: `./.agent/breakdown/config/app.yml`）
- ユーザー設定の読み込み（作業ディレクトリ: `{working_dir}/config/user.yml`）
- 環境別設定のサポート（`{configSetName}-app.yml`、`{configSetName}-user.yml`）
- 設定のマージ（ユーザー設定がアプリケーション設定を上書き）
- パスの安全性検証（パストラバーサル対策）
- 型安全な設定処理
- エラーコード管理（ERR1001-3003）

## バージョン情報

- **現在のバージョン**: 1.1.2
- **破壊的変更**: v1.2.0でコンストラクタのパラメータ順序が変更される予定

## インポート

```typescript
import { BreakdownConfig } from "@tettuan/breakdownconfig";
```

## 基本的な使い方

```typescript
// デフォルト設定
const config = new BreakdownConfig();

// 環境別設定
const prodConfig = new BreakdownConfig("production");

// カスタムベースディレクトリ
const customConfig = new BreakdownConfig(undefined, "/path/to/project");

// 設定の読み込み
await config.loadConfig();

// マージされた設定の取得
const settings = config.getConfig();
```
