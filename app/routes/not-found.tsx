import type { MetaFunction } from "react-router";
import site from "../data/site.json";

export const meta: MetaFunction = () => [
  { title: `404 Not Found - ${site.title}` },
  { name: "description", content: site.description },
  { name: "robots", content: "noindex" },
];

export default function NotFoundRoute() {
  return (
    <main>
      <section className="section">
        <div className="container">ページが見つかりません。</div>
      </section>
    </main>
  );
}

