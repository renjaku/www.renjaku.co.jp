# 給与明細作成サービス

データファイル（YAML/JSON）を基に給与計算を行い、結果をCSVファイル（給与明細.csv/源泉徴収.csv）として出力します。
計算は全てユーザーのブラウザ内で行われ、外部サーバーへのデータ送信はありません。
会社情報の管理や給与締め日、支払日の設定機能も含まれています。

## データファイル

データファイルとは、給与計算のための会社情報を時系列順に記述したものです。
手始めに [data.template.yml](https://www.renjaku.co.jp/sb/payroll/data.template.yml)
をダウンロードし、お使いのテキストエディタで編集します。

### 最初のレコード

最初のレコードは、会社の代表やその他の役員の参画履歴 `join-user` です。
次の例では、役員 (`board: true`) の基本情報や参画日時を含むレコードを追加しています。

```yml
- type: join-user
  date: 2023-01-04T11:00:00+09:00
  username: taro.tanaka@example.com
  name: Taro Tanaka
  nameJa: 田中 太郎
  zone: 1000001
  address: 東京都千代田区千代田１番１号
  board: true
  salary: 200000
  note: 定時株主総会 (2023-01-04T11:00:00+09:00) にて、役員報酬が決定。
```

### 社会保険への加入

`register-social-insurance` レコードは、社会保険への加入を示すレコードです。
会社が所属する健康保険組合を明示する目的があります。

```yml
- type: register-social-insurance
  date: 2023-01-04T00:00:00+09:00
  health: kyoukaikenpo.or.jp/tokyo  # ref: https://github.com/renjaku/opendata
  note: 健康保険 (協会けんぽ東京支部) と厚生年金保険の新規適用。
```

健康保険組合のリストは [opendata リポジトリ](https://github.com/renjaku/opendata)から取得しています。
現在は、協会けんぽの東京都のみ対応しています。
所属する健康保険組合が存在しない場合、[GitHub イシュー](https://github.com/renjaku/opendata/issues)を作成してください。

### 扶養人数の設定

役員や社員が[給与所得者の扶養控除等申告書](https://www.nta.go.jp/taxes/tetsuzuki/shinsei/annai/gensen/annai/1648_01.htm)を会社へ提出した時に追加するレコードです。
その者の扶養家族の人数を `dependents` に設定します。

```yml
- type: update-user
  date: 2023-04-01T00:00:00+09:00
  username: taro.tanaka@example.com
  dependents: 0
  note: 「給与所得者の扶養控除等申告書」を提出した。
```

### 新入社員の登録

新入社員を追加する場合、役員の参画レコードと同じように `join-user` を使用します。
今回は役員ではないため、次のように `board: false` にします。

```yml
- type: join-user
  date: 2024-01-04T11:00:00+09:00
  username: hanako.yamada@example.com
  name: Hanako Yamada
  nameJa: 山田 花子
  zone: 1000001
  address: 東京都千代田区千代田1番2号
  board: false
  salary: 200000
  dependents: 0
  note: 新入社員を登録。
```

### 基本給の変更

もし、役員や社員の月給に変動があった場合、次のように `update-user` レコードで `salary` を変更します。

```yml
- type: update-user
  date: 2024-01-04T11:00:00+09:00
  username: taro.tanaka@example.com
  salary: 300000
  note: 定時株主総会 (2024-01-04T11:00:00+09:00) にて、役員報酬が変動。
```

### 住民税の登録

住民税の通知を受け取ったら、従業員ごとに納める税額を `resident-tax` レコードとして追加します。
次の例では、2024/6/1 支払分の給与から徴収される住民税を定義しています
(毎月末日締め、毎月 1 日支払い設定時の場合)。

```yml
- type: resident-tax
  date: 2024-05-31T23:59:59.999+09:00  # 5 月分給与の締め日に入れ込む
  username: hanako.yamada@example.com
  amount: 5000
  note: 2024-05-13T00:00:00.000+09:00 に通知を受信
```

### 所得税の還付・徴収

年末調整は、給与や賞与から源泉徴収で天引きされた所得税の過不足を調整する大事な手続きです。
`adjust-income-tax` レコードでは、過不足額を `refund`
に設定することで、過納額の還付または不足額の徴収を行います。

```yml
- type: adjust-income-tax
  date: 2024-11-30T00:00:00+09:00
  username: taro.tanaka@example.com
  refund: -500

- type: adjust-income-tax
  date: 2024-11-30T00:00:00+09:00
  username: hanako.yamada@example.com
  refund: 1000
```

### 経費精算

役員や社員が立て替えた経費を登録するには `create-reimbursable-expenses` を使用します。
このレコードでは `id` は必須パラメータです。
精算処理を実施するタイミングで参照されるためです。
`id` 値の形式に指定はありません。分かりやすい一意の値を設定しておきます。

```yml
- id: reimbursable-expenses:2024-01-15-12-00-00:hanako.yamada@example.com
  type: create-reimbursable-expenses
  date: 2024-01-15T12:00:00+09:00
  username: hanako.yamada@example.com
  amount: 1000
  note: 会議の費用を 2024-01-15T10:00:00+09:00 に立て替えた。
```

経費精算を承認するには `approve-reimbursable-expenses` を使用します。
このレコードは任意です。
承認の詳細を記録として残す目的で使用します。

```yml
- type: approve-reimbursable-expenses
  date: 2024-01-15T15:00:00+09:00
  username: taro.tanaka@example.com
  target: reimbursable-expenses:2024-01-15-12-00-00:hanako.yamada@example.com
  note: 経費精算を承認した。
```

経費精算を実施するには `reimburse-expenses` を使用します。
次の例では、2024/2/1 支払分の給与で立て替えた経費が精算されます
(毎月末日締め、毎月 1 日支払い設定時の場合)。

```yml
- type: reimburse-expenses
  date: 2024-01-31T23:59:59.999+09:00  # 1 月分給与の締め日に入れ込む
  username: taro.tanaka@example.com
  target: reimbursable-expenses:2024-01-15-12-00-00:hanako.yamada@example.com
  note: 経費精算を実施した。
```
