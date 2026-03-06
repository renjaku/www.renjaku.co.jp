# [連雀株式会社](https://www.renjaku.co.jp/)

## 開発

```sh
git clone https://github.com/renjaku/www.renjaku.co.jp.git
cd www.renjaku.co.jp
npm install
cp .env.example .env
npm run dev
```

`.env` では以下を設定できます。

```env
VITE_GA_ID=G-XXXXXXXXXX
VITE_CONTACT_WEBHOOK_URL=https://discord.com/api/webhooks/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_CONTACT_WEBHOOK_SALES_URL=https://discord.com/api/webhooks/yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
SITE_URL=https://www.renjaku.co.jp
PORT=5173
```

`SITE_URL` は必須です。

## Build

```sh
npm run build
```

生成物は `build/client` に出力されます。

## GitHub Pages Deploy Variables

GitHub Actions では以下の Repository Variable を参照します。

- `GA_ID`
- `CONTACT_WEBHOOK_URL`
- `CONTACT_WEBHOOK_SALES_URL`
- `SITE_URL`
