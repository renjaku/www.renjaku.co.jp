import { useEffect, useMemo, useState } from "react";
import { formatInquiryReceipt, type InquiryReceipt } from "../lib/inquiry-receipt";

export function InquiryReceiptDownload({ receipt }: { receipt: InquiryReceipt }) {
  const file = useMemo(() => formatInquiryReceipt(receipt), [receipt]);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const objectUrl = URL.createObjectURL(new Blob([file.text], { type: "text/plain;charset=utf-8" }));
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url ? (
    <div className="contact-receipt">
      <a className="contact-receipt-download" href={url} download={file.filename}>
        送信内容をダウンロード（.txt）
      </a>
      <p>送信した内容を控えとして保存できます。このページを再読み込みするとダウンロードできなくなります。</p>
    </div>
  ) : null;
}
