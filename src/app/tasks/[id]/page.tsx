"use client";

import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { TaskEvent } from "@/lib/types";

type TaskDetailResponse = {
  task: {
    id: number;
    title: string;
    description: string;
    acceptanceCriteria: string[];
    state: string;
    prUrl: string | null;
    branchName: string | null;
    attempts: number;
    mergeApproved: boolean;
    updatedAt: string;
    validationRuns: Array<{
      id: number;
      status: string;
      checks: string[];
      logsUrl: string | null;
      createdAt: string;
    }>;
  };
  epic: { id: number; title: string } | null;
  events: TaskEvent[];
  auditLogs: Array<{ id: number; action: string; details: string; createdAt: string }>;
};

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<TaskDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const latestValidation = useMemo(() => data?.task.validationRuns[0], [data]);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/tasks/${id}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to load task");
      }
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load task");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const runAction = async (action: string) => {
    setBusy(true);
    setError(null);

    try {
      const note = action === "MARK_BLOCKED" ? prompt("Add a blocking note") ?? "" : undefined;
      const validationResult = action === "RERUN_VALIDATION" ? (prompt("Validation result (PASSED/FAILED)", "PASSED") ?? "PASSED") : undefined;

      const response = await fetch(`/api/tasks/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note, validationResult }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? `${action} failed`);
      }

      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm">Loading task…</p>;
  }

  if (error) {
    return <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  }

  if (!data) {
    return null;
  }

  return (
    <main className="space-y-4">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-semibold">Task Detail</h2>
        <p className="text-sm text-slate-500">
          {data.epic?.title ? `Epic: ${data.epic.title}` : "No epic context"} • State: {data.task.state}
        </p>

        <h3 className="mt-4 text-lg font-medium">{data.task.title}</h3>
        <p className="mt-1 text-sm text-slate-600">{data.task.description}</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
          {data.task.acceptanceCriteria.map((criterion) => (
            <li key={criterion}>{criterion}</li>
          ))}
        </ul>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
          <span>Attempts: {data.task.attempts}</span>
          <span>Last update: {new Date(data.task.updatedAt).toLocaleString()}</span>
          {data.task.branchName && <span>Branch: {data.task.branchName}</span>}
          {data.task.prUrl && (
            <a href={data.task.prUrl} target="_blank" rel="noreferrer" className="font-medium text-blue-700 hover:text-blue-600">
              PR
            </a>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            ["Trigger agent run", "TRIGGER_AGENT_RUN"],
            ["Re-run validation", "RERUN_VALIDATION"],
            ["Approve merge", "APPROVE_MERGE"],
            ["Merge", "MERGE"],
          ].map(([label, action]) => (
            <button
              key={action}
              type="button"
              disabled={busy}
              onClick={() => void runAction(action)}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-100 disabled:opacity-50"
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-medium">Validation results</h3>
        {latestValidation?.status === "FAILED" && (
          <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Validation failed. Use Trigger agent run to continue the fix-validation sub-task thread.
          </p>
        )}
        <ul className="mt-3 space-y-2 text-sm">
          {data.task.validationRuns.length === 0 && <li className="text-slate-500">No validation runs yet.</li>}
          {data.task.validationRuns.map((run) => (
            <li key={run.id} className="rounded-md border border-slate-200 px-3 py-2">
              <p>
                <span className="font-medium">{run.status}</span> • {new Date(run.createdAt).toLocaleString()}
              </p>
              <ul className="mt-1 list-disc pl-5 text-xs text-slate-600">
                {run.checks.map((check) => (
                  <li key={`${run.id}-${check}`}>{check}</li>
                ))}
              </ul>
              {run.logsUrl && (
                <a href={run.logsUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs font-medium text-blue-700 hover:text-blue-600">
                  Logs/checks link
                </a>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-medium">State transition history</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {data.events.length === 0 && <li className="text-slate-500">No state transitions yet.</li>}
          {data.events.map((event) => (
            <li key={event.id} className="rounded-md border border-slate-200 px-3 py-2">
              <p>
                {(event.fromState ?? "N/A")} → <span className="font-medium">{event.toState}</span>
              </p>
              <p className="text-xs text-slate-500">{event.note}</p>
              <p className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
