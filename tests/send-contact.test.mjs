import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const source = readFileSync(new URL("../app/lib/send-contact.ts", import.meta.url), "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
});
const responseDate = "2026-11-08T06:02:06.714Z";
const endpoint = "https://script.google.com/macros/s/test-deployment/exec";
const successMessage = "送信が完了しました。内容を確認のうえ、ご連絡いたします。";

function setup({ values = {}, categoryLabel, response = { success: true, date: responseDate }, ok = true, fetchImpl } = {}) {
  const fields = {
    name: { value: " テスト太郎 " },
    email: { value: " test@example.test " },
    category: { value: " dev " },
    message: { value: " 制作費用と納期の目安を教えてください。\n追加の相談です。 " },
  };
  for (const [key, value] of Object.entries(values)) fields[key].value = value;
  fields.category.selectedOptions = [{
    label: categoryLabel ?? (fields.category.value.trim() === "dev" ? " 開発のご相談・お見積り " : fields.category.value),
  }];
  const originalValues = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value]));
  const fieldset = { disabled: false };
  const requests = [];
  const messages = [];
  const feedbackChanges = [];
  const sendingChanges = [];
  const controller = new AbortController();
  const exports = {};
  runInNewContext(outputText, {
    exports,
    URLSearchParams,
    AbortSignal: { timeout(ms) { assert.equal(ms, 30_000); return controller.signal; } },
    window: { alert() { throw new Error("Unexpected alert"); } },
    fetch: async (url, options) => {
      assert.equal(fieldset.disabled, true);
      assert.equal(sendingChanges.at(-1), true);
      requests.push({ url, options });
      if (fetchImpl) return fetchImpl(url, options);
      return { ok, status: ok ? 200 : 500, json: async () => response };
    },
  });
  const selectors = {
    fieldset,
    "input[name=name]": fields.name,
    "input[name=email]": fields.email,
    "textarea[name=message]": fields.message,
    "select[name=category]": fields.category,
  };
  const event = { preventDefault() {}, currentTarget: { querySelector: (selector) => selectors[selector] } };
  return {
    fields, fieldset, requests, messages, controller, sendingChanges, feedbackChanges,
    submit: (url = endpoint) => exports.sendContact(event, url, {
      onSendingChange: (sending) => sendingChanges.push(sending),
      onFeedback: (feedback) => {
        feedbackChanges.push(feedback ? { ...feedback } : null);
        if (feedback) messages.push(feedback.message);
      },
    }),
    assertPreserved() {
      assert.deepEqual(Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value])), originalValues);
      assert.equal(fieldset.disabled, false);
      assert.deepEqual(sendingChanges, Array.from({ length: requests.length }, () => [true, false]).flat());
      assert.equal(feedbackChanges[0], null);
      assert.equal(feedbackChanges.at(-1).type, messages.at(-1) === successMessage ? "success" : "error");
      if (feedbackChanges.at(-1).type === "error") {
        assert.equal(feedbackChanges.at(-1).receipt, undefined);
      }
    },
  };
}

test("sends trimmed form fields and follows redirects without custom headers or credentials", async () => {
  const form = setup();
  await form.submit();
  assert.equal(form.requests.length, 1);
  const { url, options } = form.requests[0];
  assert.equal(url, endpoint);
  assert.equal(options.method, "POST");
  assert.ok(options.body instanceof URLSearchParams);
  assert.deepEqual(Object.fromEntries(options.body), {
    name: "テスト太郎", replyTo: "test@example.test", category: "開発のご相談・お見積り",
    message: "制作費用と納期の目安を教えてください。\n追加の相談です。",
  });
  assert.equal(options.headers, undefined);
  assert.equal(options.mode, "cors");
  assert.equal(options.credentials, "omit");
  assert.equal(options.redirect, "follow");
  assert.equal(options.signal, form.controller.signal);
  assert.deepEqual(form.messages, [successMessage]);
  form.assertPreserved();
});

test("encodes ampersands, plus signs and newlines without losing input", async () => {
  const message = "広告 & SEO + 制作\n日本語の本文 = ?";
  const form = setup({ values: { message, email: "test+tag@example.test" } });
  await form.submit();
  const decoded = new URLSearchParams(form.requests[0].options.body.toString());
  assert.equal(decoded.get("message"), message);
  assert.equal(decoded.get("replyTo"), "test+tag@example.test");
});

for (const [field, value] of [
  ["email", " "], ["email", "invalid"], ["email", "a b@example.test"],
  ["message", "\n "], ["category", " "], ["name", "a".repeat(101)],
  ["email", "a".repeat(242) + "@example.test"],
  ["category", "a".repeat(101)], ["message", "a".repeat(10_001)],
  ["message", "😀".repeat(5_001)],
]) {
  test(`rejects invalid ${field} (length ${value.length}) before sending`, async () => {
    const form = setup({ values: { [field]: value } });
    await form.submit();
    assert.equal(form.requests.length, 0);
    assert.equal(form.messages.length, 1);
    assert.notEqual(form.messages[0], successMessage);
    form.assertPreserved();
  });
}

test("accepts exact UTF-16 limits after trim", async () => {
  const form = setup({ values: {
    name: ` ${"a".repeat(100)} `,
    email: ` ${"a".repeat(241)}@example.test `,
    category: ` ${"a".repeat(100)} `,
    message: ` ${"😀".repeat(5_000)} `,
  } });
  await form.submit();
  assert.equal(form.requests.length, 1);
  assert.deepEqual(form.messages, [successMessage]);
});

test("can send an empty optional name", async () => {
  const form = setup({ values: { name: " " } });
  await form.submit();
  assert.equal(form.requests[0].options.body.get("name"), "");
});

test("rejects the placeholder even when its label is nonempty", async () => {
  const form = setup({ values: { category: "" }, categoryLabel: "選択してください" });
  await form.submit();
  assert.equal(form.requests.length, 0);
  assert.match(form.messages[0], /お問い合わせ種別を選択/);
});

test("validates category label length rather than the option value", async () => {
  const form = setup({ categoryLabel: "あ".repeat(101) });
  await form.submit();
  assert.equal(form.requests.length, 0);
  assert.match(form.messages[0], /お問い合わせ種別は100文字以内/);
});

test("does not send when the endpoint is unconfigured", async () => {
  const form = setup();
  await form.submit(" ");
  assert.equal(form.requests.length, 0);
  assert.match(form.messages[0], /送信先の設定/);
});

for (const error of ["Missing required parameters", "Parameter too long", "Invalid email address"]) {
  test(`displays an API validation error: ${error}`, async () => {
    const form = setup({ response: { success: false, error, date: responseDate } });
    await form.submit();
    assert.equal(form.requests.length, 1);
    assert.equal(form.messages.length, 1);
    assert.notEqual(form.messages[0], successMessage);
    assert.doesNotMatch(form.messages[0], /受付結果を確認できません/);
    form.assertPreserved();
  });
}

for (const response of [null, {}, [], "ok", { success: "true" }, { success: false }, { success: false, error: "toString" }]) {
  test(`does not treat unexpected JSON as success: ${JSON.stringify(response)}`, async () => {
    const form = setup({ response });
    await form.submit();
    assert.match(form.messages[0], /受付結果を確認できません/);
    assert.equal(form.requests.length, 1);
    form.assertPreserved();
  });
}

test("rejects HTTP errors even if their body claims success", async () => {
  const form = setup({ ok: false, response: { success: true, date: responseDate } });
  await form.submit();
  assert.match(form.messages[0], /すでに受け付けられている可能性/);
  form.assertPreserved();
});

test("handles HTML/non-JSON responses without retrying", async () => {
  const form = setup({ fetchImpl: async () => ({ ok: true, json: async () => { throw new SyntaxError("Not JSON"); } }) });
  await form.submit();
  assert.equal(form.requests.length, 1);
  assert.match(form.messages[0], /受付結果を確認できません/);
  form.assertPreserved();
});

test("handles network/CORS failures without retrying", async () => {
  const form = setup({ fetchImpl: async () => { throw new TypeError("Failed to fetch"); } });
  await form.submit();
  assert.equal(form.requests.length, 1);
  assert.match(form.messages[0], /重複送信にご注意/);
  form.assertPreserved();
});

test("prevents repeated submissions while pending and restores the form after timeout", async () => {
  const form = setup({ fetchImpl: async (_url, { signal }) => new Promise((_resolve, reject) => {
    signal.addEventListener("abort", () => reject(signal.reason), { once: true });
  }) });
  const pending = form.submit();
  await form.submit();
  assert.equal(form.requests.length, 1);
  assert.equal(form.fieldset.disabled, true);
  assert.deepEqual(form.sendingChanges, [true]);
  assert.deepEqual(form.messages, []);
  form.controller.abort(new DOMException("Timed out", "TimeoutError"));
  await pending;
  assert.equal(form.requests.length, 1);
  assert.match(form.messages[0], /受付結果を確認できません/);
  form.assertPreserved();
});

test("keeps the result after sending ends and clears it only for the next attempt", async () => {
  let resolveResponse;
  const form = setup({ fetchImpl: () => new Promise((resolve) => { resolveResponse = resolve; }) });
  const first = form.submit();
  assert.deepEqual(form.feedbackChanges, [null]);
  resolveResponse({ ok: true, json: async () => ({ success: true, date: responseDate }) });
  await first;
  assert.equal(form.feedbackChanges.length, 2);
  assert.equal(form.feedbackChanges[1].type, "success");
  assert.equal(form.feedbackChanges[1].message, successMessage);
  assert.ok(form.feedbackChanges[1].receipt);
  await Promise.resolve();
  assert.equal(form.feedbackChanges.length, 2);

  const second = form.submit();
  assert.equal(form.feedbackChanges.at(-1), null);
  const changeCount = form.feedbackChanges.length;
  await form.submit();
  assert.equal(form.feedbackChanges.length, changeCount);
  resolveResponse({ ok: true, json: async () => ({ success: false, error: "Invalid email address", date: responseDate }) });
  await second;
  assert.equal(form.feedbackChanges.at(-1).type, "error");
  form.assertPreserved();
});

test("receipt contains the sent snapshot even if inputs change before or after the response", async () => {
  let resolveResponse;
  const form = setup({ fetchImpl: () => new Promise((resolve) => { resolveResponse = resolve; }) });
  const pending = form.submit();
  const sentValues = Object.fromEntries(form.requests[0].options.body);
  form.fields.message.value = "応答前に書き換えた本文";
  resolveResponse({ ok: true, json: async () => ({ success: true, date: responseDate }) });
  await pending;
  const receipt = form.feedbackChanges.at(-1).receipt;
  const { sentAt, ...values } = receipt;
  assert.deepEqual({ ...values }, sentValues);
  assert.equal(sentAt, responseDate);
  form.fields.message.value = "応答後に書き換えた本文";
  form.fields.name.value = "別の名前";
  assert.equal(receipt.message, sentValues.message);
  assert.equal(receipt.name, sentValues.name);
});

test("uses the API response date for feedback and the receipt", async () => {
  const date = "2026-11-08T06:02:06.714Z";
  const form = setup({ response: { success: true, date } });
  await form.submit();
  const feedback = form.feedbackChanges.at(-1);
  assert.equal(feedback.responseDate, date);
  assert.equal(feedback.receipt.sentAt, date);
  form.assertPreserved();
});

test("preserves the response date on API errors without creating a receipt", async () => {
  const date = "2026-11-08T06:02:06.714Z";
  for (const error of ["Invalid email address", "Unknown server error"]) {
    const form = setup({ response: { success: false, error, date } });
    await form.submit();
    const feedback = form.feedbackChanges.at(-1);
    assert.equal(feedback.type, "error");
    assert.equal(feedback.responseDate, date);
    assert.equal(feedback.receipt, undefined);
    form.assertPreserved();
  }
});
