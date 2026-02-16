"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

type DraftTask = {
  title: string;
  description: string;
  acceptanceCriteriaText: string;
};

export default function CreateEpicPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [intent, setIntent] = useState("");
  const [repo, setRepo] = useState("");
  const [defaultBranch, setDefaultBranch] = useState("main");
  const [constraints, setConstraints] = useState('{"allowedPaths":["src/**"],"maxLoc":400,"maxFiles":8}');
  const [validationProfile, setValidationProfile] = useState("tests,lint,codeql");
  const [tasks, setTasks] = useState<DraftTask[]>([]);
  const [planSummary, setPlanSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePlan = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/plans/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, intent }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Plan generation failed");
      }

      setPlanSummary(data.summary);
      setTasks(
        data.tasks.map((task: { title: string; description: string; acceptanceCriteria: string[] }) => ({
          title: task.title,
          description: task.description,
          acceptanceCriteriaText: task.acceptanceCriteria.join("\n"),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Plan generation failed");
    } finally {
      setLoading(false);
    }
  };

  const createEpic = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/epics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          intent,
          repo,
          defaultBranch,
          constraints,
          validationProfile,
          tasks: tasks.map((task) => ({
            title: task.title,
            description: task.description,
            acceptanceCriteria: task.acceptanceCriteriaText
              .split(/\r?\n/)
              .map((line) => line.trim())
              .filter(Boolean),
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Epic creation failed");
      }

      router.push(`/epics/${data.epic.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Epic creation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Create Epic (Intent Setup)</h2>
        <p className="text-sm text-slate-500">Define constraints and generate an editable, PR-friendly task plan.</p>
      </section>

      <form onSubmit={generatePlan} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm">
            <span className="font-medium">Title</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" required />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Repo URL / owner/repo</span>
            <input value={repo} onChange={(event) => setRepo(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" placeholder="owner/repo" required />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Default branch</span>
            <input value={defaultBranch} onChange={(event) => setDefaultBranch(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Validation profile</span>
            <input value={validationProfile} onChange={(event) => setValidationProfile(event.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2" />
          </label>
        </div>

        <label className="space-y-1 text-sm">
          <span className="font-medium">High-level intent</span>
          <textarea value={intent} onChange={(event) => setIntent(event.target.value)} className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2" required />
        </label>

        <label className="space-y-1 text-sm">
          <span className="font-medium">Constraints</span>
          <textarea value={constraints} onChange={(event) => setConstraints(event.target.value)} className="min-h-20 w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>

        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Generating…" : "Generate Plan"}
          </button>
          <p className="self-center text-xs text-slate-500">Merge policy: manual approval required</p>
        </div>
      </form>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {tasks.length > 0 && (
        <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-medium">Generated Plan (editable)</h3>
          <p className="text-sm text-slate-600">{planSummary}</p>

          <div className="space-y-4">
            {tasks.map((task, index) => (
              <article key={`${task.title}-${index}`} className="rounded-lg border border-slate-200 p-4">
                <label className="block text-sm font-medium">Task title</label>
                <input
                  value={task.title}
                  onChange={(event) => {
                    const next = [...tasks];
                    next[index] = { ...task, title: event.target.value };
                    setTasks(next);
                  }}
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />

                <label className="mt-3 block text-sm font-medium">Description</label>
                <textarea
                  value={task.description}
                  onChange={(event) => {
                    const next = [...tasks];
                    next[index] = { ...task, description: event.target.value };
                    setTasks(next);
                  }}
                  className="mt-1 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />

                <label className="mt-3 block text-sm font-medium">Acceptance criteria (one line each)</label>
                <textarea
                  value={task.acceptanceCriteriaText}
                  onChange={(event) => {
                    const next = [...tasks];
                    next[index] = { ...task, acceptanceCriteriaText: event.target.value };
                    setTasks(next);
                  }}
                  className="mt-1 min-h-20 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </article>
            ))}
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => void createEpic()}
            className="rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Saving…" : "Create Epic"}
          </button>
        </section>
      )}
    </main>
  );
}
