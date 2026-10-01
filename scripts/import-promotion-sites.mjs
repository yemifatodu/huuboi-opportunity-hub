import fs from "node:fs";
import path from "node:path";

const SRC = path.join("sources", "startup-promotion-sites");
const OUT = path.join("app", "data", "opportunities.json");

const files = fs
  .readdirSync(SRC)
  .filter((f) => /^\d\d-.*\.md$/.test(f));

const splitRow = (line) =>
  line.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());

const byDomain = new Map();

for (const file of files) {
  const category = file.replace(/^\d\d-/, "").replace(/\.md$/, "");
  const lines = fs.readFileSync(path.join(SRC, file), "utf8").split(/\r?\n/);

  for (let i = 0; i < lines.length - 1; i++) {
    // a table starts with a header row followed by a |---| separator row
    if (!lines[i].trim().startsWith("|") || !/^\|[\s:|-]+\|?$/.test(lines[i + 1].trim())) continue;

    const headers = splitRow(lines[i]).map((h) => h.toLowerCase());
    i += 2;
    for (; i < lines.length && lines[i].trim().startsWith("|"); i++) {
      const cells = splitRow(lines[i]);
      const row = Object.fromEntries(headers.map((h, idx) => [h, cells[idx] ?? ""]));

      const url = (lines[i].match(/\((https?:\/\/[^)\s]+)\)/) || [])[1];
      if (!url || !row.name) continue;

      let domain;
      try {
        domain = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
      } catch {
        continue;
      }

      const feeText = row.fee || "";
      const fee = /free/i.test(feeText) ? "free" : /paid|💰/i.test(feeText) ? "paid" : "unknown";
      const rank = parseInt(row["domain rank"], 10);
      const domainRank = Number.isNaN(rank) ? null : rank;

      // keep any extra columns as notes
      const known = new Set(["name", "fee", "domain rank", "link"]);
      const notes = headers
        .filter((h) => !known.has(h) && row[h])
        .map((h) => `${h}: ${row[h]}`)
        .join("; ");

      const existing = byDomain.get(domain);
      if (existing) {
        if (!existing.categories.includes(category)) existing.categories.push(category);
        if (existing.domainRank == null && domainRank != null) existing.domainRank = domainRank;
      } else {
        byDomain.set(domain, {
          id: domain,
          name: row.name,
          url,
          domain,
          categories: [category],
          fee,
          domainRank,
          source: "startup-promotion-sites",
          status: "todo",
          notes,
        });
      }
    }
    i--;
  }
}

const items = [...byDomain.values()].sort(
  (a, b) => (b.domainRank ?? -1) - (a.domainRank ?? -1)
);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(items, null, 2));
console.log(`Wrote ${items.length} opportunities to ${OUT}`);