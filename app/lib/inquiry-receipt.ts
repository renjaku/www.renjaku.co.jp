export type InquiryReceipt = Readonly<{
  name: string;
  replyTo: string;
  category: string;
  message: string;
  sentAt: string;
}>;

export function formatInquiryReceipt(receipt: InquiryReceipt) {
  const sentAt = new Date(receipt.sentAt);
  let dateText = receipt.sentAt;
  let filename = "renjaku-inquiry.txt";
  if (!Number.isNaN(sentAt.getTime())) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }).formatToParts(sentAt);
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)!.value;
    const date = `${part("year")}-${part("month")}-${part("day")}`;
    const time = `${part("hour")}:${part("minute")}:${part("second")}`;
    dateText = `${date} ${time}（日本時間）`;
    filename = `renjaku-inquiry-${date}-${time.replaceAll(":", "")}.txt`;
  }

  return {
    filename,
    text: [
      "連雀株式会社 お問い合わせ控え",
      "",
      `送信日時：${dateText}`,
      `お名前：${receipt.name || "（未入力）"}`,
      `メールアドレス：${receipt.replyTo}`,
      `お問い合わせ種別：${receipt.category}`,
      "",
      "お問い合わせ内容：",
      receipt.message,
      "",
      "この控えは送信内容のコピーであり、サーバーが発行する受付証明ではありません。",
      "",
    ].join("\n"),
  };
}
