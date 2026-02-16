import { NextResponse } from "next/server";
import { getEpicWithTasks } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const epic = getEpicWithTasks(Number(id));
  if (!epic) {
    return NextResponse.json({ error: "Epic not found" }, { status: 404 });
  }

  return NextResponse.json(epic);
}
