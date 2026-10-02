"use client";

import { useEffect, useMemo, useState } from "react";
import { scoreFor, type Project } from "../lib/priority";

export type Opportunity = {
  id: string;
  name: string;
  url: string;
  domain: string;
  categories: string[];
  fee: "free" | "paid" | "unknown";
  domainRank: number | null;
  notes: string;
};

const STATUSES = ["todo", "submitted", "live", "rejected"] as const;
type Status = (typeof STATUSES)[number];
const storageKey = (p: Project) => `huuboi-hub-status-${p}`;
const OLD_KEY = "huuboi-opportunity-status";

export default function OpportunityTable({ items }: { items: Opportunity[] }) {
  const [project, setProject] = useState<Project>("huuboi");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [fee, setFee] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [topOnly, setTopOnly] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(storageKey(project)) ??
        (project === "huuboi" ? localStorage.getItem(OLD_KEY) : null);
      setStatuses(saved ? JSON.parse(saved) : {});
    } catch {
      setStatuses({});
    }
  }, [project]);

  function setStatus(id: string, s: Status) {
    const next = { ...statuses, [id]: s };
    setStatuses(next);
    try {
      localStorage.setItem(storageKey(project), JSON.stringify(next));
    } catch {}
  }

  const scores = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of items) m.set(i.id, scoreFor(project, i));
    return m;
  }, [items, project]);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(items.flatMap((i) => i.categories))).sort()],
    [items]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = items
      .filter((i) => {
        const st = statuses[i.id] ?? "todo";
        if (q && !i.name.toLowerCase().includes(q) && !i.domain.includes(q)) return false;
        if (category !== "all" && !i.categories.includes(category)) return false;
        if (fee !== "all" && i.fee !== fee) return false;
        if (statusFilter !== "all" && st !== statusFilter) return false;
        return true;
      })
      .sort((a, b) => (scores.get(b.id) ?? 0) - (scores.get(a.id) ?? 0));
    return topOnly ? list.slice(0, 50) : list;
  }, [items, query, category, fee, statusFilter, statuses, scores, topOnly]);

  const live = Object.values(statuses).filter((s) => s === "live").length;
  const submitted = Object.values(statuses).filter((s) => s === "submitted").length;
  const field = "border border-gray-400/50 rounded px-3 py-2 bg-background text-foreground";
  const tab = (p: Project) =>
    `rounded px-4 py-2 font-medium border ${
      project === p ? "bg-foreground text-background" : "border-gray-400/50"
    }`;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button className={tab("huuboi")} onClick={() => setProject("huuboi")}>HUUBOI</button>
        <button className={tab("portfolio")} onClick={() => setProject("portfolio")}>Portfolio</button>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <input
          className={`${field} flex-1 min-w-48`}
          placeholder="Search name or domain..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select className={field} value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((c) => (
            <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>
          ))}
        </select>
        <select className={field} value={fee} onChange={(e) => setFee(e.target.value)}>
          <option value="all">Free + paid</option>
          <option value="free">Free</option>
          <option value="paid">Paid</option>
        </select>
        <select className={field} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Any status</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={topOnly} onChange={(e) => setTopOnly(e.target.checked)} />
          Top 50 only
        </label>
      </div>

      <p className="text-sm opacity-70">
        Showing {filtered.length} of {items.length} · {submitted} submitted · {live} live
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-base text-left">
          <thead>
            <tr className="border-b-2 border-gray-400/60 bg-gray-500/15">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Fee</th>
              <th className="py-2 pr-4">Rank</th>
              <th className="py-2 pr-4">Fit</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-gray-400/30 hover:bg-gray-500/10">
                <td className="py-2 pr-4">
                  <a href={i.url} target="_blank" rel="noopener noreferrer" className="font-medium underline">
                    {i.name}
                  </a>
                  <div className="text-xs opacity-60">{i.domain}</div>
                </td>
                <td className="py-2 pr-4">{i.categories.join(", ")}</td>
                <td className="py-2 pr-4">
                  <span className={i.fee === "free" ? "rounded bg-green-500/20 px-2 py-0.5 text-green-600" : "rounded bg-amber-500/20 px-2 py-0.5 text-amber-600"}>{i.fee}</span>
                </td>
                <td className="py-2 pr-4">{i.domainRank ?? "-"}</td>
                <td className="py-2 pr-4 font-semibold">{scores.get(i.id)}</td>
                <td className="py-2">
                  <select
                    className={field}
                    value={statuses[i.id] ?? "todo"}
                    onChange={(e) => setStatus(i.id, e.target.value as Status)}
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
