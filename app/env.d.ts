/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_ID?: string;
  readonly VITE_CONTACT_WEBHOOK_URL?: string;
  readonly VITE_CONTACT_WEBHOOK_SALES_URL?: string;
  readonly SITE_URL?: string;
  readonly PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
