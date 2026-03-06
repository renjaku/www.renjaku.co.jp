import fs from "node:fs/promises";
import path from "node:path";
import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { sitemapRoutes } from "./routes-manifest";

function sitemapPlugin(siteUrl: string): Plugin {
  let outDir = "";
  return {
    name: "renjaku-sitemap",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const now = new Date().toISOString();
      const xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        ...sitemapRoutes.map(
          (routePath) =>
            `  <url><loc>${siteUrl}${routePath}</loc><lastmod>${now}</lastmod></url>`
        ),
        "</urlset>",
        "",
      ].join("\n");
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(path.join(outDir, "sitemap.xml"), xml, "utf8");
    },
  };
}

function staticMetadataPlugin(siteUrl: string): Plugin {
  let outDir = "";
  return {
    name: "renjaku-static-metadata",
    apply: "build",
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    async closeBundle() {
      const robotsPath = path.join(outDir, "robots.txt");
      let robots = "";
      try {
        robots = await fs.readFile(robotsPath, "utf8");
      } catch {
        robots = "";
      }
      const robotsLines = robots
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith("Sitemap:"))
        .filter((line, index, lines) => !(index === lines.length - 1 && line.trim() === ""));
      robotsLines.push("", `Sitemap: ${siteUrl}/sitemap.xml`, "");
      await fs.writeFile(robotsPath, robotsLines.join("\n"), "utf8");

      const siteJsonPath = path.resolve("app", "data", "site.json");
      const siteRaw = await fs.readFile(siteJsonPath, "utf8");
      const site = JSON.parse(siteRaw) as { corporateNumber?: string };
      const corporateNumber = String(site.corporateNumber || "").trim();
      if (!corporateNumber) {
        throw new Error("corporateNumber is missing in app/data/site.json");
      }
      await fs.writeFile(path.join(outDir, "tax-registration-id.txt"), `T${corporateNumber}\n`, "utf8");
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const port = Number(env.PORT || process.env.PORT || 5173);
  const siteUrl = env.SITE_URL || process.env.SITE_URL;
  if (!siteUrl) throw new Error("SITE_URL is required.");
  const normalizedSiteUrl = siteUrl.replace(/\/$/, "");
  return {
    server: { port },
    plugins: [
      reactRouter(),
      sitemapPlugin(normalizedSiteUrl),
      staticMetadataPlugin(normalizedSiteUrl),
    ],
  };
});
