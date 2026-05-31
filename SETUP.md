# TANGO セットアップガイド

## 必要なもの
- Node.js 18+
- PostgreSQL データベース（Neon.tech 推奨：無料、設定不要）

---

## 1. データベース設定（Neon.tech 推奨）

1. https://neon.tech にアクセス → 無料でアカウント作成
2. 「New Project」→ プロジェクト名を入力
3. 「Connection string」をコピー（`postgresql://...` で始まる文字列）

---

## 2. Google OAuth 設定

1. https://console.cloud.google.com にアクセス
2. APIs & Services → Credentials → 「Create Credentials」→ OAuth 2.0 Client ID
3. Application type: Web application
4. Authorized redirect URIs に追加:
   - `http://localhost:3000/api/auth/callback/google`（開発用）
5. Client ID と Client Secret をコピー

---

## 3. GitHub OAuth 設定

1. https://github.com/settings/developers → 「New OAuth App」
2. Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
3. Client ID と Client Secret をコピー

---

## 4. 環境変数を設定

`.env.local` ファイルを編集:

```env
DATABASE_URL="postgresql://..."          # Neon.tech のコネクション文字列
AUTH_SECRET="ryiztUrb29wjB1rXhVxuN4/..."   # 変更不要（生成済）
NEXTAUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="xxx.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-..."
AUTH_GITHUB_ID="Ov23li..."
AUTH_GITHUB_SECRET="..."
ENCRYPTION_KEY="zOyRaoB8ZhjWkZGvkyeH2FP..."  # 変更不要（生成済）
```

---

## 5. データベース初期化

```bash
npx prisma migrate dev --name init
```

---

## 6. 起動

```bash
npm run dev
```

http://localhost:3000 にアクセス

---

## 7. アプリの使い方

1. **ログイン** — Google または GitHub でログイン
2. **設定** — 右上「設定」→ Anthropic の Claude API キーを入力（https://console.anthropic.com で取得）
3. **デッキ追加** — 「＋ 追加」→ Wordholic 形式の CSV をインポート
4. **学習開始** — デッキ「▶ 学習」をクリック
5. **AI 深掘り** — カードを見ながら「💬 Claude にもっと詳しく聞く」で AI チャット
6. **まとめ生成** — 右上「📝 まとめ」→「まとめを生成」でラウンドサマリー生成

---

## 機能一覧

| 機能 | 説明 |
|------|------|
| 📚 デッキ管理 | CSV インポート・削除 |
| 🃏 フラッシュカード | フリップアニメーション付き |
| ✓✗⭐⏭ 判定 | 正解/不正解/お気に入り/保留 |
| 🔄 周回管理 | 第 N 周目の表示・出題フィルター |
| 💬 AI チャット | カードごとに Claude と対話・会話を DB に保存 |
| 📝 まとめ | ラウンド完了後に AI が学習内容を要約 |
| 🔐 認証 | Google/GitHub OAuth |
| 🔑 API キー | AES-256 暗号化してサーバー側で保管 |
