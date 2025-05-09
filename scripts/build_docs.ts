import { ensureDir } from "@std/fs";
import { join } from "@std/path";

const DOCS_DIR = "docs";
const API_JSON = join(DOCS_DIR, "api.json");
const README = "README.md";
const INDEX_HTML = join(DOCS_DIR, "index.html");

async function buildDocs() {
  // Ensure docs directory exists
  await ensureDir(DOCS_DIR);

  // Read API documentation
  const apiJson = JSON.parse(await Deno.readTextFile(API_JSON));
  const readme = await Deno.readTextFile(README);

  // Generate HTML
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Breakdown Documentation</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/water.css@2/out/water.css">
  <style>
    body { max-width: 1200px; margin: 0 auto; padding: 2rem; }
    pre { background: #f5f5f5; padding: 1rem; border-radius: 4px; }
    .module { margin: 2rem 0; padding: 1rem; border: 1px solid #eee; border-radius: 4px; }
    .symbol { margin: 1rem 0; padding: 1rem; background: #f9f9f9; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>Breakdown Documentation</h1>
  
  <div class="readme">
    ${readme}
  </div>

  <h2>API Reference</h2>
  ${
    Object.entries(apiJson).map(([name, doc]: [string, any]) => `
    <div class="module">
      <h3>${name}</h3>
      ${doc.doc ? `<p>${doc.doc}</p>` : ""}
      ${
      doc.items
        ? `
        <div class="symbols">
          ${
          doc.items.map((item: any) => `
            <div class="symbol">
              <h4>${item.name}</h4>
              ${item.doc ? `<p>${item.doc}</p>` : ""}
              ${
            item.kind === "function"
              ? `
                <pre>${item.functionDef?.params?.map((p: any) => p.name).join(", ")}</pre>
              `
              : ""
          }
            </div>
          `).join("")
        }
        </div>
      `
        : ""
    }
    </div>
  `).join("")
  }
</body>
</html>`;

  // Write HTML file
  await Deno.writeTextFile(INDEX_HTML, html);
  console.log("Documentation built successfully!");
}

if (import.meta.main) {
  await buildDocs();
}
