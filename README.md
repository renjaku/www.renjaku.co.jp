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
VITE_INQUIRY_ENDPOINT_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
SITE_URL=https://www.renjaku.co.jp
PORT=5173
```

`SITE_URL` は必須です。

問い合わせフォームには `VITE_INQUIRY_ENDPOINT_URL` も必要です。運用担当者から取得した、発行済みの Apps Script Web アプリの `/exec` URL を設定してください。Script ID からの組み立てや `/dev` URL は使用しません。環境変数はビルド時に反映されるため、変更後は再ビルド・再デプロイが必要です。

## 問い合わせ送信

ブラウザから受付 API へ、`name`・`replyTo`・`category`・`message` をフォーム形式（`URLSearchParams`）で送信します。`category` は選択肢の表示ラベル（「開発のご相談・お見積り」など）を送ります。分類や Discord 通知はサイト側では行いません。

HTTP 成功かつ JSON 応答の `success === true` を確認して受付完了を表示します。名前は100文字、メールアドレスは254文字、種別は100文字、本文は10,000文字までです。長さは trim 後の JavaScript `String.length` で検証します。メールアドレスと本文は必須で、画面では従来どおり名前と種別の入力も求めます。

受付 API は、実際のサイトのオリジンからリダイレクト後の JSON 応答まで CORS で読み取れる必要があります。リダイレクトは追跡し、Cookie などの認証情報は送信しません。カスタムヘッダーは追加しません。

送信中は入力を無効にし、連打による二重送信を防ぎます。30秒のタイムアウト・通信失敗・HTTP エラー・不正な応答の場合も入力を保持します。応答を取得できなくても保存済みの可能性があるため、自動再送はしません。

送信結果や入力エラーはフォーム最下部に表示します。成功・エラーを見出しと色で区別し、次の送信操作まで表示を残します。読み上げ通知にも対応しています。

API 応答には成功・エラーのいずれも有効な日時文字列の `date` が含まれる前提で、メッセージと控えにその日時を日本時間で表示します。端末時刻による代用は行いません。

日時を変換できない場合は、画面・控えともに API が返した文字列をそのまま表示します。控えの生成は継続し、ファイル名は `renjaku-inquiry.txt` とします。

受付成功後は、メッセージの下のリンクから送信内容の控えをテキスト（UTF-8、BOMなし）でダウンロードできます。控えには送信日時（API 応答の `date` を日本時間で表示）、名前、メールアドレス、種別の表示ラベル、本文を含めます。送信時に取得した内容を保持するため、送信後のフォーム編集は控えに反映されません。次の送信操作や再読み込みで控えは消え、ブラウザのストレージには保存しません。サーバー発行の受付証明ではありません。

```sh
npm test
```

テストは通信をモックし、本番 API へ問い合わせを送信しません。

## Build

```sh
npm run build
```

生成物は `build/client` に出力されます。

## GitHub Pages Deploy Variables

GitHub Actions では以下の Repository Variable を参照します。

- `GA_ID`
- `INQUIRY_ENDPOINT_URL`（発行済みの `/exec` URL）
- `SITE_URL`
