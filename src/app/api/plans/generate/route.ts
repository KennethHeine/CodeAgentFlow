import { NextResponse } from "next/server";
import { generatePlan } from "@/lib/plan-generator";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = String(body.title ?? "").trim();
    const intent = String(body.intent ?? "").trim();

    if (!title || !intent) {
      return NextResponse.json({ error: "Title and intent are required" }, { status: 400 });
    }

    return NextResponse.json(generatePlan(title, intent));
  } catch {
    return NextResponse.json({ error: "Unable to generate plan" }, { status: 500 });
  }
}
