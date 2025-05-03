# PromptParamsFactory

## 概要

プロンプト置換処理に必要なパラメータを構築するファクトリクラス。
デザインパターンのFactoryパターンを採用し、複雑なパラメータ構築処理をカプセル化します。

## 責務

- プロンプト置換処理に必要なパラメータの構築
- ファイルパスやディレクトリパスの生成
- 入力パラメータのバリデーションと変換

## 前提条件

1. 構成要素の設定が読み込まれていること
   - アプリケーション設定（プロンプトベースディレクトリ、スキーマベースディレクトリなど）
   - 作業ディレクトリ設定
2. 構成要素のSeedがパラメータとして受け取られていること
   - demonstrativeType（指示語タイプ）
   - layerType（レイヤータイプ）
   - オプション（fromFile, destinationFile, fromLayerType）

## 入力

- breakdownparamsのDoubleParamsResultオブジェクト
- アプリケーション設定オブジェクト

## 出力

プロンプト置換処理のメインクラスが必要とする以下のパラメータ：

1. プロンプトファイル関連
   - プロンプトファイルのパス
   - プロンプトの種類（from/to）
   - 対象レイヤー情報

2. 入出力ファイル関連
   - 入力ファイルのパス
   - 出力ファイルのパス
   - 入力レイヤータイプ
   - 出力レイヤータイプ

## 構築ルール

### プロンプトファイルパス

- ベースディレクトリ + demonstrativeType + layerType + プロンプトファイル名
- プロンプトファイル名は `f_{fromLayerType}.md` の形式

### スキーマファイルパス

- ベースディレクトリ + demonstrativeType + layerType + base.schema.md

### 入力ファイルパス

docs/breakdown/path.ja.md の「Inputファイル」セクションに従う

1. fromFileがPATH階層を持つ場合：そのパスをそのまま使用
2. fromFileがファイル名のみの場合：
   - fromLayerTypeが指定されている場合：fromLayerType + fromFile
   - 指定がない場合：layerType + fromFile
3. fromFileが未指定の場合：空のパスを返す

### 出力ファイルパス

docs/breakdown/path.ja.md の「Outputファイル」セクションに従う

> destinationFile（destinationPath）は、テンプレートに埋め込むための値であり、プロンプトを受け取った結果を書き込む必要は一切ありません。ファイル出力は必須ではなく、必要に応じて利用者が判断します。

1. destinationFileがPATH階層を持つファイルの場合：そのパスをそのまま使用
2. destinationFileがファイル名のみの場合：layerType + destinationFile
3. destinationFileがディレクトリの場合：
   - ディレクトリ + 日付_ハッシュ値.md
4. destinationFileが未指定の場合：
   - layerType + 日付_ハッシュ値.md

## エラー処理

1. 必須パラメータの欠落チェック
2. パスの妥当性チェック
3. ファイル/ディレクトリの存在チェック（必要な場合）

## 拡張性への配慮

1. 新しいパラメータタイプの追加が容易な構造
2. パス生成ルールの変更に対応しやすい設計
3. テスト可能な構造
