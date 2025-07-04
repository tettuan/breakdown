# 概要
「骨格」をもとに、重複フローを強化する。
特に、重要な箇所は全域関数によって、TYPE宣言を全て意味のある型に置き換え、処理フローを型で実装する。
定義された型を用いることで、ドメイン駆動設計における「ドメイン特有の型定義」を名実ともに表し、仕様と実装の一体化を狙う。

## 前提
アプリケーションの重要なTYPE宣言と重要なフローがYAML化されている。(`tmp/application-20250704.yml`)
これは「骨格」であり、様々な引数を通じて確認されたメインストリームである。

`docs/breakdown/index.ja.md`や `docs/breakdown/overview/architecture.ja.md`に仕様書の骨格が記載されている。この仕様を十分に考慮に入れて、以下を実施する。


## ドメインのコア
「ドメインのコア」は、アプリケーションの目的に照らして重要度が最大に高く、このアプリケーション特有の「用語・処理・フロー」が全て重なっている箇所である。

### 「ドメインのコア」の判定方法

まず、特定の処理フローの塊に対し「用語・処理・フロー」の実装案を24個つくる。一般的な実装案として、毎回ゼロベース思考でつくる。
続いて24個の実装案を評価し、実装案の差分を「振れ幅（統計的なシグマ）」として計算する。
振れ幅が大きい順に各処理を並べたとき、上位がドメイン領域である。（文脈の理解が、特有であるために難しい、と判断する）


# 実施すること

`tmp/application-20250704.yml` を仕様と合わせ、以下の処理を行なって出力する。

## 1. 「バリューオブジェクト」の定義
制約のある＆繰り返し用いられる共通パターンを、ドメイン駆動設計の「バリューオブジェクト」へ置き換える。

ドメインにおいて有効なユビキタス言語を用いて一元化する。

### 例: 割引の状態
- **パーセント割引**: 割引率(0-100%)と上限額を持つ
- **固定額割引**: 固定金額を持つ


## 2. 「ユニオン型」パターンの定義
繰り返し用いられる共通パターンを、ドメイン駆動設計の「バリューオブジェクト」へ置き換える。

### 例: 結果型
type Result<T, E> = { ok: true; data: T } | { ok: false; error: E };


## 3. DRY原則に基づく重複経路の整理

迂回的な処理、類似ロジック、同一インスタンスの多重生成など、重複・冗長な処理経路を統合し、コードの明確化と保守性向上を図る。


## 4. SRP / SoC

大きな責任を追っている箇所は、責務の分離を行う。
SOLID原則を理想としつつ、YAGNI に基づいて過剰な実装は避ける。

## 5. DIP

具体的な実装ではなく、抽象に依存する。
「ドメインのコア」に適用する。

### 例
```
// dip-example.ts

// --- 共通の型定義 ---
type User = {
  id: string;
  name: string;
};

// --- 抽象インターフェース（ドメイン層が依存する） ---
interface UserRepository {
  getUserById(id: string): Promise<User>;
}

// --- ドメイン層：UserService（抽象に依存） ---
class UserService {
  constructor(private userRepo: UserRepository) {}

  async showUserName(id: string): Promise<string> {
    const user = await this.userRepo.getUserById(id);
    return user.name;
  }
}

// --- インフラ層：HTTPでユーザー取得する具象実装 ---
class HttpUserRepository implements UserRepository {
  async getUserById(id: string): Promise<User> {
    // ダミーAPI呼び出し（実際には fetch などを使う）
    return {
      id,
      name: `User ${id}`,
    };
  }
}

// --- 実行部（依存の注入） ---
async function main() {
  const userRepo = new HttpUserRepository(); // 具象を注入
  const userService = new UserService(userRepo);

  const name = await userService.showUserName("123");
  console.log(`ユーザー名: ${name}`); // → ユーザー名: User 123
}

main();

```

# 不要

`Testing Strategy` や `Implementation Roadmap` は不要。プロジェクト管理は行わない。TYPEと処理フローのみを表現する。

# 出力先
`tmp/application-20250704-concrete.yml`



