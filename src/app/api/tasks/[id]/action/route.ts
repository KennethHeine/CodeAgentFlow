import { NextResponse } from "next/server";
import { performTaskAction } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const body = await request.json();
    const action = String(body.action ?? "").trim();

    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 });
    }

    const updated = performTaskAction(Number(id), action, {
      note: body.note ? String(body.note) : undefined,
      validationResult: body.validationResult,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Task action failed" },
      { status: 400 }
    );
  }
}
