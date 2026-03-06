import type { ComponentProps } from "react";
import type { MetaFunction } from "react-router";
import site from "../data/site.json";
import { formatDate, formatNumber } from "../lib/format";
import { createSchemas } from "../lib/schema";

export const meta: MetaFunction = () => [
  { title: site.title },
  { name: "description", content: site.description },
];

const CONTACT_WEBHOOK_URL = import.meta.env.VITE_CONTACT_WEBHOOK_URL || "";
const CONTACT_WEBHOOK_SALES_URL = import.meta.env.VITE_CONTACT_WEBHOOK_SALES_URL || "";

type FormSubmitEvent = Parameters<NonNullable<ComponentProps<"form">["onSubmit"]>>[0];

async function sendContact(event: FormSubmitEvent) {
  event.preventDefault();

  const form = event.currentTarget;
  const fieldset = form.querySelector("fieldset");
  const name = form.querySelector<HTMLInputElement>("input[name=name]");
  const email = form.querySelector<HTMLInputElement>("input[name=email], input[type=email]");
  const message = form.querySelector<HTMLTextAreaElement>("textarea[name=message], textarea");
  const category = form.querySelector<HTMLSelectElement>("select[name=category]");

  if (!fieldset || !email || !message) {
    window.alert("フォームの構成が正しくありません。");
    return;
  }

  const validErrors: string[] = [];
  const nameValue = name?.value.trim() ?? "";
  const emailValue = email.value.trim();
  const messageValue = message.value.trim();
  const categoryValue = category?.value ?? "";
  const categoryName = category?.options?.[category?.selectedIndex]?.innerText;
  const sales = categoryValue === "sales";

  if (emailValue && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailValue))
    validErrors.push("メールアドレスの形式が正しくありません。");

  if (!messageValue) validErrors.push("メッセージをご記入ください。");
  if (!categoryValue) validErrors.push("お問い合わせ種別を選択してください。");

  if (validErrors.length > 0) {
    validErrors.forEach((x) => window.alert(x));
    return;
  }

  if (!emailValue && !window.confirm("メールアドレス未入力のまま送信します。よろしいですか？")) return;

  const endpoint = sales ? CONTACT_WEBHOOK_SALES_URL || CONTACT_WEBHOOK_URL : CONTACT_WEBHOOK_URL;
  if (!endpoint) {
    window.alert("送信先の設定が不足しているため、現在このフォームは利用できません。");
    return;
  }

  const content = `
@everyone ${messageValue}

Name: ${nameValue || "(empty)"}
Reply-To: ${emailValue || "(empty)"}
Category: ${categoryName || "(none)"}
`.trim();

  fieldset.disabled = true;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) {
      window.alert(`HTTP Error: ${res.status}: ${res.statusText}`);
      return;
    }

    window.alert("送信が完了しました。内容を確認のうえ、ご連絡いたします。");
  } catch {
    window.alert("エラーが発生しました。時間をおいて再度お試しください。");
  } finally {
    fieldset.disabled = false;
  }
}

export default function HomeRoute() {
  const schemas = createSchemas(site);
  return (
    <main>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }}
        />
      ))}
      <section className="hero">
        <div className="container">
          <h1>Web デザインやシステム開発を承っております</h1>
          <p>
            連雀株式会社は、Web システム開発・サイト制作・デザインを通じてお客様のビジネスをサポートします。
          </p>
          <a className="cta-btn" href="#contact">
            お問い合わせ
          </a>
        </div>
      </section>

      <section className="section services" id="services">
        <div className="container">
          <div className="section-head">
            <h2>Services</h2>
            <p>提供しているサービス</p>
          </div>
          <div className="service-cards">
            <article className="service-card">
              <p className="emoji">🛠️</p>
              <h3>システム開発</h3>
              <p className="meta">Python / TypeScript / etc.</p>
              <p>
                Webアプリケーションや業務システムの設計・開発を承ります。スケーラブルで保守性の高いシステムを構築します。
              </p>
            </article>
            <article className="service-card">
              <p className="emoji">🎨</p>
              <h3>デザイン</h3>
              <p className="meta">Web / アプリ / ロゴ / etc.</p>
              <p>
                ウェブサイトのデザインからロゴ制作、アプリのUIデザインまで幅広く対応いたします。
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="section profile" id="profile">
        <div className="container">
          <div className="section-head">
            <h2>Profile</h2>
            <p>会社概要</p>
          </div>
          <dl className="profile-table">
            <div>
              <dt>商号</dt>
              <dd>
                <p>
                  <span lang="ja">{site.corporateName}</span>（
                  <span lang="en">{site.en.corporateName}</span>）
                </p>
              </dd>
            </div>
            <div>
              <dt>事業内容</dt>
              <dd>{site.business}</dd>
            </div>
            <div>
              <dt>設立</dt>
              <dd>{formatDate(site.established)}</dd>
            </div>
            <div>
              <dt>資本金</dt>
              <dd>¥{formatNumber(site.capitalStock)}</dd>
            </div>
            <div className="address-row">
              <dt>本社所在地</dt>
              <dd>
                <address lang="ja">
                  〒{site.address.postalCode}
                  <br />
                  {site.address.region}
                  {site.address.locality}
                  {site.address.streetAddress}
                </address>
                <address lang="en">
                  {site.en.address.streetAddress},
                  <br />
                  {site.en.address.locality}, {site.en.address.region} {site.en.address.postalCode},{" "}
                  {site.en.address.country}
                </address>
              </dd>
            </div>
            <div>
              <dt>代表者</dt>
              <dd>
                <p>
                  <span>代表取締役</span> <span>{site.representative}</span>
                </p>
              </dd>
            </div>
            <div>
              <dt>会社法人等番号</dt>
              <dd>{site.corporateNumber.slice(1)}</dd>
            </div>
            <div>
              <dt>法人番号</dt>
              <dd>
                <a
                  href={`https://www.houjin-bangou.nta.go.jp/henkorireki-johoto.html?selHouzinNo=${site.corporateNumber}`}
                >
                  {site.corporateNumber}
                </a>
              </dd>
            </div>
            <div>
              <dt>適格請求書発行事業者の登録番号</dt>
              <dd>
                <a
                  href={`https://www.invoice-kohyo.nta.go.jp/regno-search/detail?selRegNo=${site.corporateNumber}`}
                >
                  T{site.corporateNumber}
                </a>
              </dd>
            </div>
            <div>
              <dt>従業員数</dt>
              <dd>{site.employees} 人</dd>
            </div>
            <div className="links-row">
              <dt>参考リンク</dt>
              <dd>
                <ul>
                  <li>
                    <a href={`https://info.gbiz.go.jp/hojin/ichiran?hojinBango=${site.corporateNumber}`}>
                      {site.corporateName} | gBizINFO
                    </a>
                  </li>
                  <li>
                    <a href="https://www.facebook.com/renjaku.co.jp">{site.corporateName} | Facebook</a>
                  </li>
                </ul>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="section contact" id="contact">
        <div className="container">
          <div className="section-head">
            <h2>Contact</h2>
            <p>お問い合わせ</p>
          </div>
          <form onSubmit={sendContact}>
            <fieldset>
              <label htmlFor="contact-name">お名前</label>
              <input id="contact-name" name="name" type="text" placeholder="山田 太郎" required />

              <label htmlFor="contact-email">メールアドレス</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                placeholder="example@mail.com"
                required
              />

              <label htmlFor="contact-message">メッセージ</label>
              <textarea
                id="contact-message"
                name="message"
                placeholder="ご用件をご記入ください..."
                required
              />

              <label htmlFor="contact-category">お問い合わせ種別</label>
              <select id="contact-category" name="category" required defaultValue="">
                <option value="" disabled>
                  選択してください
                </option>
                <option value="dev">開発のご相談・お見積り</option>
                <option value="design">サイト制作・デザインのご相談</option>
                <option value="partner">協業・パートナーのご相談</option>
                <option value="billing">契約・請求に関するお問い合わせ</option>
                <option value="sales">営業・売り込み（広告/SEO/外注/人材紹介等）</option>
                <option value="other">その他（上記に当てはまらない）</option>
              </select>

              <button type="submit">送信する</button>
            </fieldset>
          </form>
        </div>
      </section>
    </main>
  );
}
