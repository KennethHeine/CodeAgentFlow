import { NextResponse } from 'next/server';
import { getEpic, updateEpic, deleteEpic, listTasks, generatePlan, createTask, listAuditLogs } from '@/lib/db';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const epic = getEpic(id);
  if (!epic) {
    return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
  }
  const tasks = listTasks(id);
  const auditLogs = listAuditLogs(id);
  return NextResponse.json({ ...epic, tasks, auditLogs });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const epic = updateEpic(id, body);
  if (!epic) {
    return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
  }
  return NextResponse.json(epic);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const deleted = deleteEpic(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

// POST to generate plan for an existing epic
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const epic = getEpic(id);
  if (!epic) {
    return NextResponse.json({ error: 'Epic not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const action = body.action;

  if (action === 'generate-plan') {
    const plan = generatePlan(epic.intent, epic.repo);
    const tasks = [];
    for (const taskInput of plan) {
      tasks.push(createTask({ ...taskInput, epicId: id }));
    }
    return NextResponse.json({ tasks }, { status: 201 });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
