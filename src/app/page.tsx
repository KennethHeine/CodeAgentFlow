"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Epic } from "@/lib/types";

const statusStyles: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  RUNNING: "bg-blue-100 text-blue-700",
  BLOCKED: "bg-amber-100 text-amber-700",
  COMPLETED: "bg-emerald-100 text-emerald-700",
};

export default function DashboardPage() {
  const [epics, setEpics] = useState<Epic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/epics", { cache: "no-store" });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Unable to load epics");
        }
        setEpics(data.epics);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load epics");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  return (
    <main className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Epics</h2>
            <p className="text-sm text-slate-500">Track intent projects and task orchestration progress.</p>
          </div>
          <Link href="/epics/new" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
            Create new Epic
          </Link>
        </div>
      </section>

      {loading && <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm">Loading epics…</p>}
      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {!loading && !error && epics.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          No epics yet. Create your first intent project to generate a PR-friendly plan.
        </p>
      )}

      <div className="grid gap-4">
        {epics.map((epic) => (
          <article key={epic.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-medium">{epic.title}</h3>
              <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[epic.status] ?? "bg-slate-100 text-slate-700"}`}>
                {epic.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{epic.intent}</p>
            <p className="mt-1 text-xs text-slate-500">
              Repo: {epic.repo} • Updated: {new Date(epic.updatedAt).toLocaleString()}
            </p>
            <div className="mt-3">
              <Link href={`/epics/${epic.id}`} className="text-sm font-medium text-blue-700 hover:text-blue-600">
                Open epic →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
