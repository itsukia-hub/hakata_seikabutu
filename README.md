# Meguriai

同じ生活圏で繰り返し接点が生まれる相手と、双方の合意のもとで一歩前に進めるマッチングアプリ。

ハッカソン提出用の実装ディレクトリ。

## 構成

```
app/
├── api/        Hono (Node.js) バックエンド
├── web/        Next.js フロントエンド (次ターンで雛形作成)
├── db/         PostgreSQL マイグレーション
├── docker-compose.yml  PostgreSQL ローカル起動
└── package.json        npm workspaces ルート
```

## 必要環境
- Node.js 20+ (確認済: v24.14.1)
- Docker (確認済: 29.3.1)

## セットアップ（初回）

```bash
# 1. ルートで依存インストール
cd app
npm install

# 2. 環境変数ファイル作成
cp .env.example .env
cp api/.env.example api/.env

# 3. PostgreSQL 起動
npm run db:up

# 4. マイグレーション適用
npm run db:migrate

# 5. API 起動 (port 8787)
npm run dev:api
```

ヘルスチェック確認:
```bash
curl http://localhost:8787/health
# {"ok":true}
```

## 主なコマンド

| コマンド | 内容 |
|---|---|
| `npm run db:up` | PostgreSQL 起動 |
| `npm run db:down` | PostgreSQL 停止 |
| `npm run db:reset` | DB を作り直してマイグレーション再適用 |
| `npm run db:migrate` | マイグレーション適用 |
| `npm run dev:api` | API を開発モードで起動 |
| `npm run dev:web` | Web を開発モードで起動（雛形作成後に有効） |

## 実装方針
- 詳細は `../成果物/実装計画_v1.md` を参照
- 採用スタック: Next.js + Hono + PostgreSQL + SSE
- すれ違い検出は **シミュレーション**（マップ上で位置を動かす操作で擬似発生）
