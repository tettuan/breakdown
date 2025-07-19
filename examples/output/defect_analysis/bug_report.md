# バグレポート

## 発生状況
- 環境: Production
- 発生日時: 2024-01-15 14:30
- 影響範囲: 全ユーザーの約30%

## 症状
1. ログイン後にセッションが頻繁に切れる
2. API呼び出しで401エラーが断続的に発生
3. リフレッシュトークンの更新が失敗することがある

## エラーログ
```
[ERROR] 2024-01-15 14:30:15 - TokenRefreshError: Failed to refresh token
  at AuthService.refreshToken (auth.service.ts:145)
  at SessionManager.validateSession (session.manager.ts:78)
  
[ERROR] 2024-01-15 14:31:02 - UnauthorizedError: Invalid session
  at middleware.auth (auth.middleware.ts:23)
```

## 再現手順
1. ユーザーとしてログイン
2. 30分間放置
3. 任意のAPIエンドポイントにアクセス
4. 約50%の確率で401エラー

## 試した対処法
- サーバー再起動 → 一時的に改善するが再発
- Redis接続確認 → 正常
