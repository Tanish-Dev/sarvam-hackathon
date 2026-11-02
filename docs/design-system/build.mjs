// Builds docs/design-system.pdf from template.html.
// {{i:name}} or {{i:name:size:stroke}} is replaced with an inline Lucide SVG, then headless Chrome prints the page.
// Run from the repo root: node docs/design-system/build.mjs
import { readFile, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "../..");
const icons = path.join(root, "node_modules/lucide-react/dist/esm/icons");
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

async function svg(name, size = 20, stroke = 1.6) {
  const { __iconData } = await import(pathToFileURL(path.join(icons, `${name}.mjs`)).href);
  const body = __iconData.node.map(([tag, attrs]) =>
    `<${tag} ${Object.entries(attrs).filter(([k]) => k !== "key").map(([k, v]) => `${k}="${v}"`).join(" ")}/>`).join("");
  return `<svg class="ic" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

let html = await readFile(path.join(dir, "template.html"), "utf8");
for (const m of new Set(html.match(/\{\{i:[^}]+\}\}/g) ?? [])) {
  const [name, size, stroke] = m.slice(4, -2).split(":");
  html = html.replaceAll(m, await svg(name, size ? +size : undefined, stroke ? +stroke : undefined));
}
const out = path.join(dir, "index.html");
await writeFile(out, html);

execFileSync(chrome, [
  "--headless", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=15000",
  `--print-to-pdf=${path.join(root, "docs/design-system.pdf")}`, pathToFileURL(out).href,
], { stdio: "inherit" });
console.log("wrote docs/design-system.pdf");
