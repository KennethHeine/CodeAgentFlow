"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuditLog, Epic, Task } from "@/lib/types";

function stateStyle(state: string) {
  switch (state) {
    case "DONE":
      return "bg-emerald-100 text-emerald-700";
    case "BLOCKED":
      return "bg-amber-100 text-amber-700";
    case "APPROVAL_PENDING":
      return "bg-indigo-100 text-indigo-700";
    case "FIXING":
      return "bg-rose-100 text-rose-700";
    case "VALIDATING":
      return "bg-blue-100 text-blue-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function EpicDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [epic, setEpic] = useState<Epic | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyTaskId, setBusyTaskId] = useState<number | null>(null);

  const nextSuggestedTask = useMemo(
    () => tasks.find((task) => task.state === "PLANNED"),
    [tasks]
  );

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/epics/${id}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to load epic");
      }
      setEpic(data.epic);
      setTasks(data.tasks);
      setLogs(data.auditLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load epic");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const runAction = async (taskId: number, action: string) => {
    setBusyTaskId(taskId);
    setError(null);

    try {
      const note = action === "MARK_BLOCKED" ? prompt("Add a blocking note") ?? "" : undefined;
      const validationResult = action === "RERUN_VALIDATION" ? (prompt("Validation result (PASSED/FAILED)", "PASSED") ?? "PASSED") : undefined;

      const response = await fetch(`/api/tasks/${taskId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          note,
          validationResult,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? `Action ${action} failed`);
      }

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyTaskId(null);
    }
  };

  return (
    <main className="space-y-4">
      {loading && <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm">Loading epic…</p>}
      {error && <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      {epic && (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-semibold">{epic.title}</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium">{epic.status}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{epic.intent}</p>
            <p className="mt-1 text-xs text-slate-500">
              Repo: {epic.repo} • Default branch: {epic.defaultBranch}
            </p>
            {nextSuggestedTask && (
              <p className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700">
                Suggested next task: <strong>{nextSuggestedTask.title}</strong>
              </p>
            )}
          </section>

          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-medium">Task Timeline</h3>
            <div className="space-y-4">
              {tasks.map((task) => (
                <article key={task.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-medium">
                      {task.order}. {task.title}
                    </h4>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${stateStyle(task.state)}`}>{task.state}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{task.description}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-slate-500">
                    {task.acceptanceCriteria.map((criterion) => (
                      <li key={`${task.id}-${criterion}`}>{criterion}</li>
                    ))}
                  </ul>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span>Attempts: {task.attempts}</span>
                    <span>Last update: {new Date(task.updatedAt).toLocaleString()}</span>
                    {task.branchName && <span>Branch: {task.branchName}</span>}
                    {task.prUrl && (
                      <a href={task.prUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:text-blue-600">
                        PR link
                      </a>
                    )}
                    {task.validationRuns[0]?.logsUrl && (
                      <a href={task.validationRuns[0].logsUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:text-blue-600">
                        Checks/logs
                      </a>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {[
                      ["Start task", "START_TASK"],
                      ["Trigger agent run", "TRIGGER_AGENT_RUN"],
                      ["Re-run validation", "RERUN_VALIDATION"],
                      ["Retry", "RETRY"],
                      ["Mark blocked", "MARK_BLOCKED"],
                      ["Approve merge", "APPROVE_MERGE"],
                      ["Merge", "MERGE"],
                      ["Skip task", "SKIP_TASK"],
                    ].map(([label, action]) => (
                      <button
                        key={`${task.id}-${action}`}
                        type="button"
                        disabled={busyTaskId === task.id}
                        onClick={() => void runAction(task.id, action)}
                        className="rounded-md border border-slate-300 px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 disabled:opacity-50"
                      >
                        {label}
                      </button>
                    ))}
                    <Link href={`/tasks/${task.id}`} className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100">
                      Task detail
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-medium">Audit Log</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {logs.length === 0 && <li className="text-slate-500">No audit entries yet.</li>}
              {logs.map((log) => (
                <li key={log.id} className="rounded-md border border-slate-200 px-3 py-2">
                  <p>
                    <span className="font-medium">{log.action}</span> — {log.details}
                  </p>
                  <p className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </main>
  );
}
