import fs from "node:fs";
import path from "node:path";

const SRC = path.join("sources", "accelerator-search", "data", "output.json");
const OUT = path.join("app", "data", "investors.json");

const rows = JSON.parse(fs.readFileSync(SRC, "utf8"));
const TRAVEL = /travel|tourism|hospitality|leisure|booking|airline|mobility|transport/i;

const clean = (v) => {
  const s = (v ?? "").trim();
  return !s || s.toLowerCase() === "n/a" ? null : s;
};

const seen = new Set();
const items = [];

for (const r of rows) {
  const name = clean(r.name);
  if (!name) continue;

  const website = clean(r.website);
  let domain = null;
  if (website) {
    try {
      domain = new URL(website).hostname.replace(/^www\./, "").toLowerCase();
    } catch {}
  }

  const key = domain ?? name.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);

  const industries = (r.industries || []).map((i) => i.trim()).filter(Boolean);

  items.push({
    id: key,
    name,
    website,
    domain,
    linkedIn: clean(r.linkedIn),
    structure: clean(r.structure),
    country: clean(r.country),
    industries,
    travelRelevant: industries.some((i) => TRAVEL.test(i)),
    source: "accelerator-search",
    status: "todo",
    notes: "",
  });
}

// travel-relevant first, then funds that have a website
items.sort(
  (a, b) =>
    Number(b.travelRelevant) - Number(a.travelRelevant) ||
    Number(!!b.website) - Number(!!a.website) ||
    a.name.localeCompare(b.name)
);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(items));

const structures = {};
for (const i of items) structures[i.structure ?? "unknown"] = (structures[i.structure ?? "unknown"] || 0) + 1;

console.log(`Wrote ${items.length} funds to ${OUT}`);
console.log(`With website: ${items.filter((i) => i.website).length}`);
console.log(`Travel-relevant: ${items.filter((i) => i.travelRelevant).length}`);
console.log("By structure:", structures);