import { NextResponse } from "next/server";
import { createEpic, listEpics } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ epics: listEpics() });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const intent = String(body.intent ?? "").trim();
    const repo = String(body.repo ?? "").trim();
    const defaultBranch = String(body.defaultBranch ?? "main").trim() || "main";
    const constraints = String(body.constraints ?? "{}").trim() || "{}";
    const validationProfile = String(body.validationProfile ?? "tests,lint,codeql").trim();
    const mergePolicy = "MANUAL_APPROVAL_REQUIRED";
    const tasks = Array.isArray(body.tasks) ? body.tasks : [];

    if (!title || !intent || !repo) {
      return NextResponse.json({ error: "Title, intent, and repo are required" }, { status: 400 });
    }

    if (tasks.length < 5 || tasks.length > 12) {
      return NextResponse.json({ error: "Task list must contain between 5 and 12 tasks" }, { status: 400 });
    }

    const created = createEpic({
      title,
      intent,
      repo,
      defaultBranch,
      constraints,
      validationProfile,
      mergePolicy,
      tasks: tasks.map((task: { title?: string; description?: string; acceptanceCriteria?: string[] }) => ({
        title: String(task.title ?? "Untitled task").trim(),
        description: String(task.description ?? "").trim(),
        acceptanceCriteria: Array.isArray(task.acceptanceCriteria)
          ? task.acceptanceCriteria.map((criterion) => String(criterion))
          : [],
      })),
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create epic" },
      { status: 500 }
    );
  }
}
