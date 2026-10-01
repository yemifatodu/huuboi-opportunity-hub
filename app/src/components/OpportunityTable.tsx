"use client";

import { useEffect, useMemo, useState } from "react";

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
const STORAGE_KEY = "huuboi-opportunity-status";

export default function OpportunityTable({ items }: { items: Opportunity[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [fee, setFee] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [statuses, setStatuses] = useState<Record<string, Status>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setStatuses(JSON.parse(saved));
    } catch {}
  }, []);

  function setStatus(id: string, s: Status) {
    const next = { ...statuses, [id]: s };
    setStatuses(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(items.flatMap((i) => i.categories))).sort()],
    [items]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      const st = statuses[i.id] ?? "todo";
      if (q && !i.name.toLowerCase().includes(q) && !i.domain.includes(q)) return false;
      if (category !== "all" && !i.categories.includes(category)) return false;
      if (fee !== "all" && i.fee !== fee) return false;
      if (statusFilter !== "all" && st !== statusFilter) return false;
      return true;
    });
  }, [items, query, category, fee, statusFilter, statuses]);

  const done = Object.values(statuses).filter((s) => s === "live").length;
  const field = "border border-gray-400/50 rounded px-3 py-2 bg-background text-foreground";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
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
      </div>

      <p className="text-sm opacity-70">
        Showing {filtered.length} of {items.length} · {done} live
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-gray-400/50">
              <th className="py-2 pr-4">Name</th>
              <th className="py-2 pr-4">Category</th>
              <th className="py-2 pr-4">Fee</th>
              <th className="py-2 pr-4">Rank</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="border-b border-gray-400/20">
                <td className="py-2 pr-4">
                  <a href={i.url} target="_blank" rel="noopener noreferrer" className="font-medium underline">
                    {i.name}
                  </a>
                  <div className="text-xs opacity-60">{i.domain}</div>
                </td>
                <td className="py-2 pr-4">{i.categories.join(", ")}</td>
                <td className="py-2 pr-4">{i.fee}</td>
                <td className="py-2 pr-4">{i.domainRank ?? "-"}</td>
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