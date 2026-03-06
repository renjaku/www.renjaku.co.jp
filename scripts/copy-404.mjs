import fs from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve("build", "client");
const notFoundIndex = path.join(outDir, "404", "index.html");
const notFoundHtml = path.join(outDir, "404.html");
const notFoundDir = path.join(outDir, "404");

try {
  await fs.rename(notFoundIndex, notFoundHtml);
  await fs.rmdir(notFoundDir);
  console.log(`Moved ${notFoundIndex} -> ${notFoundHtml}`);
} catch (error) {
  console.error("Failed to generate 404.html:", error);
  process.exit(1);
}
