import type { Config } from "@react-router/dev/config";
import { prerenderRoutes } from "./routes-manifest";

export default {
  ssr: false,
  prerender: [...prerenderRoutes],
} satisfies Config;
