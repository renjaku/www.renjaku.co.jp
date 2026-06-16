import type { Config } from "@react-router/dev/config";
import { prerenderRoutes } from "./routes-manifest";

export default {
  ssr: false,
  prerender: [...prerenderRoutes],
  future: {
    v8_middleware: true,
    v8_splitRouteModules: true,
    v8_viteEnvironmentApi: true,
    v8_passThroughRequests: true,
    v8_trailingSlashAwareDataRequests: true,
  },
} satisfies Config;
