import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../app/lib/inquiry-receipt.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const exports = {};
runInNewContext(outputText, { exports });
const { formatInquiryReceipt } = exports;
const receipt = {
  sentAt: "2026-11-08T15:04:05.000Z",
  name: "田中 太郎",
  replyTo: "taro+tag@example.test",
  category: "開発のご相談・お見積り",
  message: "制作費用と納期の目安を教えてください。\n広告 & SEO + 開発 = 相談\n<script>本文です</script> 😀",
};

test("formats a readable UTF-8 text receipt with the Japanese date and original body", async () => {
  const file = formatInquiryReceipt(receipt);
  assert.equal(file.filename, "renjaku-inquiry-2026-11-09-000405.txt");
  assert.equal(file.text, [
    "連雀株式会社 お問い合わせ控え", "",
    "送信日時：2026-11-09 00:04:05（日本時間）",
    "お名前：田中 太郎",
    "メールアドレス：taro+tag@example.test",
    "お問い合わせ種別：開発のご相談・お見積り", "",
    "お問い合わせ内容：", receipt.message, "",
    "この控えは送信内容のコピーであり、サーバーが発行する受付証明ではありません。", "",
  ].join("\n"));
  const blob = new Blob([file.text], { type: "text/plain;charset=utf-8" });
  assert.equal(await blob.text(), file.text);
  const bytes = new Uint8Array(await blob.arrayBuffer());
  assert.notDeepEqual([...bytes.slice(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.equal(new TextDecoder("utf-8", { fatal: true }).decode(bytes), file.text);
});

test("does not place personal data in the filename and handles optional names", () => {
  const file = formatInquiryReceipt({ ...receipt, name: "" });
  assert.match(file.text, /お名前：（未入力）/);
  assert.match(file.filename, /^renjaku-inquiry-\d{4}-\d{2}-\d{2}-\d{6}\.txt$/);
});

test("keeps invalid date text unchanged and uses a fixed filename", () => {
  for (const sentAt of ["Invalid Date", "not-a-date", "../../invalid:date?", ""]) {
    const file = formatInquiryReceipt({ ...receipt, sentAt });
    assert.equal(file.filename, "renjaku-inquiry.txt");
    assert.ok(file.text.includes(`送信日時：${sentAt}\n`));
    assert.ok(file.text.includes(receipt.message));
    assert.doesNotMatch(file.text, /（日本時間）/);
  }
});
