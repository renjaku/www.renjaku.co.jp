import { useEffect, useMemo, useState } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
  type LinksFunction,
} from "react-router";

const GA_ID = import.meta.env.VITE_GA_ID || "";

export const links: LinksFunction = () => [
  { rel: "icon", href: "/favicon.svg", type: "image/svg+xml", sizes: "any" },
  { rel: "icon", href: "/favicon.ico" },
  { rel: "stylesheet", href: "/css/global.css" },
  { rel: "stylesheet", href: "/css/main.css" },
];

function useGoogleAnalytics(): void {
  const location = useLocation();
  const pathname = useMemo(
    () => `${location.pathname}${location.search}${location.hash}`,
    [location.pathname, location.search, location.hash]
  );

  useEffect(() => {
    if (!GA_ID || typeof window === "undefined" || window.location.hostname === "localhost") {
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>(
      `script[src^="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"]`
    );
    if (!existing) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.append(script);
    }

    const w = window as Window & {
      dataLayer?: unknown[];
      gtag?: (...args: unknown[]) => void;
    };
    w.dataLayer = w.dataLayer || [];
    w.gtag =
      w.gtag ||
      function gtag(...args: unknown[]) {
        w.dataLayer?.push(args);
      };
    w.gtag("js", new Date());
    w.gtag("config", GA_ID, { send_page_view: false });
    w.gtag("event", "page_view", { page_path: pathname });
  }, [pathname]);
}

function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className={`site-header${open ? " menu-open" : ""}`}>
      <div className="container">
        <a className="brand" href="/" aria-label="連雀株式会社">
          <img src="/favicon.svg" width={28} height={28} alt="連雀" />
          <span>連雀株式会社</span>
        </a>
        <button
          className="hamburger"
          type="button"
          aria-controls="mobile-nav"
          aria-expanded={open}
          aria-label="メニューを開く"
          onClick={() => setOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>
        <nav className="desktop-nav" aria-label="Main navigation">
          <a href="/#services">サービス</a>
          <a href="/#profile">会社概要</a>
          <a href="/#contact">お問い合わせ</a>
          <a className="github-btn" href="https://github.com/renjaku/www.renjaku.co.jp">
            GitHub
          </a>
        </nav>
      </div>
      <nav className="mobile-nav" id="mobile-nav" aria-label="Mobile navigation">
        <a href="/#services" onClick={() => setOpen(false)}>
          サービス
        </a>
        <a href="/#profile" onClick={() => setOpen(false)}>
          会社概要
        </a>
        <a href="/#contact" onClick={() => setOpen(false)}>
          お問い合わせ
        </a>
        <a href="https://github.com/renjaku/www.renjaku.co.jp" onClick={() => setOpen(false)}>
          GitHub
        </a>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <small>(C) {new Date().getFullYear()} Renjaku Inc.</small>
        <a href="https://github.com/renjaku/www.renjaku.co.jp">GitHub</a>
      </div>
    </footer>
  );
}

export default function App() {
  useGoogleAnalytics();
  return (
    <html lang="ja">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <noscript>
          JavaScript must be enabled for this website to work properly.
        </noscript>
        <Header />
        <Outlet />
        <Footer />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
