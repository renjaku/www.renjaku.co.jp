import type { ComponentProps } from "react";
import type { InquiryReceipt } from "./inquiry-receipt";

type FormSubmitEvent = Parameters<NonNullable<ComponentProps<"form">["onSubmit"]>>[0];

export type ContactFeedback = { responseDate?: string } & (
  | { type: "success"; message: string; receipt: InquiryReceipt }
  | { type: "error"; message: string }
);

const apiErrors: Record<string, string> = {
  "Missing required parameters": "メールアドレスとメッセージをご記入ください。",
  "Parameter too long": "入力内容が文字数の上限を超えています。",
  "Invalid email address": "メールアドレスの形式が正しくありません。",
};

export async function sendContact(
  event: FormSubmitEvent,
  endpoint: string,
  callbacks: {
    onSendingChange?: (sending: boolean) => void;
    onFeedback: (feedback: ContactFeedback | null) => void;
  },
) {
  event.preventDefault();
  const { onSendingChange, onFeedback } = callbacks;

  const form = event.currentTarget;
  const fieldset = form.querySelector("fieldset");
  const name = form.querySelector<HTMLInputElement>("input[name=name]");
  const email = form.querySelector<HTMLInputElement>("input[name=email]");
  const message = form.querySelector<HTMLTextAreaElement>("textarea[name=message]");
  const category = form.querySelector<HTMLSelectElement>("select[name=category]");

  if (fieldset?.disabled) return;
  onFeedback(null);
  if (!fieldset || !email || !message || !category) {
    onFeedback({ type: "error", message: "フォームの構成が正しくありません。" });
    return;
  }

  const values = {
    name: name?.value.trim() ?? "",
    replyTo: email.value.trim(),
    category: category.selectedOptions[0]?.label.trim() ?? "",
    message: message.value.trim(),
  };
  const errors: string[] = [];
  if (!values.replyTo) errors.push("メールアドレスをご記入ください。");
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.replyTo)) {
    errors.push("メールアドレスの形式が正しくありません。");
  }
  if (!values.message) errors.push("メッセージをご記入ください。");
  if (!category.value.trim() || !values.category) errors.push("お問い合わせ種別を選択してください。");
  if (values.name.length > 100) errors.push("お名前は100文字以内でご記入ください。");
  if (values.replyTo.length > 254) errors.push("メールアドレスは254文字以内でご記入ください。");
  if (values.category.length > 100) errors.push("お問い合わせ種別は100文字以内で指定してください。");
  if (values.message.length > 10_000) errors.push("メッセージは10,000文字以内でご記入ください。");
  if (errors.length) {
    onFeedback({ type: "error", message: errors.join("\n") });
    return;
  }
  if (!endpoint.trim()) {
    onFeedback({ type: "error", message: "送信先の設定が不足しているため、現在このフォームは利用できません。" });
    return;
  }

  fieldset.disabled = true;
  try {
    onSendingChange?.(true);
    const response = await fetch(endpoint.trim(), {
      method: "POST",
      body: new URLSearchParams(values),
      mode: "cors",
      credentials: "omit",
      redirect: "follow",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const result = await response.json();
    const responseDate = result?.date;
    if (result?.success !== true) {
      if (typeof result?.error === "string" && Object.hasOwn(apiErrors, result.error)) {
        onFeedback({ type: "error", message: apiErrors[result.error], responseDate });
        return;
      }
      onFeedback({
        type: "error",
        message: "受付結果を確認できませんでした。すでに受け付けられている可能性があります。入力内容は保持しています。重複送信にご注意ください。",
        responseDate,
      });
      return;
    }

    onFeedback({
      type: "success",
      message: "送信が完了しました。内容を確認のうえ、ご連絡いたします。",
      responseDate,
      receipt: { ...values, sentAt: responseDate },
    });
  } catch {
    // A missing response does not imply that saving failed. Never retry here.
    onFeedback({ type: "error", message: "受付結果を確認できませんでした。すでに受け付けられている可能性があります。入力内容は保持しています。重複送信にご注意ください。" });
  } finally {
    fieldset.disabled = false;
    onSendingChange?.(false);
  }
}
